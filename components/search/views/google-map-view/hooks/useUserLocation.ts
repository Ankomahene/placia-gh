import { useState, useEffect } from 'react';

interface UserLocationState {
  userLocation: { lat: number; lng: number } | null;
  isLoadingLocation: boolean;
  locationError: string | null;
}

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    userLocation: null,
    isLoadingLocation: false,
    locationError: null,
  });

  useEffect(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        locationError: 'Geolocation is not supported by this browser.',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isLoadingLocation: true }));

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000, // 5 minutes
    };

    const successCallback = (position: GeolocationPosition) => {
      setState({
        userLocation: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        isLoadingLocation: false,
        locationError: null,
      });
    };

    const errorCallback = (error: GeolocationPositionError) => {
      let errorMessage = 'Unable to retrieve your location.';

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Location access denied by user.';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Location information is unavailable.';
          break;
        case error.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
      }

      setState({
        userLocation: null,
        isLoadingLocation: false,
        locationError: errorMessage,
      });
    };

    navigator.geolocation.getCurrentPosition(
      successCallback,
      errorCallback,
      options
    );
  }, []);

  return state;
}
