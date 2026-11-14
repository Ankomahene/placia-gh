# Search evaluation

How we know search works, and how much each change helped. All numbers are reproducible:

```
pnpm eval                          # dev set, AI parse if a key is set (else rules)
pnpm eval --mode rules --save      # rule parser only; writes packages/evals/reports/ + eval_runs
pnpm eval --set holdout            # the held-out set (run, never tuned on)
pnpm eval --chaos hang             # AI "configured" but hanging: graceful degradation
pnpm eval --ablate                 # switch each ranking signal off in turn
pnpm eval --tag typo -v            # one slice, with every miss printed
```

## Method

- **Golden set v1** (`packages/evals/src/golden.ts`): 158 queries written the way people in Ghana type them.
  - Local terms ("chop bar", "chemical shop", "trotro station", "momo agent").
  - Misspellings ("korlebu", "acra mall", "kaneshi").
  - Abbreviations ("KATH", "KNUST", "UCC").
  - Near-me queries with a simulated position.
  - Descriptive requests ("where can i watch football in kumasi").
  - Coverage: 34 towns and neighbourhoods, including 11 of the 16 regional capitals.
- **Two kinds of judgment, both predicates, not place ids**, so they survive re-ingests:
  - **Known item** (56): one specific place, matched by a name pattern and optionally an area. Scored with **MRR**, **Hit@1** and **Hit@10**.
  - **Browse** (102): any place of the right kind within *k* km of the intended area. Scored with **P@10** (over returned results), binary **nDCG@10** and **Success@10**.
- **Parse labels** score the query understanding separately from ranking: categories, area, near-me, open-now and cheap.
- **Held-out set** (40 queries): written *after* tuning finished, covering other towns, schools, airports and landmarks. It was run once. Its score is the honest estimate of how search does on unseen queries.
- **Label discipline**: labels were written before tuning. The only edits allowed are logged in `LABEL_FIXES`: five patterns that wrongly rejected the same real place under another spelling (e.g. "University of Ghana, Legon").
- **Latency** is measured end to end from a laptop in Accra to the Supabase project. The same run measures a no-op RPC round trip, so network and database time can be told apart.

## Results (2026-11-14, rule parser, no AI key yet)

| | Baseline | After tuning | Held-out |
| --- | --- | --- | --- |
| Known item MRR | 0.804 | **0.919** | 0.865 |
| Known item Hit@1 | 71% | **89%** | 75% |
| Known item Hit@10 | 91% | **98%** | 100% |
| Browse P@10 | 71% | **80%** | 79% |
| Browse nDCG@10 | 0.732 | **0.821** | 0.804 |
| Browse Success@10 | 95% | **97%** | 96% |
| Parse fully correct | 80% | **94%** | 100% |
| Zero-result rate | 0% | 0.6% | 0% |
| Latency p50 / p95 | 770 / 1248 ms | 410 / 1309 ms | 525 / 1324 ms |

- The baseline was scored with the five original, too-strict labels; the later columns use the fixed ones.
- **Held-out scores sit close to the tuned scores** (browse 79% vs 80%, known MRR 0.87 vs 0.92). The tuning generalised rather than memorised the dev set.
- **Latency:**
  - A no-op RPC from the laptop takes ~240 ms.
  - The median search spends ~160 ms beyond that, and 66 of 158 searches made a second call (radius widening or a landmark lookup).
  - p95 is dominated by those multi-call searches over a slow link. On Railway, next to the database, the network share mostly disappears.

### Slices (dev set, after tuning)

| Slice | n | Before | After |
| --- | --- | --- | --- |
| Typos | 8 | MRR 0.51 | MRR 0.74 |
| Ghanaian terms | 16 | P@10 61% | P@10 76% |
| Abbreviations | 5 | P@10 45% | P@10 95% (MRR 0.43) |
| Near me | 10 | P@10 71% | P@10 73% |
| Descriptive | 14 | P@10 74% | P@10 84% |

## What changed, and what each change was worth

Each step was measured on its own, rule parser, dev set:

| Change | Known MRR | Browse P@10 | Parse |
| --- | --- | --- | --- |
| Baseline: 5 arms + RRF, rules v1 | 0.804 | 71% | 80% |
| + **title arm** (all query words in the name, shortest first) | 0.874 | 69% | 80% |
| + parser v2 | 0.873 | 77% | 93% |
| + **intent-aware weights**, leading area = ranking only | 0.919 | 80% | 94% |

What parser v2 changed:

- Area words never count as categories, so "Legon" stops reading as a university.
- Specific phrases beat group words ("cement" beats "buy").
- Plurals are handled.
- Phrases may contain filler words ("learn to drive").
- A trailing area filters.
- An unknown "near X" becomes a landmark lookup.

What the intent-aware weights do:

- Distance is weighted 3× for "a kind of place around here".
- The trigram arm is halved when a town name is part of the text.

The label fixes landed between the first and second rows.

### Ablation: what each ranking signal is worth

Each row switches one signal off (weight 0), on the dev set with the rule parser (`reports/2026-11-14-07-50-ablation-rules.json`):

| Variant | Known MRR | Hit@1 | Browse P@10 | nDCG@10 |
| --- | --- | --- | --- | --- |
| All signals | **0.919** | **89%** | 80.1% | 0.822 |
| − title | 0.874 | 84% | 84.1% | 0.864 |
| − full-text | 0.917 | 89% | 82.7% | 0.840 |
| − trigram name | 0.819 | 75% | 84.6% | 0.867 |
| − category | 0.893 | 86% | 68.9% | 0.712 |
| − proximity | 0.918 | 89% | 76.1% | 0.774 |
| − confidence | 0.916 | 89% | 81.2% | 0.831 |

What it shows:

- **Name signals carry known items.** Without the trigram arm, Hit@1 falls from 89% to 75%. Without the title arm it falls to 84%.
- **Category and proximity carry browsing.** Without the category arm P@10 falls 11 points; without proximity, 4.
- **The name signals cost browse precision.**
  - Switching off either name arm *raises* browse P@10 to about 85%. For "pharmacy in madina", places merely *named* "… Pharmacy" outside the category crowd the list.
  - Full text overlaps the other arms almost completely: removing it changes known items by 0.002.
- **Next experiment:** turn the title and trigram arms down when the query text is nothing but category words, i.e. a pure browse query. The expected gain is about +4 points of browse P@10 at no cost to known items. Because the held-out set is now spent, this will be judged on a fresh held-out set v2.

## Graceful degradation (held-out set, simulated AI outage)

| Scenario | Quality | Errors | Latency p50 / p95 | Requests that waited on the AI |
| --- | --- | --- | --- | --- |
| No AI configured | MRR 0.865, P@10 79% | 0 | 525 / 1324 ms | 0 |
| AI errors instantly (HTTP 529) | identical | 0 | 494 / 1108 ms | 0 (breaker open after 3 failures) |
| AI hangs | identical | 0 | 390 / 2897 ms | 3 of 40, each capped at 2.5 s |

When the provider hangs, only the first three searches pay the 2.5 s budget. Then the circuit breaker opens and every later search goes straight to the rule parser (`fallback: circuit_open`). Search never fails because the AI is down. It only loses whatever the AI parse adds, which the next run measures once a key is set.

## Known gaps (and what fixes them)

| Gap | Example | Fix |
| --- | --- | --- |
| Joined or split words | "korlebu" vs "Korle Bu" (MRR 0.2) | AI parse; a token-level spelling index |
| Abbreviations not in the data | "KATH kumasi", "knust" (rank 6) | AI parse; alias list from Wikidata |
| Fuzzy area too eager | "kotoka" → Kotoko (held-out miss) | prefer a landmark lookup before fuzzy area |
| Duplicate landmarks | 6 × "University of Ghana", 5 × Kempinski | entity resolution for large campuses |
| Data gaps | no tailor in Tamale, few momo agents | Foursquare dump, contributions |
| Big-city radius | "bakery tema" also returns Teshie | per-city radii from district shapes |
| Descriptive queries | "watch football" → stadiums, not bars | semantic arm (embeddings) + AI parse |

Next measurements, once keys exist:

- the AI parse versus rules on the same sets (quality, latency, cost per query);
- the semantic arm's contribution;
- Claude versus OpenAI.
