import { photoKey, photoUrl } from '@placia/core/photos';
import { cn } from '@placia/ui/cn';
import { ChevronLeft, Copy, Database, ExternalLink, Images } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { z } from 'zod';
import { PendingButton } from '../../../_components/pending-button';
import { Card } from '../../../_components/ui';
import { requireAdmin, serviceDb } from '../../../_lib/auth';
import { categoryOptions, hoursText, parsePoint } from '../../../_lib/places';
import { WEB_URL } from '../../../_lib/web';
import { AddPhotos } from '../add-photos';
import { markNotDuplicates, mergePlaces } from '../edit-actions';
import { PhotoManager } from '../photo-manager';
import { PlaceEditor, type PlaceValues } from '../place-editor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Edit place' };

interface Named {
  name: string;
}

interface Lookalike {
  id: string;
  slug: string;
  name: string;
  status: string;
  address: string | null;
  phone: string | null;
  photo_count: number;
  confidence: number;
  location: string;
  categories: Named | null;
  localities: Named | null;
  place_sources: { count: number }[];
}

const STATUS_STYLE: Record<string, string> = {
  active: 'bg-success/15 text-success',
  pending: 'bg-warning/15 text-warning',
  hidden: 'bg-surface-2 text-muted-foreground',
  closed: 'bg-danger/10 text-danger',
};

export default async function EditPlacePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ merged?: string }>;
}) {
  const [admin, db] = [await requireAdmin(), serviceDb()];
  const { id } = await params;
  const merged = (await searchParams).merged === '1';
  if (!db || !z.uuid().safeParse(id).success) notFound();

  const { data: p } = await db
    .from('places')
    .select(
      'id, slug, name, alt_names, category_id, location, address, phone, website, email, opening_hours, description, status, confidence, merged_into, localities(name), districts(name), regions(name)',
    )
    .eq('id', id)
    .maybeSingle();
  if (!p) notFound();
  const point = parsePoint(p.location);
  if (!point) notFound();

  const [categories, photosRes, sourcesRes, lookRes, keeperRes] = await Promise.all([
    categoryOptions(db),
    db
      .from('place_photos')
      .select('id, storage_path, cloudinary_public_id, width, height')
      .eq('place_id', id)
      .eq('status', 'approved')
      .order('created_at'),
    db
      .from('place_sources')
      .select('source, source_id, name, fetched_at')
      .eq('place_id', id)
      .order('fetched_at'),
    db.rpc('place_lookalikes', { p_place: id }),
    p.merged_into
      ? db.from('places').select('id, name').eq('id', p.merged_into).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const look = lookRes.data ?? [];
  const { data: lookRows } = look.length
    ? await db
        .from('places')
        .select(
          'id, slug, name, status, address, phone, photo_count, confidence, location, categories(name), localities(name), place_sources(count)',
        )
        .in(
          'id',
          look.map((l) => l.id),
        )
    : { data: [] };
  const byId = new Map(((lookRows ?? []) as unknown as Lookalike[]).map((r) => [r.id, r]));
  const lookalikes = look
    .map((l) => ({ ...l, place: byId.get(l.id) }))
    .filter((l): l is typeof l & { place: Lookalike } => !!l.place);

  const photos = (photosRes.data ?? [])
    .filter((f) => photoKey(f))
    .map((f) => ({
      id: f.id,
      src: photoUrl(photoKey(f), { width: 1600 }),
      thumb: photoUrl(photoKey(f), { width: 400 }),
      width: f.width,
      height: f.height,
    }));

  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
  const area = [
    one(p.localities as unknown as Named)?.name,
    one(p.districts as unknown as Named)?.name,
    one(p.regions as unknown as Named)?.name,
  ]
    .filter(Boolean)
    .join(', ');

  const initial: PlaceValues = {
    name: p.name,
    alt_names: (p.alt_names ?? []).join(', '),
    category_id: p.category_id ? String(p.category_id) : '',
    lat: point.lat,
    lon: point.lon,
    address: p.address ?? '',
    phone: p.phone ?? '',
    website: p.website ?? '',
    email: p.email ?? '',
    hours: hoursText(p.opening_hours),
    description: p.description ?? '',
    status: p.status as PlaceValues['status'],
  };

  const others = lookalikes
    .map((l) => {
      const pt = parsePoint(l.place.location);
      return pt ? { ...pt, name: l.place.name } : null;
    })
    .filter((x) => x !== null);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div>
        <Link
          href="/places"
          className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Places
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">{p.name}</h1>
          <span
            className={cn(
              'inline-flex rounded-full px-2 py-0.5 font-medium text-[11px] capitalize',
              STATUS_STYLE[p.status] ?? 'bg-surface-2',
            )}
          >
            {p.status}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground text-sm">
          <span>{area || '—'}</span>
          <a
            href={`${WEB_URL}/place/${p.slug}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 hover:text-foreground"
          >
            View on site <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>

      {keeperRes.data ? (
        <p className="rounded-lg border border-warning/40 bg-warning/10 px-4 py-3 text-sm">
          Merged into{' '}
          <Link href={`/places/${keeperRes.data.id}`} className="font-medium underline">
            {keeperRes.data.name}
          </Link>
        </p>
      ) : null}
      {merged ? (
        <p className="rounded-lg border border-success/40 bg-success/10 px-4 py-3 text-sm">
          Merged
        </p>
      ) : null}

      <PlaceEditor id={p.id} initial={initial} categories={categories} others={others} />

      <Card
        title={`Photos (${photos.length})`}
        icon={Images}
        action={
          <AddPhotos
            placeId={p.id}
            userId={admin.id}
            label="Add photos"
            className="h-8 border bg-surface"
          />
        }
      >
        <PhotoManager placeId={p.id} title={p.name} photos={photos} />
      </Card>

      {lookalikes.length && !p.merged_into ? (
        <Card title="Possible duplicates" icon={Copy}>
          <ul className="divide-y">
            {lookalikes.map((l) => (
              <li
                key={l.id}
                className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <Link
                    href={`/places/${l.id}`}
                    className="block truncate font-medium text-sm hover:underline"
                  >
                    {l.place.name}
                  </Link>
                  <p className="truncate text-muted-foreground text-xs tabular-nums">
                    {Math.round(l.distance_m)} m · {Math.round(l.similarity * 100)}% alike ·{' '}
                    {l.place.categories?.name ?? 'Uncategorised'} · {l.place.status} ·{' '}
                    {l.place.place_sources[0]?.count ?? 0} src · {l.place.photo_count} photos
                    {l.place.address ? ` · ${l.place.address}` : ''}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-1">
                  <form action={mergePlaces}>
                    <input type="hidden" name="keep" value={p.id} />
                    <input type="hidden" name="drop" value={l.id} />
                    <input type="hidden" name="back" value="keep" />
                    <PendingButton variant="primary" pendingText="Merging…">
                      Merge into this
                    </PendingButton>
                  </form>
                  <form action={mergePlaces}>
                    <input type="hidden" name="keep" value={l.id} />
                    <input type="hidden" name="drop" value={p.id} />
                    <input type="hidden" name="back" value="keep" />
                    <PendingButton pendingText="Merging…">Keep that one</PendingButton>
                  </form>
                  <form action={markNotDuplicates}>
                    <input type="hidden" name="a" value={p.id} />
                    <input type="hidden" name="b" value={l.id} />
                    <PendingButton variant="ghost">Different</PendingButton>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card title="Sources" icon={Database}>
        {sourcesRes.data?.length ? (
          <ul className="divide-y text-sm">
            {sourcesRes.data.map((s) => (
              <li key={`${s.source}:${s.source_id}`} className="flex items-center gap-3 py-2">
                <span className="w-24 shrink-0 font-medium capitalize">{s.source}</span>
                <span className="min-w-0 flex-1 truncate">{s.name}</span>
                <span className="shrink-0 text-muted-foreground text-xs tabular-nums">
                  {new Date(s.fetched_at).toLocaleDateString('en-GB')}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground text-sm">—</p>
        )}
      </Card>
    </div>
  );
}
