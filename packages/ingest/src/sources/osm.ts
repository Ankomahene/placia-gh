import fs from 'node:fs';
import path from 'node:path';
import { GHANA_BBOX as B, CACHE_DIR, type Duck, log } from '../duck';
import { LEAVES } from '../taxonomy';

/**
 * OpenStreetMap extract for Ghana (Geofabrik daily .pbf, ODbL 1.0).
 * DuckDB's ST_ReadOSM streams the file; nothing but the rows we keep is materialised.
 */
export const OSM_FILE = path.join(CACHE_DIR, 'osm', 'ghana-latest.osm.pbf');
const OSM_URL = 'https://download.geofabrik.de/africa/ghana-latest.osm.pbf';

const q = (s: string) => `'${s.replaceAll("'", "''")}'`;

/** The taxonomy's ordered OSM rules compiled into one CASE expression (first match wins). */
export function osmCategorySql(tags = 'tags') {
  const whens = LEAVES.flatMap((l) =>
    l.osm.map((rule) => {
      const [k, v] = rule.split('=') as [string, string];
      const cond = v === '*' ? `map_contains(${tags}, ${q(k)})` : `${tags}[${q(k)}] = ${q(v)}`;
      return `WHEN ${cond} THEN ${q(l.slug)}`;
    }),
  );
  return `CASE ${whens.join(' ')} END`;
}

/** Every tag key any rule looks at; used to pre-filter the scan. */
const POI_KEYS = [...new Set(LEAVES.flatMap((l) => l.osm.map((r) => r.split('=')[0] as string)))];

const LOCALITY_KIND: Record<string, string> = {
  city: 'city',
  town: 'town',
  suburb: 'suburb',
  quarter: 'neighbourhood',
  neighbourhood: 'neighbourhood',
  village: 'village',
  hamlet: 'village',
};

export async function ensureOsm() {
  if (fs.existsSync(OSM_FILE)) return OSM_FILE;
  fs.mkdirSync(path.dirname(OSM_FILE), { recursive: true });
  log('osm', 'downloading Geofabrik extract…');
  const res = await fetch(OSM_URL);
  if (!res.ok) throw new Error(`Geofabrik: HTTP ${res.status}`);
  fs.writeFileSync(OSM_FILE, Buffer.from(await res.arrayBuffer()));
  return OSM_FILE;
}

/** Builds stg_osm_places (POIs) and stg_osm_localities (place=* nodes). */
export async function extractOsm(db: Duck) {
  const f = (await ensureOsm()).replaceAll('\\', '/');
  const keyFilter = POI_KEYS.map((k) => `map_contains(tags, ${q(k)})`).join(' OR ');
  const t = Date.now();

  await db.run(`
    -- 1. Named features any taxonomy rule could match (nodes, ways and multipolygon relations).
    CREATE OR REPLACE TEMP TABLE osm_poi AS
      SELECT kind, id, tags, refs, ref_types, lat, lon
      FROM ST_ReadOSM('${f}')
      WHERE tags IS NOT NULL AND map_contains(tags, 'name')
        AND NOT map_contains(tags, 'disused') AND NOT map_contains(tags, 'abandoned')
        AND (${keyFilter});

    -- 2. Geometry for ways and relations: average of member node coordinates.
    CREATE OR REPLACE TEMP TABLE osm_rel_ways AS
      SELECT id AS rel_id, unnest(refs) AS way_id, unnest(ref_types) AS t
      FROM osm_poi WHERE kind = 'relation';
    CREATE OR REPLACE TEMP TABLE osm_way_refs AS
      SELECT id AS way_id, unnest(refs) AS node_id
      FROM ST_ReadOSM('${f}')
      WHERE kind = 'way' AND (id IN (SELECT id FROM osm_poi WHERE kind = 'way')
                           OR id IN (SELECT way_id FROM osm_rel_ways WHERE t = 'way'));
    CREATE OR REPLACE TEMP TABLE osm_nodes AS
      SELECT id, lat, lon FROM ST_ReadOSM('${f}')
      WHERE kind = 'node' AND id IN (SELECT node_id FROM osm_way_refs);
    CREATE OR REPLACE TEMP TABLE osm_way_xy AS
      SELECT r.way_id, avg(n.lon) AS lon, avg(n.lat) AS lat
      FROM osm_way_refs r JOIN osm_nodes n ON n.id = r.node_id GROUP BY r.way_id;
    CREATE OR REPLACE TEMP TABLE osm_rel_xy AS
      SELECT rw.rel_id, avg(w.lon) AS lon, avg(w.lat) AS lat
      FROM osm_rel_ways rw JOIN osm_way_xy w ON w.way_id = rw.way_id WHERE rw.t = 'way'
      GROUP BY rw.rel_id;

    -- 3. Classify + normalise into the shared staging shape.
    CREATE OR REPLACE TABLE stg_osm_places AS
      WITH located AS (
        SELECT p.*,
               coalesce(p.lon, w.lon, r.lon) AS x,
               coalesce(p.lat, w.lat, r.lat) AS y,
               ${osmCategorySql('p.tags')} AS category
        FROM osm_poi p
        LEFT JOIN osm_way_xy w ON p.kind = 'way' AND w.way_id = p.id
        LEFT JOIN osm_rel_xy r ON p.kind = 'relation' AND r.rel_id = p.id
      )
      SELECT
        'osm'                                                     AS source,
        left(kind, 1) || id                                       AS source_id,
        trim(tags['name'])                                        AS name,
        list_filter(list_distinct(flatten([
          string_split(coalesce(tags['alt_name'], ''), ';'),
          string_split(coalesce(tags['old_name'], ''), ';'),
          [tags['official_name'], tags['short_name'], tags['loc_name'], tags['name:en']]
        ])), lambda n: n IS NOT NULL AND trim(n) <> '' AND trim(n) <> trim(tags['name'])) AS alt_names,
        category,
        coalesce(tags['amenity'], tags['shop'], tags['tourism'], tags['leisure'], tags['office'],
                 tags['healthcare'], tags['craft'], tags['historic'])                AS category_raw,
        x AS lon, y AS lat,
        coalesce(tags['phone'], tags['contact:phone'], tags['mobile'], tags['contact:mobile']) AS phone,
        coalesce(tags['website'], tags['contact:website'], tags['url'])           AS website,
        coalesce(tags['email'], tags['contact:email'])                            AS email,
        tags['opening_hours']                                                     AS opening_hours,
        nullif(concat_ws(', ',
          nullif(trim(concat_ws(' ', tags['addr:housenumber'], tags['addr:street'])), ''),
          tags['addr:suburb'], tags['addr:city']), '')                            AS address,
        coalesce(tags['brand'], tags['operator'])                                 AS brand,
        json_object(
          'cuisine', tags['cuisine'], 'wheelchair', tags['wheelchair'],
          'internet_access', tags['internet_access'], 'wikidata', tags['wikidata'],
          'religion', tags['religion'], 'denomination', tags['denomination'],
          'check_date', tags['check_date']
        )                                                         AS extra,
        NULL::DOUBLE                                              AS source_confidence
      FROM located
      WHERE category IS NOT NULL AND x IS NOT NULL
        AND x BETWEEN ${B.xmin} AND ${B.xmax} AND y BETWEEN ${B.ymin} AND ${B.ymax};

    -- 4. Settlements and neighbourhoods: the words people use for "where".
    --    Named bus stops become landmarks ("near Obaatanpa"), one per name per ~300 m.
    CREATE OR REPLACE TABLE stg_osm_localities AS
      WITH raw AS (
        SELECT id, trim(tags['name']) AS name, tags, lon, lat,
               CASE WHEN tags['place'] IS NOT NULL THEN
                 CASE tags['place'] ${Object.entries(LOCALITY_KIND)
                   .map(([k, v]) => `WHEN ${q(k)} THEN ${q(v)}`)
                   .join(' ')} END
               ELSE 'landmark' END AS kind
        FROM ST_ReadOSM('${f}')
        WHERE kind = 'node' AND tags IS NOT NULL AND map_contains(tags, 'name')
          AND (tags['place'] IN (${Object.keys(LOCALITY_KIND).map(q).join(', ')}) OR tags['highway'] = 'bus_stop')
          AND lon BETWEEN ${B.xmin} AND ${B.xmax} AND lat BETWEEN ${B.ymin} AND ${B.ymax}
      )
      SELECT 'osm' AS source, 'n' || min(id) AS source_id, name, kind,
             list_filter([any_value(tags['alt_name']), any_value(tags['old_name']), any_value(tags['name:en'])],
                         lambda n: n IS NOT NULL AND n <> name) AS alt_names,
             max(TRY_CAST(tags['population'] AS INTEGER)) AS population,
             avg(lon) AS lon, avg(lat) AS lat
      FROM raw
      GROUP BY name, kind,
               CASE WHEN kind = 'landmark' THEN floor(lon / 0.003) ELSE id END,
               CASE WHEN kind = 'landmark' THEN floor(lat / 0.003) ELSE 0 END;
  `);

  const [c] = await db.all<{ p: number; l: number }>(
    'SELECT (SELECT count(*) FROM stg_osm_places)::INT AS p, (SELECT count(*) FROM stg_osm_localities)::INT AS l',
  );
  log('osm', `${c?.p} places, ${c?.l} localities in ${Math.round((Date.now() - t) / 1000)} s`);
}
