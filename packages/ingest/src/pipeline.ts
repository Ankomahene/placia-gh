import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, type Duck, log } from './duck';
import { type CanonicalPlace, type ResolveStats, resolve, type SourceRecord } from './resolve';
import {
  matchDomain,
  nameTokens,
  normEmail,
  normName,
  normPhone,
  normWebsite,
} from './resolve/normalize';
import { loadBoundaries } from './sources/boundaries';
import { extractOsm } from './sources/osm';
import { stageOverture } from './sources/overture';

const fwd = (p: string) => p.replaceAll('\\', '/');

/** Step 1 — every source into one staging table, clipped to Ghana's land border (+~1 km for the coast). */
export async function stage(db: Duck) {
  await loadBoundaries(db);
  await extractOsm(db);
  await stageOverture(db);
  await db.run(`
    CREATE OR REPLACE TABLE stg_country_buf AS SELECT ST_Buffer(geom, 0.01) AS geom FROM stg_country;
    CREATE OR REPLACE TABLE stg_all AS
      WITH u AS (
        SELECT * FROM stg_osm_places UNION ALL BY NAME SELECT * FROM stg_overture_places
      )
      SELECT u.* FROM u, stg_country_buf c WHERE ST_Intersects(c.geom, ST_Point(u.lon, u.lat));
  `);
  const rows = await db.all<{ source: string; n: number }>(
    'SELECT source, count(*)::INT n FROM stg_all GROUP BY 1 ORDER BY 1',
  );
  log('stage', rows.map((r) => `${r.source} ${r.n}`).join(' · '));
}

interface StagedRow {
  source: SourceRecord['source'];
  source_id: string;
  name: string;
  alt_names: string[] | null;
  category: string;
  category_raw: string | null;
  lon: number;
  lat: number;
  phone: string | null;
  website: string | null;
  email: string | null;
  opening_hours: string | null;
  address: string | null;
  brand: string | null;
  extra: string | Record<string, unknown> | null;
  source_confidence: number | null;
}

export function toRecord(r: StagedRow, idx: number): SourceRecord {
  const norm = normName(r.name);
  const website = normWebsite(r.website);
  const extra =
    typeof r.extra === 'string'
      ? (JSON.parse(r.extra) as Record<string, unknown>)
      : (r.extra ?? {});
  return {
    idx,
    source: r.source,
    sourceId: r.source_id,
    name: r.name,
    norm,
    tokens: nameTokens(norm),
    altNames: (r.alt_names ?? []).map((n) => n.trim()).filter(Boolean),
    category: r.category,
    categoryRaw: r.category_raw,
    lon: r.lon,
    lat: r.lat,
    phone: normPhone(r.phone),
    website,
    domain: matchDomain(website),
    email: normEmail(r.email),
    openingHours: r.opening_hours?.trim() || null,
    address: r.address?.trim() || null,
    brand: r.brand?.trim() || null,
    extra,
    sourceConfidence: r.source_confidence,
  };
}

/** Step 2 — entity resolution, then region / district / locality assignment in DuckDB. */
export async function merge(db: Duck): Promise<ResolveStats> {
  const rows = await db.all<StagedRow>('SELECT * FROM stg_all ORDER BY source, source_id');
  const records = rows.map(toRecord);
  const t = Date.now();
  const locs = await db.all<{ name: string }>(
    "SELECT DISTINCT name FROM stg_osm_localities WHERE kind <> 'landmark'",
  );
  const placeWords = new Set(locs.flatMap((l) => nameTokens(normName(l.name))));
  const { places, stats } = resolve(records, { placeWords });
  log(
    'merge',
    `${stats.records} records → ${stats.places} places (${stats.multiSource} multi-source) in ${Date.now() - t} ms`,
  );

  const placesFile = path.join(CACHE_DIR, 'canon_places.ndjson');
  const sourcesFile = path.join(CACHE_DIR, 'canon_sources.ndjson');
  fs.writeFileSync(placesFile, places.map((p) => JSON.stringify(placeRow(p))).join('\n'));
  fs.writeFileSync(
    sourcesFile,
    places
      .flatMap(sourceRows)
      .map((r) => JSON.stringify(r))
      .join('\n'),
  );

  await db.run(`
    CREATE OR REPLACE TABLE canon_places AS SELECT * FROM read_json('${fwd(placesFile)}', format = 'newline_delimited',
      columns = {id: 'UUID', name: 'VARCHAR', alt_names: 'VARCHAR[]', category: 'VARCHAR', lon: 'DOUBLE', lat: 'DOUBLE',
                 address: 'VARCHAR', phone: 'VARCHAR', website: 'VARCHAR', email: 'VARCHAR', socials: 'JSON',
                 opening_hours: 'VARCHAR', attributes: 'JSON', confidence: 'DOUBLE', sources: 'VARCHAR[]'});
    CREATE OR REPLACE TABLE canon_sources AS SELECT * FROM read_json('${fwd(sourcesFile)}', format = 'newline_delimited',
      columns = {place_id: 'UUID', source: 'VARCHAR', source_id: 'VARCHAR', name: 'VARCHAR', lon: 'DOUBLE', lat: 'DOUBLE',
                 category_raw: 'VARCHAR', fields: 'JSON', source_confidence: 'DOUBLE', match_score: 'DOUBLE', rule: 'VARCHAR'});
  `);
  await assignAreas(db);
  return stats;
}

function placeRow(p: CanonicalPlace) {
  return {
    id: p.id,
    name: p.name,
    alt_names: p.altNames,
    category: p.category,
    lon: p.lon,
    lat: p.lat,
    address: p.address,
    phone: p.phone,
    website: p.website,
    email: p.email,
    socials: p.socials,
    opening_hours: p.openingHours,
    attributes: p.attributes,
    confidence: p.confidence,
    sources: [...new Set(p.members.map((m) => m.rec.source))],
  };
}

function sourceRows(p: CanonicalPlace) {
  return p.members.map(({ rec, score, rule }) => {
    const fields: Record<string, string> = {};
    if (rec.phone) fields.phone = rec.phone;
    if (rec.website) fields.website = rec.website;
    if (rec.email) fields.email = rec.email;
    if (rec.address) fields.address = rec.address;
    if (rec.openingHours) fields.opening_hours = rec.openingHours;
    if (rec.category !== p.category) fields.category = rec.category;
    return {
      place_id: p.id,
      source: rec.source,
      source_id: rec.sourceId,
      name: rec.name,
      lon: rec.lon,
      lat: rec.lat,
      category_raw: rec.categoryRaw,
      fields,
      source_confidence: rec.sourceConfidence,
      match_score: score,
      rule,
    };
  });
}

/** Approximate metres between points (equirectangular; fine at city scale near the equator). */
const metres = (a: string, b: string) =>
  `sqrt(power((${b}.lon - ${a}.lon) * cos(radians(${a}.lat)) * 111320, 2) + power((${b}.lat - ${a}.lat) * 110540, 2))`;

/** Locality search radius by kind: a place "belongs to" the finest settlement it sits within. */
const RADIUS_SQL = `CASE l.kind WHEN 'neighbourhood' THEN 1200 WHEN 'suburb' THEN 2500 WHEN 'village' THEN 2500
                                 WHEN 'town' THEN 6000 WHEN 'city' THEN 15000 END`;

async function assignAreas(db: Duck) {
  await db.run(`
    -- District by containment; coastal / border points fall back to the nearest district.
    CREATE OR REPLACE TEMP TABLE pt AS
      SELECT id, lon, lat, ST_Point(lon, lat) AS g FROM canon_places
      UNION ALL SELECT NULL, lon, lat, ST_Point(lon, lat) FROM stg_osm_localities;
    CREATE OR REPLACE TEMP TABLE pt_district AS
      SELECT p.lon, p.lat, any_value(d.did) AS did
      FROM pt p JOIN stg_districts d ON ST_Contains(d.geom, p.g) GROUP BY p.lon, p.lat;
    INSERT INTO pt_district
      SELECT p.lon, p.lat, arg_min(d.did, ST_Distance(d.geom, p.g))
      FROM (SELECT DISTINCT lon, lat, g FROM pt) p
      CROSS JOIN stg_districts d
      WHERE NOT EXISTS (SELECT 1 FROM pt_district x WHERE x.lon = p.lon AND x.lat = p.lat)
      GROUP BY p.lon, p.lat;

    CREATE OR REPLACE TABLE canon_localities AS
      SELECT l.*, d.did, s.rid
      FROM stg_osm_localities l
      LEFT JOIN pt_district d ON d.lon = l.lon AND d.lat = l.lat
      LEFT JOIN stg_districts s ON s.did = d.did
      WHERE l.kind IS NOT NULL;

    CREATE OR REPLACE TEMP TABLE place_locality AS
      SELECT p.id, arg_min(l.source_id, ${metres('p', 'l')} / ${RADIUS_SQL}) AS locality
      FROM canon_places p JOIN canon_localities l
        ON l.lon BETWEEN p.lon - 0.14 AND p.lon + 0.14 AND l.lat BETWEEN p.lat - 0.14 AND p.lat + 0.14
      WHERE l.kind <> 'landmark' AND ${metres('p', 'l')} <= ${RADIUS_SQL}
      GROUP BY p.id;

    CREATE OR REPLACE TABLE places_out AS
      SELECT p.*, d.did, s.rid, pl.locality AS locality_source_id
      FROM canon_places p
      LEFT JOIN pt_district d ON d.lon = p.lon AND d.lat = p.lat
      LEFT JOIN stg_districts s ON s.did = d.did
      LEFT JOIN place_locality pl ON pl.id = p.id;
  `);
  const [c] = await db.all<{ n: number; d: number; l: number }>(
    'SELECT count(*)::INT n, count(did)::INT d, count(locality_source_id)::INT l FROM places_out',
  );
  log('areas', `${c?.n} places · ${c?.d} with district · ${c?.l} with locality`);
}
