import type { StructuredSearchQuery } from '@/types/search';
import type { PlaceResults } from '@/types/place';
import type {
  ScoringWeights,
  ScoringConfig,
  PlaceScore,
  DistanceResult,
} from '@/types/sorting';

// Default configuration - easily customizable
const DEFAULT_SCORING_CONFIG: ScoringConfig = {
  weights: {
    // Dynamic weights - these will be adjusted based on query
    proximity: 0.3, // Highest when location/radius specified
    locationMatch: 0.25, // High when location specified
    rating: 0.25, // High when min_rating specified
    nameMatch: 0.25, // High when no location/rating criteria

    // Supporting weights
    categoryMatch: 0.15,
    subcategoryMatch: 0.1,
    openNow: 0.1,

    // Additional context weights
    featuresMatch: 0.05,
    tagsMatch: 0.05,
    hasWebsite: 0.02,
    hasPhone: 0.02,
    priceMatch: 0.02,
    completeness: 0.05,
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
 * Score proximity based on distance and radius
 */
function scoreProximity(
  place: PlaceResults,
  query: StructuredSearchQuery,
  config: ScoringConfig
): DistanceResult {
  // If no user location or place location, return neutral score
  if (!place.distance) {
    return { distance: Infinity, score: 0.5 };
  }

  const distance = place.distance;
  const radiusKm = query.radius_meters
    ? query.radius_meters / 1000
    : config.maxProximityKm;

  // If distance is within radius, score based on how close it is
  if (distance <= query.radius_meters!) {
    return {
      distance,
      score: 1 - distance / query.radius_meters!,
    };
  }

  // If outside radius but within max proximity, give partial score
  if (distance <= radiusKm * 1000) {
    return {
      distance,
      score: 0.5 * (1 - distance / (radiusKm * 1000)),
    };
  }

  // If beyond max proximity, give minimal score
  return { distance, score: 0.1 };
}

/**
 * Score location match
 */
function scoreLocationMatch(
  place: PlaceResults,
  query: StructuredSearchQuery
): number {
  if (!query.location) return 0.5; // Neutral score if no location specified

  const queryLocation = query.location.toLowerCase();
  const placeLocation = place.location?.name?.toLowerCase() || '';
  const placeAddress = place.location?.street_address?.toLowerCase() || '';
  const placeCity = place.city?.name?.toLowerCase() || '';
  const placeRegion = place.region?.name?.toLowerCase() || '';

  // Exact match gets highest score
  if (
    placeLocation === queryLocation ||
    placeCity === queryLocation ||
    placeRegion === queryLocation
  ) {
    return 1.0;
  }

  // Partial match
  if (
    placeLocation.includes(queryLocation) ||
    placeAddress.includes(queryLocation) ||
    placeCity.includes(queryLocation) ||
    placeRegion.includes(queryLocation)
  ) {
    return 0.8;
  }

  // Check for word overlap
  const queryWords = queryLocation.split(/\s+/);
  const locationWords = [
    ...placeLocation.split(/\s+/),
    ...placeAddress.split(/\s+/),
    ...placeCity.split(/\s+/),
    ...placeRegion.split(/\s+/),
  ];
  const matchedWords = queryWords.filter((word) =>
    locationWords.some(
      (locWord) => locWord.includes(word) || word.includes(locWord)
    )
  );

  return 0.5 + (matchedWords.length / queryWords.length) * 0.3;
}

/**
 * Score category and subcategory match
 */
function scoreCategoryMatch(
  place: PlaceResults,
  query: StructuredSearchQuery
): {
  categoryScore: number;
  subcategoryScore: number;
} {
  const categoryScore =
    query.category && place.category.name === query.category ? 1.0 : 0;
  const subcategoryScore =
    query.subcategory && place.subcategory.name.includes(query.subcategory)
      ? 1.0
      : 0;

  return { categoryScore, subcategoryScore };
}

/**
 * Score rating match
 */
function scoreRating(
  place: PlaceResults,
  query: StructuredSearchQuery,
  config: ScoringConfig
): number {
  if (!place.rating?.rate) return 0.5; // Neutral score if no rating

  const rating = place.rating.rate;
  let score = rating / 5; // Normalize to 0-1

  // Boost for high ratings
  if (rating >= config.ratingBoostThreshold) {
    score *= 1.2;
  }

  // If min_rating specified, boost scores above it
  if (query.min_rating) {
    if (rating >= query.min_rating) {
      score *= 1.3;
    } else {
      score *= 0.7; // Penalize but don't completely exclude
    }
  }

  return Math.min(score, 1);
}

/**
 * Score price match
 */
function scorePriceMatch(
  place: PlaceResults,
  query: StructuredSearchQuery
): number {
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
  place: PlaceResults,
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
function scoreCompleteness(place: PlaceResults, config: ScoringConfig): number {
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
 * Score name match and semantic relevance
 */
function scoreNameMatch(
  place: PlaceResults,
  query: StructuredSearchQuery
): number {
  if (!query.query) return 0.5; // Neutral score if no query

  const searchQuery = query.query.toLowerCase();
  const searchTerms = searchQuery
    .split(/\s+/)
    .filter((term) => term.length > 2); // Ignore very short terms
  const placeName = place.name.toLowerCase();
  const placeDescription = place.description?.toLowerCase() || '';
  const placeCategory = place.category?.name?.toLowerCase() || '';
  const placeSubcategory = place.subcategory?.name?.toLowerCase() || '';

  let score = 0;

  // 1. Exact phrase match in name (highest priority)
  if (placeName.includes(searchQuery)) {
    return 1.0;
  }

  // 2. Most terms match in sequence
  const consecutiveMatches = findLongestCommonSubsequence(
    searchTerms,
    placeName.split(/\s+/)
  );
  if (consecutiveMatches > 1) {
    score += 0.3 * (consecutiveMatches / searchTerms.length);
  }

  // 3. Individual term matches in name
  const nameWords = placeName.split(/\s+/);
  const nameMatchCount = searchTerms.filter((term) =>
    nameWords.some((word) => word.includes(term) || term.includes(word))
  ).length;
  score += 0.3 * (nameMatchCount / searchTerms.length);

  // 4. Category/Subcategory match
  if (
    searchTerms.some(
      (term) => placeCategory.includes(term) || placeSubcategory.includes(term)
    )
  ) {
    score += 0.2;
  }

  // 5. Description match (lower weight)
  const descriptionMatchCount = searchTerms.filter((term) =>
    placeDescription.includes(term)
  ).length;
  score += 0.1 * (descriptionMatchCount / searchTerms.length);

  // 6. Tag matches
  if (place.tags?.length) {
    const tagMatches = searchTerms.filter((term) =>
      place.tags!.some((tag) => tag.toLowerCase().includes(term))
    ).length;
    score += 0.1 * (tagMatches / searchTerms.length);
  }

  return Math.min(score, 1);
}

/**
 * Helper function to find longest common subsequence length
 */
function findLongestCommonSubsequence(
  terms: string[],
  words: string[]
): number {
  let maxLength = 0;
  for (let i = 0; i < words.length; i++) {
    let currentLength = 0;
    let termIndex = 0;
    for (let j = i; j < words.length && termIndex < terms.length; j++) {
      if (
        words[j].includes(terms[termIndex]) ||
        terms[termIndex].includes(words[j])
      ) {
        currentLength++;
        termIndex++;
      }
    }
    maxLength = Math.max(maxLength, currentLength);
  }
  return maxLength;
}

/**
 * Adjust weights based on query parameters
 */
function getAdjustedWeights(
  query: StructuredSearchQuery,
  config: ScoringConfig
): ScoringWeights {
  const weights = { ...config.weights };

  // Case 1: Location-based search
  if (query.user_location || query.location) {
    weights.proximity = 0.35;
    weights.locationMatch = 0.3;
    weights.nameMatch = 0.15;
  }

  // Case 2: Rating-based search
  if (query.min_rating) {
    weights.rating = 0.35;
    weights.nameMatch = 0.15;
  }

  // Case 3: Category/Subcategory search
  if (query.category || query.subcategory) {
    weights.categoryMatch = 0.25;
    weights.subcategoryMatch = 0.2;
    weights.nameMatch = 0.2;
  }

  // Case 4: Open now prioritized
  if (query.open_now) {
    weights.openNow = 0.2;
    weights.nameMatch = 0.2;
  }

  // Normalize weights to ensure they sum to ~1
  const totalWeight = Object.values(weights).reduce(
    (sum, weight) => sum + weight,
    0
  );
  if (totalWeight > 0) {
    Object.keys(weights).forEach((key) => {
      weights[key as keyof ScoringWeights] /= totalWeight;
    });
  }

  return weights;
}

/**
 * Compute the overall score for a place
 */
export function computePlaceScore(
  place: PlaceResults,
  query: StructuredSearchQuery,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PlaceScore {
  // Get adjusted weights based on query
  const weights = getAdjustedWeights(query, config);
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
  const nameMatchScore = scoreNameMatch(place, query);

  // Store breakdown for debugging/analytics
  breakdown.proximity = proximityScore;
  breakdown.locationMatch = locationMatchScore;
  breakdown.categoryMatch = categoryScore;
  breakdown.subcategoryMatch = subcategoryScore;
  breakdown.rating = ratingScore;
  breakdown.priceMatch = priceMatchScore;
  breakdown.openNow = place.open_now ? 1 : 0;
  breakdown.hasWebsite = place.website ? 1 : 0;
  breakdown.hasPhone = place.contacts?.length ? 1 : 0;
  breakdown.featuresMatch = featuresScore;
  breakdown.tagsMatch = tagsScore;
  breakdown.completeness = completenessScore;
  breakdown.nameMatch = nameMatchScore;

  // Calculate weighted total score
  const totalScore =
    proximityScore * weights.proximity +
    locationMatchScore * weights.locationMatch +
    categoryScore * weights.categoryMatch +
    subcategoryScore * weights.subcategoryMatch +
    ratingScore * weights.rating +
    priceMatchScore * weights.priceMatch +
    (place.open_now ? 1 : 0) * weights.openNow +
    (place.website ? 1 : 0) * weights.hasWebsite +
    (place.contacts?.length ? 1 : 0) * weights.hasPhone +
    featuresScore * weights.featuresMatch +
    tagsScore * weights.tagsMatch +
    completenessScore * weights.completeness +
    nameMatchScore * weights.nameMatch;

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
  places: PlaceResults[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG
): PlaceResults[] {
  // Early return for empty input
  if (!places.length) return [];

  // Score all places
  const scoredPlaces = places.map((place) =>
    computePlaceScore(place, query, config)
  );

  // Sort by score descending
  scoredPlaces.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    // Tiebreakers based on query parameters
    if (query.user_location && a.place.distance !== b.place.distance) {
      return (a.place.distance || Infinity) - (b.place.distance || Infinity);
    }

    if (query.min_rating && a.place.rating?.rate !== b.place.rating?.rate) {
      return (b.place.rating?.rate || 0) - (a.place.rating?.rate || 0);
    }

    if (query.open_now && a.place.open_now !== b.place.open_now) {
      return a.place.open_now ? -1 : 1;
    }

    // Final tiebreaker: higher rating
    return (b.place.rating?.rate || 0) - (a.place.rating?.rate || 0);
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
