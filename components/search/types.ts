import {
  Place,
  PlaceCategory,
  PlaceSubcategory,
  PlaceResults,
} from '@/types/place';

export type ViewMode = 'map' | 'card' | 'list';
export type SearchResultSource = 'local' | 'google';

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
  results: SearchResult[];
  totalResults: number;
  currentPage: number;
  hasMore: boolean;
  viewMode: ViewMode;
  filters: SearchFilters;
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
