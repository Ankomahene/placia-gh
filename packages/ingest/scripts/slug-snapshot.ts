import fs from 'node:fs';
import { createServiceClient } from '@placia/db';

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const { data } = await sb.rpc('ingest_slugs');
const out = process.argv[2]!;
fs.writeFileSync(out, JSON.stringify(data));
console.log(out, Object.keys(data as object).length);
