import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculate the distance between two geographical coordinates using the Haversine formula
 * @param lat1 - Latitude of the first location
 * @param lon1 - Longitude of the first location
 * @param lat2 - Latitude of the second location
 * @param lon2 - Longitude of the second location
 * @param unit - Unit of measurement ('km' for kilometers, 'mi' for miles, 'm' for meters)
 * @returns Distance between the two coordinates
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'mi' | 'm' = 'km'
): number {
  // Convert degrees to radians
  const toRadians = (degrees: number) => degrees * (Math.PI / 180);

  const R = unit === 'km' ? 6371 : unit === 'mi' ? 3959 : 6371000; // Earth's radius

  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c;

  // Round to 2 decimal places
  return Math.round(distance * 100) / 100;
}

/**
 * Calculate distance and return formatted string with unit
 * @param lat1 - Latitude of the first location
 * @param lon1 - Longitude of the first location
 * @param lat2 - Latitude of the second location
 * @param lon2 - Longitude of the second location
 * @param unit - Unit of measurement ('km' for kilometers, 'mi' for miles, 'm' for meters)
 * @returns Formatted distance string (e.g., "5.2 km", "3.1 mi")
 */
export function getFormattedDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'km' | 'mi' | 'm' = 'km'
): string {
  const distance = calculateDistance(lat1, lon1, lat2, lon2, unit);
  return `${distance} ${unit}`;
}
