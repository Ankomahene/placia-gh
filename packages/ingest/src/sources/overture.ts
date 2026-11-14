import fs from 'node:fs';
import path from 'node:path';
import { GHANA_BBOX as B, CACHE_DIR, type Duck, log } from '../duck';
import { OVERTURE_TO_LEAF } from '../taxonomy';

export const OVERTURE_RELEASE = process.env.OVERTURE_RELEASE ?? '2026-10-21.0';

/**
 * Pulls Ghana's Overture places straight from the public S3 bucket into a local Parquet file.
 * DuckDB pushes the bbox filter into the Parquet row groups, so only Ghana-area data is fetched.
 * Licence: CDLA-Permissive 2.0, or Apache 2.0 for Foursquare-sourced records (kept per record).
 */
export async function fetchOverture(db: Duck) {
  const out = path.join(CACHE_DIR, 'overture', `places_gh_${OVERTURE_RELEASE}.parquet`);
  if (fs.existsSync(out)) {
    log('overture', `cached ${path.basename(out)}`);
    return out;
  }
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const src = `s3://overturemaps-us-west-2/release/${OVERTURE_RELEASE}/theme=places/type=place/*`;
  log('overture', `downloading ${OVERTURE_RELEASE} (Ghana bbox)…`);
  await db.run(`
    COPY (
      SELECT
        id,
        names."primary"                       AS name,
        basic_category,
        taxonomy."primary"                    AS taxonomy_primary,
        taxonomy.hierarchy                    AS taxonomy_hierarchy,
        confidence,
        operating_status,
        websites,
        phones,
        socials,
        emails,
        addresses[1].freeform                 AS address,
        addresses[1].locality                 AS address_locality,
        addresses[1].country                  AS address_country,
        brand.names."primary"                 AS brand,
        list_distinct(list_transform(sources, lambda s: s.dataset)) AS datasets,
        ST_X(geometry)                        AS lon,
        ST_Y(geometry)                        AS lat
      FROM read_parquet('${src}', hive_partitioning = 1)
      WHERE bbox.xmin BETWEEN ${B.xmin} AND ${B.xmax}
        AND bbox.ymin BETWEEN ${B.ymin} AND ${B.ymax}
    ) TO '${out.replaceAll('\\', '/')}' (FORMAT parquet, COMPRESSION zstd)
  `);
  const [row] = await db.all<{ n: number }>(
    `SELECT count(*)::INT AS n FROM '${out.replaceAll('\\', '/')}'`,
  );
  log('overture', `saved ${row?.n} records`);
  return out;
}

/**
 * Normalises the Overture extract into the shared staging shape (stg_overture_places).
 * Category: the most specific Overture category we have a mapping for
 * (taxonomy primary → hierarchy deepest-first → basic_category).
 */
export async function stageOverture(db: Duck) {
  const file = (await fetchOverture(db)).replaceAll('\\', '/');
  const pairs = [...OVERTURE_TO_LEAF].map(([c, s]) => `('${c}', '${s}')`).join(', ');
  await db.run(`
    CREATE OR REPLACE TEMP TABLE ov_map AS SELECT * FROM (VALUES ${pairs}) t(cat, slug);

    CREATE OR REPLACE TEMP TABLE ov_cat AS
      WITH c AS (
        SELECT id, unnest(flatten([[taxonomy_primary], list_reverse(coalesce(taxonomy_hierarchy, [])),
                                   [basic_category]])) AS cat,
               generate_subscripts(flatten([[taxonomy_primary], list_reverse(coalesce(taxonomy_hierarchy, [])),
                                            [basic_category]]), 1) AS ord
        FROM '${file}'
      )
      SELECT id, arg_min(m.slug, c.ord) AS category
      FROM c JOIN ov_map m ON m.cat = c.cat GROUP BY id;

    CREATE OR REPLACE TABLE stg_overture_places AS
      SELECT
        CASE WHEN list_contains(o.datasets, 'Foursquare') AND len(o.datasets) = 2
             THEN 'foursquare' ELSE 'overture' END                  AS source,
        o.id                                                        AS source_id,
        trim(o.name)                                                AS name,
        CASE WHEN o.brand IS NOT NULL AND o.brand <> o.name THEN [o.brand] ELSE [] END AS alt_names,
        k.category,
        coalesce(o.taxonomy_primary, o.basic_category)              AS category_raw,
        o.lon, o.lat,
        o.phones[1]                                                 AS phone,
        o.websites[1]                                               AS website,
        o.emails[1]                                                 AS email,
        NULL::VARCHAR                                               AS opening_hours,
        o.address,
        o.brand,
        json_object('socials', o.socials, 'locality', o.address_locality) AS extra,
        o.confidence                                                AS source_confidence
      FROM '${file}' o JOIN ov_cat k USING (id)
      WHERE o.name IS NOT NULL AND trim(o.name) <> ''
        AND coalesce(o.address_country, 'GH') = 'GH'
        AND coalesce(o.operating_status, 'open') = 'open';
  `);
  const [c] = await db.all<{ n: number }>('SELECT count(*)::INT AS n FROM stg_overture_places');
  log('overture', `${c?.n} places staged`);
}
