import { createClient } from '@/lib/supabase/client';
import { Country, Region, City, Town } from '@/types/place';

// Countries
export async function getCountries() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .order('name');

  if (error) throw error;
  return data as Country[];
}

export async function getCountryById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('countries')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Country;
}

// Regions
export async function getRegions(countryId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('country_id', countryId)
    .order('name');

  if (error) throw error;
  return data as Region[];
}

export async function getRegionById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('regions')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Region;
}

// Cities
export async function getCities(regionId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('region_id', regionId)
    .order('name');

  if (error) throw error;
  return data as City[];
}

export async function getCityById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('cities')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as City;
}

// Towns
export async function getTowns(cityId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('towns')
    .select('*')
    .eq('city_id', cityId)
    .order('name');

  if (error) throw error;
  return data as Town[];
}

export async function searchTowns(query: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('towns')
    .select('*')
    .ilike('name', `%${query}%`)
    .ilike('alternatenames', `%${query}%`)
    .order('name')
    .limit(10);

  if (error) throw error;
  return data as Town[];
}

export async function getTownById(id: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('towns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as Town;
}
