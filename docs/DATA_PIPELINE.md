# Data pipeline

`pnpm ingest` builds Placia's place database from open data. It runs locally (DuckDB, no Docker) and loads into Supabase.

```
pnpm ingest            # stage → merge → load → mentions → acronyms (→ embed, when OPENAI_API_KEY is set)
pnpm ingest stage      # download (cached) and normalise every source
pnpm ingest foursquare # check / extract the Foursquare dump (see below)
pnpm ingest merge      # entity resolution + area assignment
pnpm ingest load       # upsert into Supabase, prune stale rows, record the run
pnpm ingest mentions   # cluster town names written in addresses (same-name towns)
pnpm ingest acronyms   # learn the initials people use for places ("kbth")
pnpm ingest embed      # embed new or edited places for the meaning arm (resumable)
```

## Sources

| Source                                     | Licence                       | What we take                                                          | Records (2026-11-14)              |
| ------------------------------------------ | ----------------------------- | --------------------------------------------------------------------- | --------------------------------- |
| OpenStreetMap (Geofabrik Ghana extract)    | ODbL 1.0                      | Named POIs (nodes, ways, multipolygons), settlements, named bus stops | 31,727 places · 11,551 localities |
| Overture Maps places, release 2026-10-21.0 | CDLA-Permissive 2.0           | Ghana-bbox Parquet read directly from S3                              | 29,664 places                     |
| Foursquare-only Overture records           | Apache 2.0                    | Kept with their own source tag                                        | 72                                |
| Foursquare OS Places, release 2026-10-15   | Apache 2.0                    | Ghana rows of the 2 files that hold Ghana (see below)                 | 28,031 staged                     |
| geoBoundaries gbOpen (commit 9469f09)      | PD / CC BY-SA 2.0 / CC BY 4.0 | Country, 16 regions, 260 districts                                    | 277 shapes                        |

### Foursquare OS Places

The dump is gated: accept the terms on huggingface.co/datasets/foursquare/fsq-os-places and put a read token in `.env.local` as `HF_TOKEN`. It is 100 Parquet files of about 110 MB each, sorted by location. Only the files holding Ghana are needed.

```
pnpm ingest foursquare   # check which files hold Ghana; extract them once they are downloaded
```

1. The step reads each file's footer (a few KB) and keeps files whose row groups overlap Ghana's bbox. Results are cached as markers in `.cache/foursquare/parts_<release>/`.
2. Files still missing are listed with their URLs in `.cache/foursquare/NEEDED.txt`. Download them in a browser while signed in to Hugging Face, into `packages/ingest/.cache/foursquare/`, keeping their names.
3. The next run extracts the Ghana rows from each file, deletes the file and writes `places_gh_<release>.parquet`.
4. Alternatively, `FSQ_REMOTE=1` fetches just the needed row groups itself (~30 MB per file), resuming after dropped connections.

Until every needed file is in place, `pnpm ingest` stages OSM and Overture only.

Staging keeps `country = 'GH'` records that are not closed and carry no `unresolved_flags`.

- **Categories:** each `category_label` path maps to a leaf by its longest matching prefix (`foursquareLeaf` in `src/taxonomy.ts`, all 1,279 categories covered). The primary path wins unless only its top-level group matched. Areas, roads and events are dropped.
- **Confidence:** set from `date_refreshed`: 0.75 within a year, 0.6 within three, 0.45 within five, else 0.35. A stale record alone falls under the 0.36 floor, but it still corroborates a place another source has.
- **Anchors:** OSM first, then Overture, then the dump.
- **Joins, never bridges:** a dump record may join one existing place, but it may not fuse two places the other sources keep apart. Without this guard it fused 113, about a dozen of them wrongly ("Ecobank (Silver Star Towers)" into Stanbic Bank, "Circle VIP Station" into Neoplan). With it, adding the dump moved 4 place ids out of 57,607.
- **Big sites:** campuses, hospitals and markets have points far apart. Foursquare's University of Ghana sits 1 km from OSM's. A dump record left on its own joins the one existing place with exactly its name and leaf within 1.5 km (rule `big-site`, 119 records).

Of 29,505 Ghana records, 29,125 are open and unflagged. Most were last refreshed in 2012–2016, so 17,500 stale records with nothing to corroborate them are dropped.

Raw source payloads stay in `packages/ingest/.cache`. The database only gets normalised fields, which keeps the free tier's 500 MB in reach: the full load uses **123 MB**.

## Stages

1. **Stage** (`src/sources/*`, DuckDB). Every source is mapped into one shape: name, alt names, category, point, phone, website, email, hours, address, brand.
   - Categories come from one taxonomy (`src/taxonomy.ts`): 12 groups and 71 leaves with Ghanaian synonyms ("chop bar", "chemical shop").
   - Synonyms name kinds of place, never places. "knust", "legon", "makola" or "kotoka" as a synonym is written into every university's, market's or airport's search text, so "ucc" matched every university. Landmarks are found as places instead (initials, anchors).
   - OSM rules are compiled into a single SQL `CASE` (first match wins).
   - Overture uses its most specific category: taxonomy primary, then the hierarchy deepest-first, then `basic_category`. 94% of Ghana records map.
   - Records are clipped to Ghana's border, buffered about 1 km for the coast.
2. **Merge** (`src/resolve/*`, pure TypeScript, unit-tested). Entity resolution:
   - **Blocking:** a ~440 m grid, plus small groups (≤ 6) sharing a phone number or website domain.
   - **Name similarity:** soft TF-IDF, i.e. IDF-weighted tokens matched with Jaro-Winkler ≥ 0.88. It is scored both ways: the minimum gives symmetric similarity, the maximum gives containment. Settlement words ("Osu", "Haatso") are down-weighted for containment, so a town name never swallows a church named after it.
   - **Match rule** (`decide()`): explicit and explainable. Rules: name, containment, name + category, phone, website, co-located, OSM duplicate.
     - Category conflicts are blocked.
     - Generic or chain names ("Hostel", "Goil", "MoneyGram") only match when the points practically coincide.
     - Shared phone or website only counts when both names are distinctive.
   - **Clustering:** union-find over edges, strongest first, with three guards:
     - two OSM-backed clusters never fuse through a third record;
     - a cluster may not sprawl past its radius, which stops "Hostel"–"Hostel"–"Hostel" chains;
     - a Foursquare dump record never bridges two existing places (see Foursquare above).
   - **Survivorship:** OSM wins name and location, and other sources fill the gaps.
     - Confidence is 1 − Π(1 − cᵢ) over the sources, plus small bonuses for contact details.
     - Single-source records (not OSM) below 0.36 are dropped.
   - **Ids:** deterministic UUIDv5-style, derived from the anchor record, so re-runs keep ids.
   - **Areas:** district by point-in-polygon (nearest district for the coast). Locality is the finest settlement whose radius covers the point (neighbourhood 1.2 km … city 15 km).
3. **Load** (`src/load.ts`). Upserts by natural keys: category slug, region/district slug, `(source, source_id)`, place id.
   - Published slugs are permanent: existing ones are reused and never handed to another place.
   - `ingest_prune()` removes machine rows a newer run no longer produced. Community data is never pruned.
   - Each run is recorded in `ingest_runs` with source versions and resolver statistics.
4. **Mentions** (`refresh_area_mentions()`, in Postgres, ~8 s). Finds every town name in place names and addresses, longest name first. "Asokore Mampong" is not a mention of Mampong, and neither is "Mampong Road". Each name's mentions are clustered with DBSCAN (~2 km reach, at least 3 places). Only neighbourhood-sized clusters are kept, since "Accra" written all over the city says nothing about which Accra is meant. 2,032 clusters; the search parser uses them to tell same-name towns apart ([SEARCH.md](SEARCH.md)).
5. **Acronyms** (`refresh_place_acronyms()`, in Postgres, ~9 s). Every name with 3–8 content words yields its initials, each combination of its small words in or out ("umt", "umat", "uomat"), from the whole name and from its head before a comma or dash. A pair is kept when an alternative name or a bracket states it, or when at least two places carry the name. 2,605 pairs for 2,166 initials; search expands them ([SEARCH.md](SEARCH.md)).

## Result (2026-11-14, with Foursquare)

- 94,074 source records (OSM 31,727 · Overture 34,316 · Foursquare 28,031) became **61,612 places**; 7,084 of them are backed by more than one source. Before Foursquare it was 57,607 places, 2,828 multi-source.
- Foursquare added **3,998 new places** and corroborated **5,077 existing ones**. It filled only 53 missing phones and 41 websites, because its Ghana contact data is thin.
- Merges by rule:

  | Rule            | Merges |
  | --------------- | ------ |
  | name            | 5,925  |
  | containment     | 2,258  |
  | phone           | 709    |
  | OSM duplicate   | 493    |
  | co-located      | 444    |
  | website         | 252    |
  | big site        | 119    |
  | name + category | 104    |

- Guards blocked 471 merges (dump bridge), 239 (OSM guard) and 65 (spread). 22,158 single-source records fell under the confidence floor.
- Re-running `load` is idempotent: 0 rows pruned.
- Database: 269 MB of the free tier's 500 MB, embeddings included.
- Full run time: about 10 minutes on the dev laptop (resolution ~2 min, load ~6 min over a slow link).

### Effect on search (data only, same code)

Rules mode with the meaning arm, compared with the round 4 runs ([EVALS.md](EVALS.md)):

| Set      | Known MRR     | Browse P@10   | Browse nDCG@10 |
| -------- | ------------- | ------------- | -------------- |
| dev      | 0.931 → 0.945 | 84.8 → 85.8 % | 0.869 → 0.875  |
| holdout3 | 1 → 1         | 49.4 → 50.0 % | 0.526 → 0.538  |
| holdout4 | 0.885 → 0.808 | 57.9 → 59.8 % | 0.628 → 0.650  |
| holdout6 | 0.746 → 0.726 | 66.7 → 70.0 % | 0.738 → 0.763  |

Browse improves on every set. Known items lose where a new place with a near-identical name now ranks first: "Nzulezu Silt Water" for nzulezo, "Winneba University Central Campus" for central university. Campus buildings named "… KNUST" or "… UCC" also crowd out the universities behind those acronyms. That last loss belongs with the v7 work on campus acronyms. All of these sets were already spent, so these are measurements, not tuning targets.

Search is plain weighted full-text for now. `places.search_tsv` is built by a trigger with four weights: name and alt names (A), category words and synonyms (B), locality/district/region (C), address (D). It uses the `simple` config and `unaccent`, because Ghanaian names must not be stemmed. Hybrid ranking arrives in Phase 2.

## Known gaps

- **Foursquare places without categories** (213 new places, such as "Shoprite (Kasoa)") land in `other`. A name rule like the worship one could place the obvious ones.
- **Embeddings:** need `OPENAI_API_KEY` in `.env.local`.
- **Match quality was eyeballed,** from random samples per rule (`scripts/audit-merge.ts`). Phase 2's eval harness adds a labelled pair set to measure precision and recall properly.
- **OSM building and part names** ("Classroom Block") survive as places. A later filter can drop them.
