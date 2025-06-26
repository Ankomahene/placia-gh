'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { PlaceResultsSummary } from '@/types/place';
import { toast } from 'sonner';

interface PlacesPagination {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
}

interface PlacesQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  category?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Fetch places with pagination and filters
async function fetchPlaces(params: PlacesQueryParams = {}): Promise<{
  data: PlaceResultsSummary[];
  count: number;
}> {
  const {
    page = 1,
    pageSize = 10,
    search = '',
    status,
    category,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = params;

  const supabase = createClient();
  
  // Start building the query
  let query = supabase
    .from('places')
    .select(
      `
        *,
        category:category_id(id, name, slug, icon),
        subcategory:subcategory_id(id, name, slug, icon),
        type:type_id(id, name, slug, icon),
        ownership:ownership_id(id, type, slug, icon),
        country:country_id(id, name, emoji),
        region:region_id(id, name),
        city:city_id(id, name)
      `,
      { count: 'exact' }
    );

  // Apply filters
  if (search) {
    query = query.textSearch('search_vector', search, {
      type: 'websearch',
      config: 'english',
    });
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (category) {
    query = query.eq('category_id', category);
  }

  // Apply pagination
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  
  // Apply sorting
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });
  
  // Execute the query with pagination
  const { data, error, count } = await query.range(from, to);

  if (error) {
    console.error('Error fetching places:', error);
    throw new Error(error.message);
  }

  return { 
    data: data as PlaceResultsSummary[], 
    count: count || 0 
  };
}

// Delete a place
async function deletePlace(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from('places').delete().eq('id', id);
  
  if (error) {
    console.error('Error deleting place:', error);
    throw new Error(error.message);
  }
}

// Update place status
async function updatePlaceStatus(id: string, status: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('places')
    .update({ status, updated_at: new Date() })
    .eq('id', id);
  
  if (error) {
    console.error('Error updating place status:', error);
    throw new Error(error.message);
  }
}

export function usePlaces() {
  const queryClient = useQueryClient();
  const [pagination, setPagination] = useState<PlacesPagination>({
    page: 1,
    pageSize: 10,
    totalPages: 1,
    totalItems: 0,
  });
  const [queryParams, setQueryParams] = useState<PlacesQueryParams>({
    page: 1,
    pageSize: 10,
  });

  // Fetch places query
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['places', queryParams],
    queryFn: () => fetchPlaces(queryParams),
    keepPreviousData: true,
  });

  // Update pagination when data changes
  useEffect(() => {
    if (data) {
      setPagination({
        ...pagination,
        totalItems: data.count,
        totalPages: Math.ceil(data.count / pagination.pageSize),
      });
    }
  }, [data, pagination.pageSize]);

  // Delete place mutation
  const deleteMutation = useMutation({
    mutationFn: deletePlace,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Place deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete place: ${error.message}`);
    },
  });

  // Update place status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      updatePlaceStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['places'] });
      toast.success('Place status updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update place status: ${error.message}`);
    },
  });

  // Fetch places with filters
  const fetchPlacesWithFilters = useCallback((params: PlacesQueryParams) => {
    setQueryParams((prev) => ({
      ...prev,
      ...params,
    }));
  }, []);

  return {
    places: data?.data || [],
    isLoading,
    error,
    pagination,
    setPagination,
    fetchPlaces: fetchPlacesWithFilters,
    deletePlace: deleteMutation.mutate,
    updatePlaceStatus: (id: string, status: string) => 
      updateStatusMutation.mutate({ id, status }),
    isDeleting: deleteMutation.isPending,
    isUpdating: updateStatusMutation.isPending,
    refetch,
  };
}