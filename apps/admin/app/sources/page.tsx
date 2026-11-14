import { cn } from '@placia/ui/cn';
import {
  Blend,
  ChartColumn,
  Database,
  GitMerge,
  Layers,
  ListChecks,
  MapPinned,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import type { Metadata } from 'next';
import { BarList, Card, Stat, StatusDot } from '../_components/ui';
import { getDataQuality } from '../_lib/quality';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Data sources' };

const SOURCES = [
  { key: 'osm', name: 'OpenStreetMap', licence: 'ODbL 1.0', version: 'osm' },
  { key: 'overture', name: 'Overture Maps', licence: 'CDLA-P 2.0', version: 'overture' },
  { key: 'foursquare', name: 'Foursquare OS Places', licence: 'Apache 2.0', version: 'overture' },
] as const;

const RULES: Record<string, string> = {
  name: 'Name',
  containment: 'Name containment',
  'osm-duplicate': 'OSM duplicate',
  phone: 'Phone',
  'co-located': 'Co-located',
  website: 'Website',
  'name+category': 'Name + category',
};

const FIELDS = [
  ['district', 'District'],
  ['locality', 'Locality'],
  ['address', 'Address'],
  ['phone', 'Phone'],
  ['website', 'Website'],
  ['hours', 'Opening hours'],
] as const;

const pct = (n: number, of = 1) => `${Math.round((n / Math.max(1, of)) * 100)}%`;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} days ago`;
}

export default async function SourcesPage() {
  const q = await getDataQuality();
  if (!q) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-semibold text-2xl tracking-tight">Data sources</h1>
        <p className="mt-6 text-muted-foreground text-sm">Database not connected.</p>
      </div>
    );
  }
  const run = q.last_run;
  const totalSources = Object.values(q.sources ?? {}).reduce((a, b) => a + b, 0);
  const matches = Object.entries(run?.stats.matches ?? {})
    .map(([rule, value]) => ({ label: RULES[rule] ?? rule, value }))
    .sort((a, b) => b.value - a.value);
  const conf = Array.from({ length: 10 }, (_, bucket) => ({
    bucket,
    n: q.confidence?.find((c) => c.bucket === bucket)?.count ?? 0,
  }));
  const confMax = Math.max(1, ...conf.map((c) => c.n));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Data sources</h1>
        {run ? (
          <div className="flex items-center gap-3 rounded-full border bg-surface px-3 py-1.5 text-xs shadow-card">
            <StatusDot
              ok={run.status === 'succeeded'}
              on="Last ingest"
              off={run.status === 'running' ? 'Running' : 'Failed'}
            />
            <span className="text-muted-foreground tabular-nums">{ago(run.started_at)}</span>
          </div>
        ) : null}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MapPinned} label="Places" value={q.places} />
        <Stat
          icon={GitMerge}
          label="Multi-source"
          value={q.multi_source}
          hint={pct(q.multi_source, q.places)}
        />
        <Stat icon={Database} label="Source records" value={totalSources} />
        <Stat icon={Trash2} label="Dropped" value={run?.stats.droppedLowConfidence ?? null} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        {SOURCES.map((s) => (
          <div key={s.key} className="rounded-lg border bg-surface p-4 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <span className="font-medium text-sm">{s.name}</span>
              <span className="shrink-0 rounded-full bg-surface-2 px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
                {s.licence}
              </span>
            </div>
            <div className="mt-3 font-semibold text-xl tabular-nums">
              {(q.sources?.[s.key] ?? 0).toLocaleString()}
            </div>
            <div className="mt-1 text-muted-foreground text-xs tabular-nums">
              {run?.source_versions[s.version] ?? '—'}
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card title="Field coverage" icon={ListChecks}>
          <BarList
            rows={FIELDS.map(([k, label]) => ({ label, value: q.coverage[k], of: q.places }))}
            format={(n, of) => pct(n, of)}
          />
        </Card>

        <Card title="Confidence" icon={ShieldCheck}>
          <div
            className="flex h-36 items-end gap-1.5"
            role="img"
            aria-label="Places by confidence score, 0 to 1"
          >
            {conf.map(({ bucket: b, n }) => (
              <div
                key={b}
                className="group flex h-full flex-1 flex-col justify-end"
                title={`${(b / 10).toFixed(1)}–${((b + 1) / 10).toFixed(1)}: ${n.toLocaleString()}`}
              >
                <div
                  className={cn(
                    'w-full rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80',
                    n === 0 && 'bg-border',
                  )}
                  style={{ height: `${Math.max(2, (n / confMax) * 100)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-muted-foreground tabular-nums">
            <span>0</span>
            <span>0.5</span>
            <span>1</span>
          </div>
        </Card>

        <Card title="Merges by rule" icon={Blend}>
          {matches.length ? (
            <BarList rows={matches} />
          ) : (
            <p className="py-4 text-muted-foreground text-sm">No run yet</p>
          )}
          {run ? (
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 border-t pt-3 text-muted-foreground text-xs tabular-nums">
              <span>Records {run.stats.records?.toLocaleString() ?? '—'}</span>
              <span>Blocked: OSM guard {run.stats.rejectedByOsmGuard ?? 0}</span>
              <span>Blocked: spread {run.stats.rejectedBySpread ?? 0}</span>
            </div>
          ) : null}
        </Card>

        <Card title="Categories" icon={Layers}>
          <BarList rows={(q.groups ?? []).map((g) => ({ label: g.name, value: g.count }))} />
        </Card>

        <Card title="Regions" icon={ChartColumn} className="lg:col-span-2">
          <div className="grid gap-x-10 gap-y-2.5 md:grid-cols-2">
            {[0, 1].map((half) => {
              // Both columns share one scale so bars stay comparable across the split.
              const max = Math.max(1, ...(q.regions ?? []).map((r) => r.count));
              const rows = (q.regions ?? [])
                .slice(half * 8, half * 8 + 8)
                .map((r) => ({ label: r.name, value: r.count, of: max }));
              return <BarList key={half} rows={rows} format={(n) => n.toLocaleString()} />;
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
