export interface ScoringWeights {
  proximity: number;
  locationMatch: number;
  categoryMatch: number;
  subcategoryMatch: number;
  rating: number;
  priceMatch: number;
  openNow: number;
  hasWebsite: number;
  hasPhone: number;
  featuresMatch: number;
  tagsMatch: number;
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
  place: import('./place').Place;
  score: number;
  breakdown: Partial<Record<keyof ScoringWeights, number>>;
}

export interface DistanceResult {
  distance: number;
  score: number;
}
