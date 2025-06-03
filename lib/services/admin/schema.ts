import { createClient } from '@/lib/supabase/client';
import type { PlaceGroupingSchema } from '@/types/place';

export async function updateSchemaMapping(
  groupingId: string,
  fieldId: string,
  required: boolean
) {
  const supabase = createClient();

  // First check if mapping already exists - don't use .single() to avoid 406 error
  const { data: existing, error: selectError } = await supabase
    .from('place_grouping_schema')
    .select('*')
    .eq('grouping_id', groupingId)
    .eq('field_id', fieldId);

  // Only throw error if it's not a "no rows" error
  if (selectError) {
    throw selectError;
  }

  if (existing && existing.length > 0) {
    // Update existing mapping
    const { error } = await supabase
      .from('place_grouping_schema')
      .update({ required })
      .eq('id', existing[0].id);

    if (error) throw error;
    return existing[0];
  } else {
    // Create new mapping
    const { data, error } = await supabase
      .from('place_grouping_schema')
      .insert([{ grouping_id: groupingId, field_id: fieldId, required }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}

export async function removeSchemaMapping(groupingId: string, fieldId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_grouping_schema')
    .delete()
    .eq('grouping_id', groupingId)
    .eq('field_id', fieldId);

  if (error) throw error;
}
