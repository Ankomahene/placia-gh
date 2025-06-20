import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PlaceDetails } from '@/components/place-details/place-details';
import { PlaceDetailsSkeleton } from '@/components/place-details/place-details-skeleton';

interface PlacePageProps {
  params: {
    slug: string;
  };
}

async function getPlaceBySlug(slug: string) {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('places')
    .select(`
      *,
      category:category_id(id, name, slug, icon),
      subcategory:subcategory_id(id, name, slug, icon),
      type:type_id(id, name, slug, icon),
      ownership:ownership_id(id, type, slug, icon),
      country:country_id(id, name, emoji),
      region:region_id(id, name),
      city:city_id(id, name)
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .single();

  if (error || !data) {
    return null;
  }

  return data;
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