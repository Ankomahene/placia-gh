'use client';

import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useLocalStorage } from './use-local-storage';
import { useUser } from './use-user';
import type { Place, PlaceResults, PlaceResultsSummary } from '@/types/place';

type AcceptedPlaceType = Place | PlaceResults | PlaceResultsSummary;

const FAVORITES_BASE_KEY = 'placia-favorites';

// Helper function to convert any place type to PlaceResultsSummary
function transformToSummary(place: AcceptedPlaceType): PlaceResultsSummary {
  // If it's already a PlaceResultsSummary, return as is
  if (
    'category' in place &&
    typeof place.category === 'object' &&
    place.category.id
  ) {
    return place as PlaceResultsSummary;
  }

  // If it's a PlaceResults, extract summary fields
  if ('category' in place && typeof place.category === 'object') {
    const placeResults = place as PlaceResults;
    return {
      id: placeResults.id,
      name: placeResults.name,
      slug: placeResults.slug,
      tagline: placeResults.tagline,
      description: placeResults.description,
      main_image: placeResults.main_image,
      gallery: placeResults.gallery,
      country: placeResults.country,
      region: placeResults.region,
      city: placeResults.city,
      location: placeResults.location,
      category: {
        id: placeResults.category.id,
        name: placeResults.category.name,
        slug: placeResults.category.slug,
        icon: placeResults.category.icon,
      },
      subcategory: {
        id: placeResults.subcategory.id,
        name: placeResults.subcategory.name,
        slug: placeResults.subcategory.slug,
        icon: placeResults.subcategory.icon,
      },
      type: placeResults.type
        ? {
            id: placeResults.type.id,
            name: placeResults.type.name,
            slug: placeResults.type.slug,
            icon: placeResults.type.icon,
          }
        : null,
      ownership: placeResults.ownership
        ? {
            id: placeResults.ownership.id,
            type: placeResults.ownership.type,
            slug: placeResults.ownership.slug,
            icon: placeResults.ownership.icon,
          }
        : null,
      rate_average: placeResults.rate_average,
      rate_count: placeResults.rate_count,
      rate_label: placeResults.rate_label,
      price_level: placeResults.price_level,
      price_level_count: placeResults.price_level_count,
      price_level_label: placeResults.price_level_label,
      distance: placeResults.distance,
      open_now: placeResults.open_now,
      features: placeResults.features,
      services: placeResults.services,
      tags: placeResults.tags,
      accessibility: placeResults.accessibility,
      source: placeResults.source,
      google_place_types: placeResults.google_place_types,
      business_status: placeResults.business_status,
      formatted_address: placeResults.formatted_address,
      vicinity: placeResults.vicinity,
      isBusinessPlace: placeResults.isBusinessPlace,
    };
  }

  // If it's a Place (from database), we need to transform it
  const dbPlace = place as Place;

  // For Place type, we have country_id, region_id, city_id instead of nested objects
  // We'll create partial objects with just the id
  return {
    id: dbPlace.id,
    name: dbPlace.name,
    slug: dbPlace.slug,
    tagline: dbPlace.tagline,
    description: dbPlace.description,
    main_image: dbPlace.main_image,
    gallery: dbPlace.gallery,
    country: { id: dbPlace.country_id },
    region: { id: dbPlace.region_id },
    city: { id: dbPlace.city_id },
    location: dbPlace.location,
    category: { id: dbPlace.category_id },
    subcategory: { id: dbPlace.subcategory_id },
    type: dbPlace.type_id ? { id: dbPlace.type_id } : null,
    ownership: dbPlace.ownership_id ? { id: dbPlace.ownership_id } : null,
    rate_average: dbPlace.rating?.rate,
    rate_count: dbPlace.rating?.count,
    distance: dbPlace.distance,
    features: dbPlace.features,
    services: dbPlace.services,
    tags: dbPlace.tags,
    accessibility: dbPlace.accessibility,
    source: dbPlace.source,
    isBusinessPlace: dbPlace.isBusinessPlace,
  };
}

export function useFavorites() {
  const { user, isLoading: userLoading } = useUser();

  // Only allow favorites operations when user is fully loaded
  // This prevents storage key switching during user authentication
  const stableUserId = !userLoading ? user?.id : null;

  // Generate stable storage key
  const favoritesKey = useMemo(() => {
    if (userLoading) {
      // Use a loading key instead of null to maintain hook stability
      return `${FAVORITES_BASE_KEY}-loading`;
    }
    return stableUserId
      ? `${FAVORITES_BASE_KEY}-${stableUserId}`
      : `${FAVORITES_BASE_KEY}-guest`;
  }, [stableUserId, userLoading]);

  // Use the generic localStorage hook - now reactive to key changes
  const [favorites, setFavorites] = useLocalStorage<PlaceResultsSummary[]>(
    favoritesKey,
    []
  );

  // User authentication flags
  const isLoggedIn = !!user && !userLoading;
  const canAddToFavorites = isLoggedIn;

  // Add a place to favorites
  const addToFavorites = useCallback(
    (place: AcceptedPlaceType) => {
      if (userLoading) {
        toast.info('Please wait while we load your account...');
        return false;
      }

      if (!canAddToFavorites) {
        toast.error('Please log in to add places to favorites');
        return false;
      }

      if (favoritesKey.includes('-loading')) {
        toast.error('Unable to save favorites at this time');
        return false;
      }

      try {
        const summary = transformToSummary(place);

        // Check if already in favorites
        const isAlreadyFavorite = favorites.some(
          (fav) => fav.id === summary.id
        );

        if (isAlreadyFavorite) {
          toast.info('This place is already in your favorites!');
          return false;
        }

        // Add to favorites
        const updatedFavorites = [...favorites, summary];
        setFavorites(updatedFavorites);

        toast.success('Added to favorites successfully!');
        return true;
      } catch (error) {
        console.error('Error adding to favorites:', error);
        toast.error('Failed to add to favorites');
        return false;
      }
    },
    [favorites, setFavorites, canAddToFavorites, userLoading, favoritesKey]
  );

  // Remove a place from favorites
  const removeFromFavorites = useCallback(
    (placeId: string) => {
      try {
        const updatedFavorites = favorites.filter((fav) => fav.id !== placeId);
        setFavorites(updatedFavorites);
        toast.success('Removed from favorites');
        return true;
      } catch (error) {
        console.error('Error removing from favorites:', error);
        toast.error('Failed to remove from favorites');
        return false;
      }
    },
    [favorites, setFavorites]
  );

  // Toggle favorite status
  const toggleFavorite = useCallback(
    (place: AcceptedPlaceType) => {
      const placeId = place.id;
      const isFavorite = favorites.some((fav) => fav.id === placeId);

      if (isFavorite) {
        return removeFromFavorites(placeId);
      } else {
        return addToFavorites(place);
      }
    },
    [favorites, addToFavorites, removeFromFavorites]
  );

  // Check if a place is in favorites
  const isFavorite = useCallback(
    (placeId: string) => {
      return favorites.some((fav) => fav.id === placeId);
    },
    [favorites]
  );

  // Clear all favorites
  const clearFavorites = useCallback(() => {
    try {
      setFavorites([]);
      toast.success('All favorites cleared');
      return true;
    } catch (error) {
      console.error('Error clearing favorites:', error);
      toast.error('Failed to clear favorites');
      return false;
    }
  }, [setFavorites]);

  // Get favorites count
  const favoritesCount = favorites.length;

  return {
    favorites,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    favoritesCount,
    isLoggedIn,
    canAddToFavorites,
    userLoading,
  };
}
