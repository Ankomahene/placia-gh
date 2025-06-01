import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  getOwnerships,
  createOwnership,
  updateOwnership,
  deleteOwnership,
} from '@/lib/services/admin/place';
import type { Ownership } from '@/types/place';

export function useOwnerships() {
  const queryClient = useQueryClient();

  const {
    data: ownerships,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ownerships'],
    queryFn: getOwnerships,
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
  };
}