import { useQuery } from '@tanstack/react-query';

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
}

async function detectLocation(): Promise<LocationState> {
  if (!navigator.geolocation) {
    throw new Error('Geolocation is not supported by your browser');
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // Fetch address using reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );

          if (!response.ok) throw new Error('Failed to fetch address');

          const data = await response.json();
          const address = data.display_name.split(',').slice(0, 2).join(',');

          resolve({
            latitude,
            longitude,
            address,
            error: null,
          });
        } catch (error) {
          reject(new Error('Failed to fetch location details'));
        }
      },
      (error) => {
        let errorMessage = 'Failed to get location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied';
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
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
      }
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
    queryKey: ['location'],
    queryFn: detectLocation,
    retry: false,
    staleTime: 5 * 60 * 1000, // Consider data stale after 5 minutes
  });

  return {
    ...location,
    error: error instanceof Error ? error.message : null,
    loading: isLoading || isFetching,
    refetch,
  };
}
