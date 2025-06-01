'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { SubcategoryForm } from './forms/SubcategoryForm';
import { TypeList } from './TypeList';
import type { PlaceSubcategory } from '@/types/place';

interface SubcategoryListProps {
  categoryId: string;
}

export function SubcategoryList({ categoryId }: SubcategoryListProps) {
  const [selectedSubcategory, setSelectedSubcategory] = useState<PlaceSubcategory | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { subcategories, isLoading, deleteSubcategory } = usePlaceSubcategories(categoryId);

  const handleEdit = (subcategory: PlaceSubcategory) => {
    setSelectedSubcategory(subcategory);
    setIsFormOpen(true);
  };

  const handleDelete = (subcategory: PlaceSubcategory) => {
    setSelectedSubcategory(subcategory);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedSubcategory) {
      await deleteSubcategory(selectedSubcategory.id);
      setIsDeleteDialogOpen(false);
      setSelectedSubcategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mt-4">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-muted-foreground">Subcategories</h3>
        <Button
          size="sm"
          onClick={() => {
            setSelectedSubcategory(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Subcategory
        </Button>
      </div>

      <Accordion type="multiple" className="space-y-2">
        {subcategories?.map((subcategory) => (
          <AccordionItem
            key={subcategory.id}
            value={subcategory.id}
            className="border rounded-md"
          >
            <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-muted/50 [&[data-state=open]>svg]:rotate-180">
              <div className="flex items-center justify-between flex-1 mr-4">
                <div className="flex items-center gap-2">
                  {subcategory.icon && (
                    <span className="text-lg">{subcategory.icon}</span>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-left">
                      {subcategory.name}
                    </h4>
                    {subcategory.description && (
                      <p className="text-xs text-muted-foreground text-left">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEdit(subcategory);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(subcategory);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
            </AccordionTrigger>
            <AccordionContent className="px-3 pb-3">
              <TypeList subcategoryId={subcategory.id} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>
              {selectedSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <SubcategoryForm
              categoryId={categoryId}
              subcategory={selectedSubcategory}
              onSuccess={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subcategory? This action cannot be
              undone and will also delete all associated types.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}