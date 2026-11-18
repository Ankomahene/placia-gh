import {
  FLAG_LABELS,
  type Flag,
  PROBLEM_FLAGS,
  REVIEW_PROBLEM_LABELS,
  type SearchReview,
} from '@placia/core/search/insights';
import { cn } from '@placia/ui/cn';
import {
  CircleAlert,
  Clock,
  History,
  ListOrdered,
  Search,
  SearchX,
  ServerCrash,
  TriangleAlert,
} from 'lucide-react';
import type { Metadata } from 'next';
import { BarList, Card, Stat } from '../../_components/ui';
import { type FlaggedSearch, getFlaggedSearches } from '../../_lib/search-insights';
import { reviewSearches } from './actions';
import { ReviewButton } from './submit';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Search insights' };

const PERIODS = [7, 30, 90] as const;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s.length ? (s[Math.floor((s.length - 1) / 2)] ?? null) : null;
};

export default async function SearchInsightsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const { days: d } = await searchParams;
  const days = PERIODS.find((p) => String(p) === d) ?? 30;
  const all = await getFlaggedSearches(days);

  if (!all) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-semibold text-2xl tracking-tight">Search insights</h1>
        <p className="mt-6 text-muted-foreground text-sm">Database not connected.</p>
      </div>
    );
  }

  const newest = [...all].reverse();
  // A human-style AI read wins over the rules: a search it judged good leaves the list.
  const attention = newest.filter((e) => (e.review ? e.review.verdict !== 'good' : e.problem));
  const unreviewed = attention.filter((e) => !e.review).length;
  const flagCounts = Object.keys(FLAG_LABELS)
    .map((k) => ({
      label: FLAG_LABELS[k as Flag['kind']],
      value: all.filter((e) => e.flags.some((f) => f.kind === k)).length,
    }))
    .filter((r) => r.value > 0)
    .sort((a, b) => b.value - a.value);
  const queries = new Map<string, number>();
  for (const e of all) {
    const q = e.query.trim().toLowerCase().replace(/\s+/g, ' ');
    queries.set(q, (queries.get(q) ?? 0) + 1);
  }
  const topQueries = [...queries.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([label, value]) => ({ label, value }));
  const count = (k: Flag['kind']) => all.filter((e) => e.flags.some((f) => f.kind === k)).length;
  const p50 = median(all.map((e) => e.total_latency_ms ?? 0).filter(Boolean));
  const pct = (n: number) => (all.length ? `${Math.round((n / all.length) * 100)}%` : undefined);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Search insights</h1>
        <div className="flex items-center gap-2">
          <nav
            aria-label="Period"
            className="flex rounded-full border bg-surface p-0.5 shadow-card"
          >
            {PERIODS.map((p) => (
              <a
                key={p}
                href={`?days=${p}`}
                aria-current={p === days ? 'page' : undefined}
                className={cn(
                  'rounded-full px-3 py-1 font-medium text-xs',
                  p === days
                    ? 'bg-primary-soft text-primary-soft-foreground'
                    : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {p}d
              </a>
            ))}
          </nav>
          {unreviewed > 0 ? (
            <form action={reviewSearches}>
              <input type="hidden" name="days" value={days} />
              <ReviewButton>Review {Math.min(unreviewed, 20)} with AI</ReviewButton>
            </form>
          ) : null}
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat icon={Search} label="Searches" value={all.length} />
        <Stat
          icon={TriangleAlert}
          label="Need attention"
          value={attention.length}
          hint={pct(attention.length)}
        />
        <Stat
          icon={SearchX}
          label="No results"
          value={count('no_results')}
          hint={pct(count('no_results'))}
        />
        <Stat
          icon={ServerCrash}
          label="AI step failed"
          value={count('ai_failed')}
          hint={pct(count('ai_failed'))}
        />
        <Stat
          icon={Clock}
          label="Median time"
          value={p50 == null ? null : `${(p50 / 1000).toFixed(1)} s`}
        />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card title="Flags" icon={CircleAlert}>
          {flagCounts.length ? (
            <BarList rows={flagCounts} />
          ) : (
            <p className="py-2 text-muted-foreground text-sm">None</p>
          )}
        </Card>
        <Card title="Top searches" icon={ListOrdered}>
          <BarList rows={topQueries} />
        </Card>
      </section>

      <Card title={`Needs attention · ${attention.length}`} icon={TriangleAlert}>
        {attention.length ? (
          <ul className="divide-y">
            {attention.map((e) => (
              <AttentionRow key={e.id} e={e} days={days} />
            ))}
          </ul>
        ) : (
          <p className="py-2 text-muted-foreground text-sm">None</p>
        )}
      </Card>

      <Card title="All searches" icon={History}>
        <div className="-mx-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-muted-foreground text-xs">
              <tr className="border-b">
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-2 py-2 font-medium">Query</th>
                <th className="px-2 py-2 text-right font-medium">Results</th>
                <th className="px-2 py-2 font-medium">Parser</th>
                <th className="px-2 py-2 text-right font-medium">Time</th>
                <th className="px-4 py-2 font-medium">Flags</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {newest.slice(0, 200).map((e) => (
                <tr key={e.id} className="align-top">
                  <td className="whitespace-nowrap px-4 py-2 text-muted-foreground text-xs tabular-nums">
                    {ago(e.created_at)}
                  </td>
                  <td
                    className="max-w-[22rem] px-2 py-2"
                    title={e.top.map((r) => r.name).join(' · ')}
                  >
                    {e.query}
                  </td>
                  <td className="px-2 py-2 text-right tabular-nums">{e.result_count ?? '—'}</td>
                  <td className="px-2 py-2 text-muted-foreground text-xs">
                    {e.parse_path === 'ai' ? 'AI' : 'Rules'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2 text-right text-muted-foreground text-xs tabular-nums">
                    {e.total_latency_ms == null
                      ? '—'
                      : `${(e.total_latency_ms / 1000).toFixed(1)} s`}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex flex-wrap gap-1">
                      {e.flags.map((f) => (
                        <FlagChip key={f.kind} f={f} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function FlagChip({ f }: { f: Flag }) {
  const problem = PROBLEM_FLAGS.has(f.kind);
  return (
    <span
      title={f.detail}
      className={cn(
        'inline-flex h-5 items-center rounded-full px-2 font-medium text-[11px]',
        problem ? 'bg-danger/10 text-danger' : 'bg-surface-2 text-muted-foreground',
      )}
    >
      {FLAG_LABELS[f.kind]}
    </span>
  );
}

const VERDICT: Record<SearchReview['verdict'], { label: string; cls: string }> = {
  good: { label: 'Good', cls: 'bg-success/10 text-success' },
  partial: { label: 'Partial', cls: 'bg-warning/15 text-foreground' },
  bad: { label: 'Bad', cls: 'bg-danger/10 text-danger' },
};

function AttentionRow({ e, days }: { e: FlaggedSearch; days: number }) {
  const r = e.review;
  return (
    <li className="space-y-2 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="font-medium">“{e.query}”</span>
        <span className="text-muted-foreground text-xs tabular-nums">
          {ago(e.created_at)} · {e.result_count ?? 0} results ·{' '}
          {e.parse_path === 'ai' ? 'AI' : 'Rules'}
          {e.lat != null ? ' · located' : ''}
        </span>
      </div>

      {e.flags.length ? (
        <ul className="space-y-1">
          {e.flags.map((f) => (
            <li key={f.kind} className="flex flex-wrap items-center gap-2 text-xs">
              <FlagChip f={f} />
              <span className="text-muted-foreground">{f.detail}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {e.top.length ? (
        <ol className="flex flex-wrap gap-x-3 gap-y-0.5 text-muted-foreground text-xs">
          {e.top.slice(0, 5).map((p, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: rank order is the identity here
            <li key={i}>
              <span className="tabular-nums">{i + 1}.</span>{' '}
              <span className="text-foreground">{p.name}</span>
              {p.category ? ` · ${p.category}` : ''}
              {p.locality ? ` · ${p.locality}` : ''}
            </li>
          ))}
        </ol>
      ) : null}

      {r ? (
        <div className="space-y-1 rounded-md bg-surface-2 px-3 py-2 text-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={cn('rounded-full px-2 py-0.5 font-medium', VERDICT[r.verdict].cls)}>
              {VERDICT[r.verdict].label}
            </span>
            {r.problem !== 'none' ? (
              <span className="font-medium">{REVIEW_PROBLEM_LABELS[r.problem]}</span>
            ) : null}
          </div>
          <p>{r.summary}</p>
          {r.fix ? <p className="text-muted-foreground text-xs">Fix: {r.fix}</p> : null}
        </div>
      ) : (
        <form action={reviewSearches}>
          <input type="hidden" name="id" value={e.id} />
          <input type="hidden" name="days" value={days} />
          <ReviewButton small>Review</ReviewButton>
        </form>
      )}
    </li>
  );
}
