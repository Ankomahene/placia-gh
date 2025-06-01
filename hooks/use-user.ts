'use client';

import { useQuery } from '@tanstack/react-query';
import { getUser } from '@/lib/services/auth';
import type { User } from '@/types/user';

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
