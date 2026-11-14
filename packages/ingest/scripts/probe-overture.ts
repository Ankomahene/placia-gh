import { openDuck } from '../src/duck';

const db = await openDuck();
const rel = 's3://overturemaps-us-west-2/release/2026-10-21.0/theme=places/type=place/*';
const cols = await db.all<{ column_name: string; column_type: string }>(
  `DESCRIBE SELECT * FROM read_parquet('${rel}', hive_partitioning=1) LIMIT 1`,
);
for (const c of cols) console.log(c.column_name, '::', c.column_type.slice(0, 160));
db.close();
