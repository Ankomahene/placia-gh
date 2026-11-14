/** pnpm --filter @placia/core exec tsx --env-file-if-exists=../../.env.local scripts/area-clashes.ts [name|name] */
import { createServiceClient } from '@placia/db';
import type { RawContext } from '../src/search/context';
import { normalize } from '../src/search/text';

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);
const { data, error } = await sb.rpc('search_context' as never);
if (error) throw error;
const raw = data as RawContext;
const regions = new Map(raw.regions.map(([id, name]) => [id, name]));
const districts = new Map(raw.districts.map(([id, name, regionId]) => [id, { name, regionId }]));

const byName = new Map<string, typeof raw.localities>();
for (const l of raw.localities) {
  const key = normalize(l[1]);
  byName.set(key, [...(byName.get(key) ?? []), l]);
}
const clashes = [...byName.entries()].filter(([, ls]) => ls.length > 1);
console.log(
  `localities ${raw.localities.length}, names ${byName.size}, clashing names ${clashes.length}`,
);
const withPlaces = clashes.filter(([, ls]) => ls.filter((l) => l[7] > 0).length > 1);
console.log(`clashing names where 2+ have places: ${withPlaces.length}`);
const kinds = new Map<string, number>();
for (const [, ls] of clashes) for (const l of ls) kinds.set(l[3], (kinds.get(l[3]) ?? 0) + 1);
console.log('kinds among clashes', Object.fromEntries(kinds));

const show = (process.argv[2] ?? 'atonsu|odumasi|adum|asokwa|kaneshie|tema|ayigya|bantama')
  .split('|')
  .map(normalize);
for (const name of show) {
  console.log(`\n${name}`);
  for (const l of byName.get(name) ?? []) {
    const d = l[4] != null ? districts.get(l[4]) : undefined;
    console.log(
      `  ${l[3].padEnd(13)} places ${String(l[7]).padStart(4)}  ${l[5].toFixed(3)},${l[6].toFixed(3)}  ${d?.name ?? '?'} / ${d ? regions.get(d.regionId) : '?'}`,
    );
  }
}
console.log('\nbiggest clashes (most places on the 2nd candidate):');
const ranked = withPlaces
  .map(([k, ls]) => [k, ls.map((l) => l[7]).sort((a, b) => b - a)] as const)
  .sort((a, b) => (b[1][1] ?? 0) - (a[1][1] ?? 0))
  .slice(0, 25);
for (const [k, counts] of ranked) console.log(`  ${k.padEnd(20)} ${counts.join(' ')}`);
