import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PlaceDetails } from '@/components/place-details/place-details';
import { PlaceDetailsSkeleton } from '@/components/place-details/place-details-skeleton';
import { mockPlaceDetails } from '@/lib/mock-place-details';

interface PlacePageProps {
  params: {
    slug: string;
  };
}

async function getPlaceBySlug(slug: string) {
  // Instead of fetching from Supabase, use mock data
  const place = mockPlaceDetails.find(p => p.slug === slug);
  return place || null;
}

export default async function PlacePage({ params }: PlacePageProps) {
  const place = await getPlaceBySlug(params.slug);
  
  if (!place) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<PlaceDetailsSkeleton />}>
        <PlaceDetails place={place} />
      </Suspense>
    </main>
  );
}