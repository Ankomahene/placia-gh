import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { useState } from 'react';
import {
  getOwnerships,
  createOwnership,
  updateOwnership,
  deleteOwnership,
} from '@/lib/services/admin/place';
import type { Ownership } from '@/types/place';

export function useOwnerships(initialSearch = '') {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: ownerships,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ownerships', debouncedSearch],
    queryFn: () => getOwnerships(debouncedSearch),
  });

  const createMutation = useMutation({
    mutationFn: createOwnership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerships'] });
      toast.success('Ownership created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<Ownership>) =>
      updateOwnership(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerships'] });
      toast.success('Ownership updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOwnership,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ownerships'] });
      toast.success('Ownership deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    ownerships,
    isLoading,
    error,
    createOwnership: createMutation.mutate,
    updateOwnership: updateMutation.mutate,
    deleteOwnership: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    search,
    setSearch,
  };
}
