/**
 * Ask eval: is the conversational answer grounded, useful and fast enough for a phone?
 *
 *   pnpm --filter @placia/evals ask                      # default model
 *   pnpm --filter @placia/evals ask --models gpt-5.4-mini,gpt-6-luna
 *   pnpm --filter @placia/evals ask --save               # writes reports/ask-<date>.md
 *
 * Per question: did it cite at least one place, were all citations real (issued by our tools),
 * did a cited place match what the asker wanted, did it fall back, and how long it took.
 * "No match" questions pass when the answer cites nothing and says so.
 */
import fs from 'node:fs';
import path from 'node:path';
import { aiConfigFromEnv } from '@placia/core/ai';
import { type AskMeta, type AskPlace, askDeps, OpenAIAskModel, runAsk } from '@placia/core/ask';
import { createServiceClient } from '@placia/db';

interface Case {
  q: string;
  /** Lat/lon of the asker, when the question depends on it. */
  at?: [number, number];
  /** A cited place must match: category name or place name (regex, case-insensitive). */
  want?: { category?: string; name?: string };
  /** Nothing in our data fits: pass when nothing is cited. */
  none?: true;
}

const OSU: [number, number] = [5.5571, -0.1818];
const KNUST: [number, number] = [6.6745, -1.5716];

export const CASES: Case[] = [
  { q: 'Where can I buy medicine around Osu?', want: { category: 'pharm' } },
  { q: 'Is there a pharmacy near me that is open 24 hours?', at: OSU, want: { category: 'pharm' } },
  { q: 'I need a hostel close to KNUST', want: { category: 'hostel|guest|hotel' } },
  { q: 'Any good chop bar near me?', at: KNUST, want: { category: 'restaurant|chop|food' } },
  { q: 'Where is Korle Bu Teaching Hospital?', want: { name: 'korle' } },
  { q: 'Which banks are in Madina?', want: { category: 'bank' } },
  { q: 'I want to fill my car with fuel in East Legon', want: { category: 'fuel|gas|filling' } },
  { q: 'Find me a church in Tema', want: { category: 'church|worship' } },
  { q: 'Is there an ATM close by?', at: OSU, want: { category: 'atm|bank' } },
  { q: 'Where can I watch a movie in Accra?', want: { category: 'cinema' } },
  { q: 'Hotels in Cape Coast for the weekend', want: { category: 'hotel|guest|lodg' } },
  { q: 'Where can I get my hair done near Adum?', want: { category: 'hair|beauty|salon' } },
  { q: 'Is there a ski resort in Accra?', none: true },
  { q: 'Where can I buy a ticket to the moon in Kumasi?', none: true },
];

const argv = process.argv.slice(2);
const arg = (k: string) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined);
const cfg = aiConfigFromEnv();
const models = (arg('--models') ?? process.env.AI_ASK_MODEL ?? cfg.openaiModel).split(',');
const sb = createServiceClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string,
);

interface Row {
  c: Case;
  meta: AskMeta;
  places: AskPlace[];
  searchMs: number;
  pass: boolean;
  why: string;
}

const pct = (xs: number[], p: number) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor((p / 100) * s.length))] ?? 0;
};

const lines: string[] = [`# Ask eval, ${new Date().toISOString().slice(0, 10)}`, ''];
for (const model of models) {
  const base = askDeps(sb as never, cfg);
  const rows: Row[] = [];
  for (const c of CASES) {
    let searchMs = 0;
    const deps = {
      ...base,
      model: new OpenAIAskModel(cfg.openaiApiKey as string, model),
      search: async (q: string, lat: number | null, lon: number | null) => {
        const t = performance.now();
        try {
          return await base.search(q, lat, lon);
        } finally {
          searchMs += performance.now() - t;
        }
      },
    };
    const places = new Map<string, AskPlace>();
    let meta: AskMeta | null = null;
    for await (const ev of runAsk(
      { question: c.q, lat: c.at?.[0] ?? null, lon: c.at?.[1] ?? null },
      deps,
    )) {
      if (ev.type === 'places') for (const p of ev.places) places.set(p.ref, p);
      if (ev.type === 'done') meta = ev.meta;
    }
    if (!meta) throw new Error('runAsk ended without done');
    const cited = meta.citations.map((r) => places.get(r)).filter(Boolean) as AskPlace[];
    let pass: boolean;
    let why = '';
    if (meta.path === 'fallback') {
      pass = false;
      why = `fallback: ${meta.error}`;
    } else if (meta.invalidCitations.length) {
      pass = false;
      why = `made-up refs ${meta.invalidCitations.join(',')}`;
    } else if (c.none) {
      pass = cited.length === 0;
      why = pass ? '' : `cited ${cited.map((p) => p.name).join(', ')}`;
    } else {
      const re = new RegExp(c.want?.category ?? c.want?.name ?? '.', 'i');
      pass = cited.some((p) => re.test(c.want?.category ? (p.categoryName ?? '') : p.name));
      why = pass
        ? ''
        : cited.length
          ? `cited ${cited.map((p) => `${p.name} (${p.categoryName})`).join(', ')}`
          : 'cited nothing';
    }
    rows.push({ c, meta, places: [...places.values()], searchMs: Math.round(searchMs), pass, why });
    process.stdout.write(pass ? '.' : 'x');
  }

  const n = rows.length;
  const ok = rows.filter((r) => r.pass).length;
  const grounded = rows.filter((r) => r.meta.path === 'agent' && !r.meta.invalidCitations.length);
  const lat = rows.map((r) => r.meta.latencyMs);
  const ftok = rows.map((r) => r.meta.firstTokenMs ?? r.meta.latencyMs);
  const search = rows.map((r) => r.searchMs);
  const tokIn = rows.reduce((s, r) => s + r.meta.inputTokens, 0);
  const tokOut = rows.reduce((s, r) => s + r.meta.outputTokens, 0);
  const summary = [
    `## ${model}`,
    '',
    '| Metric | Value |',
    '| --- | --- |',
    `| Pass (useful + grounded) | ${ok}/${n} (${Math.round((100 * ok) / n)}%) |`,
    `| Grounded (no made-up refs, no fallback) | ${grounded.length}/${n} |`,
    `| Made-up refs removed | ${rows.reduce((s, r) => s + r.meta.invalidCitations.length, 0)} |`,
    `| Fallbacks | ${rows.filter((r) => r.meta.path === 'fallback').length} |`,
    `| Tool calls per question | ${(rows.reduce((s, r) => s + r.meta.toolCalls, 0) / n).toFixed(1)} |`,
    `| First words p50 / p95 | ${pct(ftok, 50)} / ${pct(ftok, 95)} ms |`,
    `| Full answer p50 / p95 | ${pct(lat, 50)} / ${pct(lat, 95)} ms |`,
    `| Of which our search p50 | ${pct(search, 50)} ms |`,
    `| Tokens per question (in / out) | ${Math.round(tokIn / n)} / ${Math.round(tokOut / n)} |`,
    '',
    ...rows.filter((r) => !r.pass).map((r) => `- ✗ "${r.c.q}": ${r.why}`),
    '',
  ];
  console.log(`\n${summary.join('\n')}`);
  lines.push(...summary);
}

if (argv.includes('--save')) {
  const file = path.join(
    import.meta.dirname,
    '..',
    'reports',
    `ask-${new Date().toISOString().slice(0, 10)}.md`,
  );
  fs.writeFileSync(file, `${lines.join('\n')}\n`);
  console.log(`saved ${path.relative(process.cwd(), file)}`);
}
