/** pnpm --filter @placia/core search "pharmacy near madina|waakye osu" [lat lon] */
import { createServiceClient } from '@placia/db';
import { loadSearchContext, search } from '../src/search';

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
const rpc = (fn: string, args?: Record<string, unknown>) => sb.rpc(fn as never, args as never);
const context = await loadSearchContext(rpc as never);
const [q, lat, lon] = process.argv.slice(2);
for (const query of (q ?? '').split('|')) {
  const res = await search(
    { q: query, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null, limit: 8 },
    { rpc, context },
  );
  console.log(`\n» ${query}`);
  console.log(
    '  intent',
    JSON.stringify({
      ...res.intent,
      area:
        res.intent.area &&
        `${res.intent.area.name} (${res.intent.area.kind}, ${res.intent.area.relation})`,
    }),
  );
  console.log(
    '  meta  ',
    JSON.stringify({
      centre: res.meta.centre?.from,
      area: res.meta.area,
      radius: res.meta.radiusM,
      widened: res.meta.widenedTo,
      anchor: res.meta.anchor,
      t: res.meta.timings,
    }),
  );
  for (const r of res.results)
    console.log(
      `   ${r.name} · ${r.category} · ${r.locality ?? r.district}${r.distanceM != null ? ` · ${(r.distanceM / 1000).toFixed(1)} km` : ''}  ${JSON.stringify(r.arms)}`,
    );
}
