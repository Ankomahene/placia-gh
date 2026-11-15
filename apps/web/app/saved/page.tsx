import { Bookmark } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { BottomNav, SiteHeader } from '../_components/nav';
import { SignInPrompt } from '../_components/sign-in-prompt';
import { placeWhere } from '../_lib/format';
import { getViewer, supabaseServer } from '../_lib/supabase/server';

export const metadata: Metadata = { title: 'Saved', robots: { index: false } };

interface SavedRow {
  created_at: string;
  places: {
    slug: string;
    name: string;
    categories: { name: string } | null;
    localities: { name: string } | null;
    districts: { name: string } | null;
  } | null;
}

export default async function SavedPage() {
  const viewer = await getViewer();
  let rows: SavedRow[] = [];
  if (viewer) {
    const sb = await supabaseServer();
    const { data } = await sb
      .from('saved_places')
      .select('created_at, places(slug, name, categories(name), localities(name), districts(name))')
      .order('created_at', { ascending: false })
      .limit(200);
    rows = (data as unknown as SavedRow[]) ?? [];
  }
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/saved" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-6 pb-28 md:pt-10">
        {!viewer ? (
          <SignInPrompt icon={Bookmark} title="Saved places" next="/saved" />
        ) : (
          <>
            <h1 className="mb-4 font-semibold text-2xl tracking-tight">Saved</h1>
            {rows.length ? (
              <ul className="divide-y overflow-hidden rounded-xl border bg-surface">
                {rows.map((r) => {
                  const p = r.places;
                  if (!p) return null;
                  const where = placeWhere(p.localities?.name, p.districts?.name);
                  return (
                    <li key={p.slug}>
                      <Link
                        href={`/place/${p.slug}`}
                        className="block px-4 py-3 hover:bg-surface-2"
                      >
                        <span className="block truncate font-medium">{p.name}</span>
                        <span className="block truncate text-muted-foreground text-sm">
                          {[p.categories?.name, where].filter(Boolean).join(' · ')}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="flex flex-col items-center gap-3 py-16 text-muted-foreground">
                <Bookmark className="size-8" />
                No saved places
              </div>
            )}
          </>
        )}
      </main>
      <BottomNav active="/saved" />
    </div>
  );
}
