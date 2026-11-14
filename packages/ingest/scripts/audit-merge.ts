import { openDuck } from '../src/duck';

const db = await openDuck('staging.duckdb');
for (const rule of ['name', 'name+category', 'phone', 'website', 'osm-duplicate']) {
  const rows = await db.all<{
    a: string;
    b: string;
    ca: string;
    cb: string;
    m: number;
    s: number;
  }>(`
    SELECT p.name a, s.name b, p.category ca, coalesce(json_extract_string(s.fields,'$.category'), p.category) cb,
           round(sqrt(power((s.lon-p.lon)*cos(radians(p.lat))*111320,2)+power((s.lat-p.lat)*110540,2)))::INT m, s.match_score s
    FROM canon_sources s JOIN places_out p ON p.id = s.place_id
    WHERE s.rule = '${rule}' ORDER BY random() LIMIT 12`);
  console.log(`\n== ${rule}`);
  for (const r of rows) console.log(`${r.m}m  ${r.s}  [${r.ca}|${r.cb}]  ${r.a}  <=>  ${r.b}`);
}
const big = await db.all(
  `SELECT place_id, count(*)::INT n, any_value(name) FROM canon_sources GROUP BY 1 ORDER BY 2 DESC LIMIT 5`,
);
console.log(big);
db.close();
