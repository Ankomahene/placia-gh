export interface NominatimPlace {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  class: string;
  type: string;
  importance: number;
  icon?: string;
  address?: {
    house_number?: string;
    road?: string;
    neighbourhood?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    region?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  extratags?: Record<string, string>;
  namedetails?: Record<string, string>;
}

export interface MappedPlace {
  id: string;
  name: string;
  description: string;
  location: {
    lng: number;
    lat: number;
    name: string;
    street_address: string;
  };
  source: 'osm';
  source_link: string;
  raw_data: NominatimPlace;
}

export interface LocationMatch {
  country_id?: string;
  region_id?: string;
  city_id?: string;
  town_id?: string;
}
