import { createClient } from '@/lib/supabase/client';
import type { PlaceGroupingSchema } from '@/types/place';

export async function updateSchemaMapping(
  groupingId: string,
  fieldId: string,
  required: boolean
) {
  const supabase = createClient();

  // First check if mapping already exists
  const { data: existing } = await supabase
    .from('place_grouping_schema')
    .select('*')
    .eq('grouping_id', groupingId)
    .eq('field_id', fieldId)
    .single();

  if (existing) {
    // Update existing mapping
    const { error } = await supabase
      .from('place_grouping_schema')
      .update({ required })
      .eq('id', existing.id);

    if (error) throw error;
  } else {
    // Create new mapping
    const { error } = await supabase
      .from('place_grouping_schema')
      .insert([{ grouping_id: groupingId, field_id: fieldId, required }]);

    if (error) throw error;
  }
}

export async function removeSchemaMapping(
  groupingId: string,
  fieldId: string
) {
  const supabase = createClient();
  const { error } = await supabase
    .from('place_grouping_schema')
    .delete()
    .eq('grouping_id', groupingId)
    .eq('field_id', fieldId);

  if (error) throw error;
}