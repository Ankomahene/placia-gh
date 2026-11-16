import 'server-only';
import {
  type Flag,
  flagSearches,
  type LoggedSearch,
  PROBLEM_FLAGS,
} from '@placia/core/search/insights';
import { createServiceClient } from '@placia/db';

export function service() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createServiceClient(url, key) : null;
}

export interface FlaggedSearch extends LoggedSearch {
  flags: Flag[];
  /** At least one flag that means the person probably didn't get what they wanted. */
  problem: boolean;
}

/** Logged searches, oldest first, each with its rule flags. Null when the DB isn't connected. */
export async function getFlaggedSearches(days: number): Promise<FlaggedSearch[] | null> {
  const db = service();
  if (!db) return null;
  const { data, error } = await db.rpc('admin_search_events' as never, { p_days: days } as never);
  if (error || !Array.isArray(data)) return null;
  const events = data as unknown as LoggedSearch[];
  const flags = flagSearches(events);
  return events.map((e, i) => {
    const f = flags[i] ?? [];
    return { ...e, flags: f, problem: f.some((x) => PROBLEM_FLAGS.has(x.kind)) };
  });
}
