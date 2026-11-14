import { openDuck } from '../src/duck';
import { OVERTURE_TO_LEAF } from '../src/taxonomy';

const db = await openDuck(':memory:');
const f = '.cache/overture/places_gh_2026-10-21.0.parquet';
console.log(
  await db.all(
    `SELECT address_country c, count(*)::INT n FROM '${f}' GROUP BY 1 ORDER BY 2 DESC LIMIT 8`,
  ),
);
console.log(
  await db.all(`SELECT round(confidence,1) c, count(*)::INT n FROM '${f}' GROUP BY 1 ORDER BY 1`),
);
console.log(
  await db.all(
    `SELECT d, count(*)::INT n FROM (SELECT unnest(datasets) d FROM '${f}') GROUP BY 1 ORDER BY 2 DESC`,
  ),
);
const cats = await db.all<{ c: string; n: number }>(
  `SELECT basic_category c, count(*)::INT n FROM '${f}' WHERE address_country='GH' OR address_country IS NULL GROUP BY 1 ORDER BY 2 DESC`,
);
const unmapped = cats.filter((r) => !OVERTURE_TO_LEAF.has(r.c));
const mapped = cats.filter((r) => OVERTURE_TO_LEAF.has(r.c)).reduce((a, r) => a + r.n, 0);
const total = cats.reduce((a, r) => a + r.n, 0);
console.log('mapped', mapped, 'of', total);
console.log(
  unmapped
    .slice(0, 120)
    .map((r) => `${r.c}:${r.n}`)
    .join('  '),
);
db.close();
