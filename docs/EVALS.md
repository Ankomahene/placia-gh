# Search evaluation

How we know search works, and how much each change helped. All numbers are reproducible:

```
pnpm eval                          # dev set, AI parse if a key is set (else rules)
pnpm eval --mode rules --save      # rule parser only; writes packages/evals/reports/ + eval_runs
pnpm eval --set holdout            # the held-out set (run, never tuned on)
pnpm eval --chaos hang             # AI "configured" but hanging: graceful degradation
pnpm eval --ablate                 # switch each ranking signal off in turn
pnpm eval --tag typo -v            # one slice, with every miss printed
pnpm eval --set holdout2           # held-out set v2 (judged the meaning arm and browse weights)
pnpm eval --set holdout3           # held-out set v3 (judged selective AI)
pnpm eval --set holdout4           # held-out set v4 (judged fuzzy towns and the AI budget)
pnpm eval --ai always              # AI parse for every query (default: only when the rules are unsure)
pnpm eval --semantic off           # leave out the meaning (embedding) arm
pnpm eval --budget 20000           # give the AI parse unlimited time: its quality ceiling
pnpm eval --browse-weights '{"semantic":0.3}'   # try weights for pure category queries
```

Reports are named after what was switched on, e.g. `dev-auto-sem` (AI parse + meaning arm), `holdout2-rules-browsew` (rules, browse weights overridden), `dev-auto-b20000` (AI with a 20 s budget).

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
  - **Browse** (102): any place of the right kind within _k_ km of the intended area. Scored with **P@10** (over returned results), binary **nDCG@10** and **Success@10**.
- **Parse labels** score the query understanding separately from ranking: categories, area, near-me, open-now and cheap.
- **Held-out set** (40 queries): written _after_ tuning finished, covering other towns, schools, airports and landmarks. It was run once. Its score is the honest estimate of how search does on unseen queries.
- **Label discipline**: labels were written before tuning. The only edits allowed are logged in `LABEL_FIXES`: seven patterns (five on dev, two on held-out v4) that wrongly rejected the same real place under another spelling (e.g. "University of Ghana, Legon").
- **Latency** is measured end to end from a laptop in Accra to the Supabase project. The same run measures a no-op RPC round trip, so network and database time can be told apart.

# Part 1: rules only (Phase 2)

## Results (2026-11-14, rule parser, no AI key yet)

|                     | Baseline      | After tuning  | Held-out      |
| ------------------- | ------------- | ------------- | ------------- |
| Known item MRR      | 0.804         | **0.919**     | 0.865         |
| Known item Hit@1    | 71%           | **89%**       | 75%           |
| Known item Hit@10   | 91%           | **98%**       | 100%          |
| Browse P@10         | 71%           | **80%**       | 79%           |
| Browse nDCG@10      | 0.732         | **0.821**     | 0.804         |
| Browse Success@10   | 95%           | **97%**       | 96%           |
| Parse fully correct | 80%           | **94%**       | 100%          |
| Zero-result rate    | 0%            | 0.6%          | 0%            |
| Latency p50 / p95   | 770 / 1248 ms | 410 / 1309 ms | 525 / 1324 ms |

- The baseline was scored with the five original, too-strict labels; the later columns use the fixed ones.
- **Held-out scores sit close to the tuned scores** (browse 79% vs 80%, known MRR 0.87 vs 0.92). The tuning generalised rather than memorised the dev set.
- **Latency:**
  - A no-op RPC from the laptop takes ~240 ms.
  - The median search spends ~160 ms beyond that, and 66 of 158 searches made a second call (radius widening or a landmark lookup).
  - p95 is dominated by those multi-call searches over a slow link. On Railway, next to the database, the network share mostly disappears.

### Slices (dev set, after tuning)

| Slice          | n   | Before   | After               |
| -------------- | --- | -------- | ------------------- |
| Typos          | 8   | MRR 0.51 | MRR 0.74            |
| Ghanaian terms | 16  | P@10 61% | P@10 76%            |
| Abbreviations  | 5   | P@10 45% | P@10 95% (MRR 0.43) |
| Near me        | 10  | P@10 71% | P@10 73%            |
| Descriptive    | 14  | P@10 74% | P@10 84%            |

## What changed, and what each change was worth

Each step was measured on its own, rule parser, dev set:

| Change                                                        | Known MRR | Browse P@10 | Parse |
| ------------------------------------------------------------- | --------- | ----------- | ----- |
| Baseline: 5 arms + RRF, rules v1                              | 0.804     | 71%         | 80%   |
| + **title arm** (all query words in the name, shortest first) | 0.874     | 69%         | 80%   |
| + parser v2                                                   | 0.873     | 77%         | 93%   |
| + **intent-aware weights**, leading area = ranking only       | 0.919     | 80%         | 94%   |

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

| Variant        | Known MRR | Hit@1   | Browse P@10 | nDCG@10 |
| -------------- | --------- | ------- | ----------- | ------- |
| All signals    | **0.919** | **89%** | 80.1%       | 0.822   |
| − title        | 0.874     | 84%     | 84.1%       | 0.864   |
| − full-text    | 0.917     | 89%     | 82.7%       | 0.840   |
| − trigram name | 0.819     | 75%     | 84.6%       | 0.867   |
| − category     | 0.893     | 86%     | 68.9%       | 0.712   |
| − proximity    | 0.918     | 89%     | 76.1%       | 0.774   |
| − confidence   | 0.916     | 89%     | 81.2%       | 0.831   |

What it shows:

- **Name signals carry known items.** Without the trigram arm, Hit@1 falls from 89% to 75%. Without the title arm it falls to 84%.
- **Category and proximity carry browsing.** Without the category arm P@10 falls 11 points; without proximity, 4.
- **The name signals cost browse precision.**
  - Switching off either name arm _raises_ browse P@10 to about 85%. For "pharmacy in madina", places merely _named_ "… Pharmacy" outside the category crowd the list.
  - Full text overlaps the other arms almost completely: removing it changes known items by 0.002.
- **Next experiment:** turn the title and trigram arms down when the query text is nothing but category words, i.e. a pure browse query. Done in the afternoon session: see "Pure browse weights" below.

## Graceful degradation (held-out set, simulated AI outage)

| Scenario                       | Quality             | Errors | Latency p50 / p95 | Requests that waited on the AI    |
| ------------------------------ | ------------------- | ------ | ----------------- | --------------------------------- |
| No AI configured               | MRR 0.865, P@10 79% | 0      | 525 / 1324 ms     | 0                                 |
| AI errors instantly (HTTP 529) | identical           | 0      | 494 / 1108 ms     | 0 (breaker open after 3 failures) |
| AI hangs                       | identical           | 0      | 390 / 2897 ms     | 3 of 40, each capped at 2.5 s     |

When the provider hangs, only the first three searches pay the 2.5 s budget. Then the circuit breaker opens and every later search goes straight to the rule parser (`fallback: circuit_open`). Search never fails because the AI is down. It only loses whatever the AI parse adds, which the next run measures once a key is set.

## Known gaps (and what fixes them)

| Gap                              | Example                                                                                    | Fix                                                          |
| -------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------ |
| Joined or split words            | "korlebu" vs "Korle Bu" (MRR 0.2)                                                          | AI parse; a token-level spelling index                       |
| Abbreviations not in the data    | "KATH kumasi", "knust" (rank 6)                                                            | AI parse; alias list from Wikidata                           |
| Fuzzy area too eager             | "kotoka" → Kotoko (held-out miss)                                                          | prefer a landmark lookup before fuzzy area                   |
| Duplicate landmarks              | 6 × "University of Ghana", 5 × Kempinski                                                   | entity resolution for large campuses                         |
| Data gaps                        | no tailor in Tamale, few momo agents                                                       | Foursquare dump, contributions                               |
| Big-city radius                  | "bakery tema" also returns Teshie                                                          | per-city radii from district shapes                          |
| Descriptive queries              | "watch football" → stadiums, not bars                                                      | semantic arm (embeddings) + AI parse: now measured below     |
| Place names as category synonyms | "makola", "kotoka", "knust", "labadi" make "makola market" look like a pure category query | move them from `synonyms` to a landmark list in the taxonomy |

# Part 2: AI parse and the meaning arm (2026-11-14, afternoon)

An OpenAI key arrived, so the two AI components could finally be measured: the AI query parse (`gpt-6-luna`, structured output) and the meaning arm (`text-embedding-3-small`, 512 dimensions, half precision). Claude is not measured yet: there is no Anthropic key.

## Held-out set v2

Held-out v1 was spent on Phase 2, so **held-out v2** (44 queries, `HOLDOUT_V2`) was written before any of the changes below were chosen and never looked at while choosing them.

- 15 towns that appear nowhere in the dev set (Ashaiman, Elmina, Obuasi, Keta, Yendi, Suame…).
- Weighted toward what the changes could move: 22 pure category queries, 14 known items, 8 descriptive requests.

| Held-out v2                    | Known MRR | Hit@1 | Browse P@10 | nDCG@10   | p50     |
| ------------------------------ | --------- | ----- | ----------- | --------- | ------- |
| Phase 2: rules, no meaning arm | 0.821     | 79%   | 57%         | 0.626     | 415 ms  |
| + meaning arm                  | 0.857     | 86%   | 58%         | 0.638     | 1198 ms |
| + pure browse weights          | 0.857     | 86%   | **63%**     | 0.686     | 536 ms  |
| + AI parse (2.5 s budget)      | 0.857     | 86%   | **70%**     | **0.757** | 2736 ms |

Browse scores are far lower than on the dev set (57% vs 80% at the same starting point), largely because the data is thinner in smaller towns: no salon within 5 km of Ejisu, few clinics in Dome. That is a data problem, not a ranking one, and the Foursquare dump and contributions are the fix.

## Embedding the places

- `pnpm ingest embed` embeds every active place that has no embedding. It is resumable, and it is part of `pnpm ingest all`.
- **Input:** a short text built from facts already held: name and two alternative names, category and group, cuisine, denomination or brand, locality, district and region. For example: "TotalEnergies (DZODZE TotalEnergies Service Station). Fuel stations, Transport & Auto, TotalEnergies. Dzodze, Ketu North, Volta".
- **Cost:** 57,357 places, 1.4M tokens, about $0.03 at list price, about 15 s per 1,000 places.
- **A stall the first run hit:** one write hung on the slow link for six minutes. Every request now has a 60 s timeout and is retried.
- **Staying current:** a trigger clears a place's embedding when its name, category, area or the attributes that feed the text change, so the next run redoes it.
- **No vector index:**
  - the arm only ranks inside an already filtered scope, where an approximate index would not be used;
  - an index would cost 60–80 MB of the 500 MB free tier;
  - the database grew from 123 to 238 MB.
- **A bug the eval caught:**
  - Embeddings made every row about 1 KB wider.
  - The shared `scope` step of `search_places()` is materialised and selected `p.*`, so every search copied about 57 MB.
  - Database time went from p50 0.7 s to 1.6 s, p95 8.8 s.
  - The scope now carries only the columns the arms read (`20261114000700`).
- **The same width hurt elsewhere, so the vectors moved out** (`20261114000800`).
  - Anything that scans `places` read twice the data, e.g. `search_context()` counting places per locality.
  - On a cold free-tier instance `search_context()` took 22 s and once hit the statement timeout. That would be a 503 on the first search after the app has been idle.
  - Vectors now live in `place_embeddings` (one row per place), which only the meaning arm reads. `places` was rewritten back to its narrow width; the database went from 238 to 208 MB.
  - A partial index on `places(locality_id)` lets the per-locality count avoid the table altogether (`20261114000900`).

## The meaning arm

- The query is embedded **alongside** the AI parse, not after it. It embeds the rule parse's "what" with the area words stripped: "chop bar near osu" → "chop bar".
- Vectors are cached, and the call is abandoned after 1.2 s, in which case the other arms answer alone.

| Dev set, rule parse | Known MRR | Hit@1 | Browse P@10 |
| ------------------- | --------- | ----- | ----------- |
| All signals         | 0.936     | 91%   | 84.6%       |
| − semantic          | 0.908     | 88%   | 84.8%       |

- **It helps known items** by about 0.03 MRR on both sets:
  - "KATH kumasi": Komfo Anokye Teaching Hospital went from rank 9 to #1;
  - "ridge hospital": #2 → #1;
  - "korlebu hospital": outside the top 20 → #3.
- **It hurt plain category queries** before the pure-browse weights (P@10 −2 points):
  - "park kumasi" pulled in parking lots;
  - "bakery dansoman" pulled bakeries from across the radius ahead of nearby ones, because meaning knows nothing about distance.

## Pure browse weights

- **The rule:** a query whose every content word is a category word ("pharmacy in madina", "chop bar", "where to buy cement") is answered by the category arm and distance.
- **The weights:** the meaning arm is switched off, and the title and trigram arms are halved. These queries are never embedded, which saves the call.

Swept on the dev set (rule parse plus meaning arm):

| Weights for pure category queries              | Known MRR | Browse P@10 | nDCG@10 |
| ---------------------------------------------- | --------- | ----------- | ------- |
| unchanged                                      | 0.941     | 78%         | 0.798   |
| semantic 0.3                                   | 0.948     | 79%         | 0.810   |
| semantic 0.3, title and trigram 0.5            | 0.936     | 84%         | 0.861   |
| **semantic 0, title and trigram 0.5** (chosen) | 0.936     | **85%**     | 0.867   |
| semantic 0, title and trigram 0.25             | 0.916     | 87%         | 0.893   |

- The chosen row gives up nothing outside noise on known items. The last row buys 2 more points of browse precision with a real known-item loss.
- **On held-out v2 the change is worth +5 points of P@10** (+7 on dev), so it generalised.
- **Run-to-run noise:** three identical dev runs agreed within ±0.005 MRR and ±1 point of P@10. Embedding outputs and tie order vary slightly between calls, so differences smaller than that mean nothing.

## AI parse versus rules

|                     | Dev, rules | Dev, AI (2.5 s) | Dev, AI (no limit) | Held-out v2, rules | Held-out v2, AI (2.5 s) |
| ------------------- | ---------- | --------------- | ------------------ | ------------------ | ----------------------- |
| Known MRR           | **0.936**  | 0.913           | 0.925¹             | 0.857              | 0.857                   |
| Browse P@10         | **85%**    | 84%             | 82%¹               | 63%                | **70%**                 |
| Parse fully correct | 94%        | 92%             | 91%¹               | 83%                | **93%**                 |
| Answered by the AI  |            | 98 of 158       | 158 of 158         |                    | 40 of 44                |
| Parse p50 / p95     | 0 / 0 ms   | 1500 / 2505 ms  | 1633 / 3702 ms     | 0 / 0 ms           | 1690 / 2506 ms          |
| Tokens per AI parse |            | 579 in + 45 out | 579 + 45           |                    | 580 + 45                |

¹ Without the meaning arm or the browse weights; compare with the 0.919 / 80% rules row of Part 1.

- **On the dev set the AI parse adds nothing.** The rule parser and its synonyms were tuned on these queries.
- **On unseen phrasing it adds 7 points of browse precision**:
  - descriptive queries: 66% → 74%;
  - local terms: 70% → 85%;
  - near-me queries: 35% → 85%.
- **Typical rule failures it fixes:**
  - "filling station near me": the rules read "Filling" as a place;
  - "where to sew a dress in ho": no synonym for "sew";
  - "relax by the sea": too many categories.
- **The AI is less careful with names.**
  - "korlebu hospital" became a nationwide hospital search, and "achimota mal" became the word "mal" inside Achimota.
  - The rule parser's "a leading town is part of a name" judgment is lost. Known-item MRR on dev drops 0.02.
- **It is slow from Ghana.**
  - The median parse takes 1.5–1.7 s, against a 2.5 s budget.
  - On the dev run 10 parses timed out. Three timeouts in a row open the circuit breaker, so 50 more searches skipped the AI for the breaker's cool-down.
  - Breaker and budget work as designed: no search failed and none waited more than 2.5 s for the AI. But the AI only answered 62% of dev searches.
- **Parse labels understate the AI.**
  - It often returns several sensible categories: "see a doctor" → clinic + hospital, "pizza" → fast food + restaurant.
  - The label scoring rejects any extra category, but the retrieval scores for those queries are perfect.
  - Retrieval metrics are the ones to trust.

### What this means for the design

The AI parse is worth its cost exactly where the rule parser is unsure. Its value is in phrasing the synonym list has never seen, and it costs time and known-item accuracy on everything else. That led to the next experiment.

## Selective AI

- **Rule:** answer from the rule parse at once, and ask the AI only when the rules are unsure (`rulesUnsure()` in `rules.ts`). Unsure means:
  - the query is phrased as a request ("where can i…", "i need…", "somewhere to…", "my …");
  - it is vague: more than 3 categories, from a broad word like "food";
  - it contradicts itself: "near me" plus a named area;
  - it is four or more words the rules don't know. Three is usually a name, like "black star square".
- **How it was built:**
  - designed from the dev set's wins and losses;
  - judged on **held-out set v3** (44 queries in 23 towns), written before the rule was designed;
  - the rule was not changed after v3 was run.
- **This is now the default** (`aiPolicy: 'selective'`). `pnpm eval --ai always` reproduces the old behaviour.

Each v3 configuration was run **three times**. With 30 browse queries one case moves P@10 by 3.3 points. The AI's answers vary between runs, and so do its timeouts, so single runs were not enough to separate the policies.

| Held-out v3  | Browse P@10, 3 runs | Mean    | Known MRR | AI calls per run       | Breaker opened                            |
| ------------ | ------------------- | ------- | --------- | ---------------------- | ----------------------------------------- |
| Rules only   | 43 / 44 / 43%       | 43%     | 0.93–1.0  | 0                      | —                                         |
| AI always    | 57 / 57 / 48%       | **54%** | 0.93–1.0  | 44, ~5 timeouts        | every run (14–16 searches skipped the AI) |
| AI selective | 49 / 51 / 49%       | **50%** | 0.93–1.0  | 12 (27%), 2–4 timeouts | never                                     |

On the dev set, where the rules are tuned, selective keeps rules quality and the AI is barely used:

| Dev set      | Known MRR | Browse P@10 | AI asked             |
| ------------ | --------- | ----------- | -------------------- |
| Rules only   | 0.936     | 85%         | 0                    |
| AI always    | 0.913     | 84%         | 158                  |
| AI selective | 0.931     | 85%         | 14 (9%), 11 answered |

What it shows:

- **Selective recovers about 60% of the AI's gain on new phrasing** (+6.4 of +10.7 points of P@10) while calling the AI on about a quarter of searches, and on under a tenth of dev searches.
- **No known-item cost.** Named places are left to the rules, which handle them better.
- **It is more reliable on a slow link.**
  - "Always" sends every search to a model that times out on roughly one call in seven from here (4–5 of 28–30 per run). Each run tripped the breaker, which then switched the AI off for a third of the searches, whichever ones came next.
  - Selective makes few enough calls that the breaker never opened. The AI's help goes to the queries that need it, not to whichever arrive after an outage.
  - That is also why "always" varies more between runs (48–57%).
- **Latency:** the median search now spends 0 ms waiting on the AI, against about 1.35 s for "always". Only searches routed to the AI pay for it, at up to 2.5 s.

Where the rest of the gap comes from (v3, per case):

- **One routing miss.** "supermarket abelemkpe": the rules missed the misspelt suburb (the gazetteer has "Abelenkpe") yet counted themselves sure. That is a fuzzy-matching bug in the rules, which the AI exposed.
- **AI timeouts** on routed queries, e.g. "place to fix my laptop": 2–4 of the 12 per run. The longer requests are slower to parse.
- **AI answer variance.**
  - "good spot for jollof in ahodwo" returned local food + restaurant in one run, which gave perfect results.
  - Another run returned local food only, and nothing was within 3 km.

## Round 2: misspelt towns and the AI budget (held-out v4)

**Held-out v4** (45 queries, 22 more towns) was written before any of this round's changes. It leans on what the changes target:

- 6 queries with a misspelt town ("pharmacy lashibe", "guest house sogakpe");
- 10 requests phrased as sentences.

**Three candidate changes, two kept:**

1. **Kept: fuzzy match for a bare trailing town.**
   - Misspelt towns were only matched after a preposition ("in abelemkpe"), not in "supermarket abelemkpe".
   - Now the last one or two words are also matched fuzzily, but only when a category word comes before them, so a name like "pizza hut" is never bent into a town.
2. **Rejected: "a category plus an unrecognised word" as an unsure signal.**
   - Checked offline on the dev set before spending any calls: it would have sent 21 queries to the AI.
   - Almost all were named places ("kempinski hotel", "baba yara stadium"), which the AI handles worse.
3. **Tested: a 4 s AI budget instead of 2.5 s**, for the quarter of searches that are routed to the AI at all.

| Held-out v4                  | Browse P@10   | Misspelt towns | Requests      | Plain categories |
| ---------------------------- | ------------- | -------------- | ------------- | ---------------- |
| Rules, before the fuzzy fix  | 47%           | 21%            | 59%           | 57%              |
| Rules, after the fix         | **58%**       | **79%**        | 59%           | 57%              |
| Selective AI, 2.5 s (3 runs) | 59 / 60 / 59% | 79%            | 62 / 67 / 62% | 57%              |
| Selective AI, 4 s (3 runs)   | 59 / 60 / 60% | 79%            | 63 / 66 / 66% | 57%              |
| AI on every search¹          | 60%           | 86%            | 67%           | **47%**          |

¹ The one "always" run of three in which the AI answered every query. In the other two, timeouts tripped the breaker after a few calls and the AI answered only 6 and 8 of 45.

What it shows:

- **A one-line rule fix beat the AI.** Fuzzy trailing towns are worth +11 points of browse precision. On this set the AI adds 1–2 points overall, all of it on requests.
- **The AI makes plain category queries worse** (57% → 47%) when it is asked about them. That is the clearest evidence yet for selective routing: the AI's output is good on requests and costly elsewhere.
- **The 4 s budget removed timeouts but bought no measurable quality.**
  - The routed queries were all answered in two of three runs, against 3–10 of 11 at 2.5 s.
  - Quality on requests moved by about 1 point, within noise.
  - The budget stays at 2.5 s. A longer one is cheap to adopt if it is ever shown to matter.
- **Named places:** known-item MRR 0.823, Hit@1 77%. Two name patterns were too strict and are logged in `LABEL_FIXES` ("Palace Shopping Mall", Tamale's "Central Mosque"). The real misses are data gaps (Fort St. Jago) and one wrong town: "drug store atonsu" picked a village called Atonsu, not the Kumasi suburb.
- **Local terms scored poorly (15%)** whatever parsed them: chop bars in Kpone, mobile-money agents in Akatsi. The data is not there yet.

**The meaning arm on a bad link:**

- During a slow spell the OpenAI embedding call took 0.4–1.4 s, against 0.3–0.4 s earlier in the day.
- On the dev server, two of three embeddings missed the 1.2 s cutoff.
- Search fell back to the lexical arms each time, as designed. For those searches the gain the meaning arm gives named places ("KATH kumasi") is lost.
- On Railway, next to the API, this mostly disappears. On the user's side, a phone on a slow network still never waits on the embedding: the server does.

Next:

- **Claude versus OpenAI** on the same sets once an Anthropic key exists: quality, latency from Ghana, and tokens.
- **Prefer the suburb over a far-away village** when a town name is ambiguous ("atonsu").
- **Fill the data gaps** with the Foursquare dump and community contributions.
