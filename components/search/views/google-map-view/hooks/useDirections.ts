import { useState, useCallback } from 'react';
import { DirectionsInfo } from '../types';
import { PlaceResultsSummary } from '@/types/place';

interface DirectionsState {
  directionsInfo: DirectionsInfo | null;
  isLoadingDirections: boolean;
}

export function useDirections() {
  const [state, setState] = useState<DirectionsState>({
    directionsInfo: null,
    isLoadingDirections: false,
  });

  const requestDirections = useCallback(
    async (
      origin: { lat: number; lng: number },
      destination: { lat: number; lng: number },
      place: PlaceResultsSummary
    ) => {
      setState((prev) => ({
        ...prev,
        isLoadingDirections: true,
        directionsInfo: {
          destination: {
            id: place.id,
            position: destination,
            name: place.name,
            address:
              place.location.name || place.formatted_address || place.vicinity,
            rating: place.rate_average,
            category: place.category?.name || 'Place',
            image: place.main_image,
          },
          isLoading: true,
        },
      }));

      try {
        // Check if Google Maps API is loaded
        if (
          typeof window !== 'undefined' &&
          (window as any).google &&
          (window as any).google.maps
        ) {
          const directionsService = new (
            window as any
          ).google.maps.DirectionsService();

          const request = {
            origin: new (window as any).google.maps.LatLng(
              origin.lat,
              origin.lng
            ),
            destination: new (window as any).google.maps.LatLng(
              destination.lat,
              destination.lng
            ),
            travelMode: (window as any).google.maps.TravelMode.DRIVING,
            unitSystem: (window as any).google.maps.UnitSystem.METRIC,
            avoidHighways: false,
            avoidTolls: false,
          };

          directionsService.route(request, (result: any, status: any) => {
            if (
              status === (window as any).google.maps.DirectionsStatus.OK &&
              result
            ) {
              setState((prev) => ({
                ...prev,
                isLoadingDirections: false,
                directionsInfo: prev.directionsInfo
                  ? {
                      ...prev.directionsInfo,
                      routes: result,
                      isLoading: false,
                    }
                  : null,
              }));
            } else {
              console.error('Directions request failed:', status);
              setState((prev) => ({
                ...prev,
                isLoadingDirections: false,
                directionsInfo: prev.directionsInfo
                  ? {
                      ...prev.directionsInfo,
                      isLoading: false,
                    }
                  : null,
              }));
            }
          });
        } else {
          console.error('Google Maps API not loaded');
          setState((prev) => ({
            ...prev,
            isLoadingDirections: false,
          }));
        }
      } catch (error) {
        console.error('Error requesting directions:', error);
        setState((prev) => ({
          ...prev,
          isLoadingDirections: false,
        }));
      }
    },
    []
  );

  const clearDirections = useCallback(() => {
    setState({
      directionsInfo: null,
      isLoadingDirections: false,
    });
  }, []);

  return {
    ...state,
    requestDirections,
    clearDirections,
  };
}
