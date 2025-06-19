import { PlaceResultsSummary } from '@/types/place';
import {
  SortConfig,
  SortingCapabilities,
  ProximitySortOrder,
  RatingSortOrder,
  PriceLevelSortOrder,
  NameSortOrder,
  SortType,
} from '../types';

/**
 * Convert service sort_order to our SortConfig
 */
export function convertServiceSortToConfig(
  searchType: string | undefined,
  sortOrder: string | undefined
): SortConfig | null {
  if (!searchType || !sortOrder) return null;

  switch (searchType) {
    case 'proximity':
      if (sortOrder === 'nearest_first' || sortOrder === 'farthest_first') {
        return {
          type: 'proximity',
          order: sortOrder as ProximitySortOrder,
        };
      }
      break;

    case 'rating':
      if (sortOrder === 'highest_first' || sortOrder === 'lowest_first') {
        return {
          type: 'rating',
          order: sortOrder as RatingSortOrder,
        };
      }
      break;

    case 'price_level':
      if (
        sortOrder === 'cheapest_first' ||
        sortOrder === 'most_expensive_first'
      ) {
        return {
          type: 'price_level',
          order: sortOrder as PriceLevelSortOrder,
        };
      }
      break;

    case 'general':
    default:
      return {
        type: 'none',
        order: 'nearest_first', // Default fallback
      };
  }

  return null;
}

/**
 * Get default sort config for a search type
 */
export function getDefaultSortConfigForSearchType(
  searchType: string | undefined
): SortConfig {
  switch (searchType) {
    case 'proximity':
      return { type: 'proximity', order: 'nearest_first' };
    case 'rating':
      return { type: 'rating', order: 'highest_first' };
    case 'price_level':
      return { type: 'price_level', order: 'cheapest_first' };
    default:
      return { type: 'none', order: 'nearest_first' };
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // distance in meters
}

/**
 * Analyze search results to determine sorting capabilities
 */
export function analyzeSortingCapabilities(
  results: PlaceResultsSummary[]
): SortingCapabilities {
  if (results.length === 0) {
    return {
      canSortByProximity: false,
      canSortByRating: false,
      canSortByPriceLevel: false,
      hasDistanceData: false,
      needsLocationForProximity: true,
    };
  }

  const hasRatingData = results.some(
    (place) => place.rate_average !== undefined && place.rate_average > 0
  );
  const hasPriceLevelData = results.some(
    (place) => place.price_level !== undefined && place.price_level > 0
  );
  const hasDistanceData = results.some((place) => place.distance !== undefined);

  return {
    canSortByProximity: true, // Always possible, might need location
    canSortByRating: hasRatingData,
    canSortByPriceLevel: hasPriceLevelData,
    hasDistanceData,
    needsLocationForProximity: !hasDistanceData,
  };
}

/**
 * Add or update distance data to places based on a reference location
 */
export function addDistanceToPlaces(
  places: PlaceResultsSummary[],
  referenceLocation: { lat: number; lng: number }
): PlaceResultsSummary[] {
  return places.map((place) => ({
    ...place,
    distance: calculateDistance(
      referenceLocation.lat,
      referenceLocation.lng,
      place.location.lat,
      place.location.lng
    ),
  }));
}

/**
 * Sort places by proximity
 */
export function sortByProximity(
  places: PlaceResultsSummary[],
  order: ProximitySortOrder,
  referenceLocation?: { lat: number; lng: number }
): PlaceResultsSummary[] {
  let sortedPlaces = [...places];

  // Add distance if needed and reference location is provided
  if (referenceLocation && !places.some((p) => p.distance !== undefined)) {
    sortedPlaces = addDistanceToPlaces(sortedPlaces, referenceLocation);
  }

  // Filter out places without distance data
  const placesWithDistance = sortedPlaces.filter(
    (place) => place.distance !== undefined
  );
  const placesWithoutDistance = sortedPlaces.filter(
    (place) => place.distance === undefined
  );

  // Sort places with distance
  placesWithDistance.sort((a, b) => {
    const distanceA = a.distance || 0;
    const distanceB = b.distance || 0;
    return order === 'nearest_first'
      ? distanceA - distanceB
      : distanceB - distanceA;
  });

  // Return sorted places with distance first, then places without distance
  return [...placesWithDistance, ...placesWithoutDistance];
}

/**
 * Sort places by rating
 */
export function sortByRating(
  places: PlaceResultsSummary[],
  order: RatingSortOrder
): PlaceResultsSummary[] {
  const sortedPlaces = [...places];

  return sortedPlaces.sort((a, b) => {
    const ratingA = a.rate_average || 0;
    const ratingB = b.rate_average || 0;

    // Places with ratings come first
    if (ratingA > 0 && ratingB === 0) return -1;
    if (ratingA === 0 && ratingB > 0) return 1;

    // Both have ratings or both don't have ratings
    return order === 'highest_first' ? ratingB - ratingA : ratingA - ratingB;
  });
}

/**
 * Sort places by price level
 */
export function sortByPriceLevel(
  places: PlaceResultsSummary[],
  order: PriceLevelSortOrder
): PlaceResultsSummary[] {
  const sortedPlaces = [...places];

  return sortedPlaces.sort((a, b) => {
    const priceA = a.price_level || 0;
    const priceB = b.price_level || 0;

    // Places with price levels come first
    if (priceA > 0 && priceB === 0) return -1;
    if (priceA === 0 && priceB > 0) return 1;

    // Both have price levels or both don't have price levels
    return order === 'cheapest_first' ? priceA - priceB : priceB - priceA;
  });
}

/**
 * Sort places by name
 */
export function sortByName(
  places: PlaceResultsSummary[],
  order: NameSortOrder
): PlaceResultsSummary[] {
  const sortedPlaces = [...places];

  return sortedPlaces.sort((a, b) => {
    const nameA = a.name.toLowerCase();
    const nameB = b.name.toLowerCase();

    if (order === 'a_to_z') {
      return nameA.localeCompare(nameB);
    } else {
      return nameB.localeCompare(nameA);
    }
  });
}

/**
 * Apply sorting to a list of places based on sort configuration
 */
export function applySorting(
  places: PlaceResultsSummary[],
  sortConfig: SortConfig
): PlaceResultsSummary[] {
  if (sortConfig.type === 'none' || places.length === 0) {
    return places;
  }

  switch (sortConfig.type) {
    case 'proximity':
      return sortByProximity(
        places,
        sortConfig.order as ProximitySortOrder,
        sortConfig.customLocation
      );
    case 'rating':
      return sortByRating(places, sortConfig.order as RatingSortOrder);
    case 'price_level':
      return sortByPriceLevel(places, sortConfig.order as PriceLevelSortOrder);
    case 'name':
      return sortByName(places, sortConfig.order as NameSortOrder);
    default:
      return places;
  }
}
