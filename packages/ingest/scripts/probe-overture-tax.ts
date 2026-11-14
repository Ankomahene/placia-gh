import { openDuck } from '../src/duck';
import { OVERTURE_TO_LEAF } from '../src/taxonomy';

const db = await openDuck(':memory:');
const f = '.cache/overture/places_gh_2026-10-21.0.parquet';
const rows = await db.all<{ p: string; h: string[]; b: string; n: number }>(
  `SELECT taxonomy_primary p, taxonomy_hierarchy h, basic_category b, count(*)::INT n FROM '${f}' WHERE address_country='GH' OR address_country IS NULL GROUP BY ALL`,
);
let mapped = 0,
  total = 0;
const miss = new Map<string, number>();
for (const r of rows) {
  total += r.n;
  const cands = [r.p, ...[...(r.h ?? [])].reverse(), r.b];
  if (cands.some((c) => c && OVERTURE_TO_LEAF.has(c))) mapped += r.n;
  else miss.set(`${r.p}|${r.b}`, (miss.get(`${r.p}|${r.b}`) ?? 0) + r.n);
}
console.log('mapped', mapped, 'of', total);
console.log(
  [...miss]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 110)
    .map(([k, n]) => `${k}:${n}`)
    .join('  '),
);
console.log(rows.slice(0, 3));
db.close();
