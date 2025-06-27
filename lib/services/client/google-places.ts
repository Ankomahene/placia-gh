import { AddressType, Client } from '@googlemaps/google-maps-services-js';

const client = new Client({});
const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY!;

if (!GOOGLE_API_KEY) {
  throw new Error('GOOGLE_API_KEY environment variable is required');
}

export async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number }> {
  try {
    const response = await client.geocode({
      params: {
        address: location,
        key: GOOGLE_API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      throw new Error('No results found');
    }

    const { lat, lng } = response.data.results[0].geometry.location;
    return { lat, lng };
  } catch (error) {
    console.error('Error geocoding location:', error);
    throw error;
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<{ city?: string; region?: string }> {
  try {
    const response = await client.reverseGeocode({
      params: {
        latlng: { lat, lng },
        key: GOOGLE_API_KEY,
      },
    });

    if (response.data.results.length === 0) {
      return {};
    }

    let city, region;

    // Parse the address components to find city and region
    for (const result of response.data.results) {
      for (const component of result.address_components) {
        if (component.types.includes(AddressType.locality)) {
          city = component.long_name;
        }
        if (component.types.includes(AddressType.administrative_area_level_1)) {
          region = component.long_name;
        }
      }
      if (city && region) break;
    }

    return { city, region };
  } catch (error) {
    console.error('Error in reverse geocoding:', error);
    return {};
  }
}

export function getGooglePhotoUrl(
  photoReference: string,
  maxWidth: number = 400
): string {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxWidth}&photo_reference=${photoReference}&key=${GOOGLE_API_KEY}`;
}
