import 'server-only';
import { createServiceClient } from '@placia/db';

export interface DataQuality {
  places: number;
  multi_source: number;
  coverage: Record<'phone' | 'website' | 'hours' | 'address' | 'locality' | 'district', number>;
  confidence: { bucket: number; count: number }[] | null;
  sources: Record<string, number> | null;
  groups: { slug: string; name: string; icon: string; count: number }[] | null;
  regions: { name: string; count: number }[] | null;
  last_run: {
    started_at: string;
    finished_at: string | null;
    status: 'running' | 'succeeded' | 'failed';
    source_versions: Record<string, string | null>;
    stats: {
      records?: number;
      matches?: Record<string, number>;
      rejectedByOsmGuard?: number;
      rejectedBySpread?: number;
      droppedLowConfidence?: number;
    };
  } | null;
}

export async function getDataQuality(): Promise<DataQuality | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  const { data, error } = await createServiceClient(url, key).rpc('admin_data_quality');
  if (error || !data) return null;
  return data as unknown as DataQuality;
}
