/** pnpm --filter @placia/core run ask "where can I buy medicine around osu?" [lat lon] */
import { createServiceClient } from '@placia/db';
import { askDeps, runAsk } from '../src/ask';

const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);
const [question = 'Where can I get medicine in Osu?', lat, lon] = process.argv.slice(2);
const deps = askDeps(sb as never);
for await (const ev of runAsk(
  { question, lat: lat ? Number(lat) : null, lon: lon ? Number(lon) : null },
  deps,
)) {
  if (ev.type === 'delta') process.stdout.write(ev.text);
  else if (ev.type === 'places')
    console.log(`\n[places] ${ev.places.map((p) => `${p.ref} ${p.name}`).join(' · ')}`);
  else if (ev.type === 'status') console.log(`\n[status] ${ev.text}`);
  else console.log('\n[done]', JSON.stringify({ ...ev.meta, answer: undefined }));
}
