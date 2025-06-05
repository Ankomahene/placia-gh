'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePlaceCategories } from '@/hooks/admin/use-place-categories';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import type { PlaceSubcategory, PlaceType, Ownership } from '@/types/place';
import { IconRenderer } from '../ui/icon-renderer';

interface CategorySelectionStepProps {
  selectedCategoryId: string;
  selectedSubcategoryId: string;
  selectedTypeId?: string;
  selectedOwnershipId?: string;
  onCategoryChange: (categoryId: string) => void;
  onSubcategoryChange: (subcategoryId: string) => void;
  onTypeChange: (typeId?: string) => void;
  onOwnershipChange: (ownershipId?: string) => void;
  errors?: {
    category_id?: string;
    subcategory_id?: string;
  };
}

export function CategorySelectionStep({
  selectedCategoryId,
  selectedSubcategoryId,
  selectedTypeId,
  selectedOwnershipId,
  onCategoryChange,
  onSubcategoryChange,
  onTypeChange,
  onOwnershipChange,
  errors,
}: CategorySelectionStepProps) {
  const [categorySearch, setCategorySearch] = useState('');
  const { categories, isLoading: categoriesLoading } = usePlaceCategories();

  // Fetch subcategories
  const { data: subcategories, isLoading: subcategoriesLoading } = useQuery({
    queryKey: ['subcategories', selectedCategoryId],
    queryFn: async () => {
      if (!selectedCategoryId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('subcategories')
        .select('*')
        .eq('category_id', selectedCategoryId)
        .order('name');
      if (error) throw error;
      return data as PlaceSubcategory[];
    },
    enabled: !!selectedCategoryId,
  });

  // Fetch types
  const { data: types, isLoading: typesLoading } = useQuery({
    queryKey: ['types', selectedSubcategoryId],
    queryFn: async () => {
      if (!selectedSubcategoryId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('types')
        .select('*')
        .eq('subcategory_id', selectedSubcategoryId)
        .order('name');
      if (error) throw error;
      return data as PlaceType[];
    },
    enabled: !!selectedSubcategoryId,
  });

  // Fetch ownerships based on subcategory
  const { data: ownerships, isLoading: ownershipsLoading } = useQuery({
    queryKey: ['ownerships', selectedSubcategoryId],
    queryFn: async () => {
      if (!selectedSubcategoryId) return [];
      const supabase = createClient();
      const { data, error } = await supabase
        .from('ownerships')
        .select('*')
        .eq('subcategory_id', selectedSubcategoryId)
        .order('type');
      if (error) throw error;
      return data as Ownership[];
    },
    enabled: !!selectedSubcategoryId,
  });

  // Reset subcategory when category changes
  useEffect(() => {
    if (selectedCategoryId && selectedSubcategoryId) {
      const currentSubcategory = subcategories?.find(
        (s) => s.id === selectedSubcategoryId
      );
      if (!currentSubcategory) {
        onSubcategoryChange('');
        onTypeChange('');
      }
    }
  }, [selectedCategoryId, subcategories]);

  // Reset type when subcategory changes
  useEffect(() => {
    if (selectedSubcategoryId && selectedTypeId) {
      const currentType = types?.find((t) => t.id === selectedTypeId);
      if (!currentType) {
        onTypeChange('');
      }
    }
  }, [selectedSubcategoryId, types]);

  // Reset ownership when subcategory changes
  useEffect(() => {
    if (selectedSubcategoryId && selectedOwnershipId) {
      const currentOwnership = ownerships?.find(
        (o) => o.id === selectedOwnershipId
      );
      if (!currentOwnership) {
        onOwnershipChange('');
      }
    }
  }, [selectedSubcategoryId, ownerships]);

  const selectedCategory = categories?.find((c) => c.id === selectedCategoryId);
  const selectedSubcategory = subcategories?.find(
    (s) => s.id === selectedSubcategoryId
  );

  // Filter categories based on search
  const filteredCategories = categories?.filter(
    (category) =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      category.description.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Category Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Category *</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Field */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search categories..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-10 pr-10"
            />
            {categorySearch && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCategorySearch('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {categoriesLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading categories...
            </div>
          ) : filteredCategories && filteredCategories.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={
                    selectedCategoryId === category.id ? 'default' : 'outline'
                  }
                  onClick={() => onCategoryChange(category.id)}
                  className={cn(
                    'h-auto p-4 flex flex-col items-center gap-3',
                    errors?.category_id && 'border-red-500'
                  )}
                >
                  <IconRenderer
                    icon={category.icon}
                    className={cn(
                      'text-primary',
                      selectedCategoryId === category.id && 'text-white'
                    )}
                  />
                  <div className="text-center">
                    <div className="font-medium">{category.name}</div>
                  </div>
                </Button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {categorySearch
                ? 'No categories found matching your search.'
                : 'No categories available.'}
            </div>
          )}
          {errors?.category_id && (
            <p className="text-sm text-red-500 mt-2">{errors.category_id}</p>
          )}
        </CardContent>
      </Card>

      {/* Subcategory Selection */}
      {selectedCategoryId && (
        <Card>
          <CardHeader>
            <CardTitle>
              Select Subcategory
              {selectedCategory && (
                <Badge variant="secondary" className="ml-2">
                  {selectedCategory.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subcategoriesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading subcategories...
              </div>
            ) : subcategories && subcategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subcategories.map((subcategory) => (
                  <Button
                    key={subcategory.id}
                    variant={
                      selectedSubcategoryId === subcategory.id
                        ? 'default'
                        : 'outline'
                    }
                    onClick={() => onSubcategoryChange(subcategory.id)}
                    className={cn(
                      'h-auto p-4 flex flex-col items-center gap-3',
                      errors?.subcategory_id && 'border-red-500'
                    )}
                  >
                    {subcategory.icon && (
                      <IconRenderer
                        icon={subcategory.icon}
                        className={cn(
                          'text-primary',
                          selectedSubcategoryId === subcategory.id &&
                            'text-white'
                        )}
                      />
                    )}
                    <div className="text-center">
                      <div className="font-medium">{subcategory.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {subcategory.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No subcategories available for this category.
              </div>
            )}
            {errors?.subcategory_id && (
              <p className="text-sm text-red-500 mt-2">
                {errors.subcategory_id}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Type Selection (Optional) */}
      {selectedSubcategoryId && types && types.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Select Type
              {selectedSubcategory && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSubcategory.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {typesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading types...
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {types.map((type) => (
                  <Button
                    key={type.id}
                    variant={selectedTypeId === type.id ? 'default' : 'outline'}
                    onClick={() =>
                      onTypeChange(selectedTypeId === type.id ? '' : type.id)
                    }
                    className="h-auto p-4 flex flex-col items-center gap-3"
                  >
                    {type.icon && (
                      <IconRenderer
                        icon={type.icon}
                        className={cn(
                          'text-primary',
                          selectedTypeId === type.id && 'text-white'
                        )}
                      />
                    )}
                    <div className="text-center">
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {type.description}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ownership Selection (Optional) */}
      {selectedSubcategoryId && ownerships && ownerships.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Ownership Type
              {selectedSubcategory && (
                <Badge variant="secondary" className="ml-2">
                  {selectedSubcategory.name}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ownershipsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading ownership types...
              </div>
            ) : (
              <RadioGroup
                value={selectedOwnershipId || ''}
                onValueChange={(value) => onOwnershipChange(value || undefined)}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="" id="no-ownership" />
                  <Label htmlFor="no-ownership">None</Label>
                </div>
                {ownerships.map((ownership) => (
                  <div
                    key={ownership.id}
                    className="flex items-center space-x-2"
                  >
                    <RadioGroupItem value={ownership.id} id={ownership.id} />
                    <Label
                      htmlFor={ownership.id}
                      className="flex items-center gap-2"
                    >
                      {ownership.icon && (
                        <IconRenderer
                          icon={ownership.icon}
                          className={cn('text-primary')}
                        />
                      )}
                      <div>
                        <div className="font-medium">{ownership.type}</div>
                        <div className="text-sm text-muted-foreground">
                          {ownership.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
