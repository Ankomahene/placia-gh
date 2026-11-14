import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, type Duck, log } from '../duck';

/**
 * Official administrative boundaries from geoBoundaries (gbOpen, pinned commit).
 * ADM0 public domain · ADM1 CC BY-SA 2.0 · ADM2 CC BY 4.0. Simplified geometry keeps the DB small.
 */
const COMMIT = '9469f09';
const LEVELS = ['ADM0', 'ADM1', 'ADM2'] as const;
const url = (lvl: string) =>
  `https://github.com/wmgeolab/geoBoundaries/raw/${COMMIT}/releaseData/gbOpen/GHA/${lvl}/geoBoundaries-GHA-${lvl}_simplified.geojson`;

async function download(lvl: string) {
  const out = path.join(CACHE_DIR, 'boundaries', `GHA_${lvl}.geojson`);
  if (fs.existsSync(out)) return out;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  log('bounds', `downloading ${lvl}…`);
  const res = await fetch(url(lvl), { redirect: 'follow' });
  if (!res.ok) throw new Error(`geoBoundaries ${lvl}: HTTP ${res.status}`);
  fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()));
  return out;
}

export const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’′`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Builds stg_country, stg_regions and stg_districts (district → region by largest overlap). */
export async function loadBoundaries(db: Duck) {
  const files = Object.fromEntries(
    await Promise.all(
      LEVELS.map(async (l) => [l, (await download(l)).replaceAll('\\', '/')] as const),
    ),
  ) as Record<(typeof LEVELS)[number], string>;

  await db.run(`
    CREATE OR REPLACE TABLE stg_country AS
      SELECT ST_Union_Agg(geom) AS geom FROM ST_Read('${files.ADM0}');

    CREATE OR REPLACE TABLE stg_regions AS
      SELECT row_number() OVER (ORDER BY shapeName)::INT AS rid,
             regexp_replace(trim(shapeName), '\\s+Region$', '') AS name,
             shapeID AS source_id,
             ST_Multi(geom) AS geom
      FROM ST_Read('${files.ADM1}');

    CREATE OR REPLACE TABLE stg_districts AS
      WITH d AS (
        SELECT shapeID AS source_id, trim(shapeName) AS name, ST_Multi(geom) AS geom
        FROM ST_Read('${files.ADM2}')
      ),
      ranked AS (
        SELECT d.*, r.rid,
               row_number() OVER (PARTITION BY d.source_id
                                  ORDER BY ST_Area(ST_Intersection(d.geom, r.geom)) DESC) AS rk
        FROM d JOIN stg_regions r ON ST_Intersects(d.geom, r.geom)
      )
      SELECT row_number() OVER (ORDER BY rid, name)::INT AS did, rid, name, source_id, geom
      FROM ranked WHERE rk = 1;
  `);
  const [c] = await db.all<{ r: number; d: number }>(
    'SELECT (SELECT count(*) FROM stg_regions)::INT AS r, (SELECT count(*) FROM stg_districts)::INT AS d',
  );
  log('bounds', `${c?.r} regions, ${c?.d} districts`);
}
