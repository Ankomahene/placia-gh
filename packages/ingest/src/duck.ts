import fs from 'node:fs';
import path from 'node:path';
import { DuckDBInstance } from '@duckdb/node-api';

export const CACHE_DIR = path.join(import.meta.dirname, '..', '.cache');

/** Ghana's bounding box (with a small margin). Every source is clipped to it first. */
export const GHANA_BBOX = { xmin: -3.3, xmax: 1.25, ymin: 4.65, ymax: 11.2 } as const;

/**
 * One local DuckDB file holds all staging tables. It is the ingest cache: nothing in it
 * is sent to Supabase until the load step, which keeps the 500 MB free-tier DB lean.
 */
export async function openDuck(file = 'staging.duckdb') {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const instance = await DuckDBInstance.create(
    file === ':memory:' ? ':memory:' : path.join(CACHE_DIR, file),
  );
  const con = await instance.connect();
  await con.run(`
    INSTALL spatial; LOAD spatial;
    INSTALL httpfs; LOAD httpfs;
    SET s3_region = 'us-west-2';
    SET preserve_insertion_order = false;
  `);
  return {
    con,
    async all<T = Record<string, unknown>>(sql: string): Promise<T[]> {
      const reader = await con.runAndReadAll(sql);
      return reader.getRowObjectsJson() as T[];
    },
    async run(sql: string) {
      await con.run(sql);
    },
    close() {
      con.closeSync();
      instance.closeSync();
    },
  };
}

export type Duck = Awaited<ReturnType<typeof openDuck>>;

export function log(step: string, msg: string) {
  console.log(`[${new Date().toISOString().slice(11, 19)}] ${step.padEnd(10)} ${msg}`);
}
