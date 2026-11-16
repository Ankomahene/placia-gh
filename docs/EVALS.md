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
pnpm eval --set holdout5           # held-out set v5 (judged same-name towns)
pnpm eval --set holdout6           # held-out set v6 (judged initials)
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

## Round 3: towns that share a name (held-out v5)

Many Ghanaian towns share a name: there are several Atonsus, Anlogas, Mampongs, Akropongs and Odumasis. "drug store atonsu" picked a village in the Eastern Region, because the Kumasi suburb everyone means is not in the gazetteer at all.

The places data knows better: 43 places in Kumasi say "Atonsu" in their name or address. Three changes ([SEARCH.md](SEARCH.md)):

1. **Learn towns from addresses.**
   - `area_mentions` clusters the places that name a town (DBSCAN in Postgres, ~8 s per ingest).
   - A cluster credits the same-name town it sits in.
   - When a cluster outweighs every same-name town in the gazetteer, it stands in for the missing one.
   - A "Kumasi" cluster in Sunyani (from "Sunyani–Kumasi" addresses) can never outweigh Kumasi, so it is dropped.
2. **A second name decides** ("atonsu kumasi", "anloga volta", "konongo odumasi"): the town that lies inside the other name wins.
3. **Otherwise the user's position.** The nearer town wins unless the farther one is much better known; without a position, the best-known one wins. Bus stops never beat the town they are named after.

**Held-out v5** (30 queries, written and checked against the data before any of this code):

- 4 bare names where one town clearly dominates;
- 13 names with a qualifier;
- 9 bare names with a user position;
- 4 unambiguous controls.

Each label is the town people mean, located from the places that name it. Two labels asked for something with no matching place in that town (a pharmacy in Volta's Anloga); their category was changed before any run.

**Success@10** (is the right town in the top 10?) is the main measure here. Precision can't reach 100% in a town with two pharmacies.

| Held-out v5                 | Success@10  | P@10      |
| --------------------------- | ----------- | --------- |
| Before                      | 70%         | 52%       |
| After                       | **100%**    | **73%**   |
| · bare names                | 50% → 100%  | 28% → 50% |
| · with a qualifier          | 54% → 100%  | 37% → 76% |
| · with the user's position¹ | 89% → 100%  | 68% → 72% |
| · controls                  | 100% → 100% | 88% → 88% |

¹ Not truly held out. The distance weight (3) was chosen by reasoning through examples like "Akropong from Accra", which are this slice's cases. It shows the rule does what it says, not that it generalises.

- **No AI involved.** With the default selective policy, all 30 queries stayed with the rules: same results, no tokens.
- **Also fixed on older sets:**
  - "bank swedru" now finds Agona Swedru (held-out v3, P@10 0 → 100%);
  - "manhyia palace" and "ridge hospital" resolve to the right town.
- **Two regressions caught on dev and fixed before this write-up:**
  - In "filling station kasoa", "station" is also a bus stop's name, so it was taken for a qualifier and the fuel category was lost. Words doing category duty can no longer be qualifiers.
  - Round 2's misspelt-town fix had bent "university of ghana" into the town Ghanata. Round 2 was judged on v4 without re-running dev, which is how it slipped. Fuzzy matching now skips a word after "of".
- **Dev after both fixes:** known MRR 0.936 and browse P@10 85%, the same as before.

**A finding about the meaning arm:** "UMaT tarkwa" (v3) ranks UMaT first only when the embedding misses its cutoff. With the meaning arm on, "umat" means little to the embedding and the arm promotes other Tarkwa places (known MRR on v3: 1.0 without the meaning arm, 0.929 with it). Short abbreviations should probably skip the meaning arm.

## Round 4: initials (held-out v6)

Round 3 ended with "UMaT tarkwa" and a plan to skip the meaning arm for short abbreviations. A wider probe showed the real problem was bigger:

- "knust" put the university 6th and "upsa" 5th, behind a hostel and a car park merely named after it.
- "kbth" returned nothing at all, because no place in the data says "KBTH".
- Selective AI never stepped in: the rules felt sure of every one of these queries, so the fix had to be in search itself.

**Held-out v6** (36 queries, written before any of this code):

- 24 institutions by their initials, alone or with a town ("tth", "uds tamale", "gpha tema");
- 2 typed with full stops ("k.n.u.s.t");
- 4 whose initials are in the place names themselves (ECG, MTN, KFC, GCB);
- 6 controls: short ordinary words that must not be read as initials ("bar labone", "gym tema", "spa osu").

Five labels were fixed after the baseline run and before any code change. Four rejected the same organisation under its short name ("GPHA Tema Hq", "VRA Office", "GRA", "UDS - Tamale Campus"), and one had a typo. All five are listed in LABEL_FIXES.

What changed ([SEARCH.md](SEARCH.md), [DATA_PIPELINE.md](DATA_PIPELINE.md)):

1. **Initials learned from the data.**
   - `place_acronyms` holds the initials of every name with 3–8 content words, small words optional, so UMaT matches "University of Mines and Technology".
   - A pair needs evidence: an alternative name or a bracket that states it, or at least two places with that name.
   - The first version also accepted "other places are named with these letters". On the dev and spent sets that read "spare", "dam", "sea" and "baba" as initials, and "kfc" became Kenzey Fashion Centre. Ordinary words are in hundreds of names, so that evidence now only adds to the score.
2. **An alias arm.** A query word that is learned initials, and not a category word or a town, is searched as the full name (a phrase, shortest name first). The arms that match names containing the letters ("UCC SRC") are halved.
3. **The meaning arm embeds the name**, not the letters. This replaces round 3's idea of skipping it.
4. **Dotted initials are joined** ("K.N.U.S.T" → "knust").

| Held-out v6, rules + meaning arm | Before | After     |
| -------------------------------- | ------ | --------- |
| Known-item MRR                   | 0.442  | **0.746** |
| Hit@1                            | 33%    | 67%       |
| Hit@10                           | 67%    | **93%**   |
| · initials (24)                  | 0.369  | 0.751     |
| · hospitals (4)                  | 0      | 1         |
| · dotted (2)                     | 0.198  | 0.167     |
| · initials in names (4)          | 1      | 1         |
| · controls, P@10 (6)             | 67%    | 67%       |

- **No AI involved.** With selective AI all 36 queries stayed with the rules: same results, no tokens.
- **Spent sets:**
  - v3 known MRR went 0.929 → 1.0: "UMaT tarkwa" now ranks UMaT first even when the embedding answers.
  - v4 known MRR went 0.823 → 0.885 ("UPSA").
  - On dev and the spent sets, expansion fires on exactly 3 of 361 queries: KATH, UMaT and UPSA.
- **Dev:** known MRR 0.931 against 0.936, browse P@10 85% against 85%. The one changed case, "korlebu hospital" (rank 3 → 15), has no initials in it. Its embedding took 1.21 s, just past the 1.2 s cutoff, so the meaning arm that usually finds Korle Bu was missing from that run.
- **Cost:** the alias arm adds 50–80 ms to an unscoped query, and nothing when no initials are found.

What v6 still misses, and why (not tuned on v6, which is now spent):

| Miss                        | Cause                                                                                                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "ucc", "U.C.C", "k.n.u.s.t" | "ucc" and "knust" are taxonomy synonyms of the university category, so they are read as category words and never expanded. This is the known gap "place names as category synonyms".                                   |
| "ktu kumasi", "cuc"         | Shared initials: Koforidua Technical University is also KTU, and Christ Universal Church outweighs Central University College. The parser knows only the best name per acronym, so the town in the query can't choose. |
| "gij", "nafti"              | Their only evidence was other places named with the letters, which no longer counts on its own. This is the cost of stopping "spare" and "kfc".                                                                        |
| "gra", "gbc"                | The right place ranks 3rd, behind prefix matches ("Grace").                                                                                                                                                            |

Next:

- **Move landmark names out of category synonyms** ("knust", "ucc", "legon") into the acronym and landmark data; judge on held-out v7.
- **Let the town choose between shared initials** ("ktu kumasi"): ship every name per acronym, not just the best.
- **Claude versus OpenAI** on the same sets once an Anthropic key exists: quality, latency from Ghana, and tokens.
- **Show the "did you mean" towns** (`meta.area.others`) and the expanded initials (`meta.aliases`) in the app.
- **Fill the data gaps** with the Foursquare dump and community contributions.

## Round 5: landmarks (held-out v7)

Round 4 left "ucc", "knust" and "legon" as taxonomy synonyms of the university category. A probe showed what that costs:

- "ucc" matched every university, because each synonym is written into the search text of every place in its category.
- "pharmacy legon" read Legon as the university, not the town.
- "hostel knust" had no anchor: without "near", initials beside a category were only letters in names.
- "hotel near kotoka" fuzzy-matched Kotoko, a neighbourhood in Kumasi, and searched there.

**Held-out v7** (34 queries, written before any of this code):

- 16 kinds of place beside a landmark ("pharmacy ucc", "bank kejetia", "forex makola", "restaurant near kotoka");
- 13 landmarks by name or initials, alone or with a town ("kia airport", "kotoka terminal 3", "ktu koforidua");
- 5 controls ("pharmacy madina", "beach accra", "airport in tamale").

Three queries that repeated earlier sets were replaced before the baseline. One label was fixed: Tamale's airport is 17 km out, so its radius is 25 km, not 15 (LABEL_FIXES).

What changed ([SEARCH.md](SEARCH.md), [DATA_PIPELINE.md](DATA_PIPELINE.md)):

1. **Synonyms name kinds of place, never places.** Landmark words left the market, airport, university and beach synonyms, and the search text was rebuilt.
2. **Initials beside a kind of place are an anchor** ("hostel knust"), unless a town is named too ("uew kumasi campus").
3. **Other words beside a kind of place can be a landmark** ("forex makola"): an airport, market, campus, beach, mall, hospital, park, attraction, stadium or station whose name has exactly those words. The shortest such name wins. Not when the landmark is the kind asked for, or when some place's name holds the whole query ("marina mall", "mole motel", "kotoka terminal 3").
4. **A fuzzily matched town keeps what was typed.** If a landmark carries those exact words, it wins over the town: "near kotoka" is the airport, not Kotoko.
5. **Anchors pick the place itself**: for initials, the place the alias arm finds ("kia" is the airport, not a Kia showroom); otherwise, the shortest matching name, not a hotel named after it.
6. **The town chooses between shared initials** within 40 km ("ktu koforidua"). Each name carries one point, its most trusted place; an average of two places 150 km apart was nowhere.

| Held-out v7, rules + meaning arm | Before | After     |
| -------------------------------- | ------ | --------- |
| Known-item MRR                   | 0.686  | **0.865** |
| Hit@1                            | 62%    | 77%       |
| Hit@10                           | 77%    | **100%**  |
| Browse P@10                      | 42%    | **73%**   |
| Browse nDCG@10                   | 0.443  | 0.758     |
| Success@10                       | 67%    | 91%       |
| · landmark browse, P@10 (16)     | 38%    | 78%       |
| · named, MRR (8)                 | 0.646  | 0.938     |
| · controls, P@10 (5)             | 57%    | 57%       |

Dev and the spent sets (measurements, not tuning targets):

| Set | Known MRR     | Browse P@10 |
| --- | ------------- | ----------- |
| dev | 0.945 → 0.966 | 86% → 86%   |
| v1  | 0.875 → 0.865 | 78% → 89%   |
| v2  | 0.857 → 0.821 | 63% → 64%   |
| v3  | 1 → 1         | 50% → 49%   |
| v4  | 0.808 → 0.846 | 60% → 60%   |
| v5  | —             | 73% → 73%   |
| v6  | 0.726 → 0.826 | 70% → 70%   |

- "knust", "ucc", "k.n.u.s.t", "U.C.C" and "ktu kumasi" now find their universities; "kotoka airport" goes from rank 3 to 1.
- The v1, v2 and v5 "before" runs predate the Foursquare load, so their small losses ("paga crocodile pond" 1 → 2, "kumasi airport" 2 → 3) are new near-name places, not this round.
- Single browse cases that move by one result ("chop bar near adum" 100% → 90%) are within run-to-run variance of the meaning arm.
- **Cost:** a query with a category and one or two other words now makes one extra lookup (50–100 ms in the database; more on a slow link). Pure category queries and queries with a known town make none.
- Evals on this network often hit "fetch failed" or a cold statement timeout. Such a case scores 0; every zero above was rerun.

What v7 still misses (not tuned on v7, which is now spent):

| Miss                 | Cause                                                                                                             |
| -------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "hotel in ada"       | The gazetteer's "Ada" is a village inland. Ada Foah is the town people mean.                                      |
| "airport in tamale"  | Tamale's 15 km city radius ends before its airport (17 km).                                                       |
| "ttu tamale"         | The right place ranks 4th, behind campus buildings named with the initials.                                       |
| Browse near campuses | "printing shop legon", "hospital ucc": shops on campus are often tagged as the university, not as what they sell. |

Next:

- **Landmark kinds reach further**: an airport or campus anchor should get a wider radius than a shop.
- **Same-name towns**: prefer the town people mean (Ada Foah over Ada village) using address evidence, as round 3 did for Atonsu.
- **Claude versus OpenAI** on the same sets once an Anthropic key exists.
- **Show the anchor** (`meta.anchor`) in the app: "Near Kotoka International Airport".

# Part 3: Voice and Ask (2026-11-15, Phase 4)

## Voice: speech to text

Phones with built-in speech recognition (Chrome/Android) use it: free and fast, but it needs Google's servers. Everything else records up to 8 s and sends it to `/api/transcribe`. A recognition error that isn't "mic blocked" falls back to recording, and the keyboard always works.

We measured word error rate (WER) on 20 spoken place searches (`pnpm --filter @placia/evals voice`). The clips are **synthetic**: a TTS model asked for a Ghanaian English accent, four voices. That makes a repeatable baseline but not a substitute for real speakers; real recordings go in `packages/evals/voice/real/` with the same `manifest.json` and are reported as their own set.

| Model                  | Place-name hints | WER   | Exact | p50 latency |
| ---------------------- | ---------------- | ----- | ----- | ----------- |
| gpt-4o-mini-transcribe | yes              | 2.9%  | 18/20 | 910 ms      |
| gpt-4o-mini-transcribe | no               | 18.9% | 10/20 | 919 ms      |
| gpt-transcribe         | yes              | 2.5%  | 18/20 | 930 ms      |
| gpt-transcribe         | no               | 18.5% | 11/20 | 771 ms      |
| whisper-1              | yes              | 3.8%  | 17/20 | 1369 ms     |
| whisper-1              | no               | 23.0% | 9/20  | 1405 ms     |

**The hint list matters more than the model.** Sending a short prompt of Ghanaian place and food words (`GHANA_VOCABULARY` in `@placia/core/voice`) cuts WER by about 85% for every model: "Ayeduase", "Achimota" and "waakye" come back spelled the way search knows them. Without it every model mangles local names. The app uses `gpt-transcribe` with hints. Remaining misses: "kenkey" → "Kenkay", "mosque" → "Mask".

## Ask: grounded answers

Ask is a small agent with two tools, `search_places` (our own hybrid search) and `get_place` (details). Places come back with short refs (P1, P2…), and the model must cite every place it names with one. After the answer we check every citation against the refs our tools issued: a ref we never issued is a made-up place and is removed before the user sees the final answer. If the model errors or runs out of time before writing anything, the user gets the plain search results instead (path `fallback`).

Eval: 14 questions (12 that our data can answer, 2 it can't, like "ski resort in Accra"). A question passes when the answer is grounded and a cited place matches what was asked, or, for the impossible ones, when nothing is cited (`pnpm --filter @placia/evals ask --models …`).

| Model        | Pass  | Grounded | Made-up refs | Tool calls | First words p50 / p95 | Full answer p50 / p95 | Tokens in/out |
| ------------ | ----- | -------- | ------------ | ---------- | --------------------- | --------------------- | ------------- |
| gpt-6-luna   | 13/14 | 14/14    | 0            | 1.0        | 2.7 / 3.9 s           | 3.4 / 4.3 s           | 935 / 72      |
| gpt-5.4-mini | 13/14 | 14/14    | 0            | 1.0        | 3.8 / 10.5 s          | 4.1 / 10.6 s          | 955 / 101     |
| gpt-5.4-nano | 12/14 | 14/14    | 0            | 2.6        | 3.9 / 9.1 s           | 4.5 / 9.7 s           | 1471 / 207    |

Our search is about 0.8 s of each answer. No model invented a place in this run, so the citation check is a safety net, not a crutch; it is still the reason a hallucination can't reach the screen. The failures are the "impossible" questions: models offered near matches (a beach resort for "ski resort", a travel agent for "ticket to the moon") and cited them. That is arguably helpful, but the eval counts it as a miss. The smallest model calls tools 2.6 times per question and is slower overall, so cheaper is not faster here. `gpt-6-luna` stays the default (`AI_ASK_MODEL` overrides it).

Reports: `packages/evals/reports/voice-2026-11-15.md`, `packages/evals/reports/ask-2026-11-15.md`.

# Part 4: Learning from real searches (2026-11-16)

## Search insights

Every search is logged to `search_events`. The admin page **Search insights** reads that log in two layers. The first is rule flags, free and computed on every search (`@placia/core/search/insights`):

- **Wrong kind of place**: a category was asked for, but most of the top five results are something else ("asked for shop; top results: church ×5").
- **Searched again**: the same person rephrased within three minutes ("… around dummy" → "… around dome Accra" 7 s later). Same session, or the same ~1 km location cell. A new topic doesn't count.
- **AI step failed**, **No results**, **Place not found** (an anchor that resolved to nothing).
- Notes: **Repeated words** (a voice stutter), **Too vague**, **Slow** (over 5 s).

The second is an AI review, run on demand and stored in `search_events.review`. The model reads the query, how it was understood, the top results and the next search, then writes a verdict (good/partial/bad), a problem type (wrong kind, misheard, not covered, too vague, missing place, ranking) and a one-line fix. For example: _"They wanted a place in Accra to buy a cat; results were churches such as Holy Spirit Cathedral and Wesley Cathedral, apparently matching 'cat' to 'cathedral'."_ A "good" review clears a search the rules flagged.

The first real user session (about 20 searches near Ablekuma, mostly spoken) turned up:

- **Short words**, fixed below.
- **Voice mishearings**: "dummy" for Dome, "bus" for bars.
- **Out of scope**: "best areas in Accra" matched places named "Area".
- **Empty "near me"**.

## Short words

"Is there place in Accra where I can buy a cat" was parsed well (category shop, text "cat"), but ranked Holy Spirit Cathedral and Catholic churches first. "pet" ranked the Ministry of Energy and Petroleum first. Two arms matched the three-letter word inside longer ones. The title and full-text arms matched the last word as a prefix (`cat:*`), and the fuzzy name arm scored "cat" as close to "Catholic". Three name arms against one category arm outvoted the category.

Three settings were added to `search_places`, through `p_weights` (migration `20261116000000`). Each was judged on all 198 eval cases with the keyword parser:

| Setting                                             | Named place: MRR / Hit@1 | Effect                                     |
| --------------------------------------------------- | ------------------------ | ------------------------------------------ |
| Before                                              | 0.900 / 86%              | (browse P@10 86%, nDCG 0.880)              |
| Penalise places outside the asked-for category ×0.5 | 0.889 / 85%              | Worse: drops a "Pet Shop" filed under mall |
| No prefix match under 4 letters                     | 0.934 / 89%              | Loses "achimota mal" (a half-typed word)   |
| No fuzzy name match under 4 letters                 | 0.943 / 90%              | Better                                     |

Adopted: fuzzy matching needs 4+ letters always. Prefix matching needs 4+ letters only when a kind of place was asked for, because then "cat" is a whole word rather than a half-typed one. The category penalty is left off.

Result on all sets: named place MRR **0.900 → 0.943**, Hit@1 86% → 90%, Hit@10 96% → 99%. Browse is unchanged (P@10 86%, nDCG 0.880). "pet" in shops near Accra now returns Village Pets and Garden, Precious Pet Shop, Pet Mart, Pet Land and Sweet Pet Grooming. "cat" returns ordinary shops, because there are no cat sellers in the data. Report: `packages/evals/reports/2026-11-16-02-01-all-rules-sem.json`.
