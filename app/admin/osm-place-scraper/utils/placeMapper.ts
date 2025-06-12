import { v4 as uuidv4 } from 'uuid';
import slugify from 'slugify';
import { Place } from '@/types/place';
import { MappedPlace, NominatimPlace } from '../types';

export function generateSlug(
  name: string,
  location?: string,
  osmId?: string | number
): string {
  const text = location ? `${name} ${location}` : name;

  // Use slugify package for better handling of special characters and edge cases
  const baseSlug = slugify(text, {
    lower: true,
    strict: true, // Remove special characters
    trim: true,
  });

  // Add OSM ID suffix to ensure uniqueness
  const uniqueSlug = osmId ? `${baseSlug}-${osmId}` : baseSlug;

  return uniqueSlug.slice(0, 100);
}

export function mapToPlaceModel(mappedPlace: MappedPlace): Partial<Place> {
  const place = mappedPlace.raw_data;

  return {
    id: uuidv4(), // Generate UUID for database
    name: mappedPlace.name,
    slug: generateSlug(
      mappedPlace.name,
      extractLocationName(place),
      place.osm_id
    ),
    description: mappedPlace.description,

    // Location data
    location: mappedPlace.location,

    // These will need to be mapped to your existing database IDs
    country_id: '', // Will need location matching logic
    region_id: '', // Will need location matching logic
    city_id: '', // Will need location matching logic

    // Category mapping - will need to be determined based on OSM tags
    category_id: '', // Will need category mapping logic
    subcategory_id: '', // Will need subcategory mapping logic
    type_id: null,
    ownership_id: null,

    // OSM specific data
    source: 'osm',
    source_link: mappedPlace.source_link,
    other_details: {
      osm_id: place.osm_id,
      osm_type: place.osm_type,
      osm_class: place.class,
      osm_type_detail: place.type,
      importance: place.importance,
      raw_nominatim_data: place,
    },

    // Default values
    added_by: 'admin', // You might want to use actual admin user ID
    status: 'scraped' as const,

    // Optional fields that could be extracted from OSM
    contacts: extractContacts(place),
    website: extractWebsite(place),

    created_at: new Date(),
    updated_at: new Date(),
  };
}

function extractLocationName(place: NominatimPlace): string {
  const address = place.address;
  if (!address) return '';

  // Build a more specific location string with multiple components
  const locationParts: string[] = [];

  // Add specific area/suburb if available
  if (address.suburb) locationParts.push(address.suburb);
  if (address.neighbourhood) locationParts.push(address.neighbourhood);

  // Add city/town/village
  if (address.city) locationParts.push(address.city);
  else if (address.town) locationParts.push(address.town);
  else if (address.village) locationParts.push(address.village);

  // Add county/district if no city/town/village
  if (locationParts.length === 0 && address.county) {
    locationParts.push(address.county);
  }

  // Add state/region for additional context
  if (address.state && locationParts.length > 0) {
    locationParts.push(address.state);
  }

  return locationParts.join(' ');
}

function extractContacts(place: NominatimPlace): string[] | undefined {
  const contacts: string[] = [];

  if (place.extratags?.phone) {
    contacts.push(place.extratags.phone);
  }

  if (place.extratags?.['contact:phone']) {
    contacts.push(place.extratags['contact:phone']);
  }

  return contacts.length > 0 ? contacts : undefined;
}

function extractWebsite(place: NominatimPlace): string | undefined {
  if (place.extratags?.website) {
    return place.extratags.website;
  }

  if (place.extratags?.['contact:website']) {
    return place.extratags['contact:website'];
  }

  return undefined;
}

export function inferCategoryFromOSM(place: NominatimPlace): {
  category: string;
  subcategory: string;
  suggested_type?: string;
} {
  const osmClass = place.class;
  const osmType = place.type;

  // This is a basic mapping - you'll want to expand this based on your categories
  const categoryMappings: Record<
    string,
    { category: string; subcategory: string; type?: string }
  > = {
    'amenity:school': { category: 'education', subcategory: 'schools' },
    'amenity:university': {
      category: 'education',
      subcategory: 'universities',
    },
    'amenity:hospital': { category: 'healthcare', subcategory: 'hospitals' },
    'amenity:clinic': { category: 'healthcare', subcategory: 'clinics' },
    'amenity:restaurant': { category: 'food', subcategory: 'restaurants' },
    'amenity:cafe': { category: 'food', subcategory: 'cafes' },
    'amenity:bank': { category: 'finance', subcategory: 'banks' },
    'amenity:fuel': { category: 'automotive', subcategory: 'fuel_stations' },
    'shop:supermarket': { category: 'shopping', subcategory: 'supermarkets' },
    'tourism:hotel': { category: 'accommodation', subcategory: 'hotels' },
    'leisure:park': { category: 'recreation', subcategory: 'parks' },
  };

  const key = `${osmClass}:${osmType}`;
  const mapping = categoryMappings[key];

  if (mapping) {
    return {
      category: mapping.category,
      subcategory: mapping.subcategory,
      suggested_type: mapping.type,
    };
  }

  // Fallback to generic mappings
  return {
    category: osmClass || 'general',
    subcategory: osmType || 'other',
  };
}
