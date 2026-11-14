import { openDuck } from '../src/duck';

const db = await openDuck(':memory:');
const f = '.cache/osm/ghana-latest.osm.pbf';
const t = Date.now();
console.log(await db.all(`DESCRIBE SELECT * FROM ST_ReadOSM('${f}')`));
console.log(
  await db.all(`
  SELECT kind, count(*)::INT AS n,
         count(*) FILTER (WHERE tags['name'] IS NOT NULL)::INT AS named
  FROM ST_ReadOSM('${f}')
  WHERE tags IS NOT NULL AND (
    map_contains(tags, 'amenity') OR map_contains(tags, 'shop') OR map_contains(tags, 'tourism') OR
    map_contains(tags, 'leisure') OR map_contains(tags, 'office') OR map_contains(tags, 'healthcare') OR
    map_contains(tags, 'craft') OR map_contains(tags, 'historic'))
  GROUP BY kind`),
);
console.log(
  await db.all(
    `SELECT tags['place'] AS place, count(*)::INT n FROM ST_ReadOSM('${f}') WHERE kind='node' AND map_contains(tags,'place') GROUP BY 1 ORDER BY 2 DESC`,
  ),
);
console.log('took', Math.round((Date.now() - t) / 1000), 's');
db.close();
