'use client';

import { cn } from '@placia/ui/cn';
import {
  ChevronLeft,
  ChevronRight,
  FileDown,
  GitMerge,
  Layers,
  ListChecks,
  ListOrdered,
  type LucideIcon,
  MapPin,
  Scale,
  Search,
  WandSparkles,
} from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { GLOSSARY, type TermGroup } from './content';

/* ─────────────────────────────────────────── Walkthrough: one real query, stage by stage */

interface Stage {
  icon: LucideIcon;
  title: string;
  tone: string;
  body: ReactNode;
  out: [string, string][];
}

const Chip = ({ children, tone }: { children: ReactNode; tone: string }) => (
  <span
    className="rounded px-1 py-0.5 font-medium"
    style={{ background: `color-mix(in oklch, ${tone} 16%, transparent)`, color: tone }}
  >
    {children}
  </span>
);

const R = 'var(--g-rules)';
const D = 'var(--g-data)';
const A = 'var(--color-primary)';

const STAGES: Stage[] = [
  {
    icon: Search,
    title: 'Someone searches',
    tone: A,
    body: (
      <>
        A person in Accra types <b>cheap hotel around kaneshi</b>. Note the spelling: the area is
        really called Kaneshie.
      </>
    ),
    out: [['query', 'cheap hotel around kaneshi']],
  },
  {
    icon: WandSparkles,
    title: 'Clean up',
    tone: A,
    body: 'Lower-cased, spaces tidied. Nothing else to fix here.',
    out: [['text', 'cheap hotel around kaneshi']],
  },
  {
    icon: ListChecks,
    title: 'Rule parse',
    tone: R,
    body: (
      <>
        Each word is checked against our lists: <Chip tone={R}>cheap</Chip> is a price word,{' '}
        <Chip tone={R}>hotel</Chip> is a kind of place, <Chip tone={R}>around</Chip> means “near an
        area”, and <Chip tone={R}>kaneshi</Chip> is close enough to the town <b>Kaneshie</b>{' '}
        (spelling fix, only after a kind of place, never inside a name).
      </>
    ),
    out: [
      ['kind', 'hotel'],
      ['area', 'Kaneshie (around)'],
      ['cheap', 'yes'],
      ['time', '~0.1 ms'],
    ],
  },
  {
    icon: Scale,
    title: 'Sure? Yes',
    tone: R,
    body: 'Not a request, one clear kind, nothing contradictory, no unknown words. The AI is not called: faster and free. meta.parse says rules_confident.',
    out: [
      ['parser', 'rules'],
      ['AI', 'not needed'],
    ],
  },
  {
    icon: MapPin,
    title: 'Find the place',
    tone: R,
    body: 'Kaneshie is a suburb, so the search circle is 2.5 km, made 1.5× wider because the person said “around”.',
    out: [
      ['centre', 'Kaneshie'],
      ['circle', '≈ 3.75 km'],
    ],
  },
  {
    icon: Layers,
    title: 'Seven arms search',
    tone: D,
    body: (
      <>
        Inside that circle, the <Chip tone={D}>category</Chip> arm lists hotels nearest first, the{' '}
        <Chip tone={D}>full text</Chip> and <Chip tone={D}>title</Chip> arms look for “hotel” in
        names, the <Chip tone={D}>meaning</Chip> arm finds lodges and guest houses that mean the
        same thing.
      </>
    ),
    out: [
      ['arms', 'category, text, title, meaning…'],
      ['one call', 'search_places()'],
    ],
  },
  {
    icon: GitMerge,
    title: 'Fuse & rank',
    tone: D,
    body: 'A hotel found by several arms and close to the centre gets the most points. Its confidence (how many sources agree it exists) scales the score.',
    out: [
      ['method', 'RRF + nearness × confidence'],
      ['widen?', 'only if under 3 results'],
    ],
  },
  {
    icon: ListOrdered,
    title: 'Results',
    tone: A,
    body: (
      <>
        Hotels in and around Kaneshie, each with why it was found. Honest note: “cheap” is
        understood and recorded, but we hold no prices yet, so it does not change the order today.
      </>
    ),
    out: [
      ['shown', 'up to 20 hotels'],
      ['logged', 'search_events'],
    ],
  },
];

export function Walkthrough() {
  const [i, setI] = useState(0);
  const s = STAGES[i] as Stage;
  const Icon = s.icon;
  const last = STAGES.length - 1;
  return (
    <div className="overflow-hidden rounded-lg border bg-surface shadow-card">
      <div className="flex items-center gap-1 overflow-x-auto border-b px-3 py-2.5 [scrollbar-width:none] print:hidden">
        {STAGES.map((st, n) => {
          const I = st.icon;
          return (
            <button
              key={st.title}
              type="button"
              onClick={() => setI(n)}
              aria-label={st.title}
              aria-current={n === i ? 'step' : undefined}
              className={cn(
                'grid size-8 shrink-0 place-items-center rounded-full border transition-colors',
                n === i
                  ? 'border-transparent text-white'
                  : n < i
                    ? 'border-transparent bg-surface-2 text-foreground'
                    : 'text-muted-foreground',
              )}
              style={n === i ? { background: st.tone } : undefined}
            >
              <I className="size-4" />
            </button>
          );
        })}
      </div>

      <div key={i} className="grid gap-4 p-4 g-in sm:grid-cols-[1fr_16rem] print:hidden">
        <div className="flex gap-3">
          <span
            className="grid size-10 shrink-0 place-items-center rounded-full"
            style={{ background: `color-mix(in oklch, ${s.tone} 14%, transparent)`, color: s.tone }}
          >
            <Icon className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-muted-foreground text-xs tabular-nums">
              Step {i + 1} of {STAGES.length}
            </p>
            <p className="font-semibold">{s.title}</p>
            <p className="mt-1 text-muted-foreground text-sm leading-relaxed">{s.body}</p>
          </div>
        </div>
        <dl className="h-fit rounded-md border bg-surface-2 p-3 font-mono text-xs">
          {s.out.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 py-0.5">
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="text-right">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* Printed: every stage, one under the other. */}
      <ol className="hidden space-y-2 p-4 text-sm print:block">
        {STAGES.map((st, n) => (
          <li key={st.title}>
            <b>
              {n + 1}. {st.title}
            </b>{' '}
            — {st.body} ({st.out.map(([k, v]) => `${k}: ${v}`).join(' · ')})
          </li>
        ))}
      </ol>

      <div className="flex items-center justify-between border-t px-3 py-2.5 print:hidden">
        <button
          type="button"
          onClick={() => setI((n) => Math.max(0, n - 1))}
          disabled={i === 0}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2.5 font-medium text-sm hover:bg-surface-2 disabled:opacity-40"
        >
          <ChevronLeft className="size-4" /> Back
        </button>
        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${((i + 1) / STAGES.length) * 100}%` }}
          />
        </div>
        <button
          type="button"
          onClick={() => setI((n) => (n === last ? 0 : n + 1))}
          className="inline-flex h-8 items-center gap-1 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm"
        >
          {i === last ? 'Again' : 'Next'} <ChevronRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────── RRF: switch arms on and off, watch the order */

const DEMO_ARMS = ['Title', 'Fuzzy', 'Category', 'Meaning', 'Near'] as const;
type Arm = (typeof DEMO_ARMS)[number];

const DEMO: { name: string; ranks: Partial<Record<Arm, number>> }[] = [
  { name: 'Kaneshie Hotel', ranks: { Title: 1, Fuzzy: 1, Category: 4 } },
  { name: 'Royal Lodge', ranks: { Category: 1, Meaning: 1, Near: 2 } },
  { name: 'Green View Guest House', ranks: { Category: 2, Meaning: 2, Near: 1 } },
  { name: 'Hotel Kaneshie Annex', ranks: { Title: 2, Fuzzy: 2 } },
];

const K = 60;

export function RrfDemo() {
  const [on, setOn] = useState<Set<Arm>>(new Set(DEMO_ARMS));
  const rows = useMemo(
    () =>
      DEMO.map((p) => {
        const parts = DEMO_ARMS.filter((a) => on.has(a) && p.ranks[a]).map((a) => ({
          arm: a,
          rank: p.ranks[a] as number,
          pts: 1000 / (K + (p.ranks[a] as number)),
        }));
        return { ...p, parts, total: parts.reduce((s, x) => s + x.pts, 0) };
      }).sort((a, b) => b.total - a.total),
    [on],
  );
  const max = Math.max(...rows.map((r) => r.total), 1);
  const toggle = (a: Arm) =>
    setOn((s) => {
      const n = new Set(s);
      if (n.has(a)) n.delete(a);
      else n.add(a);
      return n;
    });

  return (
    <div className="overflow-hidden rounded-lg border bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-1.5 border-b px-4 py-3">
        <span className="mr-1 text-muted-foreground text-xs">Arms</span>
        {DEMO_ARMS.map((a) => (
          <button
            key={a}
            type="button"
            onClick={() => toggle(a)}
            aria-pressed={on.has(a)}
            className={cn(
              'h-7 rounded-full border px-2.5 font-medium text-xs transition-colors',
              on.has(a)
                ? 'border-transparent bg-primary text-primary-foreground'
                : 'text-muted-foreground',
            )}
          >
            {a}
          </button>
        ))}
      </div>
      <ol className="space-y-3 p-4">
        {rows.map((r, n) => (
          <li key={r.name} className="space-y-1 transition-all">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="mr-2 text-muted-foreground tabular-nums">{n + 1}.</span>
                {r.name}
              </span>
              <span className="shrink-0 font-mono text-xs tabular-nums">
                {r.total.toFixed(1)} pts
              </span>
            </div>
            <div className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-surface-2">
              {r.parts.map((p) => (
                <div
                  key={p.arm}
                  title={`${p.arm}: #${p.rank} → ${p.pts.toFixed(1)} pts`}
                  className="h-full transition-all duration-500"
                  style={{
                    width: `${(p.pts / max) * 100}%`,
                    background:
                      p.arm === 'Meaning'
                        ? 'var(--g-ai)'
                        : p.arm === 'Near'
                          ? 'var(--g-rules)'
                          : 'var(--g-data)',
                  }}
                />
              ))}
            </div>
            <p className="text-muted-foreground text-xs">
              {r.parts.length
                ? r.parts.map((p) => `${p.arm} #${p.rank}`).join(' · ')
                : 'no arm found it'}
            </p>
          </li>
        ))}
      </ol>
      <p className="border-t px-4 py-2.5 text-muted-foreground text-xs">
        Each arm gives 1000 ÷ (60 + position). #1 = 16.4 pts, #2 = 16.1, #4 = 15.6.
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────── Glossary */

const GROUPS: (TermGroup | 'All')[] = ['All', 'Search', 'AI', 'Data', 'Quality', 'Admin', 'Tech'];

export function Glossary() {
  const [q, setQ] = useState('');
  const [g, setG] = useState<TermGroup | 'All'>('All');
  const needle = q.trim().toLowerCase();
  const list = GLOSSARY.filter(
    (t) =>
      (g === 'All' || t.group === g) &&
      (!needle || `${t.term} ${t.means} ${t.here ?? ''}`.toLowerCase().includes(needle)),
  );
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <label className="relative min-w-0 flex-1 basis-56">
          <Search className="-translate-y-1/2 absolute top-1/2 left-2.5 size-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Find a term"
            aria-label="Find a term"
            className="h-9 w-full rounded-md border bg-surface pr-3 pl-8 text-sm outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {GROUPS.map((x) => (
            <button
              key={x}
              type="button"
              onClick={() => setG(x)}
              aria-pressed={g === x}
              className={cn(
                'h-8 rounded-full border px-3 font-medium text-xs',
                g === x
                  ? 'border-transparent bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-surface-2',
              )}
            >
              {x}
            </button>
          ))}
        </div>
      </div>
      <dl className="grid gap-2 sm:grid-cols-2 print:grid-cols-2">
        {list.map((t) => (
          <div key={t.term} className="break-inside-avoid rounded-lg border bg-surface p-3">
            <dt className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm">{t.term}</span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-muted-foreground">
                {t.group}
              </span>
            </dt>
            <dd className="mt-1 text-muted-foreground text-sm leading-relaxed">{t.means}</dd>
            {t.here ? (
              <dd className="mt-1.5 font-mono text-[11px] text-muted-foreground">{t.here}</dd>
            ) : null}
          </div>
        ))}
      </dl>
      {list.length === 0 ? <p className="text-muted-foreground text-sm">No match</p> : null}
    </div>
  );
}

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-surface px-3 font-medium text-sm hover:bg-surface-2 print:hidden"
    >
      <FileDown className="size-4" /> Save as PDF
    </button>
  );
}
