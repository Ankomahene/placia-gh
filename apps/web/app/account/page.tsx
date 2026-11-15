import { buttonVariants } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { Bookmark, ChevronRight, ClipboardCheck, LogOut, UserRound } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BottomNav, SiteHeader } from '../_components/nav';
import { SignInPrompt } from '../_components/sign-in-prompt';
import { db } from '../_lib/db';
import { getViewer, isModerator, supabaseServer, type Viewer } from '../_lib/supabase/server';
import { NameForm } from './name-form';

export const metadata: Metadata = { title: 'Account', robots: { index: false } };

const KIND: Record<string, string> = {
  new_place: 'New place',
  edit: 'Edit',
  report: 'Report',
  photo: 'Photo',
};

const STATUS: Record<string, string> = {
  pending: 'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-danger/10 text-danger',
};

export default async function AccountPage() {
  const viewer = await getViewer();
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/account" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-28 md:pt-10">
        {viewer ? (
          <Account viewer={viewer} />
        ) : (
          <SignInPrompt icon={UserRound} title="Account" next="/account" />
        )}
      </main>
      <BottomNav active="/account" />
    </div>
  );
}

async function Account({ viewer }: { viewer: Viewer }) {
  const sb = await supabaseServer();
  const { data: mine } = await sb
    .from('contributions')
    .select('id, kind, status, payload, created_at, review_note, place_id')
    .order('created_at', { ascending: false })
    .limit(30);
  // Names come from the service client: a place the user reported closed is hidden from theirs.
  const ids = [...new Set((mine ?? []).map((c) => c.place_id).filter((x): x is string => !!x))];
  const { data: places } = ids.length
    ? await db().from('places').select('id, slug, name, status').in('id', ids)
    : { data: [] };
  const byId = new Map((places ?? []).map((p) => [p.id, p]));

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="font-semibold text-2xl tracking-tight">{viewer.displayName || 'Account'}</h1>
        <p className="text-muted-foreground">{viewer.email}</p>
        <NameForm initial={viewer.displayName ?? ''} />
      </section>

      <nav className="divide-y overflow-hidden rounded-xl border bg-surface">
        <Row href="/saved" icon={<Bookmark />} label="Saved places" />
        {isModerator(viewer) ? (
          <Row href="/review" icon={<ClipboardCheck />} label="Review queue" />
        ) : null}
      </nav>

      <section aria-labelledby="mine" className="space-y-3">
        <h2 id="mine" className="font-semibold text-lg tracking-tight">
          My contributions
        </h2>
        {mine?.length ? (
          <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
            {mine.map((c) => {
              const p = c.place_id ? byId.get(c.place_id) : undefined;
              const place = p && (p.status === 'active' || p.status === 'closed') ? p : null;
              const name = p?.name ?? (c.payload as { name?: string } | null)?.name ?? '—';
              const when = new Date(c.created_at).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
              });
              return (
                <li key={c.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    {place ? (
                      <Link
                        href={`/place/${place.slug}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {name}
                      </Link>
                    ) : (
                      <span className="block truncate font-medium">{name}</span>
                    )}
                    <span className="block text-muted-foreground text-xs">
                      {KIND[c.kind]} · {when}
                      {c.review_note ? ` · ${c.review_note}` : ''}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2.5 py-1 font-medium text-xs capitalize',
                      STATUS[c.status],
                    )}
                  >
                    {c.status}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <Link href="/contribute" className={buttonVariants({ variant: 'outline' })}>
            Add a place
          </Link>
        )}
      </section>

      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="inline-flex items-center gap-2 font-medium text-danger text-sm"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </div>
  );
}

function Row({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href as never}
      className="flex items-center gap-3 px-4 py-3.5 hover:bg-surface-2 [&>svg:first-child]:size-5 [&>svg:first-child]:text-primary"
    >
      {icon}
      <span className="flex-1 font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
