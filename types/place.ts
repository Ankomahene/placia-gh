export interface PlaceCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

export interface PlaceSubcategory {
  id: string;
  category_id: string; // FK to place_categories.id
  name: string;
  slug: string;
  icon: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

export interface PlaceType {
  id: string;
  subcategory_id: string; // FK to place_subcategories.id
  name: string;
  slug: string;
  icon: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

export interface Ownership {
  id: string;
  name: string; // e.g., Public, Private, International
  slug: string;
  icon: string;
  description: string;
  created_at: Date;
  updated_at: Date;
};

export interface Place {
  id: string;
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  contacts?: string[];
  email?: string;
  icon?: string;
  logo?: string;
  main_image: string;
  gallery: string[];
  
  country: {lng: number; lat: number; name: string; code?: string};
  region?: {lng: number; lat: number; name: string};
  city?: {lng: number; lat: number; name: string};
  location: {lng: number; lat: number; name: string; street_address: string};
  
  website?: string;
  socials?: {platform_name?: string; link: string}[];
  
  category_id: string; // FK to place_categories.id
  subcategory_id: string; // FK to place_subcategories.id
  type_id: string | null; // optional, FK to place_types.id
  ownership_id: string | null; // optional, FK to ownerships.id

  rating: {rate: number, count};
  open_hours?: {
    day: string; 
    from: string;
    to: string;
  }[];
  features?: {label: string, icon: string}[];
  services?: {label: string, icon: string}[];
  tags: string[];
  
  created_at: Date;
  updated_at: Date;

  other_details: object;
};

export interface UserUploadedPhotosForPlace {
  id: string;
  place_id: string;
  user_id: string;
  photos: string[];
  comment: string;
  created_at: Date;
  updated_at: Date;
}

