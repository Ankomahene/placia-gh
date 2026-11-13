import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export type { Database } from './database.types';

/**
 * Service-role client for trusted server code (route handlers, jobs, admin).
 * Never import this from client components.
 */
export function createServiceClient(url: string, serviceRoleKey: string) {
  return createClient<Database>(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
