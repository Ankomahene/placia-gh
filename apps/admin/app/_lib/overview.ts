import 'server-only';
import { createServiceClient } from '@placia/db';

interface OverviewRow {
  places: number;
  pending_contributions: number;
  source_records: number;
  searches_7d: number;
  db_size_mb: number;
  extensions: Record<string, boolean>;
}

const EXTENSION_LABELS: Record<string, string> = {
  postgis: 'PostGIS',
  vector: 'pgvector',
  pg_trgm: 'Trigram search',
  unaccent: 'Unaccent',
};

export async function getOverviewCounts() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return empty();

  const { data, error } = await createServiceClient(url, key).rpc('admin_overview');
  if (error || !data) return empty();
  const row = data as unknown as OverviewRow;

  return {
    places: row.places,
    pendingContributions: row.pending_contributions,
    sourceRecords: row.source_records,
    searches7d: row.searches_7d,
    health: [
      { label: `Connected · ${row.db_size_mb} MB / 500 MB`, ok: true },
      ...Object.entries(EXTENSION_LABELS).map(([ext, label]) => ({
        label,
        ok: !!row.extensions[ext],
      })),
    ],
  };
}

function empty() {
  return {
    places: null,
    pendingContributions: null,
    sourceRecords: null,
    searches7d: null,
    health: [{ label: 'Connected', ok: false }],
  };
}
