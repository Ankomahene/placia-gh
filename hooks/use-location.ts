/**
 * Enhanced Location Detection Hook
 *
 * Features:
 * - Session-level caching (30 minutes) to prevent unnecessary API calls
 * - GPS-based location detection with high/low accuracy fallback
 * - Manual location override capability
 * - Automatic address resolution with graceful degradation
 * - Cross-component state sharing via React Query
 *
 * Usage:
 * ```typescript
 * const { latitude, longitude, address, error, loading, source, setManualLocation } = useLocation();
 * ```
 *
 * Manual Override:
 * ```typescript
 * setManualLocation({ latitude: 5.6037, longitude: -0.1870, address: "Accra, Ghana" });
 * ```
 *
 * Cache Management:
 * ```typescript
 * import { clearLocationCache, wasLocationDenied } from '@/hooks/use-location';
 *
 * // Clear cache manually
 * clearLocationCache();
 *
 * // Check if user previously denied location
 * if (wasLocationDenied()) {
 *   // Show alternative UI or fallback
 * }
 * ```
 *
 * Performance:
 * - First call: Attempts geolocation detection
 * - Subsequent calls: Returns cached data instantly
 * - Cache expires after 30 minutes
 * - Shared across all components using the hook
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
  accuracy?: number;
  source?: 'high-accuracy' | 'low-accuracy' | 'cached' | 'manual';
}

interface ManualLocationOverride {
  latitude: number;
  longitude: number;
  address: string;
}

// Storage keys for caching
const LOCATION_CACHE_KEY = 'user-location-cache';
const LOCATION_PERMISSION_KEY = 'location-permission-status';
const MANUAL_LOCATION_KEY = 'manual-location-override';

// Cache duration (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

// Get manual location override from localStorage
function getManualLocationOverride(): LocationState | null {
  if (typeof window === 'undefined') return null;

  try {
    const manual = localStorage.getItem(MANUAL_LOCATION_KEY);
    if (!manual) return null;

    const data = JSON.parse(manual);
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      address: data.address,
      error: null,
      source: 'manual',
    };
  } catch {
    return null;
  }
}

// Set manual location override to localStorage
function setManualLocationOverride(location: ManualLocationOverride): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(MANUAL_LOCATION_KEY, JSON.stringify(location));
  } catch {
    // Ignore storage errors
  }
}

// Clear manual location override
function clearManualLocationOverride(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MANUAL_LOCATION_KEY);
}

// Get cached location from sessionStorage
function getCachedLocation(): LocationState | null {
  if (typeof window === 'undefined') return null;

  try {
    const cached = sessionStorage.getItem(LOCATION_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);

    // Check if cache is still valid
    if (Date.now() - timestamp < CACHE_DURATION) {
      return { ...data, source: 'cached' };
    }

    // Clear expired cache
    sessionStorage.removeItem(LOCATION_CACHE_KEY);
    return null;
  } catch {
    return null;
  }
}

// Cache location to sessionStorage
function cacheLocation(location: LocationState): void {
  if (typeof window === 'undefined') return;

  try {
    sessionStorage.setItem(
      LOCATION_CACHE_KEY,
      JSON.stringify({
        data: location,
        timestamp: Date.now(),
      })
    );
  } catch {
    // Ignore storage errors
  }
}

// GPS-based location detection (removed IP fallback for accuracy)
async function detectLocationGPS(): Promise<LocationState> {
  // First check for manual override
  const manualLocation = getManualLocationOverride();
  if (manualLocation) {
    return manualLocation;
  }

  // Then check for cached location
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by this browser');
  }

  // Try high accuracy first, then fallback to low accuracy
  const strategies = [
    {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000, // 1 minute
      source: 'high-accuracy' as const,
    },
    {
      enableHighAccuracy: false,
      timeout: 15000,
      maximumAge: 300000, // 5 minutes
      source: 'low-accuracy' as const,
    },
  ];

  for (const strategy of strategies) {
    try {
      const location = await attemptGeolocation(strategy);

      // Cache successful location
      cacheLocation(location);

      return location;
    } catch (error) {
      // Continue to next strategy
      console.warn(`Location strategy ${strategy.source} failed:`, error);
    }
  }

  // If all GPS methods fail, throw error instead of using inaccurate IP location
  throw new Error(
    'Unable to determine your location. Please enable location services or select manually.'
  );
}

// Single geolocation attempt
function attemptGeolocation(options: {
  enableHighAccuracy: boolean;
  timeout: number;
  maximumAge: number;
  source: 'high-accuracy' | 'low-accuracy';
}): Promise<LocationState> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude, accuracy } = position.coords;

          // Start with basic location data
          const locationData: LocationState = {
            latitude,
            longitude,
            address: null,
            error: null,
            accuracy,
            source: options.source,
          };

          // Try to get address (non-blocking)
          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16&addressdetails=1`,
              { signal: AbortSignal.timeout(8000) }
            );

            if (response.ok) {
              const data = await response.json();
              locationData.address =
                data.display_name?.split(',').slice(0, 3).join(',') || null;
            }
          } catch {
            // Address lookup failed, but we still have coordinates
            console.warn(
              'Address lookup failed, continuing with coordinates only'
            );
          }

          resolve(locationData);
        } catch (error) {
          reject(new Error('Failed to process location data'));
        }
      },
      (error) => {
        let errorMessage = 'Location detection failed';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage =
              'Location permission denied. Please enable location services or select manually.';
            // Remember permission denial to avoid repeated prompts
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage =
              'Location information unavailable. Please select manually.';
            break;
          case error.TIMEOUT:
            errorMessage =
              'Location request timed out. Please select manually.';
            break;
        }

        reject(new Error(errorMessage));
      },
      options
    );
  });
}

export function useLocation() {
  const queryClient = useQueryClient();

  const {
    data: location,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['user-location'],
    queryFn: detectLocationGPS,
    staleTime: CACHE_DURATION, // 30 minutes
    gcTime: CACHE_DURATION * 2, // 1 hour garbage collection
    retry: (failureCount, error) => {
      // Don't retry if permission was denied
      if (
        error instanceof Error &&
        error.message.includes('permission denied')
      ) {
        return false;
      }
      // Only retry once for other errors
      return failureCount < 1;
    },
    retryDelay: 3000,
  });

  // Force refetch by clearing all caches first
  const forceRefetch = async () => {
    // Clear session storage cache and permission status (but keep manual override)
    clearLocationCache();

    // Invalidate and remove React Query cache
    await queryClient.invalidateQueries({ queryKey: ['user-location'] });
    queryClient.removeQueries({ queryKey: ['user-location'] });

    // Force a fresh fetch
    return await refetch();
  };

  // Set manual location and update cache
  const setManualLocation = async (manualLocation: ManualLocationOverride) => {
    // Save manual override to localStorage
    setManualLocationOverride(manualLocation);

    // Update React Query cache
    const locationState: LocationState = {
      latitude: manualLocation.latitude,
      longitude: manualLocation.longitude,
      address: manualLocation.address,
      error: null,
      source: 'manual',
    };

    queryClient.setQueryData(['user-location'], locationState);

    // Also cache to session storage
    cacheLocation(locationState);
  };

  // Clear manual location and refetch
  const clearManualLocation = async () => {
    clearManualLocationOverride();
    return await forceRefetch();
  };

  return {
    ...location,
    error: error instanceof Error ? error.message : null,
    loading: isLoading || isFetching,
    refetch: forceRefetch,
    setManualLocation,
    clearManualLocation,
    isManualLocation: location?.source === 'manual',
  };
}

// Helper function to manually clear location cache
export function clearLocationCache(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(LOCATION_CACHE_KEY);
    sessionStorage.removeItem(LOCATION_PERMISSION_KEY);
  }
}

// Helper function to check if location permission was previously denied
export function wasLocationDenied(): boolean {
  if (typeof window === 'undefined') return false;
  return sessionStorage.getItem(LOCATION_PERMISSION_KEY) === 'denied';
}
