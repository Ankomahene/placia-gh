import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { PlaceDetails } from '@/components/place-details/place-details';
import { PlaceDetailsSkeleton } from '@/components/place-details/place-details-skeleton';
import { getPlaceDetails } from '@/lib/services/google/places';
import { getInternalPlaceDetails } from '@/lib/services/internal/places';
import {
  getPlaceReviews,
  getUserUploadedPhotos,
  getUserReviewForPlace,
  getUserPhotosForPlace,
} from '@/lib/services/reviews-user-photos-server';
import { PlaceResults } from '@/types/place';
import { createClient } from '@/lib/supabase/server';

interface PlacePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    source?: 'google' | 'platform';
  }>;
}

interface PlacePageData {
  place: PlaceResults;
  platformReviews: any[];
  userUploadedPhotos: any[];
  userReview: any | null;
  userPhotos: any[];
}

async function getCurrentUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    return null;
  }
}

async function getPlaceData(
  placeId: string,
  source: 'google' | 'platform' = 'platform'
): Promise<PlacePageData | null> {
  try {
    let place: PlaceResults | null = null;

    if (source === 'google') {
      // Get place details from Google Places API using place ID
      place = await getPlaceDetails(placeId);
    } else if (source === 'platform') {
      // Get place details from internal database
      place = await getInternalPlaceDetails(placeId);
    }

    if (!place) {
      return null;
    }

    // Get current user
    const currentUser = await getCurrentUser();

    // Fetch data in parallel
    const dataPromises = [
      // Fetch platform reviews for all places (Google and platform)
      getPlaceReviews(placeId),
      // Fetch user uploaded photos for all places (Google and platform)
      getUserUploadedPhotos(placeId),
    ];

    // If user is authenticated, also fetch their specific data
    if (currentUser) {
      dataPromises.push(
        // Get user's existing review for this place
        getUserReviewForPlace(placeId, currentUser.id),
        // Get user's photos for this place
        getUserPhotosForPlace(placeId, currentUser.id)
      );
    }

    const results = await Promise.all(dataPromises);

    const [
      platformReviews,
      userUploadedPhotos,
      userReview = null,
      userPhotos = [],
    ] = results;

    return {
      place,
      platformReviews: platformReviews as any[],
      userUploadedPhotos: userUploadedPhotos as any[],
      userReview: userReview as any | null,
      userPhotos: userPhotos as any[],
    };
  } catch (error) {
    console.error(`Error fetching place data from ${source}:`, error);
    return null;
  }
}

export default async function PlacePage({
  params,
  searchParams,
}: PlacePageProps) {
  const { id: placeId } = await params;
  const { source = 'platform' } = await searchParams;

  const placeData = await getPlaceData(placeId, source);

  if (!placeData) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={<PlaceDetailsSkeleton />}>
        <PlaceDetails
          place={placeData.place}
          platformReviews={placeData.platformReviews}
          userUploadedPhotos={placeData.userUploadedPhotos}
          userReview={placeData.userReview}
          userPhotos={placeData.userPhotos}
        />
      </Suspense>
    </main>
  );
}
