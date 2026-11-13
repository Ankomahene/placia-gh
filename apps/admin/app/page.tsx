import { aiStatus } from '@placia/core/ai';
import { cn } from '@placia/ui/cn';
import { Bot, Database, Inbox, MapPin, Search } from 'lucide-react';
import type { ComponentType, ReactNode } from 'react';
import { getOverviewCounts } from './_lib/overview';

export const dynamic = 'force-dynamic';

export default async function OverviewPage() {
  const [counts, ai] = [await getOverviewCounts(), aiStatus()];

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-6 md:px-8 md:py-8">
      <h1 className="font-semibold text-2xl tracking-tight">Overview</h1>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MapPin} label="Places" value={counts.places} />
        <Stat icon={Inbox} label="Pending contributions" value={counts.pendingContributions} />
        <Stat icon={Database} label="Source records" value={counts.sourceRecords} />
        <Stat icon={Search} label="Searches (7d)" value={counts.searches7d} />
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <Card title="AI providers" icon={Bot}>
          <ul className="divide-y">
            {ai.providers.map((p) => (
              <li key={p.name} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="font-medium text-sm">
                    {p.label}
                    {ai.primary === p.name ? (
                      <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 font-medium text-[11px] text-primary-soft-foreground">
                        Primary
                      </span>
                    ) : null}
                  </div>
                  <div className="truncate text-muted-foreground text-xs">{p.model}</div>
                </div>
                <StatusDot ok={p.configured} />
              </li>
            ))}
            <li className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="font-medium text-sm">Embeddings</div>
                <div className="truncate text-muted-foreground text-xs">
                  {ai.embeddings.model} · {ai.embeddings.dimensions}d
                </div>
              </div>
              <StatusDot ok={ai.embeddings.configured} />
            </li>
          </ul>
        </Card>

        <Card title="Database" icon={Database}>
          <ul className="divide-y">
            {counts.health.map((h) => (
              <li key={h.label} className="flex items-center justify-between py-3">
                <span className="font-medium text-sm">{h.label}</span>
                <StatusDot ok={h.ok} />
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-lg border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2 font-semibold text-2xl tabular-nums tracking-tight">
        {value == null ? '—' : value.toLocaleString()}
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: ComponentType<{ className?: string }>;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-surface px-4 pt-4 pb-1 shadow-card">
      <h2 className="flex items-center gap-2 font-semibold text-sm">
        <Icon className="size-4 text-primary" />
        {title}
      </h2>
      {children}
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn('size-2 rounded-full', ok ? 'bg-success' : 'bg-border')} />
      {ok ? 'Connected' : 'Not set'}
    </span>
  );
}
