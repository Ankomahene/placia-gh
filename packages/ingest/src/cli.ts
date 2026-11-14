import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, log, openDuck } from './duck';
import { load } from './load';
import { merge, stage } from './pipeline';
import type { ResolveStats } from './resolve';

/**
 * pnpm ingest [stage|merge|load|all]
 *   stage  download (cached) + normalise OSM, Overture, boundaries into DuckDB
 *   merge  entity resolution + region/district/locality assignment
 *   load   upsert into Supabase, prune stale machine rows, record the run
 */
const step = process.argv[2] ?? 'all';
const statsFile = path.join(CACHE_DIR, 'last-merge.json');

const db = await openDuck();
const t = Date.now();
try {
  if (step === 'stage' || step === 'all') await stage(db);
  if (step === 'merge' || step === 'all') {
    const stats = await merge(db);
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }
  if (step === 'load' || step === 'all') {
    const stats = fs.existsSync(statsFile)
      ? (JSON.parse(fs.readFileSync(statsFile, 'utf8')) as ResolveStats)
      : null;
    await load(db, stats);
  }
  log('done', `${step} in ${Math.round((Date.now() - t) / 1000)} s`);
} finally {
  db.close();
}
