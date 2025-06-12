import { Place } from '@/types/place';
import { FormattedGooglePlaceSearchResult } from '@/types/search';
import { SearchResult } from '../types';

// Convert local Place to unified SearchResult
export function placeToSearchResult(place: Place): SearchResult {
  return {
    source: 'local',
    place,
    id: place.id,
    name: place.name,
    location: {
      lat: place.location.lat,
      lng: place.location.lng,
      name: place.location.name,
    },
    rating: place.rating,
    image: place.main_image,
    description: place.description,
    category: place.category_id,
    tags: place.tags,
  };
}

// Convert Google place to unified SearchResult
export function googlePlaceToSearchResult(
  googlePlace: FormattedGooglePlaceSearchResult
): SearchResult {
  return {
    source: 'google',
    googlePlace,
    id: `google-${googlePlace.placeId}`,
    name: googlePlace.name,
    location: {
      lat: googlePlace.location.lat,
      lng: googlePlace.location.lng,
      name: googlePlace.vicinity || googlePlace.formattedAddress,
    },
    rating:
      googlePlace.rating && googlePlace.totalReviews
        ? {
            rate: googlePlace.rating,
            count: googlePlace.totalReviews,
          }
        : undefined,
    image: googlePlace.gallery?.[0],
    description: googlePlace.formattedAddress,
    category: googlePlace.types?.[0],
    tags: googlePlace.types,
  };
}

// Convert array of places to unified results
export function placesToSearchResults(places: Place[]): SearchResult[] {
  return places.map(placeToSearchResult);
}

// Convert array of Google places to unified results
export function googlePlacesToSearchResults(
  googlePlaces: FormattedGooglePlaceSearchResult[]
): SearchResult[] {
  return googlePlaces.map(googlePlaceToSearchResult);
}
