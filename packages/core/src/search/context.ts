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
  /** Places whose name or address says this name, clustered here (`area_mentions`). */
  mentions: number;
  districtId: number | null;
  regionId: number | null;
  /**
   * Not in the gazetteer: a cluster of addresses that name a place the gazetteer lacks, e.g. the
   * Kumasi suburb Atonsu. Its id is the `area_mentions` id.
   */
  fromAddresses?: true;
}

/** Raw `search_context()` payload: compact arrays, see the migrations. */
export interface RawContext {
  categories: [number, string, string, number | null, string[]][];
  regions: [number, string, number | null, number | null][];
  districts: [number, string, number, number | null, number | null][];
  localities: [number, string, string[], LocalityKind, number | null, number, number, number][];
  /** [id, normalised name, district id, lat, lon, places]. Older payloads lack it. */
  mentions?: [number, string, number | null, number, number, number][];
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
  districtNames: Map<number, string>;
  regionNames: Map<number, string>;
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

/** A suburb people write in addresses but the gazetteer lacks ranks between suburb and landmark. */
const FROM_ADDRESSES_WEIGHT = 2.5;

/** How strongly an area name refers to this particular area; used to break name clashes. */
export function areaPrior(a: Area) {
  const kind = a.fromAddresses ? FROM_ADDRESSES_WEIGHT : KIND_WEIGHT[a.kind];
  return kind + Math.log1p(a.places + a.mentions);
}

/** Straight-line km; plenty accurate at Ghana's latitudes for ranking. */
export function areaKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const x = (a.lon - b.lon) * 111.32 * Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  return Math.hypot(x, (a.lat - b.lat) * 110.57);
}

/** "Accra Metropolitan" is "Accra" in people's mouths; "Ashanti Region" is "Ashanti". */
const AREA_SUFFIX =
  / (metropolitan|metropolis|municipal|district|municipal assembly|district assembly|region)$/;
/** "Akwapem North" is also just "Akwapem" ("mampong akwapem"). */
const COMPASS_SUFFIX =
  / (north|south|east|west|central|north east|north west|south east|south west)$/;

const LOCALITY_KINDS = new Set<AreaKind>(['city', 'town', 'suburb', 'neighbourhood', 'village']);

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
  const regionNames = new Map<number, string>();
  const districtNames = new Map<number, string>();
  const regionOf = new Map<number, number>();
  for (const [id, name, lat, lon] of raw.regions) {
    regionNames.set(id, name);
    if (lat == null || lon == null) continue;
    const area: Area = {
      kind: 'region',
      id,
      name,
      lat,
      lon,
      places: 0,
      mentions: 0,
      districtId: null,
      regionId: id,
    };
    add(name, area);
    add(`${name} region`, area);
  }
  for (const [id, name, regionId, lat, lon] of raw.districts) {
    districtNames.set(id, name);
    regionOf.set(id, regionId);
    if (lat == null || lon == null) continue;
    const area: Area = {
      kind: 'district',
      id,
      name,
      lat,
      lon,
      places: 0,
      mentions: 0,
      districtId: id,
      regionId,
    };
    add(name, area);
    const short = normalize(name).replace(AREA_SUFFIX, '');
    if (short !== normalize(name)) add(short, area);
    const stem = short.replace(COMPASS_SUFFIX, '');
    if (stem !== short && stem.length >= 4) add(stem, area);
  }
  for (const [id, name, alt, kind, districtId, lat, lon, places] of raw.localities) {
    const regionId = districtId == null ? null : (regionOf.get(districtId) ?? null);
    const area: Area = { kind, id, name, lat, lon, places, mentions: 0, districtId, regionId };
    add(name, area);
    for (const a of alt ?? []) add(a, area);
  }

  // Address mentions: credit the same-name town they sit in, or, when they clearly outweigh every
  // town of that name the gazetteer has, stand in for the one it lacks (Kumasi's Atonsu). A
  // "kumasi" cluster in Sunyani ("Sunyani-Kumasi road") never outweighs Kumasi, so it is dropped.
  for (const [id, key, districtId, lat, lon, places] of raw.mentions ?? []) {
    const towns = (areas.get(key) ?? []).filter((a) => LOCALITY_KINDS.has(a.kind));
    let home: Area | null = null;
    let homeKm = Infinity;
    for (const a of towns) {
      const km = areaKm(a, { lat, lon });
      const reach = Math.max(3, AREA_RADIUS_M[a.kind as LocalityKind] / 1000);
      if (km <= reach && km < homeKm) {
        home = a;
        homeKm = km;
      }
    }
    if (home) {
      home.mentions += places;
    } else if (towns.length && places > Math.max(...towns.map((a) => a.places + a.mentions))) {
      const first = towns[0] as Area;
      areas.get(key)?.push({
        kind: 'suburb',
        id,
        name: first.name,
        lat,
        lon,
        places: 0,
        mentions: places,
        districtId,
        regionId: districtId == null ? null : (regionOf.get(districtId) ?? null),
        fromAddresses: true,
      });
    }
  }
  for (const list of areas.values()) list.sort((a, b) => areaPrior(b) - areaPrior(a));

  let maxWords = 1;
  for (const k of phrases.keys()) maxWords = Math.max(maxWords, words(k).length);
  for (const k of areas.keys()) maxWords = Math.max(maxWords, Math.min(5, words(k).length));

  return {
    categories,
    bySlug,
    byId,
    phrases,
    groupPhrases: fromGroups,
    areas,
    districtNames,
    regionNames,
    maxWords,
  };
}

/** Another town with the same name as the one searched, for a "did you mean" row. */
export interface AreaChoice {
  name: string;
  /** "Kwahu West, Eastern": enough to tell same-name towns apart. */
  where: string;
  lat: number;
  lon: number;
  /** A location phrase that picks exactly this town ("atonsu kwahu west"). */
  query: string;
}

function whereLabel(ctx: SearchContext, a: Area) {
  const district = a.districtId == null ? null : ctx.districtNames.get(a.districtId);
  const region = a.regionId == null ? null : ctx.regionNames.get(a.regionId);
  const short = district
    ? district.replace(/\s+/g, ' ').replace(/ (Metropolitan|Metropolis|Municipal|District)$/i, '')
    : null;
  return { label: [short, region].filter(Boolean).join(', '), short };
}

/**
 * Where the chosen area is, and the other towns that share its name (up to `max`, best known
 * first). Empty `others` when the name is unique or the rest are just stops inside the same town.
 */
export function sameNameAreas(
  ctx: SearchContext,
  chosen: { kind: AreaKind; id: number; name: string; lat: number; lon: number },
  max = 3,
): { where: string; others: AreaChoice[] } | null {
  const list = ctx.areas.get(normalize(chosen.name)) ?? [];
  const self = list.find(
    (a) => a.kind === chosen.kind && a.id === chosen.id && a.lat === chosen.lat,
  );
  if (!self || self.kind === 'region' || self.kind === 'district') return null;
  const others: AreaChoice[] = [];
  const seen: Area[] = [self];
  for (const a of list) {
    if (others.length >= max) break;
    if (!LOCALITY_KINDS.has(a.kind) || seen.some((s) => areaKm(s, a) < 5)) continue;
    seen.push(a);
    const { label, short } = whereLabel(ctx, a);
    if (!label) continue;
    others.push({
      name: a.name,
      where: label,
      lat: a.lat,
      lon: a.lon,
      query: normalize(`${a.name} ${short ?? label}`),
    });
  }
  return { where: whereLabel(ctx, self).label, others };
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
