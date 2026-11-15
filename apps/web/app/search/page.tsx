import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BottomNav, SiteHeader } from '../_components/nav';
import { SearchView } from './search-view';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? q : 'Search', robots: { index: false } };
}

export default function SearchPage() {
  return (
    <div className="flex min-h-dvh flex-col md:h-dvh md:overflow-hidden">
      <div className="hidden md:block">
        <SiteHeader />
      </div>
      <main className="flex flex-1 flex-col md:min-h-0">
        <Suspense>
          <SearchView />
        </Suspense>
      </main>
      <BottomNav active="/" />
    </div>
  );
}
