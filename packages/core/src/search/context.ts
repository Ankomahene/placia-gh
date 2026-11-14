import { normalize, words } from './text';

/**
 * Everything the parsers need to understand a query, built once per process from the
 * `search_context()` RPC: the category vocabulary and the gazetteer of area names.
 */

export type LocalityKind = 'city' | 'town' | 'suburb' | 'neighbourhood' | 'village' | 'landmark';
export type AreaKind = 'region' | 'district' | LocalityKind;

export interface Category {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
  synonyms: string[];
}

export interface Area {
  kind: AreaKind;
  id: number;
  name: string;
  lat: number;
  lon: number;
  /** Active places assigned to this locality: a cheap "how well-known is this name" signal. */
  places: number;
}

/** Raw `search_context()` payload: compact arrays, see the migration. */
export interface RawContext {
  categories: [number, string, string, number | null, string[]][];
  regions: [number, string, number | null, number | null][];
  districts: [number, string, number, number | null, number | null][];
  localities: [number, string, string[], LocalityKind, number | null, number, number, number][];
}

export interface SearchContext {
  categories: Category[];
  bySlug: Map<string, Category>;
  byId: Map<number, Category>;
  /** Normalised phrase → leaf category slugs it means ("chop bar" → local-food). */
  phrases: Map<string, string[]>;
  /** Phrases that came from a whole group ("eat", "buy"): weaker than a leaf phrase. */
  groupPhrases: Set<string>;
  /** Normalised area name → candidate areas, best first. */
  areas: Map<string, Area[]>;
  /** Longest phrase / area name, in words, so scans stay bounded. */
  maxWords: number;
}

/** Search radius around a locality, by how big that kind of place usually is. */
export const AREA_RADIUS_M: Record<LocalityKind, number> = {
  city: 15_000,
  town: 6_000,
  suburb: 2_500,
  neighbourhood: 1_500,
  village: 3_000,
  landmark: 1_500,
};

const KIND_WEIGHT: Record<AreaKind, number> = {
  region: 6,
  city: 5,
  district: 4.5,
  town: 4,
  suburb: 3.5,
  neighbourhood: 3,
  landmark: 2,
  village: 1,
};

/** How strongly an area name refers to this particular area; used to break name clashes. */
export function areaPrior(a: Area) {
  return KIND_WEIGHT[a.kind] + Math.log1p(a.places);
}

/** "Accra Metropolitan" is "Accra" in people's mouths; "Ashanti Region" is "Ashanti". */
const AREA_SUFFIX =
  / (metropolitan|municipal|district|municipal assembly|district assembly|region)$/;

export function buildContext(raw: RawContext): SearchContext {
  const categories: Category[] = raw.categories.map(([id, slug, name, parentId, synonyms]) => ({
    id,
    slug,
    name,
    parentId,
    synonyms: synonyms ?? [],
  }));
  const bySlug = new Map(categories.map((c) => [c.slug, c]));
  const byId = new Map(categories.map((c) => [c.id, c]));
  const children = new Map<number, Category[]>();
  for (const c of categories) {
    if (c.parentId == null) continue;
    const list = children.get(c.parentId) ?? [];
    list.push(c);
    children.set(c.parentId, list);
  }

  // Leaf phrases win over group phrases ("school" means schools, not all of Education).
  // A phrase claimed by two different groups is too vague to mean either ("service").
  const leafPhrases = new Map<string, Set<string>>();
  const groupPhrases = new Map<string, Set<string>>();
  for (const c of categories) {
    const isGroup = c.parentId == null;
    const target = isGroup ? groupPhrases : leafPhrases;
    for (const p of [c.name, ...c.synonyms]) {
      const key = normalize(p);
      if (!key) continue;
      const set = target.get(key) ?? new Set<string>();
      set.add(c.slug);
      target.set(key, set);
    }
  }
  const phrases = new Map<string, string[]>();
  const fromGroups = new Set<string>();
  for (const [key, slugs] of leafPhrases) phrases.set(key, [...slugs]);
  for (const [key, groups] of groupPhrases) {
    if (phrases.has(key) || groups.size > 1) continue;
    const group = bySlug.get([...groups][0] as string);
    const leaves = (group && children.get(group.id)) ?? [];
    if (leaves.length) {
      phrases.set(
        key,
        leaves.map((l) => l.slug),
      );
      fromGroups.add(key);
    }
  }

  const areas = new Map<string, Area[]>();
  const add = (name: string, area: Area) => {
    const key = normalize(name);
    if (key.length < 2) return;
    const list = areas.get(key) ?? [];
    if (!list.some((a) => a.kind === area.kind && a.id === area.id)) list.push(area);
    areas.set(key, list);
  };
  for (const [id, name, lat, lon] of raw.regions) {
    if (lat == null || lon == null) continue;
    const area: Area = { kind: 'region', id, name, lat, lon, places: 0 };
    add(name, area);
    add(`${name} region`, area);
  }
  for (const [id, name, , lat, lon] of raw.districts) {
    if (lat == null || lon == null) continue;
    const area: Area = { kind: 'district', id, name, lat, lon, places: 0 };
    add(name, area);
    const short = normalize(name).replace(AREA_SUFFIX, '');
    if (short !== normalize(name)) add(short, area);
  }
  for (const [id, name, alt, kind, , lat, lon, places] of raw.localities) {
    const area: Area = { kind, id, name, lat, lon, places };
    add(name, area);
    for (const a of alt ?? []) add(a, area);
  }
  for (const list of areas.values()) list.sort((a, b) => areaPrior(b) - areaPrior(a));

  let maxWords = 1;
  for (const k of phrases.keys()) maxWords = Math.max(maxWords, words(k).length);
  for (const k of areas.keys()) maxWords = Math.max(maxWords, Math.min(5, words(k).length));

  return { categories, bySlug, byId, phrases, groupPhrases: fromGroups, areas, maxWords };
}

/** Leaf slugs under a slug: itself if it is a leaf, its children if it is a group. */
export function expandCategory(ctx: SearchContext, slug: string) {
  const c = ctx.bySlug.get(slug);
  if (!c) return [];
  if (c.parentId != null) return [c.slug];
  return ctx.categories.filter((x) => x.parentId === c.id).map((x) => x.slug);
}

type Rpc = (
  fn: 'search_context',
) => PromiseLike<{ data: unknown; error: { message: string } | null }>;

let cached: { at: number; ctx: Promise<SearchContext> } | null = null;

/**
 * Loads and caches the context for `ttlMs` (categories and the gazetteer change only on ingest).
 * A failed load is not cached, so the next request retries.
 */
export function loadSearchContext(rpc: Rpc, ttlMs = 60 * 60 * 1000) {
  if (cached && Date.now() - cached.at < ttlMs) return cached.ctx;
  const ctx = Promise.resolve(rpc('search_context')).then(({ data, error }) => {
    if (error || !data) throw new Error(`search_context failed: ${error?.message ?? 'no data'}`);
    return buildContext(data as RawContext);
  });
  cached = { at: Date.now(), ctx };
  ctx.catch(() => {
    if (cached?.ctx === ctx) cached = null;
  });
  return ctx;
}
