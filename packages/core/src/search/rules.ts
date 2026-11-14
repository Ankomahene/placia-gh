import { type Area, areaPrior, type SearchContext } from './context';
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

/** Best area for a phrase. With a user location, prefer candidates near them. */
export function pickArea(
  candidates: Area[] | undefined,
  user?: { lat: number; lon: number } | null,
): Area | null {
  if (!candidates?.length) return null;
  if (!user) return candidates[0] ?? null;
  let best: Area | null = null;
  let bestScore = -Infinity;
  for (const a of candidates) {
    const km = Math.hypot((a.lat - user.lat) * 111, (a.lon - user.lon) * 111);
    // A well-known town 400 km away loses to the small village of the same name next door.
    const score = areaPrior(a) - 2 * Math.log1p(km / 5);
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
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
      const picked = pickArea(ctx.areas.get(hit.key), opts.user);
      if (picked) area = toRef(picked, p.relation);
      // "near osu oxford street": the extra words may name a specific spot within the area.
      if (toks.slice(hit.end).some((w) => !FILLER.has(w))) anchor = tail.join(' ');
      cut = p.i;
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
  let span: { start: number; end: number; area: Area; trailing: boolean } | null = null;
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
      if (picked) span = { start, end: last + 1, area: picked, trailing: true };
    }
    if (!span && last > first) {
      const hit = areaAt(ctx, toks, first, last);
      const picked = hit ? pickArea(ctx.areas.get(hit.key), opts.user) : null;
      if (hit && picked) span = { start: first, end: hit.end, area: picked, trailing: false };
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
