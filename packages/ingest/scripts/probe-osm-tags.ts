import { openDuck } from '../src/duck';

const db = await openDuck(':memory:');
const f = '.cache/osm/ghana-latest.osm.pbf';
const rows = await db.all<{ kv: string; n: number }>(`
  WITH p AS (
    SELECT tags FROM ST_ReadOSM('${f}')
    WHERE kind IN ('node','way') AND tags IS NOT NULL
      AND (map_contains(tags,'name') OR map_contains(tags,'brand') OR map_contains(tags,'operator'))
  ),
  kv AS (
    SELECT k || '=' || tags[k] AS kv FROM p,
    unnest(['amenity','shop','tourism','leisure','office','healthcare','craft','historic','public_transport','aeroway','railway','emergency','sport','building']) t(k)
    WHERE map_contains(tags, k) AND (k <> 'building' OR NOT (map_contains(tags,'amenity') OR map_contains(tags,'shop')))
  )
  SELECT kv, count(*)::INT n FROM kv GROUP BY kv HAVING count(*) >= 25 ORDER BY n DESC`);
console.log(rows.map((r) => `${r.kv}:${r.n}`).join('  '));
db.close();
