import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import type { PlaceGrouping, PlaceField } from '@/types/place';

async function getGroupings() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('place_groupings')
    .select(
      `
      *,
      place_grouping_schema (
        *,
        field:place_fields (*)
      ),
      subcategories:subcategories (*)
    `
    )
    .order('name');

  if (error) throw error;

  // Transform data to include required/optional fields
  return data.map((grouping: any) => ({
    ...grouping,
    schema: {
      required: grouping.place_grouping_schema
        .filter((s: any) => s.required)
        .map((s: any) => s.field),
      optional: grouping.place_grouping_schema
        .filter((s: any) => !s.required)
        .map((s: any) => s.field),
    },
    subcategories: grouping.subcategories || [],
  })) as PlaceGrouping[];
}

async function createGrouping(data: Partial<PlaceGrouping>) {
  const supabase = createClient();
  const { data: newGrouping, error } = await supabase
    .from('place_groupings')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return newGrouping;
}

async function updateGrouping(id: string, data: Partial<PlaceGrouping>) {
  const supabase = createClient();
  const { data: updatedGrouping, error } = await supabase
    .from('place_groupings')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updatedGrouping;
}

async function deleteGrouping(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_groupings')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function usePlaceGroupings() {
  const queryClient = useQueryClient();

  const {
    data: groupings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['place_groupings'],
    queryFn: getGroupings,
  });

  const createMutation = useMutation({
    mutationFn: createGrouping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Grouping created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<PlaceGrouping>) =>
      updateGrouping(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Grouping updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGrouping,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      toast.success('Grouping deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    groupings,
    isLoading,
    error,
    createGrouping: createMutation.mutate,
    updateGrouping: updateMutation.mutate,
    deleteGrouping: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
