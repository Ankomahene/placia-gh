/**
 * Words and numbers for the "How it works" guide. When the system changes, update this file
 * and the flows in figures.tsx, and move UPDATED to the day of the change.
 */

export const UPDATED = '18 Nov 2026';

export interface KeyNumber {
  value: string;
  label: string;
}

/** Measured figures (docs/DATA_PIPELINE.md and docs/EVALS.md). */
export const NUMBERS: KeyNumber[] = [
  { value: '61.6k', label: 'places' },
  { value: '94k', label: 'source records merged' },
  { value: '7,084', label: 'places backed by 2+ sources' },
  { value: '11.5k', label: 'towns & neighbourhoods known' },
  { value: '7', label: 'ways search looks for a match' },
  { value: '0.1 ms', label: 'rule parse' },
  { value: '≤ 2.5 s', label: 'AI parse budget' },
  { value: '0.94', label: 'named-place MRR (eval)' },
  { value: '87%', label: 'browse P@10 (eval)' },
  { value: '198', label: 'judged test searches' },
];

export type TermGroup = 'Search' | 'AI' | 'Data' | 'Quality' | 'Admin' | 'Tech';

export interface Term {
  term: string;
  group: TermGroup;
  /** Plain words: what it means. */
  means: string;
  /** Where it shows up in Placia (optional). */
  here?: string;
}

export const GLOSSARY: Term[] = [
  // Search
  {
    term: 'Query',
    group: 'Search',
    means: 'What someone types or says, e.g. "cheap hotel around kaneshi".',
  },
  {
    term: 'Intent',
    group: 'Search',
    means:
      'The query broken into parts the database can use: what (text, categories), where (area or landmark), near me, open now, cheap.',
    here: 'Both the rules and the AI produce the same Intent.',
  },
  {
    term: 'Parse / parser',
    group: 'Search',
    means: 'Turning the query into an Intent. Placia has two parsers: rules and AI.',
  },
  {
    term: 'Rule parse',
    group: 'Search',
    means:
      'Our own hand-written logic. Knows Ghanaian words ("chop bar", "chemical shop"), 11.5k towns, landmarks and initials. Instant and free, and always the fallback.',
    here: 'packages/core/src/search/rules.ts',
  },
  {
    term: 'Category',
    group: 'Search',
    means:
      'The kind of place: pharmacy, hotel, bank… 71 kinds in 12 groups, each with local synonyms.',
  },
  {
    term: 'Synonym',
    group: 'Search',
    means:
      'Another word people use for a category: "chemical shop" = pharmacy, "trotro station" = bus station.',
  },
  {
    term: 'Gazetteer',
    group: 'Search',
    means: 'Our list of place names for areas: 11.5k localities, 260 districts, 16 regions.',
  },
  {
    term: 'Area',
    group: 'Search',
    means:
      'The town, district or region a query names ("in Osu"). It filters or steers the results.',
  },
  {
    term: 'Anchor',
    group: 'Search',
    means:
      'A landmark the search centres on, when the query says "near X" and X is a place, not a town ("hostel near knust"). Search looks around it (about 2 km).',
  },
  {
    term: 'Initials (acronyms)',
    group: 'Search',
    means: 'Short forms like "kbth" or "ucc", written out to the full name before searching.',
    here: 'Learned from place names by the import (2,605 pairs).',
  },
  {
    term: 'Same-name towns',
    group: 'Search',
    means:
      'Towns that exist more than once (Atonsu, Anloga, Mampong). A second name, address evidence or your position decides which one.',
  },
  {
    term: 'Fuzzy match',
    group: 'Search',
    means: 'Matching despite typos ("acra mall", "korlebu"). Needs 4+ letters.',
  },
  {
    term: 'Radius widening',
    group: 'Search',
    means:
      'When fewer than 3 places come back, the search circle grows ×3 (up to 100 km) and tries again.',
  },
  {
    term: 'Meta',
    group: 'Search',
    means:
      'The part of every search answer that explains itself: which parser ran, why, the area, anchor, weights and timings.',
  },
  // Ranking
  {
    term: 'Arm',
    group: 'Search',
    means:
      'One way of finding matches. Search runs 7 at once: title, full text, fuzzy name, category, meaning, near and initials.',
    here: 'All inside the database function search_places().',
  },
  {
    term: 'Full-text search (FTS)',
    group: 'Search',
    means: 'Word search with importance: name counts most, then category, then area, then address.',
  },
  {
    term: 'Trigram',
    group: 'Tech',
    means:
      'Three-letter pieces of a word ("acc", "ccr", "cra"). Comparing them finds misspellings.',
    here: 'Postgres extension pg_trgm.',
  },
  {
    term: 'RRF (Reciprocal Rank Fusion)',
    group: 'Search',
    means:
      'How the 7 arms vote. Each arm gives a place points of weight ÷ (60 + its rank there); the points are added up. Being near the top in several arms beats being first in one.',
  },
  {
    term: 'Fusion weights',
    group: 'Search',
    means:
      'How much each arm\'s vote counts. They change with the query: "pharmacy near me" raises nearness; a pure kind of place switches the meaning arm off.',
  },
  {
    term: 'Confidence',
    group: 'Data',
    means:
      'How sure we are a place is real and right (0–1). More sources agreeing means higher. It scales the final score; admin saves raise it to at least 0.8.',
  },
  // AI
  {
    term: 'LLM',
    group: 'AI',
    means: 'Large language model: the AI that reads text and writes answers (GPT, Claude).',
  },
  {
    term: 'AI parse',
    group: 'AI',
    means:
      'Asking the AI to turn a hard query into an Intent. Used only when the rules are unsure. Its answer is checked before use.',
    here: 'gpt-6-luna first, Claude Sonnet 5.5 as backup.',
  },
  {
    term: 'Selective AI',
    group: 'AI',
    means:
      'Calling the AI only when it helps: requests ("where can i…"), vague or contradictory queries, or 4+ unknown words. Most searches never use it.',
  },
  {
    term: 'Time budget',
    group: 'AI',
    means:
      'The most time the AI gets (2.5 s for parsing). Too slow means the rule parse is used instead.',
  },
  {
    term: 'Circuit breaker',
    group: 'AI',
    means:
      "After 3 failures in a row an AI provider is skipped for a minute, so an outage doesn't slow every search.",
  },
  {
    term: 'Fallback',
    group: 'AI',
    means: 'The next option when one fails: OpenAI → Claude → rules. Search always answers.',
  },
  {
    term: 'Structured output',
    group: 'AI',
    means:
      'Making the AI answer in a fixed form (a schema) instead of free text, so code can read it.',
  },
  {
    term: 'Embedding (vector)',
    group: 'AI',
    means:
      'A list of 512 numbers that captures what a text means. Texts with similar meaning have close numbers, even with different words.',
    here: 'OpenAI text-embedding-3-small, stored with pgvector.',
  },
  {
    term: 'Meaning arm (semantic)',
    group: 'AI',
    means: "The arm that finds places whose meaning is close to the query's, using embeddings.",
  },
  {
    term: 'Re-embed',
    group: 'AI',
    means:
      "Recomputing a place's embedding after its name, kind or area changes. Done after every admin save.",
  },
  {
    term: 'Ask',
    group: 'AI',
    means:
      'The question-answering helper. An AI agent that may only talk about places our own search returned, each cited with a ref (P1, P2…).',
  },
  {
    term: 'Agent / tools',
    group: 'AI',
    means: 'An AI that can call functions ("tools") we give it: here search_places and get_place.',
  },
  {
    term: 'Citation check',
    group: 'AI',
    means:
      'After Ask answers, every place it named must match a ref our tools issued. Made-up ones are removed.',
  },
  {
    term: 'Hallucination',
    group: 'AI',
    means:
      "When an AI states something untrue, like a place that doesn't exist. Our checks stop these reaching people.",
  },
  {
    term: 'Speech to text',
    group: 'AI',
    means:
      'Turning speech into a query. Phones use their own; otherwise gpt-transcribe with a list of Ghanaian place words, which cut errors by ~85%.',
  },
  {
    term: 'Token',
    group: 'AI',
    means: 'The unit AI providers count and charge by, about ¾ of a word.',
  },
  // Data
  {
    term: 'Ingest / import',
    group: 'Data',
    means:
      'Building the place database from open data: stage → merge → load → mentions → initials → embed.',
    here: 'pnpm ingest, run on the laptop.',
  },
  {
    term: 'Source',
    group: 'Data',
    means: 'Where a record came from: OpenStreetMap, Overture, Foursquare, community or admin.',
  },
  {
    term: 'Entity resolution (merge)',
    group: 'Data',
    means:
      'Working out which records from different sources are the same real place, and joining them.',
  },
  {
    term: 'Blocking',
    group: 'Data',
    means:
      'Only comparing records that are close (a ~440 m grid) or share a phone or website, so merging stays fast.',
  },
  {
    term: 'Jaro-Winkler',
    group: 'Data',
    means: 'A score for how alike two words are (0–1), forgiving small spelling differences.',
  },
  {
    term: 'Survivorship',
    group: 'Data',
    means:
      "Choosing which source's details win when records merge. OSM wins name and position; others fill gaps.",
  },
  {
    term: 'Slug',
    group: 'Data',
    means:
      'The readable web address of a place, e.g. /place/accra-mall. Once published, never reused.',
  },
  {
    term: 'Duplicate pair',
    group: 'Admin',
    means:
      'Two places within 200 m with very similar names. Listed on the Duplicates page for you to merge or dismiss.',
  },
  {
    term: 'Merge',
    group: 'Admin',
    means:
      'Folding a duplicate into the place you keep: sources, photos, saves move over, the copy is hidden and its old link redirects.',
  },
  {
    term: 'Admin override',
    group: 'Admin',
    means: 'Your edits, merges and deletes. The next import respects them instead of undoing them.',
  },
  {
    term: 'Contribution',
    group: 'Admin',
    means:
      'A suggestion from the public: new place, edit, report or photo. Waits for review unless you added it.',
  },
  {
    term: 'Pre-check',
    group: 'Admin',
    means: "The AI's advice on a contribution (spam, duplicate, plausible). You always decide.",
  },
  {
    term: 'Trust score',
    group: 'Admin',
    means:
      'Goes up by 1 for each approved contribution, so regular good contributors can be recognised.',
  },
  // Quality
  {
    term: 'Eval (evaluation)',
    group: 'Quality',
    means:
      'Running search over test queries with known right answers and scoring it, so every change is measured.',
    here: 'pnpm eval; results on the Evals page.',
  },
  {
    term: 'Golden set',
    group: 'Quality',
    means: 'The test queries with their right answers, written the way people in Ghana search.',
  },
  {
    term: 'Held-out set',
    group: 'Quality',
    means:
      'Test queries written after tuning and run once: the honest estimate on searches we never tuned for.',
  },
  {
    term: 'MRR',
    group: 'Quality',
    means:
      "Mean Reciprocal Rank, for named places: 1 if the right place is first, ½ if second, ⅓ if third… averaged. 0.94 means it's nearly always first.",
  },
  {
    term: 'Hit@1 / Hit@10',
    group: 'Quality',
    means: 'How often the right place is first / in the top 10.',
  },
  {
    term: 'P@10',
    group: 'Quality',
    means:
      'Precision at 10, for "kind of place" searches: how many of the top 10 are the right kind in the right area.',
  },
  {
    term: 'nDCG@10',
    group: 'Quality',
    means: 'Like P@10, but right answers near the top count more than right answers lower down.',
  },
  {
    term: 'Ablation',
    group: 'Quality',
    means: 'Switching one part off to see how much it was worth.',
  },
  {
    term: 'WER',
    group: 'Quality',
    means: 'Word error rate, for speech to text: the share of words heard wrong.',
  },
  {
    term: 'Search insights',
    group: 'Quality',
    means:
      'The admin page that flags searches that probably went wrong, with an optional AI review of each.',
  },
  {
    term: 'p50 / p95',
    group: 'Quality',
    means: 'Typical (half are faster) and slow-case (95% are faster) timings.',
  },
  // Tech
  {
    term: 'Supabase',
    group: 'Tech',
    means: 'Our database host: Postgres plus sign-in and file storage.',
  },
  {
    term: 'Postgres / SQL',
    group: 'Tech',
    means: 'The database and its query language. Search ranking runs inside it, close to the data.',
  },
  {
    term: 'PostGIS',
    group: 'Tech',
    means: 'Postgres maps add-on: distances, "within 2 km", which district a point is in.',
  },
  {
    term: 'pgvector',
    group: 'Tech',
    means: 'Postgres add-on that stores embeddings and finds the closest ones.',
  },
  {
    term: 'RPC',
    group: 'Tech',
    means: 'Calling a function that lives in the database, e.g. search_places() or merge_places().',
  },
  {
    term: 'Migration',
    group: 'Tech',
    means:
      'A numbered SQL file that changes the database. Applied in order, kept in supabase/migrations.',
  },
  {
    term: 'Railway',
    group: 'Tech',
    means:
      'Where the web and admin apps run, plus the keep-alive job that stops the free database pausing.',
  },
  {
    term: 'Cloudinary',
    group: 'Tech',
    means:
      'Main photo store; resizes and compresses photos on the fly. Supabase Storage is the fallback.',
  },
  {
    term: 'DuckDB',
    group: 'Tech',
    means: 'A fast local database the import uses on the laptop to crunch the source files.',
  },
];
