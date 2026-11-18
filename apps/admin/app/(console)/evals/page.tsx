import { cn } from '@placia/ui/cn';
import { FlaskConical, Gauge, History, Target, Timer, TrendingUp } from 'lucide-react';
import type { Metadata } from 'next';
import { Card, Stat } from '../../_components/ui';
import { serviceDb } from '../../_lib/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Evals' };

interface Overall {
  cases?: number;
  known?: { n: number; mrr: number; hit1: number; hit10: number } | null;
  browse?: { n: number; p10: number; ndcg10: number; success10: number } | null;
  parse?: { n: number; allCorrect: number; categories: number; area: number } | null;
  latencyMs?: { p50: number; p95: number; parseP50?: number; parseP95?: number };
  zeroResultRate?: number;
  errors?: number;
  tokens?: { in: number; out: number; n: number } | null;
}

interface Run {
  id: number;
  created_at: string;
  git_sha: string | null;
  suite: string;
  config: { mode?: string; model?: string | null; aiPolicy?: string; semantic?: string | null };
  overall: Overall | null;
}

const pct = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n * 100)}%`);
const dec = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(3));
const ms = (n: number | null | undefined) =>
  n == null ? '—' : n >= 1000 ? `${(n / 1000).toFixed(1)} s` : `${Math.round(n)} ms`;
const day = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

/** "Rules" or "AI · gpt-6-luna": what a run measured. */
const setup = (r: Run) =>
  r.config.mode === 'rules' || !r.config.model
    ? 'Rules'
    : `AI${r.config.aiPolicy === 'always' ? ' always' : ''} · ${r.config.model}`;

/** One metric over time: a single series, so the card title names it and there's no legend. */
function Trend({
  runs,
  pick,
  label,
}: {
  runs: Run[];
  pick: (o: Overall) => number | null | undefined;
  label: string;
}) {
  const pts = runs
    .map((r) => ({ r, v: r.overall ? pick(r.overall) : null }))
    .filter((p): p is { r: Run; v: number } => typeof p.v === 'number');
  if (pts.length < 2) return <p className="py-8 text-muted-foreground text-sm">Not enough runs</p>;
  // The plot stretches to the card; text and dots are HTML so they keep their size on phones.
  const lo = Math.max(0, Math.floor(Math.min(...pts.map((p) => p.v)) * 10) / 10 - 0.1);
  const hi = 1;
  const x = (i: number) => (i / (pts.length - 1)) * 100;
  const y = (v: number) => (1 - (v - lo) / (hi - lo)) * 100;
  const first = pts[0] as { r: Run; v: number };
  const last = pts[pts.length - 1] as { r: Run; v: number };
  return (
    <div className="pt-2 pb-1">
      <div className="relative ml-9 h-36" role="img" aria-label={`${label} by run`}>
        {[lo, (lo + hi) / 2, hi].map((t) => (
          <div
            key={t}
            className="absolute inset-x-0 border-border border-t"
            style={{ top: `${y(t)}%` }}
          >
            <span className="-translate-y-1/2 absolute -left-9 w-7 text-right text-[11px] text-muted-foreground tabular-nums">
              {t.toFixed(2)}
            </span>
          </div>
        ))}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full overflow-visible"
          aria-hidden
        >
          <polyline
            points={pts.map((p, i) => `${x(i)},${y(p.v)}`).join(' ')}
            fill="none"
            className="stroke-primary"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        {pts.map((p, i) => (
          <span
            key={p.r.id}
            title={`${day(p.r.created_at)} · run ${p.r.id}: ${p.v.toFixed(3)}`}
            className="group -translate-x-1/2 -translate-y-1/2 absolute grid size-5 place-items-center"
            style={{ left: `${x(i)}%`, top: `${y(p.v)}%` }}
          >
            <span
              className={cn(
                'size-2 rounded-full bg-primary ring-2 ring-surface',
                i === pts.length - 1 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
              )}
            />
          </span>
        ))}
      </div>
      <div className="mt-1.5 ml-9 flex justify-between text-[11px] text-muted-foreground tabular-nums">
        <span>{day(first.r.created_at)}</span>
        <span className="font-medium text-foreground">{last.v.toFixed(3)}</span>
        <span>{day(last.r.created_at)}</span>
      </div>
    </div>
  );
}

export default async function EvalsPage({
  searchParams,
}: {
  searchParams: Promise<{ suite?: string }>;
}) {
  const sp = await searchParams;
  const db = serviceDb();
  const { data, error } = db
    ? await db
        .from('eval_runs')
        .select('id, created_at, git_sha, suite, config, overall:metrics->overall')
        .order('id', { ascending: false })
        .limit(300)
    : { data: null, error: null };
  const all = (data ?? []) as unknown as Run[];

  if (!db || error || !all.length) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-semibold text-2xl tracking-tight">Evals</h1>
        <p className="mt-6 text-muted-foreground text-sm">
          {!db ? 'Database not connected.' : error ? "Couldn't load runs." : 'No runs yet.'}
        </p>
      </div>
    );
  }

  // Suites, most recently run first; the full golden set leads when present.
  const suites = [...new Set(all.map((r) => r.suite))];
  const fallback = suites.includes('search-golden-v1-all') ? 'search-golden-v1-all' : suites[0];
  const suite = sp.suite && suites.includes(sp.suite) ? sp.suite : (fallback as string);
  const runs = all.filter((r) => r.suite === suite); // newest first
  const latest = runs[0] as Run;

  // The newest run of each setup, for the side-by-side comparison.
  const bySetup = new Map<string, Run>();
  for (const r of runs) if (!bySetup.has(setup(r))) bySetup.set(setup(r), r);
  const compare = [...bySetup.values()];
  const rulesRuns = runs.filter((r) => setup(r) === 'Rules').reverse();
  const o = latest.overall ?? {};

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Evals</h1>
        <nav
          aria-label="Suite"
          className="flex max-w-full gap-1 overflow-x-auto rounded-full border bg-surface p-1 shadow-card [scrollbar-width:none]"
        >
          {suites.map((s) => (
            <a
              key={s}
              href={`?suite=${encodeURIComponent(s)}`}
              aria-current={s === suite ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 font-medium text-xs',
                s === suite
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s.replace(/^search-golden-v1-?/, '') || 'base'}
            </a>
          ))}
        </nav>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Target}
          label="Known-item MRR"
          value={dec(o.known?.mrr)}
          hint={`Hit@1 ${pct(o.known?.hit1)}`}
        />
        <Stat
          icon={TrendingUp}
          label="Browse nDCG@10"
          value={dec(o.browse?.ndcg10)}
          hint={`P@10 ${pct(o.browse?.p10)}`}
        />
        <Stat
          icon={Gauge}
          label="Parse correct"
          value={pct(o.parse?.allCorrect)}
          hint={`n=${o.parse?.n ?? 0}`}
        />
        <Stat
          icon={Timer}
          label="Latency p50"
          value={ms(o.latencyMs?.p50)}
          hint={`p95 ${ms(o.latencyMs?.p95)}`}
        />
      </section>
      <p className="-mt-3 text-muted-foreground text-xs">
        Latest: run {latest.id} · {setup(latest)} · {day(latest.created_at)}
        {latest.git_sha ? ` · ${latest.git_sha}` : ''}
      </p>

      <Card title="Setups compared" icon={FlaskConical}>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[720px] whitespace-nowrap text-sm">
            <thead className="border-b text-left text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Setup</th>
                <th className="px-3 py-2 text-right font-medium">MRR</th>
                <th className="px-3 py-2 text-right font-medium">Hit@1</th>
                <th className="px-3 py-2 text-right font-medium">nDCG@10</th>
                <th className="px-3 py-2 text-right font-medium">Parse</th>
                <th className="px-3 py-2 text-right font-medium">Zero</th>
                <th className="px-3 py-2 text-right font-medium">Parse p50</th>
                <th className="px-3 py-2 text-right font-medium">p50</th>
                <th className="px-4 py-2 text-right font-medium">p95</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {compare.map((r) => {
                const m = r.overall ?? {};
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2">
                      <span className="font-medium">{setup(r)}</span>
                      <span className="ml-2 text-muted-foreground text-xs">
                        {day(r.created_at)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">{dec(m.known?.mrr)}</td>
                    <td className="px-3 py-2 text-right">{pct(m.known?.hit1)}</td>
                    <td className="px-3 py-2 text-right">{dec(m.browse?.ndcg10)}</td>
                    <td className="px-3 py-2 text-right">{pct(m.parse?.allCorrect)}</td>
                    <td className="px-3 py-2 text-right">{pct(m.zeroResultRate)}</td>
                    <td className="px-3 py-2 text-right">{ms(m.latencyMs?.parseP50)}</td>
                    <td className="px-3 py-2 text-right">{ms(m.latencyMs?.p50)}</td>
                    <td className="px-4 py-2 text-right">{ms(m.latencyMs?.p95)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Browse nDCG@10 · rules runs" icon={TrendingUp}>
          <Trend runs={rulesRuns} pick={(m) => m.browse?.ndcg10} label="Browse nDCG@10" />
        </Card>
        <Card title="Known-item MRR · rules runs" icon={Target}>
          <Trend runs={rulesRuns} pick={(m) => m.known?.mrr} label="Known-item MRR" />
        </Card>
      </div>

      <Card title="Runs" icon={History}>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[640px] whitespace-nowrap text-sm">
            <thead className="border-b text-left text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-2 font-medium">Run</th>
                <th className="px-3 py-2 font-medium">Setup</th>
                <th className="px-3 py-2 text-right font-medium">Cases</th>
                <th className="px-3 py-2 text-right font-medium">MRR</th>
                <th className="px-3 py-2 text-right font-medium">nDCG@10</th>
                <th className="px-3 py-2 text-right font-medium">Parse</th>
                <th className="px-4 py-2 text-right font-medium">p50</th>
              </tr>
            </thead>
            <tbody className="divide-y tabular-nums">
              {runs.slice(0, 40).map((r) => {
                const m = r.overall ?? {};
                return (
                  <tr key={r.id}>
                    <td className="px-4 py-2 text-muted-foreground">
                      <span className="font-medium text-foreground">{r.id}</span> ·{' '}
                      {day(r.created_at)}
                      {r.git_sha ? ` · ${r.git_sha}` : ''}
                    </td>
                    <td className="px-3 py-2">{setup(r)}</td>
                    <td className="px-3 py-2 text-right">{m.cases ?? '—'}</td>
                    <td className="px-3 py-2 text-right">{dec(m.known?.mrr)}</td>
                    <td className="px-3 py-2 text-right">{dec(m.browse?.ndcg10)}</td>
                    <td className="px-3 py-2 text-right">{pct(m.parse?.allCorrect)}</td>
                    <td className="px-4 py-2 text-right">{ms(m.latencyMs?.p50)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
