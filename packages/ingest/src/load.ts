import fs from 'node:fs';
import { createServiceClient } from '@placia/db';
import { type Duck, log } from './duck';
import type { ResolveStats } from './resolve';
import { slugify } from './sources/boundaries';
import { OSM_FILE } from './sources/osm';
import { OVERTURE_RELEASE } from './sources/overture';
import { TAXONOMY } from './taxonomy';

type Client = ReturnType<typeof createServiceClient>;

const CAPITALS: Record<string, string> = {
  Ahafo: 'Goaso',
  Ashanti: 'Kumasi',
  'Bono East': 'Techiman',
  Bono: 'Sunyani',
  Central: 'Cape Coast',
  Eastern: 'Koforidua',
  'Greater Accra': 'Accra',
  'North East': 'Nalerigu',
  Northern: 'Tamale',
  Oti: 'Dambai',
  Savannah: 'Damongo',
  'Upper East': 'Bolgatanga',
  'Upper West': 'Wa',
  Volta: 'Ho',
  'Western North': 'Sefwi Wiawso',
  Western: 'Sekondi-Takoradi',
};

const point = (lon: number, lat: number) => `SRID=4326;POINT(${lon.toFixed(7)} ${lat.toFixed(7)})`;

const SOCIAL_HOSTS: Record<string, string> = {
  'facebook.com': 'facebook',
  'instagram.com': 'instagram',
  'twitter.com': 'x',
  'x.com': 'x',
  'tiktok.com': 'tiktok',
  'linkedin.com': 'linkedin',
  'youtube.com': 'youtube',
};

function socialsObject(urls: unknown) {
  const out: Record<string, string> = {};
  if (!Array.isArray(urls)) return out;
  for (const u of urls as string[]) {
    try {
      const host = new URL(u).hostname.replace(/^www\.|^m\./, '');
      const key = SOCIAL_HOSTS[host];
      if (key && !out[key]) out[key] = u;
    } catch {}
  }
  return out;
}

async function inBatches<T>(
  rows: T[],
  size: number,
  fn: (batch: T[]) => Promise<void>,
  label: string,
  parallel = 4,
) {
  const batches: T[][] = [];
  for (let i = 0; i < rows.length; i += size) batches.push(rows.slice(i, i + size));
  let done = 0;
  const worker = async () => {
    for (let b = batches.shift(); b; b = batches.shift()) {
      for (let attempt = 1; ; attempt++) {
        try {
          await fn(b);
          break;
        } catch (e) {
          if (attempt >= 4) throw e;
          await new Promise((r) => setTimeout(r, 1500 * attempt));
        }
      }
      done += b.length;
      if (done % (size * 20) < size || done === rows.length)
        log('load', `${label} ${done}/${rows.length}`);
    }
  };
  await Promise.all(Array.from({ length: parallel }, worker));
}

const must = <T>(
  r: { data: T; error: { message: string } | null },
  what: string,
): NonNullable<T> => {
  if (r.error) throw new Error(`${what}: ${r.error.message}`);
  return r.data as NonNullable<T>;
};

async function loadCategories(sb: Client) {
  const groups = must(
    await sb
      .from('categories')
      .upsert(
        TAXONOMY.map((g, i) => ({
          slug: g.slug,
          name: g.name,
          icon: g.icon,
          synonyms: g.synonyms,
          sort_order: i,
          parent_id: null,
        })),
        { onConflict: 'slug' },
      )
      .select('id, slug'),
    'categories (groups)',
  );
  const gid = new Map(groups.map((g) => [g.slug, g.id]));
  const leaves = must(
    await sb
      .from('categories')
      .upsert(
        TAXONOMY.flatMap((g) =>
          g.children.map((c, i) => ({
            slug: c.slug,
            name: c.name,
            icon: c.icon,
            synonyms: c.synonyms,
            sort_order: i,
            parent_id: gid.get(g.slug)!,
          })),
        ),
        { onConflict: 'slug' },
      )
      .select('id, slug'),
    'categories (leaves)',
  );
  log('load', `${groups.length} groups, ${leaves.length} categories`);
  return new Map(leaves.map((c) => [c.slug, c.id]));
}

async function loadAreas(db: Duck, sb: Client) {
  const regions = await db.all<{ rid: number; name: string; wkt: string; cx: number; cy: number }>(
    'SELECT rid, name, ST_AsText(geom) wkt, ST_X(ST_Centroid(geom)) cx, ST_Y(ST_Centroid(geom)) cy FROM stg_regions',
  );
  const reg = must(
    await sb
      .from('regions')
      .upsert(
        regions.map((r) => ({
          name: r.name,
          slug: slugify(r.name),
          capital: CAPITALS[r.name] ?? null,
          boundary: `SRID=4326;${r.wkt}`,
          centroid: point(r.cx, r.cy),
        })),
        { onConflict: 'slug' },
      )
      .select('id, slug'),
    'regions',
  );
  const regionId = new Map(
    regions.map((r) => [r.rid, reg.find((x) => x.slug === slugify(r.name))!.id]),
  );

  const districts = await db.all<{
    did: number;
    rid: number;
    name: string;
    wkt: string;
    cx: number;
    cy: number;
  }>(
    'SELECT did, rid, name, ST_AsText(geom) wkt, ST_X(ST_Centroid(geom)) cx, ST_Y(ST_Centroid(geom)) cy FROM stg_districts',
  );
  const districtId = new Map<number, number>();
  await inBatches(
    districts,
    40,
    async (b) => {
      const rows = must(
        await sb
          .from('districts')
          .upsert(
            b.map((d) => ({
              region_id: regionId.get(d.rid)!,
              name: d.name,
              slug: slugify(d.name),
              boundary: `SRID=4326;${d.wkt}`,
              centroid: point(d.cx, d.cy),
            })),
            { onConflict: 'slug' },
          )
          .select('id, slug'),
        'districts',
      );
      for (const d of b) districtId.set(d.did, rows.find((x) => x.slug === slugify(d.name))!.id);
    },
    'districts',
    2,
  );

  const locs = await db.all<{
    source_id: string;
    name: string;
    kind: string;
    alt_names: string[] | null;
    population: number | null;
    lon: number;
    lat: number;
    did: number | null;
    rid: number | null;
  }>(
    'SELECT source_id, name, kind, alt_names, population, lon, lat, did, rid FROM canon_localities',
  );
  const localityId = new Map<string, number>();
  await inBatches(
    locs,
    1000,
    async (b) => {
      const rows = must(
        await sb
          .from('localities')
          .upsert(
            b.map((l) => ({
              name: l.name,
              alt_names: l.alt_names ?? [],
              kind: l.kind,
              region_id: l.rid == null ? null : regionId.get(l.rid)!,
              district_id: l.did == null ? null : districtId.get(l.did)!,
              location: point(l.lon, l.lat),
              population: l.population,
              source: 'osm',
              source_id: l.source_id,
            })),
            { onConflict: 'source,source_id' },
          )
          .select('id, source_id'),
        'localities',
      );
      for (const r of rows) localityId.set(r.source_id, r.id);
    },
    'localities',
  );
  return { regionId, districtId, localityId };
}

interface PlaceOut {
  id: string;
  name: string;
  alt_names: string[];
  category: string;
  lon: number;
  lat: number;
  address: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;
  socials: string | null;
  opening_hours: string | null;
  attributes: string | null;
  confidence: number;
  did: number | null;
  rid: number | null;
  locality_source_id: string | null;
  area: string | null;
}

/**
 * Readable, unique slugs: "golden-tulip-airport-residential"; the best-supported place gets the clean one.
 * Published slugs are permanent: a place that already has one keeps it, and nobody else may take it.
 */
export function assignSlugs(
  places: { id: string; name: string; area: string | null }[],
  existing: Record<string, string> = {},
) {
  const taken = new Set(Object.values(existing));
  const out = new Map<string, string>();
  for (const p of places) {
    const kept = existing[p.id];
    if (kept) {
      out.set(p.id, kept);
      continue;
    }
    const base = slugify(p.name).slice(0, 60).replace(/-+$/, '') || 'place';
    const withArea = p.area ? `${base}-${slugify(p.area)}`.slice(0, 90).replace(/-+$/, '') : base;
    let slug = taken.has(base) ? withArea : base;
    for (let n = 2; taken.has(slug); n++) slug = `${withArea}-${n}`;
    taken.add(slug);
    out.set(p.id, slug);
  }
  return out;
}

export async function load(db: Duck, stats: ResolveStats | null) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key)
    throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');
  const sb = createServiceClient(url, key);
  const startedAt = new Date().toISOString();

  const run = must(
    await sb
      .from('ingest_runs')
      .insert({
        started_at: startedAt,
        source_versions: {
          osm: fs.existsSync(OSM_FILE)
            ? fs.statSync(OSM_FILE).mtime.toISOString().slice(0, 10)
            : null,
          overture: OVERTURE_RELEASE,
          geoboundaries: '9469f09',
        },
        stats: (stats ?? {}) as never,
      })
      .select('id')
      .single(),
    'ingest_runs',
  );

  try {
    const categoryId = await loadCategories(sb);
    const { regionId, districtId, localityId } = await loadAreas(db, sb);

    const places = await db.all<PlaceOut>(`
      SELECT p.*, coalesce(l.name, d.name) AS area
      FROM places_out p
      LEFT JOIN canon_localities l ON l.source_id = p.locality_source_id
      LEFT JOIN stg_districts d ON d.did = p.did
      ORDER BY p.confidence DESC, p.id`);
    const existing = must(await sb.rpc('ingest_slugs'), 'ingest_slugs') as Record<string, string>;
    const slugs = assignSlugs(places, existing);

    await inBatches(
      places,
      500,
      async (b) => {
        must(
          await sb.from('places').upsert(
            b.map((p) => ({
              id: p.id,
              slug: slugs.get(p.id)!,
              name: p.name,
              alt_names: p.alt_names ?? [],
              category_id: categoryId.get(p.category) ?? null,
              location: point(p.lon, p.lat),
              address: p.address,
              locality_id: p.locality_source_id
                ? (localityId.get(p.locality_source_id) ?? null)
                : null,
              district_id: p.did == null ? null : districtId.get(p.did)!,
              region_id: p.rid == null ? null : regionId.get(p.rid)!,
              phone: p.phone,
              website: p.website,
              email: p.email,
              socials: socialsObject(p.socials ? JSON.parse(p.socials) : []),
              opening_hours: p.opening_hours ? { osm: p.opening_hours } : null,
              attributes: p.attributes ? JSON.parse(p.attributes) : {},
              confidence: p.confidence,
              status: 'active',
            })),
            { onConflict: 'id' },
          ),
          'places',
        );
      },
      'places',
    );

    const sources = await db.all<{
      place_id: string;
      source: string;
      source_id: string;
      name: string;
      lon: number;
      lat: number;
      category_raw: string | null;
      fields: string | null;
      source_confidence: number | null;
      match_score: number;
    }>('SELECT * EXCLUDE (rule) FROM canon_sources');
    const fetchedAt = new Date().toISOString();
    await inBatches(
      sources,
      1000,
      async (b) => {
        must(
          await sb.from('place_sources').upsert(
            b.map((s) => ({
              place_id: s.place_id,
              source: s.source,
              source_id: s.source_id,
              name: s.name,
              location: point(s.lon, s.lat),
              category_raw: s.category_raw,
              fields: s.fields ? JSON.parse(s.fields) : {},
              source_confidence: s.source_confidence,
              match_score: s.match_score,
              fetched_at: fetchedAt,
            })),
            { onConflict: 'source,source_id' },
          ),
          'place_sources',
        );
      },
      'sources',
    );

    const pruned = must(await sb.rpc('ingest_prune', { p_since: startedAt }), 'ingest_prune');
    log('load', `pruned ${JSON.stringify(pruned)}`);
    must(
      await sb
        .from('ingest_runs')
        .update({ finished_at: new Date().toISOString(), status: 'succeeded' })
        .eq('id', run.id),
      'ingest_runs',
    );
  } catch (e) {
    await sb
      .from('ingest_runs')
      .update({ finished_at: new Date().toISOString(), status: 'failed' })
      .eq('id', run.id);
    throw e;
  }
}
