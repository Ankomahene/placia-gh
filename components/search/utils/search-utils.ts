import { Place, PlaceResults } from '@/types/place';
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

// Convert Google place (PlaceResults) to unified SearchResult
export function googlePlaceToSearchResult(
  googlePlace: PlaceResults
): SearchResult {
  return {
    source: 'google',
    place: googlePlace,
    id: googlePlace.id,
    name: googlePlace.name,
    location: {
      lat: googlePlace.location.lat,
      lng: googlePlace.location.lng,
      name: googlePlace.location.name,
    },
    rating: googlePlace.rating,
    image: googlePlace.main_image,
    description: googlePlace.description,
    category: googlePlace.category.id,
    tags: googlePlace.tags,
  };
}

// Convert array of places to unified results
export function placesToSearchResults(places: Place[]): SearchResult[] {
  return places.map(placeToSearchResult);
}

// Convert array of Google places to unified results
export function googlePlacesToSearchResults(
  googlePlaces: PlaceResults[]
): SearchResult[] {
  return googlePlaces.map(googlePlaceToSearchResult);
}
