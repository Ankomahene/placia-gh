import { PriceLevelLabel } from './place';

export type SearchType = 'proximity' | 'rating' | 'price_level' | 'general';

export interface StructuredSearchQuery {
  query: string;
  location?: string;
  category?: string;
  subcategory?: string;
  type?: string;
  radius_meters?: number;
  min_rating?: number;
  min_price_level?: number; // Direct numeric value (1-4)
  max_price_level?: number; // Direct numeric value (1-4)
  open_now?: boolean;
  has_website?: boolean;
  has_phone?: boolean;
  region?: string;
  language?: string;
  user_location?: { lat: number; lng: number };
  search_type?: SearchType;
  features?: string[];
  tags?: string[];
  opened_at?: string;
  sort_order?: string; // Exact database function sort order
}

export interface GooglePlaceSearchResult {
  place_id: string;
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  types: string[];
  vicinity?: string;
  formatted_address?: string;
  open_now?: boolean;
}

export interface FormattedGooglePlaceSearchResult {
  placeId: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  gallery?: string[];
  rating?: number;
  totalReviews?: number;
  priceLevel?: number;
  types?: string[];
  vicinity?: string;
  formattedAddress?: string;
  openNow?: boolean;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  formatted_phone_number?: string;
  website?: string;
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  photos?: {
    photo_reference: string;
    height: number;
    width: number;
  }[];
  reviews?: {
    text: string;
    rating: number;
    author_name: string;
    time: number;
  }[];
  types: string[];
  opening_hours?: {
    open_now: boolean;
    weekday_text: string[];
  };
  url?: string;
}

export interface GoogleGeocodingResult {
  address_components: {
    long_name: string;
    short_name: string;
    types: string[];
  }[];
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  place_id: string;
  types: string[];
}
