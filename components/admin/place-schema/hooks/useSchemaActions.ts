import { useSchemaMapping } from '@/hooks/admin/use-schema-mapping';
import { useGroupingSubcategories } from '@/hooks/admin/use-grouping-subcategories';
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { useQueryClient } from '@tanstack/react-query';
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';

export function useSchemaActions() {
  const { updateMappingAsync } = useSchemaMapping();
  const { updateSubcategoryGroupingAsync } = useGroupingSubcategories();
  const { fields } = usePlaceFields();
  const { subcategories } = usePlaceSubcategories();
  const { groupings } = usePlaceGroupings();
  const queryClient = useQueryClient();

  const handleFieldDrop = async ({
    groupingId,
    fieldId,
    required,
  }: {
    groupingId: string;
    fieldId: string;
    required: boolean;
  }) => {
    // Find the field data
    const field = fields?.find((f) => f.id === fieldId);
    if (!field) return;

    // Optimistically update the cache directly
    queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
      if (!oldData) return oldData;

      return oldData.map((grouping) => {
        if (grouping.id !== groupingId) return grouping;

        const currentSchema = grouping.schema || { required: [], optional: [] };

        // Remove field from both arrays first (in case it's being moved)
        const newRequired =
          currentSchema.required?.filter((f: any) => f.id !== fieldId) || [];
        const newOptional =
          currentSchema.optional?.filter((f: any) => f.id !== fieldId) || [];

        // Add to the appropriate array
        if (required) {
          newRequired.push(field);
        } else {
          newOptional.push(field);
        }

        return {
          ...grouping,
          schema: {
            ...currentSchema,
            required: newRequired,
            optional: newOptional,
          },
        };
      });
    });

    try {
      const result = await updateMappingAsync({
        groupingId,
        fieldId,
        required,
      });

      // Invalidate to get fresh data from server (this will replace our optimistic update)
      await queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
    } catch (error) {
      // Rollback the optimistic update on error
      queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
        if (!oldData) return oldData;

        return oldData.map((grouping) => {
          if (grouping.id !== groupingId) return grouping;

          const currentSchema = grouping.schema || {
            required: [],
            optional: [],
          };

          // Remove the field that we optimistically added
          const newRequired =
            currentSchema.required?.filter((f: any) => f.id !== fieldId) || [];
          const newOptional =
            currentSchema.optional?.filter((f: any) => f.id !== fieldId) || [];

          return {
            ...grouping,
            schema: {
              ...currentSchema,
              required: newRequired,
              optional: newOptional,
            },
          };
        });
      });

      throw error;
    }
  };

  const handleSubcategoryDrop = async ({
    id,
    groupingId,
  }: {
    id: string;
    groupingId: string;
  }) => {
    // Find the subcategory data
    const subcategory = subcategories?.find((s) => s.id === id);
    if (!subcategory) return;

    // Optimistically update the cache directly
    queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
      if (!oldData) return oldData;

      return oldData.map((grouping) => {
        if (grouping.id !== groupingId) return grouping;

        const currentSubcategories = grouping.subcategories || [];

        // Remove subcategory if it already exists (in case it's being moved)
        const filteredSubcategories = currentSubcategories.filter(
          (s: any) => s.id !== id
        );

        // Add the subcategory
        const newSubcategories = [...filteredSubcategories, subcategory];

        return {
          ...grouping,
          subcategories: newSubcategories,
        };
      });
    });

    try {
      const result = await updateSubcategoryGroupingAsync({ id, groupingId });

      // Invalidate to get fresh data from server
      await queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      await queryClient.invalidateQueries({
        queryKey: ['grouping_subcategories'],
      });
    } catch (error) {
      // Rollback the optimistic update
      queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
        if (!oldData) return oldData;

        return oldData.map((grouping) => {
          if (grouping.id !== groupingId) return grouping;

          const currentSubcategories = grouping.subcategories || [];

          // Remove the subcategory we optimistically added
          const rolledBackSubcategories = currentSubcategories.filter(
            (s: any) => s.id !== id
          );

          return {
            ...grouping,
            subcategories: rolledBackSubcategories,
          };
        });
      });

      throw error;
    }
  };

  const handleSubcategoryRemove = async ({
    id,
    groupingId,
  }: {
    id: string;
    groupingId: string;
  }) => {
    // Optimistically update the cache directly
    queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
      if (!oldData) return oldData;

      return oldData.map((grouping) => {
        if (grouping.id !== groupingId) return grouping;

        const currentSubcategories = grouping.subcategories || [];

        // Remove the subcategory from this grouping
        const newSubcategories = currentSubcategories.filter(
          (s: any) => s.id !== id
        );

        return {
          ...grouping,
          subcategories: newSubcategories,
        };
      });
    });

    try {
      // Set groupingId to null to remove the association
      const result = await updateSubcategoryGroupingAsync({
        id,
        groupingId: null,
      });

      // Invalidate to get fresh data from server
      await queryClient.invalidateQueries({ queryKey: ['place_groupings'] });
      await queryClient.invalidateQueries({
        queryKey: ['grouping_subcategories'],
      });
    } catch (error) {
      // Rollback the optimistic update by re-adding the subcategory
      const subcategory = subcategories?.find((s) => s.id === id);
      if (subcategory) {
        queryClient.setQueryData(['place_groupings'], (oldData: any[]) => {
          if (!oldData) return oldData;

          return oldData.map((grouping) => {
            if (grouping.id !== groupingId) return grouping;

            const currentSubcategories = grouping.subcategories || [];

            // Re-add the subcategory we removed optimistically
            const restoredSubcategories = [
              ...currentSubcategories,
              subcategory,
            ];

            return {
              ...grouping,
              subcategories: restoredSubcategories,
            };
          });
        });
      }

      throw error;
    }
  };

  return {
    handleFieldDrop,
    handleSubcategoryDrop,
    handleSubcategoryRemove,
    isProcessing: false,
  };
}
