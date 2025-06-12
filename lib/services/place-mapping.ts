import { v4 as uuid } from 'uuid';
import slugify from 'slugify';
import { GooglePlaceDetails } from '@/types/search';
import { Place } from '@/types/place';
import { getGooglePhotoUrl } from './google-places';

// Mapping Google place types to our categories
const GOOGLE_TYPE_TO_CATEGORY: Record<
  string,
  { category: string; subcategory?: string }
> = {
  restaurant: { category: 'Food & Drink', subcategory: 'Restaurant' },
  cafe: { category: 'Food & Drink', subcategory: 'Coffee Shop' },
  bar: { category: 'Food & Drink', subcategory: 'Bar' },
  hospital: { category: 'Healthcare', subcategory: 'Hospital' },
  bank: { category: 'Finance', subcategory: 'Bank' },
  shopping_mall: { category: 'Shopping', subcategory: 'Mall' },
  school: { category: 'Education', subcategory: 'School' },
  gym: { category: 'Health & Fitness', subcategory: 'Gym' },
};

// Mock function to get category ID - replace with actual database lookup
async function getCategoryIdFromName(categoryName: string): Promise<string> {
  const categoryMap: Record<string, string> = {
    'Food & Drink': 'cat-food-drink-001',
    Healthcare: 'cat-healthcare-001',
    Finance: 'cat-finance-001',
    Shopping: 'cat-shopping-001',
    Education: 'cat-education-001',
    'Health & Fitness': 'cat-health-fitness-001',
  };
  return categoryMap[categoryName] || 'cat-general-001';
}

// Map Google place types to our category system
function mapGoogleTypesToCategory(googleTypes: string[]): {
  category: string;
  subcategory?: string;
} {
  for (const type of googleTypes) {
    if (GOOGLE_TYPE_TO_CATEGORY[type]) {
      return GOOGLE_TYPE_TO_CATEGORY[type];
    }
  }
  return { category: 'General', subcategory: 'Other' };
}

// Main transformation function
export async function transformGooglePlaceToLocalModel(
  googlePlace: GooglePlaceDetails,
  addedBy: string = 'system'
): Promise<Place> {
  try {
    // Map category information
    const categoryInfo = mapGoogleTypesToCategory(googlePlace.types);
    const category_id = await getCategoryIdFromName(categoryInfo.category);

    // Generate gallery from photos
    const gallery =
      googlePlace.photos?.map((photo) =>
        getGooglePhotoUrl(photo.photo_reference, 800)
      ) || [];

    // Get description from reviews or create default
    const description =
      googlePlace.reviews?.[0]?.text ||
      `${categoryInfo.category} located at ${googlePlace.formatted_address}`;

    const place: Place = {
      id: uuid(),
      name: googlePlace.name,
      slug: slugify(googlePlace.name, { lower: true, strict: true }),
      description: description.substring(0, 500),
      contacts: googlePlace.formatted_phone_number
        ? [googlePlace.formatted_phone_number]
        : undefined,
      website: googlePlace.website,
      location: {
        lat: googlePlace.geometry.location.lat,
        lng: googlePlace.geometry.location.lng,
        name: googlePlace.name,
        street_address: googlePlace.formatted_address,
      },
      country_id: 'gh-001', // Mock Ghana ID - replace with actual lookup
      region_id: 'gh-gr-001', // Mock Greater Accra ID
      city_id: 'gh-gr-accra-001', // Mock Accra ID
      category_id,
      subcategory_id: category_id, // Using same for now
      rating: googlePlace.rating
        ? {
            rate: googlePlace.rating,
            count: googlePlace.user_ratings_total || 0,
          }
        : undefined,
      gallery: gallery.length > 0 ? gallery : undefined,
      tags: googlePlace.types,
      source: 'google',
      source_link: googlePlace.url,
      added_by: addedBy,
      status: 'pending' as const,
      created_at: new Date(),
      updated_at: new Date(),
    };

    return place;
  } catch (error) {
    console.error('Error transforming Google place to local model:', error);
    throw new Error('Failed to transform place data');
  }
}
