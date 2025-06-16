/**
 * Check if a place is currently open based on open_hours data
 */
export function isPlaceOpenNow(
  openHours?: {
    day: string;
    from: string;
    to: string;
  }[]
): boolean | 'unknown' {
  if (!openHours || openHours.length === 0) {
    return 'unknown';
  }

  const now = new Date();
  const currentDay = now
    .toLocaleDateString('en-US', { weekday: 'short' })
    .toLowerCase(); // mon, tue, wed, etc.
  const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

  const todayHours = openHours.find(
    (hours) => hours.day.toLowerCase().substring(0, 3) === currentDay
  );

  if (!todayHours) {
    return 'unknown';
  }

  // Handle closed all day
  if (todayHours.from === 'closed' || todayHours.to === 'closed') {
    return false;
  }

  // Handle 24/7
  if (todayHours.from === '00:00' && todayHours.to === '23:59') {
    return true;
  }

  try {
    const openTime = todayHours.from;
    const closeTime = todayHours.to;

    // Simple time comparison (assuming 24-hour format)
    if (currentTime >= openTime && currentTime <= closeTime) {
      return true;
    }

    // Handle overnight hours (e.g., 22:00 to 06:00)
    if (openTime > closeTime) {
      return currentTime >= openTime || currentTime <= closeTime;
    }

    return false;
  } catch (error) {
    console.warn('Error parsing open hours:', error);
    return 'unknown';
  }
}

/**
 * Safely extract array of labels from features/services/accessibility
 */
export function extractLabels(
  items?: { label: string; icon?: string }[]
): string[] {
  return items?.map((item) => item.label) || [];
}

/**
 * Get safe image gallery, handling missing main_image and gallery
 */
export function getSafeImageGallery(
  gallery?: string[],
  mainImage?: string
): string[] {
  const images: string[] = [];

  if (mainImage) {
    images.push(mainImage);
  }

  if (gallery && gallery.length > 0) {
    // Add gallery images that aren't already in the list
    gallery.forEach((img) => {
      if (!images.includes(img)) {
        images.push(img);
      }
    });
  }

  return images;
}

/**
 * Simple geocoding fallback with expanded Ghana locations
 */
export async function geocodeLocationInternal(
  location: string
): Promise<{ lat: number; lng: number }> {
  const locationMappings: { [key: string]: { lat: number; lng: number } } = {
    // Major cities
    accra: { lat: 5.6037, lng: -0.187 },
    kumasi: { lat: 6.6885, lng: -1.6244 },
    takoradi: { lat: 4.8845, lng: -1.7554 },
    'cape coast': { lat: 5.1053, lng: -1.2466 },
    tamale: { lat: 9.4008, lng: -0.8393 },

    // Accra areas
    'east legon': { lat: 5.6279, lng: -0.1558 },
    airport: { lat: 5.6052, lng: -0.1679 },
    'airport residential': { lat: 5.6052, lng: -0.1679 },
    cantonments: { lat: 5.5712, lng: -0.1963 },
    labone: { lat: 5.5562, lng: -0.1765 },
    osu: { lat: 5.5562, lng: -0.1765 },
    'ring road': { lat: 5.5984, lng: -0.2057 },
    adabraka: { lat: 5.5984, lng: -0.2057 },
    kokomlemle: { lat: 5.6037, lng: -0.2057 },
    asylum: { lat: 5.5851, lng: -0.2057 },
    'asylum down': { lat: 5.5851, lng: -0.2057 },

    // Other regions
    sunyani: { lat: 7.3387, lng: -2.3265 },
    bolgatanga: { lat: 10.7856, lng: -0.8516 },
    wa: { lat: 10.0601, lng: -2.5057 },
    koforidua: { lat: 6.0889, lng: -0.2632 },

    // Universities
    'university of ghana': { lat: 5.6515, lng: -0.1866 },
    'ug legon': { lat: 5.6515, lng: -0.1866 },
    knust: { lat: 6.6745, lng: -1.5716 },
    ucc: { lat: 5.1053, lng: -1.2466 },
  };

  const normalizedLocation = location.toLowerCase().trim();

  if (locationMappings[normalizedLocation]) {
    return locationMappings[normalizedLocation];
  }

  // Default to Accra if location not found
  console.warn(
    `Location "${location}" not found in mappings, defaulting to Accra`
  );
  return { lat: 5.6037, lng: -0.187 };
}
