import { createServiceClient } from '@placia/db';

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const o = await sb.rpc('admin_overview');
console.log(o.data, o.error);
const q = await sb.rpc('admin_data_quality');
console.log(JSON.stringify(q.data).slice(0, 1500), q.error);
for (const term of ['chop bar', 'korle bu', 'pharmacy osu', 'waakye']) {
  const r = await sb
    .from('places')
    .select('name, slug, confidence')
    .textSearch('search_tsv', term.split(' ').join(' & '), { config: 'simple' })
    .order('confidence', { ascending: false })
    .limit(4);
  console.log(
    term,
    '→',
    r.data?.map((x) => `${x.name} (${x.slug})`).join(' | '),
    r.error?.message ?? '',
  );
}
