import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { PlaceSubcategory } from '@/types/place';

async function getGroupingSubcategories(groupingId?: string) {
  const supabase = createClient();
  let query = supabase.from('subcategories').select('*').order('name');

  if (groupingId) {
    query = query.eq('grouping_id', groupingId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as PlaceSubcategory[];
}

async function updateSubcategoryGrouping(
  id: string,
  groupingId: string | null
) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subcategories')
    .update({ grouping_id: groupingId })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useGroupingSubcategories(groupingId?: string) {
  const queryClient = useQueryClient();

  const {
    data: subcategories,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['grouping_subcategories', groupingId],
    queryFn: () => getGroupingSubcategories(groupingId),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      groupingId,
    }: {
      id: string;
      groupingId: string | null;
    }) => updateSubcategoryGrouping(id, groupingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grouping_subcategories'] });
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Subcategory updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    subcategories,
    isLoading,
    error,
    updateSubcategoryGrouping: updateMutation.mutate,
    updateSubcategoryGroupingAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
  };
}
