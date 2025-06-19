import {
  Place,
  PlaceCategory,
  PlaceSubcategory,
  PlaceResults,
  PlaceResultsSummary,
} from '@/types/place';

export type ViewMode = 'map' | 'card' | 'list' | 'chat';
export type SearchMode = 'general' | 'chat';
export type SearchResultSource = 'local' | 'google';

// Sorting types
export type SortType = 'proximity' | 'rating' | 'price_level' | 'name' | 'none';

export type ProximitySortOrder = 'nearest_first' | 'farthest_first';
export type RatingSortOrder = 'highest_first' | 'lowest_first';
export type PriceLevelSortOrder = 'cheapest_first' | 'most_expensive_first';
export type NameSortOrder = 'a_to_z' | 'z_to_a';

export interface SortConfig {
  type: SortType;
  order:
    | ProximitySortOrder
    | RatingSortOrder
    | PriceLevelSortOrder
    | NameSortOrder;
  customLocation?: { lat: number; lng: number; name?: string };
}

export interface SortingCapabilities {
  canSortByProximity: boolean;
  canSortByRating: boolean;
  canSortByPriceLevel: boolean;
  hasDistanceData: boolean;
  needsLocationForProximity: boolean;
}

// Unified search result type that can be either local or Google
export interface SearchResult {
  source: SearchResultSource;
  place?: Place | PlaceResults; // Can be either Place (local) or PlaceResults (google/unified)
  // Common fields derived from either source
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
    name?: string;
  };
  rating?: {
    rate: number;
    count: number;
  };
  image?: string;
  description?: string;
  category?: string;
  tags?: string[];
}

export interface SearchFilters {
  categories: string[];
  subcategories: string[];
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  openNow?: boolean;
  features?: string[];
  sources?: SearchResultSource[]; // Filter by result source
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  results: PlaceResultsSummary[];
  viewMode: ViewMode;
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface SearchParams {
  q?: string;
  view?: ViewMode;
  category?: string;
  location?: string;
  page?: string;
}
