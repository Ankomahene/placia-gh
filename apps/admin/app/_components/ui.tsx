import { cn } from '@placia/ui/cn';
import type { ComponentType, ReactNode } from 'react';

type Icon = ComponentType<{ className?: string }>;

export function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: Icon;
  label: string;
  value: number | string | null;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border bg-surface p-4 shadow-card">
      <div className="flex items-center gap-2 text-muted-foreground text-xs">
        <Icon className="size-4" />
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-semibold text-2xl tabular-nums tracking-tight">
          {value == null ? '—' : typeof value === 'number' ? value.toLocaleString() : value}
        </span>
        {hint ? <span className="text-muted-foreground text-xs tabular-nums">{hint}</span> : null}
      </div>
    </div>
  );
}

export function Card({
  title,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  icon: Icon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn('rounded-lg border bg-surface px-4 pt-4 pb-3 shadow-card', className)}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 font-semibold text-sm">
          <Icon className="size-4 text-primary" />
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export function StatusDot({
  ok,
  on = 'Connected',
  off = 'Not set',
}: {
  ok: boolean;
  on?: string;
  off?: string;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={cn('size-2 rounded-full', ok ? 'bg-success' : 'bg-border')} />
      {ok ? on : off}
    </span>
  );
}

/** Horizontal bar rows: label · thin bar · value. One series, one hue, so no legend. */
export function BarList({
  rows,
  format = (n) => n.toLocaleString(),
}: {
  rows: { label: string; value: number; of?: number }[];
  format?: (n: number, of?: number) => string;
}) {
  const max = Math.max(1, ...rows.map((r) => r.of ?? r.value));
  return (
    <ul className="space-y-2.5">
      {rows.map((r) => (
        <li
          key={r.label}
          className="grid grid-cols-[minmax(0,9rem)_minmax(0,1fr)_4.5rem] items-center gap-3 text-sm"
          title={`${r.label}: ${format(r.value, r.of)}`}
        >
          <span className="truncate text-muted-foreground">{r.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-surface-2">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </span>
          <span className="text-right font-medium tabular-nums">{format(r.value, r.of)}</span>
        </li>
      ))}
    </ul>
  );
}
