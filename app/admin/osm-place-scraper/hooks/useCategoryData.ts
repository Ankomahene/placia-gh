'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { PlaceCategory, PlaceSubcategory } from '@/types/place';

interface UseCategoryDataResult {
  categories: PlaceCategory[];
  subcategories: PlaceSubcategory[];
  loadingCategories: boolean;
  categoryError: string | null;
  getSubcategoriesByCategory: (categoryId: string) => PlaceSubcategory[];
}

export function useCategoryData(): UseCategoryDataResult {
  const [categories, setCategories] = useState<PlaceCategory[]>([]);
  const [subcategories, setSubcategories] = useState<PlaceSubcategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    loadCategoryData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCategoryData = async () => {
    try {
      setLoadingCategories(true);
      setCategoryError(null);

      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // Load subcategories
      const { data: subcategoriesData, error: subcategoriesError } =
        await supabase.from('subcategories').select('*').order('name');

      if (subcategoriesError) throw subcategoriesError;

      setCategories(categoriesData || []);
      setSubcategories(subcategoriesData || []);
    } catch (error) {
      console.error('Error loading category data:', error);
      setCategoryError(
        error instanceof Error ? error.message : 'Failed to load category data'
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const getSubcategoriesByCategory = (
    categoryId: string
  ): PlaceSubcategory[] => {
    return subcategories.filter(
      (subcategory) => subcategory.category_id === categoryId
    );
  };

  return {
    categories,
    subcategories,
    loadingCategories,
    categoryError,
    getSubcategoriesByCategory,
  };
}
