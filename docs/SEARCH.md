# Search

`GET /api/search?q=…[&lat=…&lon=…]` turns a plain-English query into ranked places. Two stages, each with a fallback:

```
query ──► understand ──────────────► retrieve + rank (Postgres) ──► results + meta
          AI parse (Claude → OpenAI)   search_places(): 6 arms fused with RRF
          ↘ rule parse on timeout,      no LLM in this step
            error or open breaker
```

Code: `packages/core/src/search` (framework-free), SQL: `supabase/migrations/2026111400020*`–`400`, route: `apps/web/app/api/search/route.ts`.

## 1. Understanding the query

Both parsers produce the same `Intent`:

```ts
{ text, categories, area, anchor, nearMe, openNow, cheap }
// "cheap hotel around kaneshi"  →  text "hotel", categories [hotel],
//   area Kaneshie (suburb, near), cheap: true
```

- **Rule parser** (`rules.ts`): about 0.1 ms, no network. It always runs as the fallback.
  - **Categories** come from Ghanaian-English synonyms: "chop bar" → local food, "chemical shop" → pharmacy, "trotro station" → bus station.
  - **Gazetteer lookup**: 11.5k localities, 260 districts, 16 regions. Misspellings are caught by Jaro-Winkler.
  - **Location clauses**: prepositions decide how firmly a location binds. "in Osu" filters to Osu; "near Legon" uses a wider circle.
  - **Area position matters:**
    - A trailing area name filters ("tailor tamale").
    - A leading one only steers ranking ("ridge hospital", "accra mall"), because it is usually part of a name.
  - **Unknown landmarks**: after a preposition, an unknown place ("near knust") becomes an *anchor*. The engine looks it up as a place and searches around it.
- **AI parser** (`ai-parse.ts`): Claude, with OpenAI as fallback, returns structured output against a fixed schema.
  - **Nothing it says reaches SQL unchecked**: categories must be real slugs, and locations must resolve in our gazetteer.
  - **Time budget**: 2.5 s in total, then the rule parse is used. A late AI answer is still cached for the next identical query.
  - **Circuit breaker**: while it is open, AI is skipped entirely, so an outage costs a few slow requests, not every request.

## 2. Retrieval and ranking

`search_places()` runs cheap retrieval arms over one scope (status, radius, district, region). It fuses their ranks with Reciprocal Rank Fusion, `Σ wᵢ / (60 + rankᵢ)`:

| Arm      | Finds                                                      | Why                                        |
| -------- | ---------------------------------------------------------- | ------------------------------------------ |
| title    | every query word in the place's own name                   | known items: "labadi beach hotel"          |
| fts      | weighted full text: name A, category B, area C, address D | general relevance; AND-matches rank first  |
| name     | trigram word similarity on the name                        | misspellings: "acra mall", "korlebu"       |
| category | places in the parsed categories, nearest first             | "pharmacy" finds pharmacies not so named   |
| semantic | pgvector cosine distance (when embeddings exist)           | descriptive queries (pending embeddings)   |
| near     | nearest places, when there is nothing else to go on        | "what's near me"                           |

- **Proximity** to the search centre is fused as one more ranking.
- **Confidence** (from source agreement) scales the final score.
- **Intent-aware weights** (`fusionWeights()`):
  - A "kind of place around here" query raises proximity.
  - A query with a town name in its text lowers the trigram arm.
- **Result metadata**: each result carries the arm ranks that found it (`arms`), so every ranking can be explained.

The engine also:

- resolves anchors;
- widens the radius ×3 (up to 100 km) when fewer than 3 results come back;
- reports `needsLocation` for "near me" without a position.

## 3. What every response says about itself

`meta` includes:

- the parse path (`ai` / `rules`), provider and model;
- why the AI was skipped, if it was;
- the search centre and radius, and any widening;
- the resolved anchor;
- the fusion weights;
- per-step timings.

`Server-Timing` headers carry the same timings. Each search is logged to `search_events` after the response is sent: no user id, location rounded to ~1 km.

Measured quality, latency and failure behaviour: [EVALS.md](EVALS.md).
