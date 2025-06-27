import { User } from './user';

export interface Country {
  id: string;
  name: string;
  numeric_code?: string;
  phonecode?: string;
  capital?: string;
  currency?: string;
  currency_name?: string;
  currency_symbol?: string;
  region?: string;
  region_id?: string;
  subregion?: string;
  subregion_id?: string;
  nationality?: string;
  longitude: number;
  latitude: number;
  emoji?: string;
  emojiU?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Region {
  id: string;
  name: string;
  country_id: string;
  longitude: number;
  latitude: number;
  is_unmatched?: boolean;
  source_address?: string;
  original_search_term?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface City {
  id: string;
  name: string;
  region_id: string;
  longitude: number;
  latitude: number;
  is_unmatched?: boolean;
  source_address?: string;
  original_search_term?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Town {
  id: string;
  name: string;
  city_id: string; // FK to cities.id
  alternatenames?: string; //comma separated list of alternate names
  longitude: number;
  latitude: number;
  is_unmatched?: boolean;
  source_address?: string;
  original_search_term?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlaceCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlaceSubcategory {
  id: string;
  category_id: string; // FK to place_categories.id
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  grouping_id?: string;
}

export interface PlaceType {
  id: string;
  subcategory_id: string; // FK to place_subcategories.id
  name: string;
  slug: string;
  icon?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface Ownership {
  id: string;
  subcategory_id: string; // FK to place_subcategories.id
  type: string; // e.g., Public, Private, International
  slug: string;
  icon?: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface PlaceGrouping {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  created_at?: string; // ISO string
  updated_at?: string;
}

export interface PlaceField {
  id: string;
  name: string; // e.g. "contacts"
  label: string; // e.g. "Contact Numbers"
  field_type: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date';
  is_array: boolean;
  is_object: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaceGroupingSchema {
  id: string;
  grouping_id: string; // FK to PlaceGrouping
  field_id: string; // FK to PlaceField
  required: boolean;
  created_at: string;
  updated_at: string;

  // Optional expanded references for easier frontend use
  field?: PlaceField;
}

export interface ExpandedPlaceGrouping extends PlaceGrouping {
  types: PlaceType[];
  schema: {
    required: PlaceField[];
    optional: PlaceField[];
  };
}

export interface Place {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  contacts?: string[];
  email?: string;
  icon?: string;
  logo?: string;
  main_image?: string;
  gallery?: string[];

  country_id: string; // Foreign Key to countries.id (int8)
  region_id: string; // Foreign Key to regions.id (int8)
  city_id: string; // Foreign Key to cities.id (int8)
  location: { lng: number; lat: number; name: string; street_address: string };
  town_id?: string;

  website?: string;
  socials?: { platform_name?: string; link: string }[];

  category_id: string; // Foreign Key to categories.id
  subcategory_id: string; // Foreign Key to subcategories.id
  type_id?: string | null; // optional, Foreign Key to types.id
  ownership_id?: string | null; // optional, Foreign Key to ownerships.id

  rating?: { rate: number; count: number };

  distance?: number;
  open_hours?: {
    day: string;
    from: string;
    to: string;
  }[];
  features?: { label: string; icon: string }[];
  services?: { label: string; icon: string }[];
  tags?: string[];
  accessibility?: { label: string; icon: string }[];

  created_at?: Date;
  updated_at?: Date;

  other_details?: object;
  source?: string;
  source_link?: string;

  added_by: string;
  status:
    | 'pending'
    | 'scraped'
    | 'approved'
    | 'rejected'
    | 'archived'
    | 'draft';
  isBusinessPlace?: boolean;
  isFeatured?: boolean;
}

export type PriceLevelLabel =
  | 'very_expensive'
  | 'expensive'
  | 'moderate'
  | 'budget_friendly';
export type RatingLevelLabel =
  | 'highly_rated'
  | 'well_rated'
  | 'moderately_rated'
  | 'poorly_rated';

export interface PlaceResults {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description: string;
  contacts?: string[];
  email?: string;
  logo?: string;
  main_image?: string;
  gallery?: string[];

  country: Partial<Country>;
  region: Partial<Region>;
  city: Partial<City>;
  location: { lng: number; lat: number; name: string; street_address: string };

  website?: string;
  socials?: { platform_name?: string; link: string }[];

  category: PlaceCategory;
  subcategory: PlaceSubcategory;
  type?: PlaceType | null;
  ownership?: Ownership | null;

  rating?: { rate: number; count: number };
  rate_average?: number;
  rate_count?: number;
  rate_label?: RatingLevelLabel;
  price_level?: number; // 0-4 price scale
  price_level_count?: number;
  price_level_label?: PriceLevelLabel;

  distance?: number;
  open_hours?: {
    day: string;
    from: string;
    to: string;
  }[];
  open_now?: boolean | 'unknown';

  features?: { label: string; icon: string }[];
  services?: { label: string; icon: string }[];
  tags?: string[];
  accessibility?: { label: string; icon: string }[];

  created_at: Date;
  updated_at: Date;

  other_details?: object;
  source?: string;
  source_link?: string;

  added_by?: string;
  status:
    | 'pending'
    | 'scraped'
    | 'approved'
    | 'rejected'
    | 'archived'
    | 'draft';

  // Google Places specific fields (optional)
  google_place_id?: string;
  google_place_types?: string[];
  business_status?: string;
  formatted_address?: string;
  international_phone_number?: string;
  vicinity?: string;
  isBusinessPlace?: boolean;
}

export interface PlaceResultsSummary {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  main_image?: string;
  gallery?: string[];

  country: Partial<Country>;
  region: Partial<Region>;
  city: Partial<City>;
  location: { lng: number; lat: number; name: string; street_address: string };

  category: Partial<PlaceCategory>;
  subcategory: Partial<PlaceSubcategory>;
  type?: Partial<PlaceType> | null;
  ownership?: Partial<Ownership> | null;

  rate_average?: number;
  rate_count?: number;
  rate_label?: RatingLevelLabel;
  price_level?: number; // 0-4 price scale
  price_level_count?: number;
  price_level_label?: PriceLevelLabel;

  distance?: number;
  open_now?: boolean | 'unknown';

  features?: { label: string; icon: string }[];
  services?: { label: string; icon: string }[];
  tags?: string[];
  accessibility?: { label: string; icon: string }[];
  source?: string;

  // Google Places specific fields (optional)
  google_place_types?: string[];
  business_status?: string;
  formatted_address?: string;
  vicinity?: string;
  isBusinessPlace?: boolean;
}

export interface UserUploadedPhotosForPlace {
  id: string;
  place_id: string;
  user_id: string;
  photos: string[];
  comment?: string;
  likes: string[]; // Array of user IDs who liked this
  created_at: Date;
  updated_at: Date;
  user?: Partial<User>;
}

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment?: string; // Database field name
  text?: string; // For Google reviews and backward compatibility
  likes: string[]; // Array of user IDs who liked this review
  user?: Partial<User>;
  created_at: Date;
  updated_at: Date;
  // Optional Google-specific data for Google reviews
  google_data?: {
    author_url: string;
    relative_time_description: string;
    language: string;
    translated: boolean;
  };
  // Additional fields to match database
  author_name?: string;
  author_email?: string;
}

export interface ReviewLikes {
  id: string;
  review_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  user?: Partial<User>;
}

export interface UploadedPhotosLikes {
  id: string;
  photo_id: string;
  user_id: string;
  created_at: Date;
  updated_at: Date;
  user?: Partial<User>;
}
