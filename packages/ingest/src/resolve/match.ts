import { TAXONOMY } from '../taxonomy';

/** One staged record from any source, already normalised. */
export interface SourceRecord {
  idx: number;
  source: 'osm' | 'overture' | 'foursquare';
  sourceId: string;
  name: string;
  norm: string;
  tokens: string[];
  altNames: string[];
  category: string;
  categoryRaw: string | null;
  lon: number;
  lat: number;
  phone: string | null;
  website: string | null;
  domain: string | null;
  email: string | null;
  openingHours: string | null;
  address: string | null;
  brand: string | null;
  extra: Record<string, unknown>;
  sourceConfidence: number | null;
}

export interface PairFeatures {
  distance: number;
  /** Symmetric soft TF-IDF name similarity, 0..1. */
  nameSim: number;
  /** How fully the shorter name is contained in the longer one, 0..1. */
  contain: number;
  /** The contained (shorter) name identifies something by itself, beyond place words. */
  containInformative: boolean;
  phoneEq: boolean;
  domainEq: boolean;
  /** 'same' leaf, same 'group', one side 'generic', or 'conflict'. */
  category: 'same' | 'group' | 'generic' | 'conflict';
  sameSource: boolean;
  bothOsm: boolean;
  /** Both names carry identity on their own (not just "Hostel", "Goil", "MoneyGram"). */
  informative: boolean;
}

const GROUP_OF = new Map(TAXONOMY.flatMap((g) => g.children.map((c) => [c.slug, g.slug] as const)));

/** Leaves that say little about what a place is; they defer to a more specific source. */
export const GENERIC = new Set([
  'other',
  'shop',
  'professional',
  'worship',
  'community',
  'services',
  'healthcare',
  'repairs',
]);

/** Physically large places whose sources often pin different spots (gate vs building vs centroid). */
const LARGE = new Set([
  'university',
  'hospital',
  'mall',
  'market',
  'airport',
  'park',
  'attraction',
  'beach',
  'camping',
  'sports',
  'shs',
  'school',
  'hotel',
  'government',
  'bus-station',
]);

export function categoryRelation(a: string, b: string): PairFeatures['category'] {
  if (a === b) return 'same';
  if (GENERIC.has(a) || GENERIC.has(b)) return 'generic';
  return GROUP_OF.get(a) === GROUP_OF.get(b) ? 'group' : 'conflict';
}

export function matchRadius(a: string, b: string) {
  return LARGE.has(a) || LARGE.has(b) ? 400 : 150;
}

export interface Decision {
  match: boolean;
  /** 0..1, stored as place_sources.match_score for auditing. */
  score: number;
  rule: string;
}

/**
 * The match rule. Deliberately transparent (no learned weights yet) so every merge can be
 * explained; Phase 2's eval harness measures precision/recall against a labelled sample.
 */
export function decide(f: PairFeatures, catA: string, catB: string): Decision {
  const radius = matchRadius(catA, catB);
  const near = Math.max(0, 1 - f.distance / (2 * radius));

  // OSM is curated: two OSM records only merge when they are clearly the same object
  // mapped twice (a node on top of its building outline).
  const best = Math.max(f.nameSim, f.contain);
  if (f.bothOsm) {
    const ok =
      f.nameSim >= 0.97 && f.distance <= (f.informative ? 75 : 20) && f.category !== 'conflict';
    return { match: ok, score: ok ? f.nameSim * near : 0, rule: 'osm-duplicate' };
  }
  // Chains share head-office numbers and websites, so contact matches need distinctive names.
  if (
    f.phoneEq &&
    f.informative &&
    f.distance <= 1000 &&
    best >= 0.6 &&
    f.category !== 'conflict'
  ) {
    return { match: true, score: Math.min(1, 0.6 + 0.4 * best), rule: 'phone' };
  }
  if (
    f.domainEq &&
    f.informative &&
    f.distance <= 1000 &&
    f.nameSim >= 0.6 &&
    f.category !== 'conflict'
  ) {
    return { match: true, score: Math.min(1, 0.55 + 0.4 * f.nameSim), rule: 'website' };
  }
  if (f.category === 'conflict' || f.distance > radius)
    return { match: false, score: 0, rule: 'blocked' };
  const scored = (s: number, rule: string): Decision => ({
    match: true,
    score: s * (0.5 + 0.5 * near),
    rule,
  });
  // A generic or chain name ("Hostel", "Goil") only identifies a place when the points practically coincide.
  if (!f.informative) {
    return f.category === 'same' && f.distance <= 40 && best >= 0.95
      ? scored(best, 'co-located')
      : { match: false, score: 0, rule: 'generic-name' };
  }
  if (f.nameSim >= 0.85) return scored(f.nameSim, 'name');
  if (
    f.contain >= 0.95 &&
    f.containInformative &&
    (f.category === 'same' || f.category === 'generic')
  ) {
    return scored(0.9 * f.contain, 'containment');
  }
  if (f.nameSim >= 0.7 && f.category === 'same' && f.distance <= radius / 3)
    return scored(f.nameSim, 'name+category');
  return { match: false, score: 0, rule: 'name-too-different' };
}
