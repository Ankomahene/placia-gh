import { createHash } from 'node:crypto';
import {
  categoryRelation,
  type Decision,
  decide,
  GENERIC,
  matchRadius,
  type PairFeatures,
  type SourceRecord,
} from './match';
import { displayName, nameTokens, normName } from './normalize';
import { haversine, Idf, softTfIdf } from './similarity';

export type { SourceRecord } from './match';

export interface Member {
  rec: SourceRecord;
  /** Best accepted edge touching this record (1 for the anchor). */
  score: number;
  rule: string;
}

export interface CanonicalPlace {
  id: string;
  name: string;
  altNames: string[];
  category: string;
  lon: number;
  lat: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  socials: string[];
  openingHours: string | null;
  attributes: Record<string, unknown>;
  confidence: number;
  members: Member[];
}

export interface ResolveStats {
  records: number;
  pairsCompared: number;
  matches: Record<string, number>;
  rejectedByOsmGuard: number;
  /** Merges refused because the cluster would sprawl (stops "Hostel"–"Hostel"–"Hostel" chains). */
  rejectedBySpread: number;
  places: number;
  multiSource: number;
  droppedLowConfidence: number;
}

/** ~440 m cells: every pair within the largest match radius (400 m) is in a neighbouring cell. */
const CELL = 0.004;

/** Stable UUID from the anchor record, so re-running ingest keeps place ids. */
export function placeId(anchor: Pick<SourceRecord, 'source' | 'sourceId'>) {
  const h = createHash('sha1').update(`placia:${anchor.source}:${anchor.sourceId}`).digest('hex');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((Number.parseInt(h[16] ?? '0', 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

class UnionFind {
  readonly parent: Int32Array;
  readonly hasOsm: Uint8Array;
  /** Bounding box per root: [minLon, minLat, maxLon, maxLat]. */
  readonly box: Float64Array;
  constructor(records: SourceRecord[]) {
    this.parent = Int32Array.from(records, (_, i) => i);
    this.hasOsm = Uint8Array.from(records, (r) => (r.source === 'osm' ? 1 : 0));
    this.box = new Float64Array(records.length * 4);
    records.forEach((r, i) => {
      this.box.set([r.lon, r.lat, r.lon, r.lat], i * 4);
    });
  }
  /** Diagonal (m) of the box the two clusters would share. */
  spreadIfJoined(ra: number, rb: number) {
    const a = this.box.subarray(ra * 4, ra * 4 + 4);
    const b = this.box.subarray(rb * 4, rb * 4 + 4);
    return haversine(
      Math.min(a[0]!, b[0]!),
      Math.min(a[1]!, b[1]!),
      Math.max(a[2]!, b[2]!),
      Math.max(a[3]!, b[3]!),
    );
  }
  find(i: number): number {
    let r = i;
    while (this.parent[r] !== r) r = this.parent[r] as number;
    while (this.parent[i] !== r) {
      const next = this.parent[i] as number;
      this.parent[i] = r;
      i = next;
    }
    return r;
  }
  union(a: number, b: number) {
    const ra = this.find(a);
    const rb = this.find(b);
    if (ra === rb) return;
    this.parent[rb] = ra;
    const x = this.box.subarray(ra * 4, ra * 4 + 4);
    const y = this.box.subarray(rb * 4, rb * 4 + 4);
    x.set([
      Math.min(x[0]!, y[0]!),
      Math.min(x[1]!, y[1]!),
      Math.max(x[2]!, y[2]!),
      Math.max(x[3]!, y[3]!),
    ]);
    this.hasOsm[ra] = (this.hasOsm[ra] as number) | (this.hasOsm[rb] as number);
  }
}

export interface ResolveOptions {
  /** Tokens that are settlement names ("osu", "haatso"): they say where, not what. */
  placeWords?: ReadonlySet<string>;
}

export function resolve(
  records: SourceRecord[],
  opts: ResolveOptions = {},
): { places: CanonicalPlace[]; stats: ResolveStats } {
  const idf = new Idf();
  for (const r of records) idf.add(r.tokens);
  const infoMin = idf.weightAt(50);
  const placeWords = opts.placeWords ?? new Set<string>();
  const w = (t: string) => idf.weight(t);
  /** Identity weight: settlement words count for little when deciding containment. */
  const wId = (t: string) => idf.weight(t) * (placeWords.has(t) ? 0.3 : 1);

  const names = records.map((r) =>
    [r.tokens, ...r.altNames.map((a) => nameTokens(normName(a)))].filter((t) => t.length),
  );
  const compact = records.map((r) =>
    [r.norm, ...r.altNames.map(normName)].map((n) => n.replaceAll(' ', '')),
  );
  const info = records.map((r) => r.tokens.reduce((s, t) => s + w(t), 0));

  /** Best symmetric similarity and best containment over all name/alt-name pairs. */
  const nameScores = (i: number, j: number) => {
    let sym = 0;
    let contain = 0;
    let containInfo = false;
    for (const ci of compact[i]!)
      for (const cj of compact[j]!)
        if (ci && ci === cj) return { sym: 1, contain: 1, containInfo: true };
    for (const ti of names[i]!) {
      for (const tj of names[j]!) {
        const { ab, ba } = softTfIdf(ti, tj, w);
        sym = Math.max(sym, Math.min(ab, ba));
        const id = softTfIdf(ti, tj, wId);
        const [c, small] = id.ab >= id.ba ? [id.ab, ti] : [id.ba, tj];
        if (c > contain) {
          contain = c;
          containInfo = small.reduce((s, t) => s + wId(t), 0) >= infoMin;
        }
      }
    }
    return { sym, contain, containInfo };
  };

  // --- candidate pairs: spatial grid + shared phone + shared website domain
  const grid = new Map<string, number[]>();
  const byPhone = new Map<string, number[]>();
  const byDomain = new Map<string, number[]>();
  const push = (m: Map<string, number[]>, k: string, i: number) => {
    const l = m.get(k);
    if (l) l.push(i);
    else m.set(k, [i]);
  };
  records.forEach((r, i) => {
    push(grid, `${Math.floor(r.lon / CELL)}:${Math.floor(r.lat / CELL)}`, i);
    if (r.phone) push(byPhone, r.phone, i);
    if (r.domain) push(byDomain, r.domain, i);
  });

  const seen = new Set<number>();
  const edges: { i: number; j: number; d: Decision; bothOsm: boolean; limit: number }[] = [];
  const stats: ResolveStats = {
    records: records.length,
    pairsCompared: 0,
    matches: {},
    rejectedByOsmGuard: 0,
    rejectedBySpread: 0,
    places: 0,
    multiSource: 0,
    droppedLowConfidence: 0,
  };
  const n = records.length;

  const consider = (i: number, j: number) => {
    if (i === j) return;
    const [a, b] = i < j ? [i, j] : [j, i];
    const key = a * n + b;
    if (seen.has(key)) return;
    seen.add(key);
    const ra = records[a] as SourceRecord;
    const rb = records[b] as SourceRecord;
    const distance = haversine(ra.lon, ra.lat, rb.lon, rb.lat);
    const phoneEq = !!ra.phone && ra.phone === rb.phone;
    const domainEq = !!ra.domain && ra.domain === rb.domain;
    if (!phoneEq && !domainEq && distance > matchRadius(ra.category, rb.category)) return;
    stats.pairsCompared++;
    const ns = nameScores(a, b);
    const f: PairFeatures = {
      distance,
      nameSim: ns.sym,
      contain: ns.contain,
      containInformative: ns.containInfo,
      phoneEq,
      domainEq,
      category: categoryRelation(ra.category, rb.category),
      sameSource: ra.source === rb.source,
      bothOsm: ra.source === 'osm' && rb.source === 'osm',
      informative: (info[a] as number) >= infoMin && (info[b] as number) >= infoMin,
    };
    const d = decide(f, ra.category, rb.category);
    if (d.match) {
      const limit =
        d.rule === 'phone' || d.rule === 'website'
          ? 1000
          : d.rule === 'osm-duplicate'
            ? 150
            : 2 * matchRadius(ra.category, rb.category);
      edges.push({ i: a, j: b, d, bothOsm: f.bothOsm, limit });
    }
  };

  records.forEach((r, i) => {
    const cx = Math.floor(r.lon / CELL);
    const cy = Math.floor(r.lat / CELL);
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (const j of grid.get(`${cx + dx}:${cy + dy}`) ?? []) if (j > i) consider(i, j);
      }
    }
  });
  // Shared contact details: chains reuse a head-office number, so only small groups count.
  for (const m of [byPhone, byDomain]) {
    for (const ids of m.values()) {
      if (ids.length < 2 || ids.length > 6) continue;
      for (let x = 0; x < ids.length; x++)
        for (let y = x + 1; y < ids.length; y++) consider(ids[x]!, ids[y]!);
    }
  }

  // --- clustering: strongest edges first; never fuse two OSM-backed clusters indirectly
  edges.sort((x, y) => y.d.score - x.d.score);
  const uf = new UnionFind(records);
  const joinedBy = new Map<number, Decision>();
  for (const e of edges) {
    const ri = uf.find(e.i);
    const rj = uf.find(e.j);
    if (ri === rj) continue;
    if (!e.bothOsm && uf.hasOsm[ri] && uf.hasOsm[rj]) {
      stats.rejectedByOsmGuard++;
      continue;
    }
    if (uf.spreadIfJoined(ri, rj) > e.limit) {
      stats.rejectedBySpread++;
      continue;
    }
    uf.union(ri, rj);
    stats.matches[e.d.rule] = (stats.matches[e.d.rule] ?? 0) + 1;
    for (const k of [e.i, e.j])
      if ((joinedBy.get(k)?.score ?? -1) < e.d.score) joinedBy.set(k, e.d);
  }

  const clusters = new Map<number, number[]>();
  for (let i = 0; i < n; i++) {
    const root = uf.find(i);
    const l = clusters.get(root);
    if (l) l.push(i);
    else clusters.set(root, [i]);
  }

  const places: CanonicalPlace[] = [];
  for (const ids of clusters.values()) {
    const p = canonical(
      ids.map((i) => records[i] as SourceRecord),
      ids.map((i) => joinedBy.get(i)),
    );
    if (!p) {
      stats.droppedLowConfidence++;
      continue;
    }
    if (new Set(p.members.map((m) => m.rec.source)).size > 1) stats.multiSource++;
    places.push(p);
  }
  stats.places = places.length;
  return { places, stats };
}

const sourceWeight = (r: SourceRecord) =>
  r.source === 'osm' ? 0.75 : (r.sourceConfidence ?? 0.5) * 0.9;

const CHURCH =
  /\b(church|chapel|cathedral|parish|tabernacle|pentecost(al)?|assembl(y|ies) of god|ministr(y|ies)|adventist|methodist|presby(terian)?|anglican|catholic|baptist)\b/i;
const MOSQUE = /\b(mosque|masjid|jamia?|islamic cent(er|re))\b/i;

/** Generic religious records get a specific leaf when the name makes it obvious. */
export function refineCategory(name: string, category: string) {
  if (category === 'worship' || category === 'community' || category === 'other') {
    if (MOSQUE.test(name)) return 'mosque';
    if (CHURCH.test(name)) return 'church';
  }
  return category;
}

/** Survivorship: OSM wins identity and location; other sources fill gaps. */
export function canonical(
  recs: SourceRecord[],
  joined: (Decision | undefined)[] = [],
): CanonicalPlace | null {
  const order = recs
    .map((rec, k) => ({ rec, d: joined[k] }))
    .sort(
      (x, y) =>
        (x.rec.source === 'osm' ? 0 : 1) - (y.rec.source === 'osm' ? 0 : 1) ||
        sourceWeight(y.rec) - sourceWeight(x.rec),
    );
  const anchor = order[0]!.rec;

  let miss = 1;
  for (const { rec } of order) miss *= 1 - sourceWeight(rec);
  const first = <K extends keyof SourceRecord>(k: K) =>
    order.find((o) => o.rec[k] != null && o.rec[k] !== '')?.rec[k] ?? null;
  const phone = first('phone') as string | null;
  const website = first('website') as string | null;
  const confidence = Math.min(0.98, 1 - miss + (phone ? 0.03 : 0) + (website ? 0.02 : 0));
  if (!order.some((o) => o.rec.source === 'osm') && confidence < 0.36) return null;

  const name = displayName(anchor.name);
  const seenNorm = new Set([normName(name)]);
  const altNames: string[] = [];
  for (const cand of order.flatMap((o) => [o.rec.name, ...o.rec.altNames])) {
    const nn = normName(cand);
    if (!nn || seenNorm.has(nn) || altNames.length >= 6) continue;
    seenNorm.add(nn);
    altNames.push(displayName(cand));
  }

  const specific = order.find((o) => !GENERIC.has(o.rec.category))?.rec.category;
  const category = refineCategory(name, specific ?? anchor.category);

  const osmExtra = order.find((o) => o.rec.source === 'osm')?.rec.extra ?? {};
  const attributes: Record<string, unknown> = {};
  for (const k of ['cuisine', 'wheelchair', 'religion', 'denomination', 'wikidata'] as const) {
    if (osmExtra[k] != null) attributes[k] = osmExtra[k];
  }
  if (osmExtra.internet_access != null) attributes.wifi = osmExtra.internet_access !== 'no';
  const brand = first('brand');
  if (brand) attributes.brand = brand;

  const socials = [
    ...new Set(
      order.flatMap((o) =>
        Array.isArray(o.rec.extra.socials) ? (o.rec.extra.socials as string[]) : [],
      ),
    ),
  ].slice(0, 4);

  return {
    id: placeId(anchor),
    name,
    altNames,
    category,
    lon: anchor.lon,
    lat: anchor.lat,
    address: (first('address') as string | null)?.replace(/\s+/g, ' ').trim() || null,
    phone,
    website,
    email: first('email') as string | null,
    socials,
    openingHours: first('openingHours') as string | null,
    attributes,
    confidence: Math.round(confidence * 1000) / 1000,
    members: order.map((o, k) => ({
      rec: o.rec,
      score: k === 0 ? 1 : Math.round((o.d?.score ?? 1) * 1000) / 1000,
      rule: k === 0 ? 'anchor' : (o.d?.rule ?? 'transitive'),
    })),
  };
}
