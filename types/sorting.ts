export interface ScoringWeights {
  // Dynamic weights - adjusted based on query
  proximity: number; // Highest when location/radius specified
  locationMatch: number; // High when location specified
  rating: number; // High when min_rating specified
  nameMatch: number; // High when no location/rating criteria

  // Supporting weights
  categoryMatch: number;
  subcategoryMatch: number;
  openNow: number;

  // Additional context weights
  featuresMatch: number;
  tagsMatch: number;
  hasWebsite: number;
  hasPhone: number;
  priceMatch: number;
  completeness: number;
}

export interface ScoringConfig {
  weights: ScoringWeights;
  maxProximityKm: number;
  ratingBoostThreshold: number;
  completenessFactors: {
    hasDescription: number;
    hasPhotos: number;
    hasOpenHours: number;
    hasContact: number;
    hasWebsite: number;
  };
}

export interface PlaceScore {
  place: import('./place').PlaceResults;
  score: number;
  breakdown: Partial<Record<keyof ScoringWeights, number>>;
}

export interface DistanceResult {
  distance: number;
  score: number;
}
