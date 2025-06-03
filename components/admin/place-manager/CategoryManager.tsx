'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import { getElementColor } from '@/lib/utils/element-colors';
import { usePlaceCategories } from '@/hooks/admin/use-place-categories';
import { CategoryForm } from './forms/CategoryForm';
import { SubcategoryList } from './SubcategoryList';
import type { PlaceCategory } from '@/types/place';

export function CategoryManager() {
  const [selectedCategory, setSelectedCategory] =
    useState<PlaceCategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { categories, isLoading, deleteCategory, search, setSearch } =
    usePlaceCategories();

  const handleEdit = (category: PlaceCategory) => {
    setSelectedCategory(category);
    setIsFormOpen(true);
  };

  const handleDelete = (category: PlaceCategory) => {
    setSelectedCategory(category);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedCategory) {
      await deleteCategory(selectedCategory.id);
      setIsDeleteDialogOpen(false);
      setSelectedCategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Categories</h2>
          <Button
            onClick={() => {
              setSelectedCategory(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Accordion type="multiple" className="space-y-4">
        {categories?.map((category, index) => (
          <AccordionItem
            key={category.id}
            value={category.id}
            className={cn(
              'border rounded-lg shadow-sm border-l-4',
              getElementColor(category.id, index)
            )}
          >
            <AccordionTrigger className="px-4 hover:no-underline hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center justify-between flex-1 mr-4">
                <div className="flex items-center gap-3">
                  {category.icon && (
                    <IconRenderer icon={category.icon} className="w-6 h-6" />
                  )}
                  <div>
                    <h3 className="font-medium text-left">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-muted-foreground text-left">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(category);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-red-500/10 dark:hover:bg-red-400/10 text-red-900 dark:text-red-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(category);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <SubcategoryList categoryId={category.id} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-6">
          <SheetHeader>
            <SheetTitle>
              {selectedCategory ? 'Edit Category' : 'Add Category'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <CategoryForm
              category={selectedCategory}
              onSuccess={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this category? This action cannot
              be undone and will also delete all associated subcategories and
              types.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
