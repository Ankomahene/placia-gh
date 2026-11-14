/**
 * Search eval runner.
 *
 *   pnpm eval                      # auto: AI parse when a key is set, else rules
 *   pnpm eval --mode rules         # force the rule-based parser
 *   pnpm eval --chaos hang         # AI "configured" but hangs: measures graceful degradation
 *   pnpm eval --tag typo -v        # one slice, print every miss
 *   pnpm eval --save               # write reports/ and record the run in eval_runs
 *   pnpm eval --semantic off       # leave out the embedding arm (on whenever OPENAI_API_KEY is set)
 *   pnpm eval --browse-weights '{"semantic":0.3}'   # weights for pure category queries only
 *   pnpm eval --ai always          # AI parse for every query (default: selective, only when rules are unsure)
 *   pnpm eval --budget 20000       # AI parse time budget in ms (production: 2500); a high value measures the AI's ceiling
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import {
  aiConfigFromEnv,
  createEmbedder,
  createLLM,
  type LLMProvider,
  LLMRouter,
} from '@placia/core/ai';
import {
  expandCategory,
  type FusionWeights,
  haversine,
  type Intent,
  loadSearchContext,
  normalize,
  type SearchContext,
  type SearchResponse,
  search,
} from '@placia/core/search';
import { createServiceClient } from '@placia/db';
import {
  GOLDEN,
  type GoldenCase,
  HOLDOUT,
  HOLDOUT_V2,
  HOLDOUT_V3,
  HOLDOUT_V4,
  HOLDOUT_V5,
  HOLDOUT_V6,
} from './golden';
import { hitAt, mean, ndcgAt, percentile, precisionAt, reciprocalRank, round } from './metrics';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? (args[i + 1] ?? '') : null;
};
const mode = (flag('mode') ?? 'auto') as 'auto' | 'rules' | 'ai';
const chaos = flag('chaos') as 'hang' | 'error' | null;
const tag = flag('tag');
const verbose = args.includes('-v') || args.includes('--verbose');
const save = args.includes('--save');
const ablate = args.includes('--ablate');
const set = (flag('set') ?? 'dev') as
  | 'dev'
  | 'holdout'
  | 'holdout2'
  | 'holdout3'
  | 'holdout4'
  | 'holdout5'
  | 'holdout6'
  | 'all';
const suite = set === 'dev' ? 'search-golden-v1' : `search-golden-v1-${set}`;
const weightsArg = flag('weights')
  ? (JSON.parse(flag('weights') as string) as Partial<FusionWeights>)
  : undefined;
const semanticFlag = flag('semantic');
const budgetMs = Number(flag('budget') ?? 2500);
const aiPolicy = (flag('ai') ?? 'selective') as 'selective' | 'always';
const browseArg = flag('browse-weights')
  ? (JSON.parse(flag('browse-weights') as string) as Partial<FusionWeights>)
  : undefined;
const K = 10;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
const sb = createServiceClient(url, key);
const rpc = (fn: string, a?: Record<string, unknown>) => sb.rpc(fn as never, a as never);

/** A provider that is always down, for chaos runs. */
function brokenProvider(kind: 'hang' | 'error'): LLMProvider {
  const fail = (signal: AbortSignal) =>
    new Promise<never>((_, reject) => {
      if (kind === 'error') reject(Object.assign(new Error('overloaded'), { status: 529 }));
      else signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  return {
    name: 'anthropic',
    model: `chaos-${kind}`,
    generateText: (_r, s) => fail(s),
    generateObject: (_r, s) => fail(s),
  };
}

function makeLLM() {
  // Production breaker settings, so the run shows the breaker taking the outage off the hot path.
  if (chaos) return new LLMRouter([brokenProvider(chaos)], { timeoutMs: 2500 });
  if (mode === 'rules') return null;
  const cfg = aiConfigFromEnv();
  if (!cfg.anthropicApiKey && !cfg.openaiApiKey) {
    if (mode === 'ai') throw new Error('--mode ai needs ANTHROPIC_API_KEY or OPENAI_API_KEY');
    return null;
  }
  return createLLM(cfg);
}

function makeEmbedder() {
  if (semanticFlag === 'off') return null;
  const cfg = aiConfigFromEnv();
  if (!cfg.openaiApiKey) {
    if (semanticFlag === 'on') throw new Error('--semantic on needs OPENAI_API_KEY');
    return null;
  }
  return createEmbedder(cfg);
}
const embedder = makeEmbedder();

function relevant(c: GoldenCase, r: SearchResponse['results'][number], ctx: SearchContext) {
  const e = c.expect;
  const within = (at?: readonly [number, number], km?: number) =>
    !at || !km || haversine(at[0], at[1], r.lat, r.lon) <= km * 1000;
  if (e.kind === 'known') return new RegExp(e.name, 'i').test(r.name) && within(e.at, e.km);
  const cats = new Set(e.categories.flatMap((s) => expandCategory(ctx, s)));
  const kindOk =
    (r.category && cats.has(r.category)) || (e.name && new RegExp(e.name, 'i').test(r.name));
  return Boolean(kindOk) && within(e.at, e.km);
}

function scoreParse(c: GoldenCase, intent: Intent, ctx: SearchContext) {
  const label = c.parse;
  if (!label) return null;
  const out: Record<string, boolean> = {};
  if (label.categories) {
    const ok = new Set(label.categories.flatMap((s) => expandCategory(ctx, s)));
    out.categories = intent.categories.length > 0 && intent.categories.every((s) => ok.has(s));
  }
  if (label.area !== undefined) {
    if (label.area === null) out.area = !intent.area && !intent.anchor;
    else {
      const want = normalize(label.area);
      const got = intent.area ? normalize(intent.area.name) : '';
      out.area =
        (!!got && (got === want || got.startsWith(want) || want.startsWith(got))) ||
        (!!intent.anchor && normalize(intent.anchor).includes(want));
    }
  }
  out.nearMe = intent.nearMe === (label.nearMe ?? false);
  out.openNow = intent.openNow === (label.openNow ?? false);
  out.cheap = intent.cheap === (label.cheap ?? false);
  return out;
}

interface CaseResult {
  id: string;
  q: string;
  tags: string[];
  kind: 'known' | 'browse';
  n: number;
  rr: number;
  hit1: number;
  hit10: number;
  p10: number;
  ndcg10: number;
  parse: Record<string, boolean> | null;
  path: string;
  fallback?: string;
  aiReason?: string;
  ms: { total: number; parse: number; db: number; embed: number };
  tokens: { in: number; out: number } | null;
  top: string[];
  intent: Intent;
  error?: string;
}

async function runCases(
  ctx: SearchContext,
  llm: LLMRouter | null,
  cases: GoldenCase[],
  weights?: Partial<FusionWeights>,
) {
  const results: CaseResult[] = [];
  for (const c of cases) {
    const req = {
      q: c.q,
      lat: c.user?.[0] ?? null,
      lon: c.user?.[1] ?? null,
      limit: 20,
      weights,
    };
    try {
      const res = await search(req, {
        rpc,
        context: ctx,
        llm,
        embedder,
        browseWeights: browseArg,
        aiPolicy,
        aiBudgetMs: budgetMs,
      });
      const rel = res.results.map((r) => relevant(c, r, ctx));
      results.push({
        id: c.id,
        q: c.q,
        tags: c.tags,
        kind: c.expect.kind,
        n: res.results.length,
        rr: reciprocalRank(rel),
        hit1: hitAt(rel, 1),
        hit10: hitAt(rel, K),
        p10: precisionAt(rel, K),
        ndcg10: ndcgAt(rel, K),
        parse: scoreParse(c, res.intent, ctx),
        path: res.meta.parse.path,
        fallback: res.meta.parse.fallback,
        aiReason: res.meta.parse.aiReason,
        ms: {
          total: res.meta.timings.totalMs,
          parse: res.meta.timings.parseMs,
          db: res.meta.timings.dbMs + res.meta.timings.anchorMs,
          embed: res.meta.timings.embedMs,
        },
        tokens:
          res.meta.parse.inputTokens != null
            ? { in: res.meta.parse.inputTokens, out: res.meta.parse.outputTokens ?? 0 }
            : null,
        top: res.results
          .slice(0, 5)
          .map(
            (r, i) =>
              `${rel[i] ? '✓' : '·'} ${r.name} (${r.category ?? '?'}, ${r.locality ?? r.district ?? ''})`,
          ),
        intent: res.intent,
      });
    } catch (err) {
      results.push({
        id: c.id,
        q: c.q,
        tags: c.tags,
        kind: c.expect.kind,
        n: 0,
        rr: 0,
        hit1: 0,
        hit10: 0,
        p10: 0,
        ndcg10: 0,
        parse: null,
        path: 'error',
        ms: { total: 0, parse: 0, db: 0, embed: 0 },
        tokens: null,
        top: [],
        intent: {} as Intent,
        error: err instanceof Error ? err.message : String(err),
      });
    }
    process.stdout.write('.');
  }
  process.stdout.write('\n');
  return results;
}

function summarise(rs: CaseResult[]) {
  const kn = rs.filter((r) => r.kind === 'known');
  const br = rs.filter((r) => r.kind === 'browse');
  const parsed = rs.filter((r) => r.parse);
  const field = (f: string) => {
    const scored = parsed.filter((r) => r.parse && f in r.parse);
    return scored.length ? round(mean(scored.map((r) => (r.parse?.[f] ? 1 : 0)))) : null;
  };
  return {
    cases: rs.length,
    known: kn.length
      ? {
          n: kn.length,
          mrr: round(mean(kn.map((r) => r.rr))),
          hit1: round(mean(kn.map((r) => r.hit1))),
          hit10: round(mean(kn.map((r) => r.hit10))),
        }
      : null,
    browse: br.length
      ? {
          n: br.length,
          p10: round(mean(br.map((r) => r.p10))),
          ndcg10: round(mean(br.map((r) => r.ndcg10))),
          success10: round(mean(br.map((r) => r.hit10))),
        }
      : null,
    zeroResultRate: round(mean(rs.map((r) => (r.n === 0 ? 1 : 0)))),
    errors: rs.filter((r) => r.error).length,
    parse: parsed.length
      ? {
          n: parsed.length,
          categories: field('categories'),
          area: field('area'),
          nearMe: field('nearMe'),
          openNow: field('openNow'),
          cheap: field('cheap'),
          allCorrect: round(
            mean(parsed.map((r) => (Object.values(r.parse ?? {}).every(Boolean) ? 1 : 0))),
          ),
        }
      : null,
    // Mean tokens per AI-parsed query (cache hits and fallbacks excluded).
    tokens: (() => {
      const t = rs.filter((r) => r.tokens).map((r) => r.tokens as { in: number; out: number });
      return t.length
        ? {
            n: t.length,
            in: round(mean(t.map((x) => x.in))),
            out: round(mean(t.map((x) => x.out))),
          }
        : null;
    })(),
    fallbacks: Object.fromEntries(
      [...new Set(rs.map((r) => r.fallback).filter((x): x is string => !!x))].map((f) => [
        f,
        rs.filter((r) => r.fallback === f).length,
      ]),
    ),
    // Why the rules were judged unsure (selective policy): how often, and for what.
    aiReasons: Object.fromEntries(
      [...new Set(rs.map((r) => r.aiReason).filter((x): x is string => !!x))].map((a) => [
        a,
        rs.filter((r) => r.aiReason === a).length,
      ]),
    ),
    paths: Object.fromEntries(
      [...new Set(rs.map((r) => r.path))].map((p) => [p, rs.filter((r) => r.path === p).length]),
    ),
    latencyMs: {
      p50: percentile(
        rs.map((r) => r.ms.total),
        50,
      ),
      p95: percentile(
        rs.map((r) => r.ms.total),
        95,
      ),
      parseP50: percentile(
        rs.map((r) => r.ms.parse),
        50,
      ),
      embedP50: percentile(
        rs.map((r) => r.ms.embed),
        50,
      ),
      parseP95: percentile(
        rs.map((r) => r.ms.parse),
        95,
      ),
      dbP50: percentile(
        rs.map((r) => r.ms.db),
        50,
      ),
      dbP95: percentile(
        rs.map((r) => r.ms.db),
        95,
      ),
    },
  };
}

/** Each variant switches one ranking signal off; the drop shows what that signal is worth. */
const ABLATIONS: [string, Partial<FusionWeights>][] = [
  ['all signals', {}],
  ['− title', { title: 0 }],
  ['− full-text', { fts: 0 }],
  ['− trigram name', { name: 0 }],
  ['− category', { category: 0 }],
  ['− proximity', { proximity: 0 }],
  ['− confidence', { confidence: 0 }],
  ['− semantic', { semantic: 0 }],
];

async function main() {
  const ctx = await loadSearchContext(rpc as never);
  const llm = makeLLM();
  const pool =
    set === 'holdout'
      ? HOLDOUT
      : set === 'holdout2'
        ? HOLDOUT_V2
        : set === 'holdout3'
          ? HOLDOUT_V3
          : set === 'holdout4'
            ? HOLDOUT_V4
            : set === 'holdout5'
              ? HOLDOUT_V5
              : set === 'holdout6'
                ? HOLDOUT_V6
                : set === 'all'
                  ? [...GOLDEN, ...HOLDOUT]
                  : GOLDEN;
  const cases = pool.filter((c) => !tag || c.tags.includes(tag));
  // One warm-up so connection setup doesn't land on the first case's latency.
  await search({ q: 'warm up', limit: 1 }, { rpc, context: ctx, llm: null });

  if (ablate) {
    const rows: { variant: string; overall: ReturnType<typeof summarise> }[] = [];
    for (const [variant, w] of ABLATIONS) {
      process.stdout.write(`${variant.padEnd(16)}`);
      rows.push({ variant, overall: summarise(await runCases(ctx, llm, cases, w)) });
    }
    console.log('\nVariant           Known MRR  Hit@1   Browse P@10  nDCG@10');
    for (const { variant, overall: o } of rows) {
      console.log(
        `${variant.padEnd(18)}${String(o.known?.mrr ?? '—').padEnd(11)}${String(o.known?.hit1 ?? '—').padEnd(8)}${String(o.browse?.p10 ?? '—').padEnd(13)}${o.browse?.ndcg10 ?? '—'}`,
      );
    }
    if (save) {
      const dir = path.join(import.meta.dirname, '..', 'reports');
      fs.mkdirSync(dir, { recursive: true });
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      const file = path.join(dir, `${stamp}-ablation-${mode}${embedder ? '-sem' : ''}.json`);
      fs.writeFileSync(
        file,
        `${JSON.stringify({ suite, at: new Date().toISOString(), mode, rows }, null, 2)}\n`,
      );
      console.log(`\nSaved ${path.relative(process.cwd(), file)}`);
    }
    return;
  }

  // Round trip of a no-op RPC: how much of each search's latency is just the network.
  const rtts: number[] = [];
  for (let i = 0; i < 10; i++) {
    const t = performance.now();
    await sb.rpc('ping');
    rtts.push(Math.round(performance.now() - t));
  }
  const rttMs = percentile(rtts, 50);

  const results = await runCases(ctx, llm, cases, weightsArg);
  const overall = summarise(results);
  const tags = [...new Set(results.flatMap((r) => r.tags))].sort();
  const byTag = Object.fromEntries(
    tags.map((t) => [t, summarise(results.filter((r) => r.tags.includes(t)))]),
  );

  const sha = (() => {
    try {
      return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
  })();
  const dirty = (() => {
    try {
      return execSync('git status --porcelain', { encoding: 'utf8' }).trim().length > 0;
    } catch {
      return false;
    }
  })();
  const config = {
    mode,
    chaos,
    tag,
    k: K,
    provider: llm?.primary.name ?? null,
    model: llm?.primary.model ?? null,
    semantic: embedder ? `${embedder.model}@${embedder.dimensions}` : false,
    aiBudgetMs: budgetMs,
    aiPolicy,
    weights: weightsArg ?? null,
    browseWeights: browseArg ?? null,
    networkRttMs: rttMs,
    dirty,
  };

  // ---- Console report ----
  const pct = (x: number | null | undefined) => (x == null ? '—' : `${Math.round(x * 100)}%`);
  console.log(
    `\nSearch eval · ${set} · ${results.length} cases · mode=${mode}${chaos ? ` chaos=${chaos}` : ''} · ${sha ?? ''}${dirty ? '+dirty' : ''}`,
  );
  if (overall.known)
    console.log(
      `Known items  MRR ${overall.known.mrr}  Hit@1 ${pct(overall.known.hit1)}  Hit@10 ${pct(overall.known.hit10)}  (n=${overall.known.n})`,
    );
  if (overall.browse)
    console.log(
      `Browse       P@10 ${pct(overall.browse.p10)}  nDCG@10 ${overall.browse.ndcg10}  Success@10 ${pct(overall.browse.success10)}  (n=${overall.browse.n})`,
    );
  if (overall.parse)
    console.log(
      `Parse        categories ${pct(overall.parse.categories)}  area ${pct(overall.parse.area)}  near-me ${pct(overall.parse.nearMe)}  open-now ${pct(overall.parse.openNow)}  all ${pct(overall.parse.allCorrect)}  (n=${overall.parse.n})`,
    );
  console.log(
    `Zero results ${pct(overall.zeroResultRate)}  errors ${overall.errors}  paths ${JSON.stringify(overall.paths)}`,
  );
  console.log(
    `Latency ms   p50 ${overall.latencyMs.p50}  p95 ${overall.latencyMs.p95}  (db p50 ${overall.latencyMs.dbP50} / p95 ${overall.latencyMs.dbP95}, parse p50 ${overall.latencyMs.parseP50} / p95 ${overall.latencyMs.parseP95}, embed p50 ${overall.latencyMs.embedP50}; network RTT ${rttMs})`,
  );
  console.log(
    `AI           ${aiPolicy} · asked ${JSON.stringify(overall.aiReasons)} · budget ${budgetMs} ms  semantic ${config.semantic || 'off'}  tokens/query ${overall.tokens ? `${overall.tokens.in} in + ${overall.tokens.out} out (n=${overall.tokens.n})` : '—'}  fallbacks ${JSON.stringify(overall.fallbacks)}`,
  );
  console.log('\nBy tag');
  for (const t of tags) {
    const s = byTag[t];
    if (!s) continue;
    const k = s.known ? `MRR ${s.known.mrr}` : '';
    const b = s.browse
      ? `P@10 ${pct(s.browse.p10)} nDCG ${s.browse.ndcg10} S@10 ${pct(s.browse.success10)}`
      : '';
    console.log(
      `  ${t.padEnd(14)} n=${String(s.cases).padStart(3)}  ${[k, b].filter(Boolean).join('  ')}`,
    );
  }

  const misses = results.filter((r) =>
    r.kind === 'known'
      ? r.hit1 === 0
      : r.p10 < 0.5 || (r.parse && !Object.values(r.parse).every(Boolean)),
  );
  if (verbose) {
    console.log(`\nMisses (${misses.length})`);
    for (const m of misses) {
      const bad = m.parse
        ? Object.entries(m.parse)
            .filter(([, v]) => !v)
            .map(([f]) => f)
        : [];
      const a = m.intent.area
        ? `${m.intent.area.name}/${m.intent.area.kind}/${m.intent.area.relation}`
        : m.intent.anchor
          ? `anchor:${m.intent.anchor}`
          : '-';
      console.log(
        `\n  ${m.id}  "${m.q}"  ${m.kind === 'known' ? `rr=${round(m.rr, 2)}` : `p10=${round(m.p10, 2)}`}${bad.length ? `  parse✗ ${bad.join(',')}` : ''}${m.error ? `  ERROR ${m.error}` : ''}`,
      );
      console.log(
        `    intent text="${m.intent.text}" cats=${m.intent.categories?.join(',') || '-'} area=${a}`,
      );
      for (const t of m.top) console.log(`    ${t}`);
    }
  }

  if (save) {
    const dir = path.join(import.meta.dirname, '..', 'reports');
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
    const name = [
      stamp,
      set,
      chaos ? `chaos-${chaos}` : mode,
      embedder ? 'sem' : null,
      budgetMs !== 2500 ? `b${budgetMs}` : null,
      llm && !chaos && aiPolicy === 'always' ? 'ai-always' : null,
      browseArg ? 'browsew' : null,
      tag,
    ]
      .filter(Boolean)
      .join('-');
    const report = {
      suite,
      at: new Date().toISOString(),
      git: sha,
      config,
      overall,
      byTag,
      cases: results,
    };
    fs.writeFileSync(path.join(dir, `${name}.json`), `${JSON.stringify(report, null, 2)}\n`);
    const { error } = await sb.from('eval_runs').insert({
      git_sha: sha,
      suite,
      config,
      metrics: { overall, byTag } as never,
    });
    console.log(
      `\nSaved reports/${name}.json${error ? ` (eval_runs insert failed: ${error.message})` : ' and eval_runs row'}`,
    );
  }
}

await main();
