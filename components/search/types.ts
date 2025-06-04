import { Place, PlaceCategory, PlaceSubcategory } from '@/types/place';

export type ViewMode = 'map' | 'card' | 'list';

export interface SearchFilters {
  categories: string[];
  subcategories: string[];
  priceRange?: [number, number];
  rating?: number;
  distance?: number;
  openNow?: boolean;
  features?: string[];
}

export interface SearchState {
  query: string;
  isSearching: boolean;
  results: Place[];
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
