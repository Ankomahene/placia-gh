'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { getUser } from '@/lib/services/auth';
import type { User } from '@/types/user';
import {
  getUserBusinesses,
  deleteUserBusiness,
  getUserContributedPlaces,
  deleteUserContributedPlace,
  getUserReviewsCount,
  getUserPhotosCount,
} from '@/lib/services/client/places';
import { useFavorites } from './use-favorites';
import { toast } from 'sonner';

export function useUser() {
  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery<User | null, Error>({
    queryKey: ['user'],
    queryFn: async () => {
      const { user, error } = await getUser();
      if (error) throw error;
      return user;
    },
    staleTime: 0,
    gcTime: 0,
  });

  return {
    user,
    isLoading,
    error,
    refetch,
  };
}

// Hook to get dashboard stats
export function useDashboardStats() {
  const { user, isLoading: userLoading } = useUser();
  const { favorites } = useFavorites();

  // Get businesses count
  const businessesQuery = useQuery({
    queryKey: ['user-businesses-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      return getUserBusinesses({
        userId: user.id,
        page: 1,
        pageSize: 1, // Just need count
      });
    },
    enabled: !!user?.id && !userLoading,
  });

  // Get contributed places count
  const contributedQuery = useQuery({
    queryKey: ['user-contributed-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return { count: 0 };
      return getUserContributedPlaces({
        userId: user.id,
        page: 1,
        pageSize: 1, // Just need count
      });
    },
    enabled: !!user?.id && !userLoading,
  });

  // Get reviews count
  const reviewsQuery = useQuery({
    queryKey: ['user-reviews-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return getUserReviewsCount(user.id);
    },
    enabled: !!user?.id && !userLoading,
  });

  // Get photos count
  const photosQuery = useQuery({
    queryKey: ['user-photos-count', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      return getUserPhotosCount(user.id);
    },
    enabled: !!user?.id && !userLoading,
  });

  return {
    businessesCount: businessesQuery.data?.count || 0,
    contributedPlacesCount: contributedQuery.data?.count || 0,
    favoritesCount: favorites.length,
    reviewsCount: reviewsQuery.data || 0,
    photosCount: photosQuery.data || 0,
    isLoading:
      userLoading ||
      businessesQuery.isLoading ||
      contributedQuery.isLoading ||
      reviewsQuery.isLoading ||
      photosQuery.isLoading,
  };
}

// Hook to manage user businesses
export function useUserBusinesses(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { user, isLoading } = useUser();

  return useQuery({
    queryKey: ['user-businesses', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserBusinesses({
        userId: user.id,
        ...params,
      });
    },
    enabled: !!user?.id && !isLoading,
  });
}

// Hook to delete a user business
export function useDeleteUserBusiness() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return deleteUserBusiness(placeId, user.id);
    },
    onSuccess: () => {
      // Invalidate and refetch businesses
      queryClient.invalidateQueries({ queryKey: ['user-businesses'] });
      queryClient.invalidateQueries({ queryKey: ['user-businesses-count'] });
      toast.success('Business deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete business');
    },
  });
}

// Hook to manage user contributed places (non-business places)
export function useUserContributedPlaces(params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}) {
  const { user, isLoading } = useUser();

  return useQuery({
    queryKey: ['user-contributed-places', user?.id, params],
    queryFn: async () => {
      if (!user?.id) throw new Error('User not authenticated');
      return getUserContributedPlaces({
        userId: user.id,
        ...params,
      });
    },
    enabled: !!user?.id && !isLoading,
  });
}

// Hook to delete a user contributed place
export function useDeleteUserContributedPlace() {
  const { user } = useUser();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (placeId: string) => {
      if (!user?.id) throw new Error('User not authenticated');
      return deleteUserContributedPlace(placeId, user.id);
    },
    onSuccess: () => {
      // Invalidate and refetch contributed places
      queryClient.invalidateQueries({ queryKey: ['user-contributed-places'] });
      queryClient.invalidateQueries({ queryKey: ['user-contributed-count'] });
      toast.success('Place deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete place');
    },
  });
}
