'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useDebounce } from '@/hooks/use-debounce';
import { useState } from 'react';
import type { PlaceField } from '@/types/place';

async function getFields(search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('place_fields')
    .select('*')
    .order('name');

  if (search) {
    query = query.or(`name.ilike.%${search}%,label.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as PlaceField[];
}

async function createField(data: Partial<PlaceField>) {
  const supabase = createClient();
  const { data: newField, error } = await supabase
    .from('place_fields')
    .insert([data])
    .select()
    .single();

  if (error) throw error;
  return newField;
}

async function updateField(id: string, data: Partial<PlaceField>) {
  const supabase = createClient();
  const { data: updatedField, error } = await supabase
    .from('place_fields')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return updatedField;
}

async function deleteField(id: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_fields')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export function usePlaceFields(initialSearch = '') {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState(initialSearch);
  const debouncedSearch = useDebounce(search, 300);

  const {
    data: fields,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['place_fields', debouncedSearch],
    queryFn: () => getFields(debouncedSearch),
  });

  const createMutation = useMutation({
    mutationFn: createField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_fields'] });
      toast.success('Field created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<PlaceField>) =>
      updateField(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_fields'] });
      toast.success('Field updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteField,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['place_fields'] });
      toast.success('Field deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return {
    fields,
    isLoading,
    error,
    createField: createMutation.mutate,
    updateField: updateMutation.mutate,
    deleteField: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    search,
    setSearch,
  };
}