import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getTypes,
  createType,
  updateType,
  deleteType,
} from '@/lib/services/admin/place';
import type { PlaceType } from '@/types/place';

export function usePlaceTypes(subcategoryId?: string) {
  const queryClient = useQueryClient();

  const {
    data: types,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['types', subcategoryId],
    queryFn: () => getTypes(subcategoryId),
  });

  const createMutation = useMutation({
    mutationFn: createType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
      toast.success('Type created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...updates }: { id: string } & Partial<PlaceType>) =>
      updateType(id, updates),
    onSuccess: (_, variables) => {
      // Invalidate both old and new subcategory queries
      queryClient.invalidateQueries({ queryKey: ['types'] });
      toast.success('Type updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['types'] });
      toast.success('Type deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    types,
    isLoading,
    error,
    createType: createMutation.mutate,
    updateType: updateMutation.mutate,
    deleteType: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
