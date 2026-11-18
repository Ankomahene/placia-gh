import { photoKey, photoUrl as url } from '@placia/core/photos';
import { cn } from '@placia/ui/cn';
import { PhotoThumbs } from '@placia/ui/photo-viewer';
import { Check, ClipboardCheck, ExternalLink, MapPin, Sparkles, X } from 'lucide-react';
import type { Metadata } from 'next';
import { PendingButton } from '../../_components/pending-button';
import { serviceDb } from '../../_lib/auth';
import { WEB_URL } from '../../_lib/web';
import { decideContribution } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Contributions' };

const TABS = ['pending', 'approved', 'rejected'] as const;
type Tab = (typeof TABS)[number];

const KIND: Record<string, string> = {
  new_place: 'New place',
  edit: 'Edit',
  report: 'Report',
  photo: 'Photo',
};

const REASON: Record<string, string> = {
  closed: 'Closed for good',
  not_here: 'Not at this location',
  duplicate: 'Listed twice',
  wrong_info: 'Wrong details',
  other: 'Something else',
};

const VERDICT: Record<string, { label: string; className: string }> = {
  looks_good: { label: 'Looks good', className: 'bg-success/15 text-success' },
  needs_check: { label: 'Check', className: 'bg-warning/15 text-warning' },
  reject: { label: 'Likely bad', className: 'bg-danger/10 text-danger' },
};

const LABELS: Record<string, string> = {
  name: 'Name',
  category_id: 'Category',
  address: 'Landmark',
  phone: 'Phone',
  website: 'Website',
  hours: 'Hours',
  note: 'Note',
};

interface AIReview {
  verdict?: string;
  spam?: number;
  duplicate_of?: string | null;
  reasons?: string[];
}

interface Place {
  slug: string;
  name: string;
  [k: string]: unknown;
}

type PhotoLike = { storage_path?: string; cloudinary_public_id?: string };
const photoUrl = (key: string, width?: number) => url(key, { width });

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m} min ago`;
  if (m < 48 * 60) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

export default async function ContributionsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const tab: Tab = TABS.includes(sp.status as Tab) ? (sp.status as Tab) : 'pending';
  const db = serviceDb();
  if (!db) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
        <h1 className="font-semibold text-2xl tracking-tight">Contributions</h1>
        <p className="mt-6 text-muted-foreground text-sm">Database not connected.</p>
      </div>
    );
  }

  const count = (s: Tab) =>
    db.from('contributions').select('id', { count: 'exact', head: true }).eq('status', s);
  const [{ data: items }, { data: cats }, ...tabCounts] = await Promise.all([
    db
      .from('contributions')
      .select(
        'id, kind, payload, ai_review, status, review_note, reviewed_at, created_at, user_id, place_id, places(slug, name, category_id, phone, website, address, opening_hours)',
      )
      .eq('status', tab)
      .order(tab === 'pending' ? 'created_at' : 'reviewed_at', { ascending: tab === 'pending' })
      .limit(100),
    db.from('categories').select('id, name'),
    ...TABS.map(count),
  ]);
  const catName = new Map((cats ?? []).map((c) => [c.id, c.name]));
  const list = items ?? [];

  const userIds = [...new Set(list.map((i) => i.user_id))];
  const dupIds = list
    .map((i) => (i.ai_review as AIReview | null)?.duplicate_of)
    .filter((x): x is string => !!x);
  const [{ data: profiles }, { data: dups }] = await Promise.all([
    userIds.length
      ? db.from('profiles').select('id, display_name, trust_score').in('id', userIds)
      : Promise.resolve({
          data: [] as { id: string; display_name: string | null; trust_score: number }[],
        }),
    dupIds.length
      ? db.from('places').select('id, slug, name').in('id', dupIds)
      : Promise.resolve({ data: [] as { id: string; slug: string; name: string }[] }),
  ]);
  const who = new Map((profiles ?? []).map((p) => [p.id, p]));
  const dup = new Map((dups ?? []).map((d) => [d.id, d]));
  const show = (k: string, v: unknown) =>
    k === 'category_id' ? (catName.get(Number(v)) ?? String(v)) : String(v ?? '');

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-semibold text-2xl tracking-tight">Contributions</h1>
        <nav
          aria-label="Status"
          className="flex gap-1 rounded-full border bg-surface p-1 shadow-card"
        >
          {TABS.map((t, i) => (
            <a
              key={t}
              href={t === 'pending' ? '?' : `?status=${t}`}
              aria-current={t === tab ? 'page' : undefined}
              className={cn(
                'rounded-full px-3 py-1 font-medium text-xs capitalize',
                t === tab
                  ? 'bg-primary-soft text-primary-soft-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {t} <span className="tabular-nums opacity-70">{tabCounts[i]?.count ?? 0}</span>
            </a>
          ))}
        </nav>
      </div>

      {!list.length ? (
        <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground text-sm">
          <ClipboardCheck className="size-8" />
          {tab === 'pending' ? 'All caught up' : 'Nothing yet'}
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {list.map((c) => {
            const pay = (c.payload ?? {}) as Record<string, unknown>;
            const place = c.places as unknown as Place | null;
            const ai = c.ai_review as AIReview | null;
            const v = ai?.verdict ? VERDICT[ai.verdict] : null;
            const by = who.get(c.user_id);
            const changes = (c.kind === 'edit' ? pay.changes : pay) as Record<string, unknown>;
            const point =
              typeof changes?.lat === 'number' && typeof changes?.lon === 'number'
                ? { lat: changes.lat, lon: changes.lon }
                : null;
            const d = ai?.duplicate_of ? dup.get(ai.duplicate_of) : null;
            const photo =
              c.kind === 'photo' && photoKey(pay as PhotoLike)
                ? photoUrl(photoKey(pay as PhotoLike), 1200)
                : null;
            return (
              <li key={c.id} className="overflow-hidden rounded-lg border bg-surface shadow-card">
                {photo ? (
                  // biome-ignore lint/performance/noImgElement: a contributed photo, shown as uploaded.
                  <img src={photo} alt="" className="aspect-[16/9] w-full object-cover" />
                ) : null}
                <PhotoThumbs
                  photos={(Array.isArray(pay.photos) ? (pay.photos as PhotoLike[]) : []).map(
                    (ph) => ({
                      src: photoUrl(photoKey(ph), 1600),
                      thumb: photoUrl(photoKey(ph), 300),
                    }),
                  )}
                  max={4}
                  className="grid grid-cols-4 gap-1 p-1"
                  thumbClassName="aspect-square w-full rounded-md"
                />
                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-medium text-xs">
                      {KIND[c.kind] ?? c.kind}
                    </span>
                    {v ? (
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium text-xs',
                          v.className,
                        )}
                      >
                        <Sparkles className="size-3" />
                        {v.label}
                      </span>
                    ) : null}
                    <span className="ml-auto text-muted-foreground text-xs">
                      {by?.display_name || 'User'} · trust {by?.trust_score ?? 0} ·{' '}
                      {ago(c.created_at)}
                    </span>
                  </div>

                  <p className="font-semibold">
                    {place ? (
                      <a
                        href={`${WEB_URL}/place/${place.slug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        {place.name}
                        <ExternalLink className="size-3 text-muted-foreground" />
                      </a>
                    ) : (
                      String(pay.name ?? '')
                    )}
                  </p>

                  {c.kind === 'report' ? (
                    <p className="text-sm">
                      <span className="font-medium">
                        {REASON[String(pay.reason)] ?? String(pay.reason)}
                      </span>
                      {pay.note ? ` · ${String(pay.note)}` : ''}
                    </p>
                  ) : c.kind !== 'photo' ? (
                    <dl className="grid grid-cols-[6rem_1fr] gap-x-3 gap-y-1 text-sm">
                      {Object.entries(changes ?? {})
                        .filter(
                          ([k, val]) =>
                            val !== '' && val != null && !['lat', 'lon', 'photos'].includes(k),
                        )
                        .map(([k, val]) => {
                          const before =
                            c.kind === 'edit' && place
                              ? k === 'hours'
                                ? ((place.opening_hours as { text?: string; osm?: string } | null)
                                    ?.text ?? (place.opening_hours as { osm?: string } | null)?.osm)
                                : place[k]
                              : undefined;
                          return (
                            <div key={k} className="contents">
                              <dt className="text-muted-foreground">{LABELS[k] ?? k}</dt>
                              <dd className="min-w-0 break-words">
                                {before != null && before !== '' ? (
                                  <span className="mr-1.5 text-muted-foreground line-through">
                                    {show(k, before)}
                                  </span>
                                ) : null}
                                {show(k, val)}
                              </dd>
                            </div>
                          );
                        })}
                      {c.kind === 'edit' && typeof pay.note === 'string' ? (
                        <div className="contents">
                          <dt className="text-muted-foreground">Note</dt>
                          <dd>{pay.note}</dd>
                        </div>
                      ) : null}
                    </dl>
                  ) : null}

                  {point ? (
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=18/${point.lat}/${point.lon}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-primary text-xs tabular-nums hover:underline"
                    >
                      <MapPin className="size-3.5" />
                      {point.lat.toFixed(5)}, {point.lon.toFixed(5)}
                    </a>
                  ) : null}

                  {ai?.reasons?.length || d ? (
                    <ul className="space-y-1 rounded-md bg-surface-2 px-3 py-2.5 text-sm">
                      {d ? (
                        <li>
                          Same as{' '}
                          <a
                            href={`${WEB_URL}/place/${d.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline"
                          >
                            {d.name}
                          </a>
                          ?
                        </li>
                      ) : null}
                      {ai?.reasons?.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                  ) : null}

                  {c.status === 'pending' ? (
                    <form action={decideContribution} className="space-y-2 border-t pt-3">
                      <input type="hidden" name="id" value={c.id} />
                      <input
                        name="note"
                        maxLength={300}
                        placeholder="Note (optional)"
                        aria-label="Review note"
                        className="h-9 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:border-primary"
                      />
                      <div className="flex gap-2">
                        <PendingButton
                          name="decision"
                          value="approve"
                          variant="primary"
                          className="h-9 flex-1"
                        >
                          <Check className="size-4" />
                          Approve
                        </PendingButton>
                        <PendingButton name="decision" value="reject" className="h-9 flex-1">
                          <X className="size-4" />
                          Reject
                        </PendingButton>
                      </div>
                    </form>
                  ) : (
                    <p className="border-t pt-3 text-muted-foreground text-xs">
                      <span className="font-medium text-foreground capitalize">{c.status}</span>
                      {c.reviewed_at ? ` · ${ago(c.reviewed_at)}` : ''}
                      {c.review_note ? ` · ${c.review_note}` : ''}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
