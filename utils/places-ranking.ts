import type { StructuredSearchQuery } from '../types/search';
import type { Place } from '../types/place';
import type {
  ScoringWeights,
  ScoringConfig,
  PlaceScore,
  DistanceResult,
} from '../types/sorting';

// Default configuration - easily customizable
const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    proximity: 0.25,
    locationMatch: 0.2,
    categoryMatch: 0.15,
    subcategoryMatch: 0.1,
    rating: 0.15,
    priceMatch: 0.05,
    openNow: 0.03,
    hasWebsite: 0.02,
    hasPhone: 0.02,
    featuresMatch: 0.02,
    tagsMatch: 0.01,
    completeness: 0.1,
  },
  maxProximityKm: 50,
  ratingBoostThreshold: 4.0,
  completenessFactors: {
    hasDescription: 0.2,
    hasPhotos: 0.3,
    hasOpenHours: 0.2,
    hasContact: 0.15,
    hasWebsite: 0.15,
  },
};

/**
 * Calculate distance between two points using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Score proximity based on distance and radius
 */
function scoreProximity(
  place: Place,
  query: StructuredSearchQuery,
  config: ScoringConfig
): DistanceResult {
  if (!query.user_location || !place.location) {
    return { distance: Infinity, score: 0 };
  }

  const distance = calculateDistance(
    query.user_location.lat,
    query.user_location.lng,
    place.location.lat,
    place.location.lng
  );

  if (query.radius_meters) {
    const radiusKm = query.radius_meters / 1000;
    if (distance > radiusKm) {
      return { distance, score: 0 };
    }
    // Score inversely proportional to distance within radius
    return { distance, score: Math.max(0, 1 - distance / radiusKm) };
  }

  // General proximity scoring
  const maxDistance = config.maxProximityKm;
  return {
    distance,
    score: Math.max(0, 1 - distance / maxDistance),
  };
}

/**
 * Score location name match
 */
function scoreLocationMatch(
  place: Place,
  query: StructuredSearchQuery
): number {
  if (!query.location) return 0;

  const queryLocation = query.location.toLowerCase();
  const placeLocation = place.location?.name?.toLowerCase() || '';
  const placeAddress = place.location?.street_address?.toLowerCase() || '';

  // Exact match gets highest score
  if (placeLocation === queryLocation || placeAddress.includes(queryLocation)) {
    return 1.0;
  }

  // Partial match
  if (
    placeLocation.includes(queryLocation) ||
    placeAddress.includes(queryLocation)
  ) {
    return 0.7;
  }

  // Check for word overlap
  const queryWords = queryLocation.split(/\s+/);
  const locationWords = [
    ...placeLocation.split(/\s+/),
    ...placeAddress.split(/\s+/),
  ];
  const matchedWords = queryWords.filter((word) =>
    locationWords.some(
      (locWord) => locWord.includes(word) || word.includes(locWord)
    )
  );

  return (matchedWords.length / queryWords.length) * 0.5;
}

/**
 * Score category and subcategory match
 */
function scoreCategoryMatch(
  place: Place,
  query: StructuredSearchQuery
): {
  categoryScore: number;
  subcategoryScore: number;
} {
  const categoryScore =
    query.category && place.category_id === query.category ? 1.0 : 0;
  const subcategoryScore =
    query.subcategory && place.subcategory_id === query.subcategory ? 1.0 : 0;

  return { categoryScore, subcategoryScore };
}

/**
 * Score rating match
 */
function scoreRating(
  place: Place,
  query: StructuredSearchQuery,
  config: ScoringConfig
): number {
  if (!place.rating?.rate) return 0;

  const rating = place.rating.rate;
  let score = rating / 5; // Normalize to 0-1

  // Boost for high ratings
  if (rating >= config.ratingBoostThreshold) {
    score *= 1.2;
  }

  // Apply minimum rating filter
  if (query.min_rating && rating < query.min_rating) {
    return 0;
  }

  return Math.min(score, 1);
}

/**
 * Score price match
 */
function scorePriceMatch(place: Place, query: StructuredSearchQuery): number {
  // Map price_level strings to numbers for comparison
  const priceLevelMap = {
    budget: 1,
    moderate: 2,
    expensive: 3,
    very_expensive: 4,
  };

  let score = 0.5; // Default neutral score

  if (query.price_level && place.rating?.rate) {
    const queryPriceLevel = priceLevelMap[query.price_level];
    const placePriceLevel = place.rating?.rate || 2; // Default to moderate

    // Exact match gets highest score
    if (queryPriceLevel === placePriceLevel) {
      score = 1.0;
    } else {
      // Closer levels get higher scores
      const difference = Math.abs(queryPriceLevel - placePriceLevel);
      score = Math.max(0, 1 - difference * 0.3);
    }
  }

  // Handle min/max price if available (assuming these would be stored in other_details)
  if (query.min_price || query.max_price) {
    // This would require actual price data in the place object
    // For now, return neutral score
    score = 0.5;
  }

  return score;
}

/**
 * Score features and tags match
 */
function scoreFeaturesTags(
  place: Place,
  query: StructuredSearchQuery
): {
  featuresScore: number;
  tagsScore: number;
} {
  let featuresScore = 0;
  let tagsScore = 0;

  if (query.features && place.features) {
    const queryFeatures = query.features.map((f) => f.toLowerCase());
    const placeFeatures = place.features.map((f) => f.label.toLowerCase());
    const matchCount = queryFeatures.filter((qf) =>
      placeFeatures.some((pf) => pf.includes(qf) || qf.includes(pf))
    ).length;
    featuresScore =
      queryFeatures.length > 0 ? matchCount / queryFeatures.length : 0;
  }

  if (place.tags) {
    const placeTags = place.tags.map((t) => t.toLowerCase());
    const queryTerms = query.query.toLowerCase().split(/\s+/);
    const matchCount = queryTerms.filter((qt) =>
      placeTags.some((pt) => pt.includes(qt) || qt.includes(pt))
    ).length;
    tagsScore =
      queryTerms.length > 0 ? (matchCount / queryTerms.length) * 0.5 : 0;
  }

  return { featuresScore, tagsScore };
}

/**
 * Score data completeness
 */
function scoreCompleteness(place: Place, config: ScoringConfig): number {
  const factors = config.completenessFactors;
  let score = 0;

  if (place.description) score += factors.hasDescription;
  if (place.gallery && place.gallery.length > 0) score += factors.hasPhotos;
  if (place.open_hours && place.open_hours.length > 0)
    score += factors.hasOpenHours;
  if (place.contacts && place.contacts.length > 0) score += factors.hasContact;
  if (place.website) score += factors.hasWebsite;

  return score;
}

/**
 * Compute the overall score for a place
 */
export function computePlaceScore(
  place: Place,
  query: StructuredSearchQuery,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PlaceScore {
  const weights = config.weights;
  const breakdown: Partial<Record<keyof ScoringWeights, number>> = {};

  // Calculate individual scores
  const { distance, score: proximityScore } = scoreProximity(
    place,
    query,
    config
  );
  const locationMatchScore = scoreLocationMatch(place, query);
  const { categoryScore, subcategoryScore } = scoreCategoryMatch(place, query);
  const ratingScore = scoreRating(place, query, config);
  const priceMatchScore = scorePriceMatch(place, query);
  const { featuresScore, tagsScore } = scoreFeaturesTags(place, query);
  const completenessScore = scoreCompleteness(place, config);

  // Boolean flags
  const openNowScore = query.open_now && place.open_hours ? 1.0 : 0;
  const hasWebsiteScore =
    query.has_website && place.website ? 1.0 : place.website ? 0.5 : 0;
  const hasPhoneScore =
    query.has_phone && place.contacts?.length
      ? 1.0
      : place.contacts?.length
        ? 0.5
        : 0;

  // Store breakdown for debugging/analytics
  breakdown.proximity = proximityScore;
  breakdown.locationMatch = locationMatchScore;
  breakdown.categoryMatch = categoryScore;
  breakdown.subcategoryMatch = subcategoryScore;
  breakdown.rating = ratingScore;
  breakdown.priceMatch = priceMatchScore;
  breakdown.openNow = openNowScore;
  breakdown.hasWebsite = hasWebsiteScore;
  breakdown.hasPhone = hasPhoneScore;
  breakdown.featuresMatch = featuresScore;
  breakdown.tagsMatch = tagsScore;
  breakdown.completeness = completenessScore;

  // Calculate weighted total score
  const totalScore =
    proximityScore * weights.proximity +
    locationMatchScore * weights.locationMatch +
    categoryScore * weights.categoryMatch +
    subcategoryScore * weights.subcategoryMatch +
    ratingScore * weights.rating +
    priceMatchScore * weights.priceMatch +
    openNowScore * weights.openNow +
    hasWebsiteScore * weights.hasWebsite +
    hasPhoneScore * weights.hasPhone +
    featuresScore * weights.featuresMatch +
    tagsScore * weights.tagsMatch +
    completenessScore * weights.completeness;

  return {
    place: { ...place, distance },
    score: totalScore,
    breakdown,
  };
}

/**
 * Main function to rank and sort places
 */
export function rankAndSortPlaces(
  query: StructuredSearchQuery,
  places: Place[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): Place[] {
  // Early return for empty input
  if (!places.length) return [];

  // Score all places
  const scoredPlaces = places.map((place) =>
    computePlaceScore(place, query, config)
  );

  // Sort by score descending, then by rating as tiebreaker
  scoredPlaces.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    // Tiebreaker: higher rating first
    const aRating = a.place.rating?.rate || 0;
    const bRating = b.place.rating?.rate || 0;
    return bRating - aRating;
  });

  return scoredPlaces.map((scored) => scored.place);
}

/**
 * Export default configuration for external customization
 */
export { DEFAULT_SCORING_CONFIG };

/**
 * Helper function to create custom scoring configurations
 */
export function createScoringConfig(
  overrides: Partial<ScoringConfig>
): ScoringConfig {
  return {
    ...DEFAULT_SCORING_CONFIG,
    ...overrides,
    weights: {
      ...DEFAULT_SCORING_CONFIG.weights,
      ...overrides.weights,
    },
    completenessFactors: {
      ...DEFAULT_SCORING_CONFIG.completenessFactors,
      ...overrides.completenessFactors,
    },
  };
}
