import { cn } from '@placia/ui/cn';
import { ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PendingButton } from '../../_components/pending-button';
import { requireAdmin, serviceDb } from '../../_lib/auth';
import { markNotDuplicates, mergePlaces, rescanDuplicates } from '../places/edit-actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Duplicates' };

const PAGE = 20;

interface Named {
  name: string;
}

interface P {
  id: string;
  name: string;
  status: string;
  address: string | null;
  phone: string | null;
  website: string | null;
  photo_count: number;
  confidence: number;
  categories: Named | null;
  localities: Named | null;
  districts: Named | null;
  place_sources: { count: number }[];
}

/** More sources and photos, then more confidence: the better record to keep. */
const score = (p: P) =>
  (p.place_sources[0]?.count ?? 0) * 2 +
  p.photo_count +
  (p.address ? 1 : 0) +
  (p.phone ? 1 : 0) +
  (p.website ? 1 : 0) +
  p.confidence;

function Side({ p, other, suggested }: { p: P; other: P; suggested: boolean }) {
  const area = [p.localities?.name, p.districts?.name].filter(Boolean).join(', ');
  const rows: [string, string | number | null][] = [
    ['Category', p.categories?.name ?? null],
    ['Area', area || null],
    ['Address', p.address],
    ['Phone', p.phone],
    ['Website', p.website],
    ['Sources', p.place_sources[0]?.count ?? 0],
    ['Photos', p.photo_count],
  ];
  return (
    <div
      className={cn(
        'flex min-w-0 flex-col rounded-md border p-3',
        suggested ? 'border-primary/50 bg-primary-soft/30' : 'bg-surface',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <Link href={`/places/${p.id}`} className="min-w-0 font-medium text-sm hover:underline">
          {p.name}
        </Link>
        <span className="shrink-0 text-[11px] text-muted-foreground capitalize">{p.status}</span>
      </div>
      <dl className="mt-2 grid grid-cols-[4.5rem_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
        {rows.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="truncate tabular-nums">{v === null || v === '' ? '—' : v}</dd>
          </div>
        ))}
      </dl>
      <form action={mergePlaces} className="mt-3">
        <input type="hidden" name="keep" value={p.id} />
        <input type="hidden" name="drop" value={other.id} />
        <PendingButton
          variant={suggested ? 'primary' : 'outline'}
          pendingText="Merging…"
          className="w-full"
        >
          Keep this
        </PendingButton>
      </form>
    </div>
  );
}

export default async function DuplicatesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  await requireAdmin();
  const db = serviceDb();
  const page = Math.max(1, Number((await searchParams).page) || 1);
  if (!db) {
    return <p className="p-8 text-muted-foreground text-sm">Database not connected.</p>;
  }

  const { data: pairs, count } = await db
    .from('place_duplicate_pairs')
    .select('a, b, distance_m, similarity', { count: 'exact' })
    .order('similarity', { ascending: false })
    .order('distance_m')
    .order('a')
    .range((page - 1) * PAGE, page * PAGE - 1);
  const ids = [...new Set((pairs ?? []).flatMap((r) => [r.a, r.b]))];
  const { data: places } = ids.length
    ? await db
        .from('places')
        .select(
          'id, name, status, address, phone, website, photo_count, confidence, categories(name), localities(name), districts(name), place_sources(count)',
        )
        .in('id', ids)
    : { data: [] };
  const byId = new Map(((places ?? []) as unknown as P[]).map((p) => [p.id, p]));
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link
            href="/places"
            className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
          >
            <ChevronLeft className="size-4" /> Places
          </Link>
          <h1 className="mt-2 font-semibold text-2xl tracking-tight">
            Duplicates{' '}
            <span className="text-base text-muted-foreground tabular-nums">
              {total.toLocaleString()}
            </span>
          </h1>
        </div>
        <form action={rescanDuplicates}>
          <PendingButton pendingText="Scanning…" className="h-9 px-3 text-sm">
            <RefreshCw className="size-4" /> Rescan
          </PendingButton>
        </form>
      </div>

      {!pairs?.length ? (
        <p className="py-12 text-center text-muted-foreground text-sm">No duplicates</p>
      ) : (
        <ul className="space-y-4">
          {pairs.map((r) => {
            const a = byId.get(r.a);
            const b = byId.get(r.b);
            if (!a || !b) return null;
            const keepA = score(a) >= score(b);
            return (
              <li key={`${r.a}:${r.b}`} className="rounded-lg border bg-surface p-3 shadow-card">
                <div className="mb-2 flex items-center justify-between gap-2 text-muted-foreground text-xs tabular-nums">
                  <span>
                    {Math.round(r.distance_m)} m apart · {Math.round(r.similarity * 100)}% alike
                  </span>
                  <form action={markNotDuplicates}>
                    <input type="hidden" name="a" value={r.a} />
                    <input type="hidden" name="b" value={r.b} />
                    <PendingButton variant="ghost" className="h-7 px-2">
                      Different places
                    </PendingButton>
                  </form>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Side p={a} other={b} suggested={keepA} />
                  <Side p={b} other={a} suggested={!keepA} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 ? (
        <div className="flex items-center justify-between text-muted-foreground text-xs tabular-nums">
          <span>
            Page {page} of {pages}
          </span>
          <div className="flex gap-1">
            <a
              href={`?page=${page - 1}`}
              aria-disabled={page <= 1}
              aria-label="Previous page"
              className={cn(
                'grid size-8 place-items-center rounded-md border bg-surface',
                page <= 1 && 'pointer-events-none opacity-40',
              )}
            >
              <ChevronLeft className="size-4" />
            </a>
            <a
              href={`?page=${page + 1}`}
              aria-disabled={page >= pages}
              aria-label="Next page"
              className={cn(
                'grid size-8 place-items-center rounded-md border bg-surface',
                page >= pages && 'pointer-events-none opacity-40',
              )}
            >
              <ChevronRight className="size-4" />
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}
