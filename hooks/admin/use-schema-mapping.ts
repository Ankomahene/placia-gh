import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { updateSchemaMapping, removeSchemaMapping } from '@/lib/services/admin/schema';

export function useSchemaMapping() {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({
      groupingId,
      fieldId,
      required,
    }: {
      groupingId: string;
      fieldId: string;
      required: boolean;
    }) => updateSchemaMapping(groupingId, fieldId, required),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Schema mapping updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: ({
      groupingId,
      fieldId,
    }: {
      groupingId: string;
      fieldId: string;
    }) => removeSchemaMapping(groupingId, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Field removed from schema');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    updateMapping: updateMutation.mutate,
    removeMapping: removeMutation.mutate,
    isUpdating: updateMutation.isPending,
    isRemoving: removeMutation.isPending,
  };
}