import { AREA_RADIUS_M, type Area, areaKm, areaPrior, type SearchContext } from './context';
import type { AreaRef, Intent } from './intent';
import { jaroWinkler, normalize, words } from './text';

/**
 * Rule-based query parser: Ghanaian-English synonyms + gazetteer lookup, no network, ~0.1 ms.
 * It is the fallback whenever the AI parser is slow, down or unconfigured, so it must always
 * return a usable intent.
 */

const NEAR_ME =
  /\b(near me|around me|close to me|closer to me|close by|closeby|nearby|near here|around here|closest|nearest)\b/g;
const OPEN_NOW =
  /\b(open now|opened now|open right now|still open|open late|open 24 ?(hours|hrs|7)|24 ?hours|24 ?hrs|24 7|open)\b/g;
const CHEAP = /\b(cheap|cheapest|affordable|budget|inexpensive|low cost)\b/g;

/** Prepositions that introduce a location, and how tightly they bind the search to it. */
const PREPOSITIONS: [string[], AreaRef['relation']][] = [
  [['close', 'to'], 'near'],
  [['closer', 'to'], 'near'],
  [['next', 'to'], 'near'],
  [['in'], 'in'],
  [['at'], 'in'],
  [['inside'], 'in'],
  [['within'], 'in'],
  [['on'], 'in'],
  [['near'], 'near'],
  [['around'], 'near'],
  [['by'], 'near'],
  [['opposite'], 'near'],
  [['behind'], 'near'],
  [['beside'], 'near'],
  [['off'], 'near'],
  [['along'], 'near'],
];

/** Words that carry no search meaning on their own. */
const FILLER = new Set([
  'i',
  'im',
  'we',
  'a',
  'an',
  'the',
  'me',
  'my',
  'us',
  'find',
  'show',
  'where',
  'wheres',
  'whats',
  'what',
  'which',
  'is',
  'are',
  'there',
  'any',
  'some',
  'can',
  'could',
  'get',
  'want',
  'need',
  'looking',
  'look',
  'search',
  'for',
  'to',
  'place',
  'places',
  'good',
  'best',
  'nice',
  'top',
  'please',
  'with',
  'of',
  'and',
  'or',
  'one',
  'go',
  'around',
  'near',
  'in',
  'at',
  'now',
  'today',
  'tonight',
]);

/** Areas a bare name (no preposition) may refer to. Villages and landmarks clash with words. */
const SOFT_KINDS = new Set(['region', 'district', 'city', 'town', 'suburb', 'neighbourhood']);

function toRef(a: Area, relation: AreaRef['relation']): AreaRef {
  return { kind: a.kind, id: a.id, name: a.name, lat: a.lat, lon: a.lon, relation };
}

type LatLon = { lat: number; lon: number };

/**
 * How much distance from the user outweighs how well-known a town is. At 3, the Akropong 45 km
 * from Accra beats the bigger Akropong 200 km away; a town ten times bigger still wins at ~2x
 * the distance.
 */
const DISTANCE_WEIGHT = 3;

const distancePenalty = (a: LatLon, user: LatLon) =>
  DISTANCE_WEIGHT * Math.log1p(areaKm(a, user) / 5);

/** Bus stops and the like are named after the area around them: prefer the area itself. */
function withoutLandmarks(candidates: Area[]) {
  const towns = candidates.filter((a) => a.kind !== 'landmark');
  return towns.length ? towns : candidates;
}

/** Best area for a phrase. With a user location, the nearer of two same-name towns wins. */
export function pickArea(candidates: Area[] | undefined, user?: LatLon | null): Area | null {
  if (!candidates?.length) return null;
  const pool = withoutLandmarks(candidates);
  if (!user) return pool[0] ?? null;
  let best: Area | null = null;
  let bestScore = -Infinity;
  for (const a of pool) {
    const score = areaPrior(a) - distancePenalty(a, user);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

/** Rough size, to tell which of two overlapping areas is the more specific one. */
function areaSize(a: Area) {
  if (a.kind === 'region') return 1e7;
  if (a.kind === 'district') return 1e6;
  return AREA_RADIUS_M[a.kind];
}

/** Is `a` inside `b`, or right next to it? */
function inside(a: Area, b: Area) {
  if (a === b) return false;
  if (b.kind === 'region') return a.kind !== 'region' && a.regionId === b.id;
  if (a.kind === 'region' || a.kind === 'district') return false;
  if (b.kind === 'district') return a.districtId === b.id;
  return areaKm(a, b) <= (AREA_RADIUS_M[b.kind] / 1000) * 1.5 + 2;
}

/**
 * Two names side by side ("atonsu kumasi", "konongo odumasi", "anloga volta"): the pair in which
 * one lies inside the other picks the town, and the inner, more specific one is the answer.
 * Null when neither lies in the other, so they are not a town and its qualifier.
 */
export function pickPair(
  first: Area[] | undefined,
  second: Area[] | undefined,
  user?: LatLon | null,
): Area | null {
  let best: Area | null = null;
  let bestScore = -Infinity;
  for (const a of withoutLandmarks(first ?? [])) {
    for (const b of withoutLandmarks(second ?? [])) {
      const aIn = inside(a, b);
      const bIn = inside(b, a);
      if (!aIn && !bIn) continue;
      // Both inside each other ("konongo odumasi": a suburb by a town): the smaller one is meant.
      const inner = aIn && bIn ? (areaSize(b) < areaSize(a) ? b : a) : aIn ? a : b;
      const score = areaPrior(a) + areaPrior(b) - (user ? distancePenalty(inner, user) : 0);
      if (score > bestScore) {
        best = inner;
        bestScore = score;
      }
    }
  }
  return best;
}

/** A location phrase made of two names ("atonsu kumasi", "atonsu in kumasi"). */
export function pairInPhrase(ctx: SearchContext, phrase: string, user?: LatLon | null) {
  const toks = words(phrase).filter((w) => !FILLER.has(w));
  for (let k = 1; k < toks.length; k++) {
    const a = toks.slice(0, k).join(' ');
    const b = toks.slice(k).join(' ');
    if (!ctx.areas.has(a) || !ctx.areas.has(b)) continue;
    const paired = pickPair(ctx.areas.get(a), ctx.areas.get(b), user);
    if (paired) return paired;
  }
  return null;
}

/** Is any word in [start, end) part of a category phrase ("filling station", "police station")? */
function inCategoryPhrase(ctx: SearchContext, toks: string[], start: number, end: number) {
  for (let i = Math.max(0, start - ctx.maxWords + 1); i < end; i++) {
    for (let e = Math.min(toks.length, i + ctx.maxWords); e > Math.max(i, start); e--) {
      const phrase = toks.slice(i, e).join(' ');
      if (ctx.phrases.has(phrase) || ctx.phrases.has(singular(phrase))) return true;
    }
  }
  return false;
}

/**
 * An area name ending exactly at `end` (just before a qualifier or a preposition). Words doing
 * category duty never count: "station" in "filling station kasoa" is a bus stop's name too.
 */
function areaEndingAt(ctx: SearchContext, toks: string[], end: number, from = 0) {
  for (let start = Math.max(from, end - ctx.maxWords); start < end; start++) {
    const hit = areaAt(ctx, toks, start, end);
    if (hit?.end === end && !inCategoryPhrase(ctx, toks, start, end))
      return { key: hit.key, start };
  }
  return null;
}

/** Closest gazetteer name for a misspelt phrase ("kaneshi" → Kaneshie). Conservative. */
export function fuzzyArea(ctx: SearchContext, phrase: string) {
  if (phrase.length < 5) return null;
  const n = words(phrase).length;
  let best: string | null = null;
  let bestSim = 0.92;
  for (const key of ctx.areas.keys()) {
    if (Math.abs(key.length - phrase.length) > 2 || words(key).length !== n) continue;
    const sim = jaroWinkler(phrase, key);
    if (sim > bestSim) {
      best = key;
      bestSim = sim;
    }
  }
  return best;
}
/** Longest gazetteer name starting at `start`, ending at or before `maxEnd`. */
function areaAt(ctx: SearchContext, toks: string[], start: number, maxEnd = toks.length) {
  for (let end = Math.min(maxEnd, start + ctx.maxWords); end > start; end--) {
    const key = toks.slice(start, end).join(' ');
    // A one-word name that is also a category word ("market", "station") is not an area.
    if (ctx.areas.has(key) && !(end - start === 1 && ctx.phrases.has(key))) return { key, end };
  }
  return null;
}

/** "universities" → "university", "hostels" → "hostel": enough for category words. */
function singular(phrase: string) {
  if (phrase.endsWith('ies')) return `${phrase.slice(0, -3)}y`;
  if (/(ches|shes|sses|xes)$/.test(phrase)) return phrase.slice(0, -2);
  if (phrase.endsWith('s') && !phrase.endsWith('ss')) return phrase.slice(0, -1);
  return phrase;
}

/**
 * Leaf category slugs mentioned in the tokens, longest phrase first. Tokens in `skip` (an area
 * name) are ignored, so "Legon" in "gym east legon" never reads as a university. Specific
 * phrases beat whole-group words ("cement" beats "buy"), and the catch-all "shop" only counts
 * when nothing more specific was found.
 */
export function findCategories(ctx: SearchContext, toks: string[], skip = new Set<number>()) {
  const leaf = new Set<string>();
  const group = new Set<string>();
  let i = 0;
  while (i < toks.length) {
    let matched = 0;
    if (!skip.has(i)) {
      for (let end = Math.min(toks.length, i + ctx.maxWords); end > i; end--) {
        let blocked = false;
        for (let j = i; j < end; j++) blocked ||= skip.has(j);
        if (blocked) continue;
        const phrase = toks.slice(i, end).join(' ');
        const key = ctx.phrases.has(phrase) ? phrase : singular(phrase);
        const slugs = ctx.phrases.get(key);
        if (!slugs) continue;
        const into = ctx.groupPhrases.has(key) ? group : leaf;
        for (const s of slugs) into.add(s);
        matched = end - i;
        break;
      }
    }
    i += matched || 1;
  }
  const found = [...(leaf.size ? leaf : group)];
  return found.length > 1 ? found.filter((s) => s !== 'shop') : found;
}

/**
 * True when every content word of the text is part of a category phrase ("pharmacy",
 * "chop bar", "where to buy cement"): a pure "kind of place" query with no name in it.
 */
export function onlyCategoryWords(ctx: SearchContext, text: string) {
  const toks = words(normalize(text));
  return toks.some((w) => !FILLER.has(w)) && otherWords(ctx, toks).length === 0;
}

/** Content words not covered by any category phrase: names, or words the rules don't know. */
function otherWords(ctx: SearchContext, toks: string[]) {
  const out: string[] = [];
  let i = 0;
  while (i < toks.length) {
    let matched = 0;
    for (let end = Math.min(toks.length, i + ctx.maxWords); end > i; end--) {
      const phrase = toks.slice(i, end).join(' ');
      if (ctx.phrases.has(phrase) || ctx.phrases.has(singular(phrase))) {
        matched = end - i;
        break;
      }
    }
    if (!matched && !FILLER.has(toks[i] as string)) out.push(toks[i] as string);
    i += matched || 1;
  }
  return out;
}

// A request phrased as a sentence ("where can i…", "i need…", "somewhere to…", "my car…").
const REQUEST =
  /^(where|what|which|how|who|any|is there|are there|i|im|i m|my|we|need|want|looking|somewhere|someone|anywhere|place to|places to|good|best|nice|recommend)\b/;
/** More categories than this means the rules only caught a broad group word. */
const MAX_CONFIDENT_CATEGORIES = 3;

/**
 * Why the rule parse might be wrong, or null when it can be trusted as is. The AI parse is only
 * worth its latency and cost for these queries (docs/EVALS.md, "Selective AI"): on short
 * category and name queries the rules are as good or better.
 */
export function rulesUnsure(query: string, intent: Intent, ctx: SearchContext): string | null {
  const n = normalize(query);
  if (REQUEST.test(n)) return 'request';
  if (intent.categories.length > MAX_CONFIDENT_CATEGORIES) return 'vague';
  if (intent.nearMe && (intent.area || intent.anchor)) return 'conflict';
  if (!intent.categories.length && !intent.area && !intent.anchor) {
    // Three unknown words is usually a name ("black star square"); four is usually a sentence.
    if (otherWords(ctx, words(normalize(intent.text))).length >= 4) return 'unknown_words';
  }
  return null;
}

function prepositionAt(toks: string[], i: number) {
  for (const [p, relation] of PREPOSITIONS) {
    if (p.every((w, j) => toks[i + j] === w)) return { len: p.length, relation };
  }
  return null;
}

export interface RulesOptions {
  user?: { lat: number; lon: number } | null;
}

export function parseRules(query: string, ctx: SearchContext, opts: RulesOptions = {}): Intent {
  let n = normalize(query);
  const nearMe = NEAR_ME.test(n);
  n = n.replace(NEAR_ME, ' ');
  const openNow = OPEN_NOW.test(n);
  n = n.replace(OPEN_NOW, ' ');
  const cheap = CHEAP.test(n);
  n = n.replace(CHEAP, ' ');
  // Regexes with /g keep state between test() calls.
  NEAR_ME.lastIndex = OPEN_NOW.lastIndex = CHEAP.lastIndex = 0;

  const toks = words(n);
  let area: AreaRef | null = null;
  let anchor: string | null = null;
  /** Tokens from `cut` on are a location clause ("in osu"), not part of what is wanted. */
  let cut = toks.length;

  // 1. "… in/near/close to <place>": scan prepositions from the end.
  const preps: { i: number; len: number; relation: AreaRef['relation'] }[] = [];
  for (let i = 0; i < toks.length; i++) {
    const p = prepositionAt(toks, i);
    if (p) preps.push({ i, ...p });
  }
  preps.reverse();
  for (const p of preps) {
    const start = p.i + p.len;
    if (start >= toks.length) continue;
    const tail = toks.slice(start);
    let hit = areaAt(ctx, toks, start);
    if (!hit) {
      // Misspelt area: try the first two words of the tail, then the first one.
      for (const len of [2, 1]) {
        const fuzzy = len <= tail.length ? fuzzyArea(ctx, tail.slice(0, len).join(' ')) : null;
        if (fuzzy) {
          hit = { key: fuzzy, end: start + len };
          break;
        }
      }
    }
    if (hit) {
      let picked = pickArea(ctx.areas.get(hit.key), opts.user);
      let end = hit.end;
      // "in atonsu kumasi": a second name right after the first says which one is meant.
      const next = end < toks.length ? areaAt(ctx, toks, end) : null;
      const pairedAfter = next
        ? pickPair(ctx.areas.get(hit.key), ctx.areas.get(next.key), opts.user)
        : null;
      if (next && pairedAfter) {
        picked = pairedAfter;
        end = next.end;
      }
      // "atonsu in kumasi": the name before the preposition is the town, this one says which.
      const before = pairedAfter ? null : areaEndingAt(ctx, toks, p.i);
      const pairedBefore = before
        ? pickPair(ctx.areas.get(before.key), ctx.areas.get(hit.key), opts.user)
        : null;
      if (pairedBefore) picked = pairedBefore;
      if (picked) area = toRef(picked, p.relation);
      // "near osu oxford street": the extra words may name a specific spot within the area.
      if (toks.slice(end).some((w) => !FILLER.has(w))) anchor = tail.join(' ');
      cut = before && pairedBefore ? before.start : p.i;
      break;
    }
    // Not an area, but grammatically a location ("near knust"): a landmark for the engine to
    // look up. If the lookup fails, the engine puts the words back into the search text.
    const tailWords = tail.filter((w) => !FILLER.has(w));
    if (p === preps[0] && tailWords.length) {
      anchor = tailWords.join(' ');
      cut = p.i;
      break;
    }
  }

  // 2. A bare area name at either end ("pharmacy kumasi", "osu waakye").
  let span: { start: number; end: number; area: Area; trailing: boolean; key: string } | null =
    null;
  if (!area && !anchor) {
    let first = 0;
    let last = cut - 1;
    while (first <= last && FILLER.has(toks[first] as string)) first++;
    while (last >= first && FILLER.has(toks[last] as string)) last--;
    for (
      let start = Math.max(first + 1, last + 1 - ctx.maxWords);
      start <= last && !span;
      start++
    ) {
      const hit = areaAt(ctx, toks, start, last + 1);
      const picked = hit?.end === last + 1 ? pickArea(ctx.areas.get(hit.key), opts.user) : null;
      if (hit && picked)
        span = { start, end: last + 1, area: picked, trailing: true, key: hit.key };
    }
    // A misspelt town after a kind of place ("supermarket abelemkpe"). Only with a category in
    // front, so a name ("pizza hut") is never bent into a town.
    for (const len of [2, 1]) {
      if (span || last + 1 - len <= first) continue;
      const tail = toks.slice(last + 1 - len, last + 1);
      if (tail.some((w) => ctx.phrases.has(w) || FILLER.has(w))) continue;
      // "university of ghana", "bank of ghana": a name, not a misspelt town (Ghanata).
      if (toks[last - len] === 'of') continue;
      if (!findCategories(ctx, toks.slice(first, last + 1 - len)).length) continue;
      const fuzzy = fuzzyArea(ctx, tail.join(' '));
      const picked = fuzzy ? pickArea(ctx.areas.get(fuzzy), opts.user) : null;
      if (fuzzy && picked) {
        span = { start: last + 1 - len, end: last + 1, area: picked, trailing: true, key: fuzzy };
      }
    }
    // "pharmacy atonsu kumasi", "hotel anloga volta": the last name says which town is meant.
    if (span?.trailing) {
      const before = areaEndingAt(ctx, toks, span.start, first);
      const paired = before
        ? pickPair(ctx.areas.get(before.key), ctx.areas.get(span.key), opts.user)
        : null;
      if (before && paired) span = { ...span, start: before.start, area: paired };
    }
    if (!span && last > first) {
      const hit = areaAt(ctx, toks, first, last);
      const picked = hit ? pickArea(ctx.areas.get(hit.key), opts.user) : null;
      if (hit && picked) {
        span = { start: first, end: hit.end, area: picked, trailing: false, key: hit.key };
      }
    }
  }

  const skip = new Set<number>();
  for (let i = cut; i < toks.length; i++) skip.add(i);
  if (span) for (let i = span.start; i < span.end; i++) skip.add(i);
  const categories = findCategories(ctx, toks, skip);

  let stripSpan = false;
  if (span) {
    const a = span.area;
    if (span.trailing && categories.length) {
      // "tailor tamale": a kind of place, then where. Limit results to that area.
      area = toRef(a, 'near');
      stripSpan = true;
    } else if (SOFT_KINDS.has(a.kind) || a.places >= 20 || categories.length) {
      // "ridge hospital", "accra mall": a leading area is usually part of a name, so it only
      // steers ranking and never filters.
      area = toRef(a, 'soft');
    }
  }

  const keep = toks.filter(
    (w, i) => i < cut && !(stripSpan && span && i >= span.start && i < span.end) && !FILLER.has(w),
  );
  let text = keep.join(' ');
  // Never drop everything: "near me" alone is fine, but a query should not vanish into fillers.
  if (!text && !categories.length && !area && !anchor && !nearMe) text = normalize(query);

  return { text, categories, area, anchor, nearMe, openNow, cheap };
}
