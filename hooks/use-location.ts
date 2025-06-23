/**
 * Enhanced Location Detection Hook
 *
 * Features:
 * - Session-level caching (30 minutes) to prevent unnecessary API calls
 * - Progressive fallback strategy: High accuracy → Low accuracy → IP-based location
 * - Smart retry logic that respects permission denials
 * - Automatic address resolution with graceful degradation
 * - Cross-component state sharing via React Query
 *
 * Usage:
 * ```typescript
 * const { latitude, longitude, address, error, loading, source } = useLocation();
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

import { useQuery } from '@tanstack/react-query';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
  accuracy?: number;
  source?: 'high-accuracy' | 'low-accuracy' | 'cached' | 'ip';
}

// Storage keys for caching
const LOCATION_CACHE_KEY = 'user-location-cache';
const LOCATION_PERMISSION_KEY = 'location-permission-status';

// Cache duration (30 minutes)
const CACHE_DURATION = 30 * 60 * 1000;

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

// Get IP-based location as fallback
async function getIPLocation(): Promise<LocationState> {
  try {
    const response = await fetch('https://ipapi.co/json/', {
      timeout: 5000,
    } as any);

    if (!response.ok) throw new Error('IP location failed');

    const data = await response.json();

    if (data.latitude && data.longitude) {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        address: `${data.city}, ${data.region}`,
        error: null,
        accuracy: 10000, // Low accuracy for IP-based location
        source: 'ip',
      };
    }

    throw new Error('Invalid IP location data');
  } catch {
    throw new Error('IP location unavailable');
  }
}

// Progressive location detection with fallbacks
async function detectLocationProgressive(): Promise<LocationState> {
  // First, try to get cached location
  const cached = getCachedLocation();
  if (cached) {
    return cached;
  }

  if (!navigator.geolocation) {
    // Fallback to IP-based location
    return await getIPLocation();
  }

  // Try high accuracy first, then fallback to low accuracy
  const strategies = [
    {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 60000, // 1 minute
      source: 'high-accuracy' as const,
    },
    {
      enableHighAccuracy: false,
      timeout: 10000,
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
      console.log(`Location strategy ${strategy.source} failed:`, error);
    }
  }

  // Final fallback to IP-based location
  try {
    const ipLocation = await getIPLocation();
    cacheLocation(ipLocation);
    return ipLocation;
  } catch {
    throw new Error('All location detection methods failed');
  }
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
              { signal: AbortSignal.timeout(5000) }
            );

            if (response.ok) {
              const data = await response.json();
              locationData.address =
                data.display_name?.split(',').slice(0, 3).join(',') || null;
            }
          } catch {
            // Address lookup failed, but we still have coordinates
            console.log(
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
            errorMessage = 'Location permission denied';
            // Remember permission denial to avoid repeated prompts
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(LOCATION_PERMISSION_KEY, 'denied');
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out';
            break;
        }

        reject(new Error(errorMessage));
      },
      options
    );
  });
}

export function useLocation() {
  const {
    data: location,
    error,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['user-location'],
    queryFn: detectLocationProgressive,
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
    retryDelay: 2000,
  });

  return {
    ...location,
    error: error instanceof Error ? error.message : null,
    loading: isLoading || isFetching,
    refetch,
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
