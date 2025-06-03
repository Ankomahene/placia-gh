import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { cn } from '@/lib/utils';
import { SubcategoryForm } from '../place-manager/forms/SubcategoryForm';
import type { PlaceSubcategory } from '@/types/place';

interface SubcategoriesSectionProps {
  groupingId?: string;
  onCreateSubcategory: (data: any) => Promise<void>;
  onUpdateSubcategory: (id: string, data: any) => Promise<void>;
  onDeleteSubcategory: (id: string) => Promise<void>;
}

export function SubcategoriesSection({
  groupingId,
  onCreateSubcategory,
  onUpdateSubcategory,
  onDeleteSubcategory,
}: SubcategoriesSectionProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<PlaceSubcategory | null>(null);
  const { subcategories, isLoading } = usePlaceSubcategories(groupingId);

  const handleEdit = (subcategory: PlaceSubcategory) => {
    setEditingSubcategory(subcategory);
    setIsFormOpen(true);
  };

  const handleDelete = (subcategory: PlaceSubcategory) => {
    setEditingSubcategory(subcategory);
    setIsDeleteDialogOpen(true);
  };

  if (!groupingId) {
    return (
      <div className="text-center text-muted-foreground p-4">
        Select a grouping to manage subcategories
      </div>
    );
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Subcategories</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditingSubcategory(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <div className="space-y-2">
        {subcategories?.map((subcategory) => (
          <div
            key={subcategory.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              {subcategory.icon && (
                <IconRenderer icon={subcategory.icon} className="w-5 h-5" />
              )}
              <div>
                <h3 className="font-medium">{subcategory.name}</h3>
                {subcategory.description && (
                  <p className="text-sm text-muted-foreground">
                    {subcategory.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleEdit(subcategory)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => handleDelete(subcategory)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-6">
          <SheetHeader>
            <SheetTitle>
              {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <SubcategoryForm
              categoryId={groupingId}
              subcategory={editingSubcategory}
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
            <AlertDialogTitle>Delete Subcategory</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subcategory? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (editingSubcategory) {
                  await onDeleteSubcategory(editingSubcategory.id);
                  setIsDeleteDialogOpen(false);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}