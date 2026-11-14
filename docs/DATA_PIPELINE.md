# Data pipeline

`pnpm ingest` builds Placia's place database from open data. It runs locally (DuckDB, no Docker) and loads into Supabase.

```
pnpm ingest            # stage → merge → load → mentions → acronyms (→ embed, when OPENAI_API_KEY is set)
pnpm ingest stage      # download (cached) and normalise every source
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
| geoBoundaries gbOpen (commit 9469f09)      | PD / CC BY-SA 2.0 / CC BY 4.0 | Country, 16 regions, 260 districts                                    | 277 shapes                        |

Raw source payloads stay in `packages/ingest/.cache`. The database only gets normalised fields, which keeps the free tier's 500 MB in reach: the full load uses **123 MB**.

## Stages

1. **Stage** (`src/sources/*`, DuckDB). Every source is mapped into one shape: name, alt names, category, point, phone, website, email, hours, address, brand.
   - Categories come from one taxonomy (`src/taxonomy.ts`): 12 groups and 71 leaves with Ghanaian synonyms ("chop bar", "chemical shop").
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
   - **Clustering:** union-find over edges, strongest first, with two guards:
     - two OSM-backed clusters never fuse through a third record;
     - a cluster may not sprawl past its radius, which stops "Hostel"–"Hostel"–"Hostel" chains.
   - **Survivorship:** OSM wins name and location, and other sources fill the gaps.
     - Confidence is 1 − Π(1 − cᵢ) over the sources, plus small bonuses for contact details.
     - Overture-only records below 0.36 are dropped (4,647).
   - **Ids:** deterministic UUIDv5-style, derived from the anchor record, so re-runs keep ids.
   - **Areas:** district by point-in-polygon (nearest district for the coast). Locality is the finest settlement whose radius covers the point (neighbourhood 1.2 km … city 15 km).
3. **Load** (`src/load.ts`). Upserts by natural keys: category slug, region/district slug, `(source, source_id)`, place id.
   - Published slugs are permanent: existing ones are reused and never handed to another place.
   - `ingest_prune()` removes machine rows a newer run no longer produced. Community data is never pruned.
   - Each run is recorded in `ingest_runs` with source versions and resolver statistics.
4. **Mentions** (`refresh_area_mentions()`, in Postgres, ~8 s). Finds every town name in place names and addresses, longest name first. "Asokore Mampong" is not a mention of Mampong, and neither is "Mampong Road". Each name's mentions are clustered with DBSCAN (~2 km reach, at least 3 places). Only neighbourhood-sized clusters are kept, since "Accra" written all over the city says nothing about which Accra is meant. 2,032 clusters; the search parser uses them to tell same-name towns apart ([SEARCH.md](SEARCH.md)).
5. **Acronyms** (`refresh_place_acronyms()`, in Postgres, ~9 s). Every name with 3–8 content words yields its initials, each combination of its small words in or out ("umt", "umat", "uomat"), from the whole name and from its head before a comma or dash. A pair is kept when an alternative name or a bracket states it, or when at least two places carry the name. 2,605 pairs for 2,166 initials; search expands them ([SEARCH.md](SEARCH.md)).

## Result (2026-11-14)

- 66,115 source records became **57,607 places**; 2,828 of them are backed by more than one source.
- Field coverage: district 100%, locality 99%, address 53%, phone 48%, website 26%, opening hours 7%.
- Merges by rule:

  | Rule            | Merges |
  | --------------- | ------ |
  | name            | 1,615  |
  | containment     | 838    |
  | OSM duplicate   | 495    |
  | phone           | 431    |
  | co-located      | 265    |
  | website         | 178    |
  | name + category | 39     |

- Guards blocked 114 merges (OSM guard) and 27 (spread).
- Re-running `load` is idempotent: 0 rows pruned, all 57,607 slugs identical.
- Full run time: about 5 minutes on the dev laptop (staging 15 s, resolution 65 s, load 3.5 min over a slow link).

Search is plain weighted full-text for now. `places.search_tsv` is built by a trigger with four weights: name and alt names (A), category words and synonyms (B), locality/district/region (C), address (D). It uses the `simple` config and `unaccent`, because Ghanaian names must not be stemmed. Hybrid ranking arrives in Phase 2.

## Known gaps

- **Foursquare OS Places full dump:** gated on Hugging Face. It is added once the dataset terms are accepted.
- **Embeddings:** need `OPENAI_API_KEY` in `.env.local`.
- **Match quality was eyeballed,** from random samples per rule (`scripts/audit-merge.ts`). Phase 2's eval harness adds a labelled pair set to measure precision and recall properly.
- **OSM building and part names** ("Classroom Block") survive as places. A later filter can drop them.
