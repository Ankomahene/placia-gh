import { createClient } from '@/lib/supabase/client';
import {
  PlaceCategory,
  PlaceSubcategory,
  PlaceType,
  Ownership,
} from '@/types/place';
import slugify from 'slugify';

// Helper function to generate slug
export function generateSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

// Categories
export async function getCategories(search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('categories')
    .select('*');
    
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { data, error } = await query.order('name');
  if (error) throw error;
  return data as PlaceCategory[];
}

export async function createCategory({
  name,
  icon,
  description,
}: Partial<PlaceCategory>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, icon, description, slug: generateSlug(name!) }])
    .select()
    .single();
  if (error) throw error;
  return data as PlaceCategory;
}

export async function updateCategory(
  id: string,
  updates: Partial<PlaceCategory>
) {
  const supabase = createClient();
  if (updates.name) {
    updates.slug = generateSlug(updates.name);
  }
  const { data, error } = await supabase
    .from('categories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PlaceCategory;
}

export async function deleteCategory(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

// Subcategories
export async function getSubcategories(categoryId?: string, search?: string) {
  const supabase = createClient();
  let query = supabase.from('subcategories').select('*').order('name');
  
  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as PlaceSubcategory[];
}

export async function createSubcategory({
  name,
  icon,
  description,
  category_id,
}: Partial<PlaceSubcategory>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('subcategories')
    .insert([
      { name, icon, description, category_id, slug: generateSlug(name!) },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as PlaceSubcategory;
}

export async function updateSubcategory(
  id: string,
  updates: Partial<PlaceSubcategory>
) {
  const supabase = createClient();
  if (updates.name) {
    updates.slug = generateSlug(updates.name);
  }
  const { data, error } = await supabase
    .from('subcategories')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PlaceSubcategory;
}

export async function deleteSubcategory(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('subcategories').delete().eq('id', id);
  if (error) throw error;
}

// Types
export async function getTypes(subcategoryId?: string, search?: string) {
  const supabase = createClient();
  let query = supabase.from('types').select('*').order('name');
  
  if (subcategoryId) {
    query = query.eq('subcategory_id', subcategoryId);
  }
  
  if (search) {
    query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return data as PlaceType[];
}

export async function createType({
  name,
  icon,
  description,
  subcategory_id,
}: Partial<PlaceType>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('types')
    .insert([
      { name, icon, description, subcategory_id, slug: generateSlug(name!) },
    ])
    .select()
    .single();
  if (error) throw error;
  return data as PlaceType;
}

export async function updateType(id: string, updates: Partial<PlaceType>) {
  const supabase = createClient();
  if (updates.name) {
    updates.slug = generateSlug(updates.name);
  }
  const { data, error } = await supabase
    .from('types')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as PlaceType;
}

export async function deleteType(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('types').delete().eq('id', id);
  if (error) throw error;
}

// Ownerships
export async function getOwnerships(search?: string) {
  const supabase = createClient();
  let query = supabase
    .from('ownerships')
    .select('*');
    
  if (search) {
    query = query.or(`type.ilike.%${search}%,description.ilike.%${search}%`);
  }
  
  const { data, error } = await query.order('type');
  if (error) throw error;
  return data as Ownership[];
}

export async function createOwnership({
  type,
  icon,
  description,
}: Partial<Ownership>) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ownerships')
    .insert([{ type, icon, description, slug: generateSlug(type!) }])
    .select()
    .single();
  if (error) throw error;
  return data as Ownership;
}

export async function updateOwnership(id: string, updates: Partial<Ownership>) {
  const supabase = createClient();
  if (updates.type) {
    updates.slug = generateSlug(updates.type);
  }
  const { data, error } = await supabase
    .from('ownerships')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Ownership;
}

export async function deleteOwnership(id: string) {
  const supabase = createClient();
  const { error } = await supabase.from('ownerships').delete().eq('id', id);
  if (error) throw error;
}
