import { cn } from '@placia/ui/cn';
import { ClipboardCheck, ShieldAlert, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticMap } from '../_components/map/static-map';
import { BottomNav, SiteHeader } from '../_components/nav';
import { SignInPrompt } from '../_components/sign-in-prompt';
import { categoryOptions } from '../_lib/categories';
import { db } from '../_lib/db';
import { photoUrl } from '../_lib/photos';
import { getViewer, isModerator } from '../_lib/supabase/server';
import { Decide } from './decide';

export const metadata: Metadata = { title: 'Review', robots: { index: false } };

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

interface AIReview {
  verdict?: string;
  spam?: number;
  duplicate_of?: string | null;
  reasons?: string[];
  error?: string;
}

const LABELS: Record<string, string> = {
  name: 'Name',
  category_id: 'Category',
  address: 'Landmark',
  phone: 'Phone',
  website: 'Website',
  hours: 'Hours',
  lat: 'Lat',
  lon: 'Lon',
  note: 'Note',
};

export default async function ReviewPage() {
  const viewer = await getViewer();
  if (!isModerator(viewer)) {
    return (
      <div className="flex min-h-dvh flex-col">
        <SiteHeader active="/account" />
        <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-28">
          {viewer ? (
            <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
              <ShieldAlert className="size-8" />
              Moderators only
            </div>
          ) : (
            <SignInPrompt icon={ClipboardCheck} title="Review queue" next="/review" />
          )}
        </main>
        <BottomNav active="/account" />
      </div>
    );
  }

  const sb = db();
  const [{ data: items }, cats] = await Promise.all([
    sb
      .from('contributions')
      .select(
        'id, kind, payload, ai_review, created_at, user_id, place_id, places(slug, name, category_id, phone, website, address, opening_hours)',
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(50),
    categoryOptions(),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const userIds = [...new Set((items ?? []).map((i) => i.user_id))];
  const { data: profiles } = userIds.length
    ? await sb.from('profiles').select('id, display_name, trust_score').in('id', userIds)
    : { data: [] };
  const who = new Map((profiles ?? []).map((p) => [p.id, p]));
  const dupIds = (items ?? [])
    .map((i) => (i.ai_review as AIReview | null)?.duplicate_of)
    .filter((x): x is string => !!x);
  const { data: dups } = dupIds.length
    ? await sb.from('places').select('id, slug, name').in('id', dupIds)
    : { data: [] };
  const dup = new Map((dups ?? []).map((d) => [d.id, d]));

  const show = (k: string, v: unknown) =>
    k === 'category_id' ? (catName.get(Number(v)) ?? String(v)) : String(v ?? '');

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/account" />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-6 pb-28 md:pt-10">
        <h1 className="mb-4 font-semibold text-2xl tracking-tight">
          Review <span className="text-muted-foreground">{items?.length ?? 0}</span>
        </h1>
        {!items?.length ? (
          <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
            <ClipboardCheck className="size-8" />
            All caught up
          </div>
        ) : (
          <ul className="space-y-4">
            {items.map((c) => {
              const pay = c.payload as Record<string, unknown>;
              const place = c.places as unknown as {
                slug: string;
                name: string;
                [k: string]: unknown;
              } | null;
              const ai = c.ai_review as AIReview | null;
              const v = ai?.verdict ? VERDICT[ai.verdict] : null;
              const by = who.get(c.user_id);
              const changes = (c.kind === 'edit' ? pay.changes : pay) as Record<string, unknown>;
              const point =
                typeof changes?.lat === 'number' && typeof changes?.lon === 'number'
                  ? { lat: changes.lat, lon: changes.lon }
                  : null;
              const d = ai?.duplicate_of ? dup.get(ai.duplicate_of) : null;
              return (
                <li key={c.id} className="overflow-hidden rounded-2xl border bg-surface">
                  {c.kind === 'photo' && typeof pay.storage_path === 'string' ? (
                    // biome-ignore lint/performance/noImgElement: a pending photo, shown as uploaded.
                    <img
                      src={photoUrl(pay.storage_path)}
                      alt=""
                      className="aspect-[4/3] w-full object-cover"
                    />
                  ) : point ? (
                    <StaticMap lat={point.lat} lon={point.lon} zoom={16} className="h-40" />
                  ) : null}
                  {Array.isArray(pay.photos) && pay.photos.length ? (
                    <div className="grid grid-cols-4 gap-1 p-1">
                      {(pay.photos as { storage_path: string }[]).map((ph) => (
                        <a
                          key={ph.storage_path}
                          href={photoUrl(ph.storage_path)}
                          target="_blank"
                          rel="noreferrer"
                          className="aspect-square overflow-hidden rounded-md bg-surface-2"
                        >
                          {/* biome-ignore lint/performance/noImgElement: a pending photo, shown as uploaded. */}
                          <img
                            src={photoUrl(ph.storage_path)}
                            alt=""
                            className="size-full object-cover"
                          />
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-surface-2 px-2.5 py-1 font-medium text-xs">
                        {KIND[c.kind]}
                      </span>
                      {v ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium text-xs',
                            v.className,
                          )}
                        >
                          <Sparkles className="size-3" />
                          {v.label}
                        </span>
                      ) : null}
                      <span className="ml-auto text-muted-foreground text-xs">
                        {by?.display_name || 'User'} · trust {by?.trust_score ?? 0}
                      </span>
                    </div>

                    <p className="font-semibold">
                      {place ? (
                        <Link href={`/place/${place.slug}`} className="hover:underline">
                          {place.name}
                        </Link>
                      ) : (
                        String(pay.name ?? '')
                      )}
                    </p>

                    {c.kind === 'report' ? (
                      <p>
                        <span className="font-medium">{REASON[String(pay.reason)]}</span>
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
                                      ?.text ??
                                    (place.opening_hours as { osm?: string } | null)?.osm)
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

                    {ai?.reasons?.length || d ? (
                      <ul className="space-y-1 rounded-xl bg-surface-2 px-3 py-2.5 text-sm">
                        {d ? (
                          <li>
                            Same as{' '}
                            <Link
                              href={`/place/${d.slug}`}
                              className="font-medium text-primary hover:underline"
                            >
                              {d.name}
                            </Link>
                            ?
                          </li>
                        ) : null}
                        {ai?.reasons?.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : null}

                    <Decide id={c.id} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
      <BottomNav active="/account" />
    </div>
  );
}
