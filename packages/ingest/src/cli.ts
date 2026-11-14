import fs from 'node:fs';
import path from 'node:path';
import { CACHE_DIR, log, openDuck } from './duck';
import { embed } from './embed';
import { load } from './load';
import { merge, stage } from './pipeline';
import type { ResolveStats } from './resolve';

/**
 * pnpm ingest [stage|merge|load|embed|all]
 *   stage  download (cached) + normalise OSM, Overture, boundaries into DuckDB
 *   merge  entity resolution + region/district/locality assignment
 *   load   upsert into Supabase, prune stale machine rows, record the run
 *   embed  embed new or edited places for the semantic arm (needs OPENAI_API_KEY)
 */
const step = process.argv[2] ?? 'all';
if (step === 'embed') {
  await embed();
  process.exit(0);
}
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
  if (step === 'all' && process.env.OPENAI_API_KEY) await embed();
  log('done', `${step} in ${Math.round((Date.now() - t) / 1000)} s`);
} finally {
  db.close();
}
