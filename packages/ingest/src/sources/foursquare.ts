import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { GHANA_BBOX as B, CACHE_DIR, type Duck, log } from '../duck';
import { foursquareLeaf } from '../taxonomy';

export const FSQ_RELEASE = process.env.FSQ_RELEASE ?? '2026-10-15';

const REPO = 'foursquare/fsq-os-places';
const fwd = (p: string) => p.replaceAll('\\', '/');

/** A small request, retried through dropped connections. */
async function fetchRetry(url: string, init: RequestInit, attempts = 10): Promise<Response> {
  for (let k = 1; ; k++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
    } catch (e) {
      if (k >= attempts) throw e;
      await new Promise((r) => setTimeout(r, Math.min(30_000, 2000 * k)));
    }
  }
}

interface RemoteFile {
  path: string;
  size: number;
}

/** The release's Parquet files, from the Hugging Face API. */
async function listFiles(token: string): Promise<RemoteFile[]> {
  const url = `https://huggingface.co/api/datasets/${REPO}/tree/main/release/dt=${FSQ_RELEASE}/places/parquet`;
  const res = await fetchRetry(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok)
    throw new Error(`Hugging Face ${res.status}: accept the dataset terms and check HF_TOKEN`);
  const items = (await res.json()) as { type: string; path: string; size: number }[];
  return items
    .filter((i) => i.type === 'file' && i.path.endsWith('.parquet'))
    .map((i) => ({ path: i.path, size: i.size }));
}

/** Byte range [start, end) of a file. */
type Range = [number, number];

/**
 * Fetches byte ranges of a remote file into a local file of the same size, each at its own
 * offset; the bytes in between stay zero and are never read. Progress is kept beside the file,
 * so a dropped connection resumes inside the range it was on.
 */
async function downloadRanges(file: RemoteFile, dest: string, token: string, ranges: Range[]) {
  const url = `https://huggingface.co/datasets/${REPO}/resolve/main/${file.path}`;
  const part = `${dest}.part`;
  const progressFile = `${dest}.progress.json`;
  const got: number[] = fs.existsSync(progressFile)
    ? JSON.parse(fs.readFileSync(progressFile, 'utf8'))
    : ranges.map(() => 0);
  if (!fs.existsSync(part)) fs.writeFileSync(part, '');
  if (fs.statSync(part).size < file.size) fs.truncateSync(part, file.size);
  const fd = fs.openSync(part, 'r+');
  try {
    for (const [k, [start, end]] of ranges.entries()) {
      for (let attempt = 1; start + (got[k] ?? 0) < end; attempt++) {
        try {
          const from = start + (got[k] ?? 0);
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${token}`, Range: `bytes=${from}-${end - 1}` },
            signal: AbortSignal.timeout(10 * 60_000),
          });
          if (res.status !== 206) throw new Error(`HTTP ${res.status}`);
          for await (const chunk of Readable.fromWeb(res.body as never) as AsyncIterable<Buffer>) {
            fs.writeSync(fd, chunk, 0, chunk.length, start + (got[k] ?? 0));
            got[k] = (got[k] ?? 0) + chunk.length;
            fs.writeFileSync(progressFile, JSON.stringify(got));
          }
        } catch (e) {
          if (attempt >= 30) throw e;
          log('foursquare', `${path.basename(file.path)}: ${(e as Error).message}, resuming`);
          await new Promise((r) => setTimeout(r, Math.min(30_000, 2000 * attempt)));
        }
      }
    }
  } finally {
    fs.closeSync(fd);
  }
  fs.renameSync(part, dest);
  fs.rmSync(progressFile, { force: true });
}

/** Where the Parquet footer sits: the last 8 bytes hold its length and the magic number. */
async function footerRange(file: RemoteFile, token: string): Promise<Range> {
  const url = `https://huggingface.co/datasets/${REPO}/resolve/main/${file.path}`;
  const res = await fetchRetry(url, {
    headers: { Authorization: `Bearer ${token}`, Range: `bytes=${file.size - 8}-${file.size - 1}` },
  });
  if (res.status !== 206) throw new Error(`HTTP ${res.status} reading the footer`);
  const tail = Buffer.from(await res.arrayBuffer());
  return [file.size - 8 - tail.readInt32LE(0), file.size];
}

/**
 * Pulls Ghana's Foursquare Open Source Places into a local Parquet file.
 * The dataset is gated: accept its terms on huggingface.co/datasets/foursquare/fsq-os-places and
 * put a read token in HF_TOKEN.
 *
 * The files are sorted by location. Each file's footer (a few KB) says which row groups could
 * hold Ghana; files with none are skipped. The few that do (~110 MB each) are read from
 * `.cache/foursquare/` when they have been downloaded there by hand (docs/DATA_PIPELINE.md),
 * filtered to Ghana and deleted. With FSQ_REMOTE=1 the script fetches just the needed byte
 * ranges itself instead, resuming after dropped connections. Until every needed file is here,
 * Foursquare is skipped and the missing files are listed in `.cache/foursquare/NEEDED.txt`.
 * Licence: Apache 2.0.
 */
export async function fetchFoursquare(db: Duck) {
  const dir = path.join(CACHE_DIR, 'foursquare');
  const out = path.join(dir, `places_gh_${FSQ_RELEASE}.parquet`);
  if (fs.existsSync(out)) {
    log('foursquare', `cached ${path.basename(out)}`);
    return out;
  }
  const token = process.env.HF_TOKEN;
  if (!token) {
    log('foursquare', 'skipped: HF_TOKEN not set (see docs/DATA_PIPELINE.md)');
    return null;
  }
  const partsDir = path.join(dir, `parts_${FSQ_RELEASE}`);
  fs.mkdirSync(partsDir, { recursive: true });
  const files = await listFiles(token);
  log('foursquare', `${FSQ_RELEASE}: ${files.length} files, checking which hold Ghana…`);
  const missing: RemoteFile[] = [];
  for (const file of files) {
    const name = path.basename(file.path);
    const done = path.join(partsDir, name);
    const none = `${done}.none`;
    const need = `${done}.need`;
    if (fs.existsSync(done) || fs.existsSync(none)) continue;

    let ranges: Range[];
    if (fs.existsSync(need)) ranges = JSON.parse(fs.readFileSync(need, 'utf8'));
    else {
      // Only the footer is fetched (resumably), into a same-size local file DuckDB can read.
      const footer = await footerRange(file, token);
      const meta = `${done}.footer`;
      await downloadRanges(file, meta, token, [footer]);
      // Byte span of each row group whose bounds overlap Ghana's bbox.
      const groups = await db.all<{ s: number; e: number }>(`
        SELECT s::BIGINT AS s, e::BIGINT AS e FROM (
          SELECT row_group_id,
                 min(least(coalesce(dictionary_page_offset, data_page_offset), data_page_offset)) AS s,
                 max(least(coalesce(dictionary_page_offset, data_page_offset), data_page_offset)
                     + total_compressed_size) AS e,
                 min(CASE WHEN path_in_schema = 'latitude' THEN stats_min_value::DOUBLE END) AS lat0,
                 max(CASE WHEN path_in_schema = 'latitude' THEN stats_max_value::DOUBLE END) AS lat1,
                 min(CASE WHEN path_in_schema = 'longitude' THEN stats_min_value::DOUBLE END) AS lon0,
                 max(CASE WHEN path_in_schema = 'longitude' THEN stats_max_value::DOUBLE END) AS lon1
          FROM parquet_metadata('${fwd(meta)}') GROUP BY row_group_id)
        WHERE lat1 >= ${B.ymin} AND lat0 <= ${B.ymax} AND lon1 >= ${B.xmin} AND lon0 <= ${B.xmax}
        ORDER BY s`);
      fs.rmSync(meta);
      if (!groups.length) {
        fs.writeFileSync(none, '');
        continue;
      }
      ranges = [...groups.map((g) => [Number(g.s), Number(g.e)] as Range), footer];
      fs.writeFileSync(need, JSON.stringify(ranges));
    }

    // A whole file downloaded by hand, or just the needed ranges fetched here.
    const local = path.join(dir, name);
    let src: string | null = fs.existsSync(local) ? local : null;
    if (!src && process.env.FSQ_REMOTE === '1') {
      const mb = ranges.reduce((s, [a, b]) => s + b - a, 0) / 1e6;
      log('foursquare', `${name}: fetching ${mb.toFixed(1)} MB of row groups`);
      src = `${local}.ranges`;
      await downloadRanges(file, src, token, ranges);
    }
    if (!src) {
      missing.push(file);
      continue;
    }
    await db.run(`
      COPY (
        SELECT fsq_place_id, name, latitude AS lat, longitude AS lon, address, locality, region,
               country, date_created, date_refreshed, date_closed, tel, website, email,
               facebook_id, instagram, twitter, fsq_category_ids, fsq_category_labels,
               unresolved_flags
        FROM read_parquet('${fwd(src)}')
        WHERE latitude BETWEEN ${B.ymin} AND ${B.ymax}
          AND longitude BETWEEN ${B.xmin} AND ${B.xmax}
      ) TO '${fwd(done)}' (FORMAT parquet, COMPRESSION zstd)
    `);
    fs.rmSync(src);
    fs.rmSync(need);
    log('foursquare', `${name}: Ghana rows extracted, ${path.basename(src)} deleted`);
  }

  const neededFile = path.join(dir, 'NEEDED.txt');
  if (missing.length) {
    const lines = missing.map(
      (f) =>
        `https://huggingface.co/datasets/${REPO}/resolve/main/${f.path}  (${Math.round(f.size / 1e6)} MB)`,
    );
    fs.writeFileSync(neededFile, `${lines.join('\n')}\n`);
    log(
      'foursquare',
      `skipped: ${missing.length} file(s) to download into ${dir} (listed in NEEDED.txt):\n  ${lines.join('\n  ')}`,
    );
    return null;
  }
  fs.rmSync(neededFile, { force: true });
  await db.run(
    `COPY (SELECT * FROM read_parquet('${fwd(partsDir)}/*.parquet')) TO '${fwd(out)}' (FORMAT parquet, COMPRESSION zstd)`,
  );
  const [row] = await db.all<{ n: number }>(`SELECT count(*)::INT AS n FROM '${fwd(out)}'`);
  log('foursquare', `saved ${row?.n} records`);
  fs.rmSync(partsDir, { recursive: true, force: true });
  return out;
}

/** Marks records from the dump in `extra.origin`, so the resolver can rank them as anchors. */
export const FSQ_ORIGIN = 'fsq-os-places';

/**
 * Normalises the Foursquare extract into the shared staging shape (stg_foursquare_places).
 * Returns false, staging nothing, until the files in NEEDED.txt are in place.
 * Category: the primary category path's leaf; when that is generic, the first specific leaf
 * among the other paths. Areas, roads and events (leaf `null`) are dropped, as are records
 * Foursquare marks closed or flags as doubtful.
 * Confidence comes from how recently Foursquare refreshed the record: many Ghana venues were
 * created by check-ins a decade ago and have since closed. A stale record alone falls under
 * the resolver's 0.36 floor, but it still corroborates a place another source has.
 */
export async function stageFoursquare(db: Duck) {
  const out = await fetchFoursquare(db);
  if (!out) return false;
  const file = fwd(out);
  // One leaf per distinct list of category paths; there are far fewer lists than places.
  const lists = await db.all<{ ls: string[] }>(
    `SELECT DISTINCT coalesce(fsq_category_labels, []) AS ls FROM '${file}'`,
  );
  const quote = (s: string) => `'${s.replaceAll("'", "''")}'`;
  const pairs = lists.map(({ ls }) => {
    const leaf = foursquareLeaf(ls);
    return `([${ls.map(quote).join(', ')}]::VARCHAR[], ${leaf === null ? 'NULL' : quote(leaf)})`;
  });
  const now = Date.now() / 1000;
  await db.run(`
    CREATE OR REPLACE TEMP TABLE fsq_map (ls VARCHAR[], category VARCHAR);
    ${pairs.length ? `INSERT INTO fsq_map VALUES ${pairs.join(', ')};` : ''}

    CREATE OR REPLACE TABLE stg_foursquare_places AS
      SELECT
        'foursquare'                                                AS source,
        f.fsq_place_id                                              AS source_id,
        trim(f.name)                                                AS name,
        []::VARCHAR[]                                               AS alt_names,
        m.category,
        f.fsq_category_labels[1]                                    AS category_raw,
        f.lon, f.lat,
        f.tel                                                       AS phone,
        f.website,
        f.email,
        NULL::VARCHAR                                               AS opening_hours,
        f.address,
        NULL::VARCHAR                                               AS brand,
        json_object('origin', '${FSQ_ORIGIN}', 'locality', f.locality,
                    'refreshed', f.date_refreshed::VARCHAR,
                    'socials', json_object('facebook', f.facebook_id::VARCHAR,
                                           'instagram', f.instagram, 'twitter', f.twitter))
                                                                    AS extra,
        CASE
          WHEN TRY_CAST(f.date_refreshed AS DATE) IS NULL THEN 0.35
          WHEN ${now} - epoch(TRY_CAST(f.date_refreshed AS DATE)) <= 1 * 31557600 THEN 0.75
          WHEN ${now} - epoch(TRY_CAST(f.date_refreshed AS DATE)) <= 3 * 31557600 THEN 0.6
          WHEN ${now} - epoch(TRY_CAST(f.date_refreshed AS DATE)) <= 5 * 31557600 THEN 0.45
          ELSE 0.35
        END::DOUBLE                                                 AS source_confidence
      FROM '${file}' f JOIN fsq_map m ON m.ls = coalesce(f.fsq_category_labels, [])
      WHERE m.category IS NOT NULL
        AND f.name IS NOT NULL AND trim(f.name) <> ''
        AND coalesce(f.country, 'GH') = 'GH'
        AND f.date_closed IS NULL
        AND coalesce(len(f.unresolved_flags), 0) = 0;
  `);
  const [c] = await db.all<{ n: number }>('SELECT count(*)::INT AS n FROM stg_foursquare_places');
  log('foursquare', `${c?.n} places staged`);
  return true;
}
