# PlaciaGh v2: rebuild plan

Status: approved 2026-11-13, with these changes from review:

- **Supabase free plan.** A scheduled GitHub Actions job pings the database every 3 days so the project doesn't pause.
- **Cloudinary** stores photos instead of Supabase Storage. Its free tier is larger, and its URL transforms (`f_auto,q_auto`, resizing) suit low bandwidth.
- **Two apps**, so they can be hosted separately: `apps/web` (public, mobile-first) and `apps/admin` (moderation, data, `/lab`). Both share `packages/ui` and `packages/core`.
- **AI providers.** Claude is primary and OpenAI is the fallback, behind one `LLM` interface. Claude is used whenever `ANTHROPIC_API_KEY` is set. Otherwise, or on Claude errors or timeouts, calls go to OpenAI. OpenAI also handles embeddings and speech-to-text, since there are credits there.
- **UI:** clean, professional, enterprise-grade. Easy navigation, minimal text, using labels, icons and numbers instead of descriptions.

## 1. What v1 was, and why we're rebuilding it

v1 was a hackathon build (Bolt, June to Sept 2025): Next.js 15 + Supabase, with about 60k lines across 350 files.

- **Search:** Groq (Llama) turned the query into JSON, which ran through one of three Postgres RPCs (proximity, rating or price). In parallel the app called Google Places Text Search, then interleaved the two result lists.
- **AI extras:** Groq place summaries and Q&A, ElevenLabs and OpenAI TTS for an audio guided tour, and a voice agent test page.
- **Data:** 414 places (408 scraped from OSM and never approved, 5 from Google, 1 added by hand). There were also 23,459 GeoNames towns, 16 regions, 121 cities, and a 19-category, 103-subcategory taxonomy.
- **Admin:** a dynamic "place schema" builder, CSV/JSON import, and an OSM scraper page.

Problems we're fixing:

| v1 problem                                                           | Consequence                                                                                                                |
| -------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Search quality depended on Google, which is paid and can't be cached | Costs rise with use, and we can't build our own dataset from Google results (Google's terms allow storing only `place_id`) |
| The LLM parse was the only path, with no timeout or fallback         | When Groq is slow or down, search breaks                                                                                   |
| Search was lexical FTS plus three fixed query shapes                 | "Somewhere quiet to work with wifi" fails. So do misspellings of Ghanaian names                                            |
| No evaluation                                                        | Nobody could say whether a prompt or model change made search better or worse                                              |
| Module-level singletons hold "last query" state on the server        | Concurrent users can overwrite each other's pagination state                                                               |
| Contributions inserted straight into `places`                        | No moderation, no field-level edits, no provenance                                                                         |
| Many test, demo and mock pages shipped in the product                | Hard to maintain and hard to explain                                                                                       |

## 2. Product in one line

**Type or say what you need, in plain English, and Placia finds it in Ghana.** You should also get something useful just by opening the app (what's near you, what's open now).

Core experiences, in priority order:

1. **Search.** Examples: "waakye near Osu", "pharmacy open now around Kumasi Tech junction", "cheap hostel close to Legon".
2. **Near me.** Open the app and see what's around you by category, with what's open now.
3. **Place page.** Details, hours, photos, directions (deep link), share, save.
4. **Ask.** A conversational follow-up, e.g. "which of these is cheapest?" or "is there parking?", with answers grounded in our data and citing places.
5. **Contribute.** Add a place, suggest an edit, report closed or duplicate, add photos. Every contribution is moderated, with an AI pre-check.

## 3. Key decisions

### 3.1 Database: keep Supabase, host the app on Railway

Supabase gives us Postgres with **PostGIS + pgvector + pg_trgm**, plus **Auth**, **Storage** (contributor photos) and **RLS** in one place, and the project is already linked. On Railway Postgres we would have to rebuild auth, storage and row-level security ourselves. That's a lot of work and doesn't add to the AI story.

Portability is kept on purpose. All search logic lives in SQL functions plus a plain TypeScript `core` package that talks to Postgres. Moving to Railway Postgres later would mean a connection string plus an auth swap, not a rewrite.

Railway runs the Next.js web service and a small worker (data refresh jobs).

> Check: is the Placia Supabase project on a paid org? Free-tier projects pause after a week of inactivity, which is bad for a showcase link.

### 3.2 Places data: open data first, our own canonical dataset

We **own the dataset** and build it from open sources whose licences allow storing and redistributing:

| Source                                      | What it gives                                                                           | Licence                                            | How we get it                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------- |
| **OpenStreetMap** (Geofabrik Ghana extract) | POIs, opening hours, phone, website, addresses, admin boundaries, landmarks             | ODbL (attribution + share-alike on the derived DB) | Weekly `.osm.pbf` download, filtered to POIs   |
| **Overture Maps Places**                    | Large POI set (Meta/Microsoft-sourced), categories, confidence score, websites, socials | CDLA-Permissive 2.0 / Apache 2.0                   | DuckDB query over GeoParquet with a Ghana bbox |
| **Foursquare OS Places**                    | POIs with categories, often with good business coverage                                 | Apache 2.0 (gated download on Hugging Face)        | Parquet, filtered to `country = GH`            |
| **GeoNames**                                | Gazetteer: towns, neighbourhoods, alternate names                                       | CC-BY 4.0                                          | `GH.zip` dump (v1 already used it)             |
| **Wikidata / Wikimedia Commons**            | Landmarks, descriptions, free images                                                    | CC0 / CC-BY-SA                                     | SPARQL for Ghana entities                      |
| **Community** (our users)                   | New places, corrections, photos, prices                                                 | Ours                                               | In-app contributions                           |

**Entity resolution** merges the same place across sources, e.g. "Accra Mall" in OSM, Overture and Foursquare. Candidates are paired by distance + name similarity (trigram / Jaro-Winkler) + category compatibility. Ambiguous pairs go to Claude through the Batch API (half price) for a match / no-match decision. Every field keeps **provenance** (which source, when, how confident), so the place page can show where a fact came from and contributors can correct it.

**Google Places is not in the core.** At $32 per 1,000 Text Search (Pro) calls, with a 5,000 free monthly cap and a terms ban on storing results, it can't be the foundation. It can stay as an optional off-by-default fallback for zero-result queries if we ever want it.

### 3.3 AI: three jobs, each with a fallback

| Job                                                                                     | Approach                                                                                                                                                                                                                                                                                                                  | Fallback when the AI is slow or down                                                                 |
| --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| **Query understanding** (text → structured intent: what, where, near-me, filters, sort) | Claude with strict tool / structured output, cached per normalised query                                                                                                                                                                                                                                                  | Rule-based parser (Ghana synonyms + gazetteer lookup) with a ~1.5 s budget, so search always returns |
| **Retrieval and ranking**                                                               | **Hybrid search in one Postgres function:** full-text (with a Ghanaian-English synonym dictionary: chop bar, drinking spot, provisions shop, trotro station, chemical shop…), trigram fuzzy name match, pgvector semantic match, and PostGIS distance, fused with Reciprocal Rank Fusion, then boosted by data confidence | No LLM in this step, so it is always available                                                       |
| **Ask (conversation)**                                                                  | Claude agent with our tools (`search_places`, `get_place`, `nearby`, `open_now`) that streams answers citing place IDs                                                                                                                                                                                                    | Plain result list                                                                                    |

- **Embeddings:** Anthropic has no embedding model, so we'll use a cheap hosted embedding API (Voyage lite tier) behind an interface. Embedding the whole of Ghana costs cents. In evals we'll also measure a free local open model, which fits the low-resource story.
- **Voice:** on Chrome/Android the browser's Web Speech API does speech-to-text for free. Otherwise the audio is recorded and sent to a server-side Whisper-class transcription API. We measure word error rate on a small set of Ghanaian-accented clips. Stretch goal: Twi via GhanaNLP Khaya.
- **Contribution moderation:** Claude pre-checks each submission (spam? plausible? duplicate of an existing place?) and extracts structured fields from free text, e.g. "new pharmacy opposite the Shell at Madina". A human approves the result.

**Model choice (your call, see §7):** the house default is Claude Opus 5.5 at low effort. Claude Haiku 5.5 is about 40× cheaper per token and may be good enough for parsing. The eval harness will show the quality and latency difference on our own queries before you decide.

### 3.4 Engineering for reliability (the masters angle)

Your study plan's thesis is that adding AI is easy but making it reliable, testable and maintainable is not, especially with cheap phones and unstable internet. v2 is built as a working case study of that claim:

1. **Evaluation harness (`packages/evals`).** It uses a labelled golden set of about 150 real Ghanaian queries and reports query-parse accuracy, Recall@10, nDCG@10, MRR, zero-result rate, p50/p95 latency and cost per query. It runs in CI on every PR, and results are versioned so we can chart improvement over time.
2. **Graceful degradation.** Every AI step has a timeout, a fallback and a flag in the response saying which path ran. There's also a chaos test mode that simulates the LLM being down or slow.
3. **Low-bandwidth first.** PWA, small JS budget (< 150 KB initial), vector map tiles, compressed images, saved places available offline, and Lighthouse checks in CI on a throttled 3G profile.
4. **Observability.** A `search_events` log (anonymised) records the path taken, latency, tokens and cost. An internal `/lab` dashboard shows zero-result queries, which tell us what data to collect next.
5. **Data quality as a metric.** The dashboard tracks coverage per region and category, field completeness, and source agreement.

This gives you a README case study with an architecture diagram, eval charts and lessons learned, which is portfolio material for the applications.

## 4. Stack

| Layer       | Choice                                                                                                                                    |
| ----------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Repo        | Same GitHub repo. v1 is tagged `v1-hackathon` and v2 is built on branch `v2`, merged to `main` at launch, so history is preserved         |
| Monorepo    | pnpm workspaces + Turborepo                                                                                                               |
| Web         | Next.js (latest stable, App Router, React 19), TypeScript strict, Tailwind v4, shadcn/ui (only the components we use), Vaul bottom sheets |
| Map         | MapLibre GL + OpenFreeMap vector tiles (free, no key). Later: self-host a Ghana Protomaps file for full control                           |
| Data access | Supabase JS + SQL functions (RPCs), generated DB types, Zod at every API boundary                                                         |
| AI          | Anthropic TypeScript SDK (Claude), embedding API behind an interface, a Whisper-class STT API behind an interface                         |
| Ingest      | Node + DuckDB (reads Parquet/GeoParquet directly, no Python needed), osmium for the OSM extract                                           |
| Auth        | Supabase Auth: email OTP + Google sign-in. Browsing never needs an account                                                                |
| Tests       | Vitest (unit + integration against a disposable schema), Playwright (mobile viewport e2e), eval harness                                   |
| CI/CD       | GitHub Actions (lint, typecheck, tests, evals, Lighthouse) → Railway deploy                                                               |

Repo layout:

```
apps/web          Next.js mobile-first PWA
packages/core     query understanding, ranking, agent tools (pure TS, framework-free)
packages/db       Supabase migrations, seed, generated types
packages/ingest   source loaders, entity resolution, embeddings, refresh jobs
packages/evals    golden queries, metrics, reports
docs/             architecture, ADRs (decision records), eval reports
```

## 5. Data model (new schema, replaces v1)

- `regions`, `districts`, `localities` (gazetteer with alternate names, PostGIS geometry, trigram index)
- `categories` (one clean two-level taxonomy, mapped from the OSM / Overture / Foursquare vocabularies)
- `places`: canonical record with `geom geography(Point)`, name + alt names, category, address, phone, website, hours (structured), price level, `confidence`, `embedding vector`, `search_tsv`, status
- `place_sources`: raw record per source + match score (provenance)
- `place_photos` (Storage-backed, moderated)
- `contributions`: new place / field edit / report, with a JSON diff, AI pre-check result and review status
- `profiles`, `saved_places`, `search_events`, `eval_runs`

v1 tables and its 414 places will be **exported to a backup file first** and then dropped.

## 6. Phases

Each phase ends with screenshots and a short summary sent to you.

| #   | Phase                                                                                                                   | Done when                                                             |
| --- | ----------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 0   | **Foundations:** tag v1, `v2` branch, monorepo scaffold, CI, back up and wipe the old schema, new base schema           | Empty app deploys; CI is green                                        |
| 1   | **Data pipeline:** gazetteer, OSM + Overture + Foursquare loaders, entity resolution, embeddings, data-quality report   | Ghana-wide canonical places in the DB, with coverage stats per region |
| 2   | **Search core + eval harness:** hybrid search function, query understanding with fallback, golden set v1, `/api/search` | Eval report baseline committed; p95 latency known                     |
| 3   | **Mobile-first app:** design system, then home (map + near me), search + results sheet, place page, PWA                 | Screens approved by you from screenshots; Lighthouse mobile ≥ 90      |
| 4   | **Voice + Ask:** speech input with fallback, conversational agent with grounded citations                               | Voice WER measured; Ask mode in evals                                 |
| 5   | **Accounts + contributions:** sign-in, saves, add/edit/report/photos, AI pre-check, moderation queue                    | A contribution flows end to end into a live place                     |
| 6   | **Launch + write-up:** Railway production, `/lab` dashboard, README case study, architecture diagram, eval charts       | Public link + portfolio-ready repo                                    |

## 7. Needs from you

1. **Model choice** for query parsing and Ask: Opus 5.5 (default) or Haiku 5.5 (much cheaper). You can also decide after the Phase 2 eval comparison.
2. **API keys** in `.env.local`: Anthropic, an embeddings provider, an STT provider. (v1's Groq/OpenAI/Google keys aren't in the local env file.)
3. **Foursquare dataset access:** accept the terms on its Hugging Face page yourself. It asks for contact details, so I won't do it for you.
4. **Supabase plan:** confirm whether the Placia project is on a paid org (to avoid free-tier pausing).
5. **Railway project:** create it, or let me know when the CLI is logged in.
