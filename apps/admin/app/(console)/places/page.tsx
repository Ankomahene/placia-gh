import { photoKey, photoUrl } from '@placia/core/photos';
import { cn } from '@placia/ui/cn';
import { PhotoThumbs, type ViewerPhoto } from '@placia/ui/photo-viewer';
import {
  Ban,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  EyeOff,
  MapPinned,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Store,
} from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PendingButton } from '../../_components/pending-button';
import { Stat } from '../../_components/ui';
import { requireAdmin, serviceDb } from '../../_lib/auth';
import { WEB_URL } from '../../_lib/web';
import { setPlaceStatus } from './actions';
import { AddPhotos } from './add-photos';
import { DeletePlace } from './delete-place';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Places' };

const PAGE = 50;
const STATUSES = ['all', 'active', 'pending', 'hidden', 'closed'] as const;
type Status = (typeof STATUSES)[number];

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  hidden: 'bg-surface-2 text-muted-foreground',
  closed: 'bg-danger/10 text-danger',
};

interface Row {
  id: string;
  slug: string;
  name: string;
  status: string;
  confidence: number;
  photo_count: number;
  phone: string | null;
  website: string | null;
  categories: { name: string } | null;
  localities: { name: string } | null;
  districts: { name: string } | null;
  place_sources: { count: number }[];
}

function href(p: { q?: string; status?: Status; page?: number }) {
  const s = new URLSearchParams();
  if (p.q) s.set('q', p.q);
  if (p.status && p.status !== 'all') s.set('status', p.status);
  if (p.page && p.page > 1) s.set('page', String(p.page));
  const qs = s.toString();
  return qs ? `?${qs}` : '?';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 font-medium text-[11px] capitalize',
        STATUS_STYLE[status] ?? 'bg-surface-2',
      )}
    >
      {status}
    </span>
  );
}

const ICON = 'size-7 px-0';

/** Edit, photos, hide/close or restore, delete: icons, so the row never overflows. */
function RowActions({ r, userId, area }: { r: Row; userId: string; area: string }) {
  return (
    <div className="flex items-center justify-end">
      <Link
        href={`/places/${r.id}`}
        title="Edit"
        aria-label={`Edit ${r.name}`}
        className="grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
      >
        <Pencil className="size-3.5" />
      </Link>
      <AddPhotos placeId={r.id} userId={userId} label="" className={cn(ICON, 'justify-center')} />
      <form action={setPlaceStatus} className="flex">
        <input type="hidden" name="id" value={r.id} />
        {r.status === 'active' ? (
          <>
            <PendingButton
              name="status"
              value="hidden"
              variant="ghost"
              title="Hide"
              className={ICON}
            >
              <EyeOff className="size-3.5" />
            </PendingButton>
            <PendingButton
              name="status"
              value="closed"
              variant="ghost"
              title="Mark closed"
              className={ICON}
            >
              <Ban className="size-3.5" />
            </PendingButton>
          </>
        ) : (
          <PendingButton
            name="status"
            value="active"
            variant="ghost"
            title="Restore"
            className={ICON}
          >
            <RotateCcw className="size-3.5" />
          </PendingButton>
        )}
      </form>
      <DeletePlace placeId={r.id} name={r.name} area={area} icon />
    </div>
  );
}

export default async function PlacesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const q = (sp.q ?? '').trim().slice(0, 100);
  const status: Status = STATUSES.includes(sp.status as Status) ? (sp.status as Status) : 'all';
  const page = Math.max(1, Number(sp.page) || 1);
  const [db, admin] = [serviceDb(), await requireAdmin()];
  if (!db) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-semibold text-2xl tracking-tight">Places</h1>
        <p className="mt-6 text-muted-foreground text-sm">Database not connected.</p>
      </div>
    );
  }

  let query = db
    .from('places')
    .select(
      'id, slug, name, status, confidence, photo_count, phone, website, categories(name), localities(name), districts(name), place_sources(count)',
      { count: 'exact' },
    );
  if (q) query = query.ilike('name', `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  if (status !== 'all') query = query.eq('status', status);
  query = q ? query.order('name') : query.order('updated_at', { ascending: false });

  const counts = (s: string) =>
    db.from('places').select('id', { count: 'exact', head: true }).eq('status', s);
  const [{ data, count, error }, active, hidden, closed, pending, dupes] = await Promise.all([
    query.range((page - 1) * PAGE, page * PAGE - 1),
    counts('active'),
    counts('hidden'),
    counts('closed'),
    counts('pending'),
    db.from('place_duplicate_pairs').select('a', { count: 'exact', head: true }),
  ]);
  const rows = (data ?? []) as unknown as Row[];
  const total = count ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE));
  const area = (r: Row) =>
    [r.localities?.name, r.districts?.name].filter(Boolean).join(', ') || '—';
  const sources = (r: Row) => r.place_sources[0]?.count ?? 0;

  // Approved photos for the rows on this page, oldest (the cover) first.
  const withPhotos = rows.filter((r) => r.photo_count > 0).map((r) => r.id);
  const { data: photoRows } = withPhotos.length
    ? await db
        .from('place_photos')
        .select('place_id, storage_path, cloudinary_public_id, width, height')
        .in('place_id', withPhotos)
        .eq('status', 'approved')
        .order('created_at')
    : { data: [] };
  const photos = new Map<string, ViewerPhoto[]>();
  for (const f of photoRows ?? []) {
    const key = photoKey(f);
    if (!key) continue;
    const list = photos.get(f.place_id) ?? [];
    list.push({
      src: photoUrl(key, { width: 1600 }),
      thumb: photoUrl(key, { width: 200 }),
      width: f.width,
      height: f.height,
    });
    photos.set(f.place_id, list);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Places</h1>
        <div className="flex gap-2">
          <Link
            href="/duplicates"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border bg-surface px-3 font-medium text-sm hover:bg-surface-2"
          >
            <Copy className="size-4" /> Duplicates
            {dupes.count ? (
              <span className="rounded-full bg-warning/15 px-1.5 text-warning text-xs tabular-nums">
                {dupes.count.toLocaleString()}
              </span>
            ) : null}
          </Link>
          <Link
            href="/places/new"
            className="inline-flex h-9 items-center gap-1.5 rounded-md bg-primary px-3 font-medium text-primary-foreground text-sm hover:opacity-90"
          >
            <Plus className="size-4" /> Add place
          </Link>
        </div>
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={MapPinned} label="Active" value={active.count ?? null} />
        <Stat icon={Store} label="Pending" value={pending.count ?? null} />
        <Stat icon={EyeOff} label="Hidden" value={hidden.count ?? null} />
        <Stat icon={Store} label="Closed" value={closed.count ?? null} />
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form className="relative w-full sm:max-w-sm">
          <Search className="-translate-y-1/2 absolute top-1/2 left-3 size-4 text-muted-foreground" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search by name"
            aria-label="Search places by name"
            className="h-10 w-full rounded-md border bg-surface pr-3 pl-9 text-sm outline-none focus:border-primary"
          />
          {status !== 'all' ? <input type="hidden" name="status" value={status} /> : null}
        </form>
        <nav
          aria-label="Status"
          className="flex gap-1 overflow-x-auto rounded-full border bg-surface p-1 shadow-card [scrollbar-width:none]"
        >
          {STATUSES.map((s) => (
            <a
              key={s}
              href={href({ q, status: s })}
              aria-current={s === status ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-full px-3 py-1 font-medium text-xs capitalize',
                s === status
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {s}
            </a>
          ))}
        </nav>
      </div>

      {error ? (
        <p className="text-danger text-sm">Couldn't load places.</p>
      ) : !rows.length ? (
        <p className="py-12 text-center text-muted-foreground text-sm">No places</p>
      ) : (
        <>
          {/* Phones: one card per place. */}
          <ul className="space-y-2 md:hidden">
            {rows.map((r) => (
              <li key={r.id} className="rounded-lg border bg-surface p-3 shadow-card">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/places/${r.id}`}
                    className="min-w-0 font-medium text-sm hover:underline"
                  >
                    {r.name}
                  </Link>
                  <StatusBadge status={r.status} />
                </div>
                <p className="mt-1 truncate text-muted-foreground text-xs">
                  {r.categories?.name ?? 'Uncategorised'} · {area(r)}
                </p>
                <PhotoThumbs
                  photos={photos.get(r.id) ?? []}
                  title={r.name}
                  max={5}
                  className="mt-2"
                  thumbClassName="size-12 rounded-md"
                />
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="text-muted-foreground text-xs tabular-nums">
                    {sources(r)} src · {r.photo_count} photos · {r.confidence.toFixed(2)}
                  </span>
                  <RowActions r={r} userId={admin.id} area={area(r)} />
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto rounded-lg border bg-surface shadow-card md:block">
            <table className="w-full min-w-[56rem] table-fixed text-sm">
              {/* Fixed widths: long names truncate instead of pushing the actions off the edge. */}
              <colgroup>
                <col />
                <col className="w-36" />
                <col className="w-44" />
                <col className="w-20" />
                <col className="w-32" />
                <col className="w-24" />
                <col className="w-20" />
                <col className="w-40" />
              </colgroup>
              <thead className="border-b bg-surface-2/50 text-left text-muted-foreground text-xs">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Name</th>
                  <th className="px-4 py-2.5 font-medium">Category</th>
                  <th className="px-4 py-2.5 font-medium">Area</th>
                  <th className="px-4 py-2.5 text-right font-medium">Sources</th>
                  <th className="px-4 py-2.5 text-right font-medium">Photos</th>
                  <th className="px-4 py-2.5 text-right font-medium">Confidence</th>
                  <th className="px-4 py-2.5 font-medium">Status</th>
                  <th className="px-2 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-surface-2/40">
                    <td className="px-4 py-2">
                      <div className="group flex min-w-0 items-center gap-1.5">
                        <Link
                          href={`/places/${r.id}`}
                          className="truncate font-medium hover:underline"
                        >
                          {r.name}
                        </Link>
                        <a
                          href={`${WEB_URL}/place/${r.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="View on site"
                          className="shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                      </div>
                    </td>
                    <td className="truncate px-4 py-2 text-muted-foreground">
                      {r.categories?.name ?? '—'}
                    </td>
                    <td className="truncate px-4 py-2 text-muted-foreground" title={area(r)}>
                      {area(r)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{sources(r)}</td>
                    <td className="px-4 py-2">
                      {r.photo_count ? (
                        <PhotoThumbs
                          photos={photos.get(r.id) ?? []}
                          title={r.name}
                          max={3}
                          className="justify-end"
                          thumbClassName="size-9 rounded-md"
                        />
                      ) : (
                        <span className="block text-right text-muted-foreground tabular-nums">
                          0
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums">{r.confidence.toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-2 py-2">
                      <RowActions r={r} userId={admin.id} area={area(r)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-muted-foreground text-xs tabular-nums">
            <span>
              {((page - 1) * PAGE + 1).toLocaleString()}–
              {Math.min(page * PAGE, total).toLocaleString()} of {total.toLocaleString()}
            </span>
            <div className="flex gap-1">
              <a
                href={href({ q, status, page: page - 1 })}
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
                href={href({ q, status, page: page + 1 })}
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
        </>
      )}
    </div>
  );
}
