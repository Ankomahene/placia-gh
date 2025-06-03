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
import { Button } from '@/components/ui/button';
import { IconRenderer } from '@/components/ui/icon-renderer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { cn } from '@/lib/utils';
import type { PlaceSubcategory } from '@/types/place';
import { useDraggable } from '@dnd-kit/core';
import { GripVerticalIcon, Grip, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SubcategoryForm } from '../place-manager/forms/SubcategoryForm';

function DraggableSubcategory({
  subcategory,
  onEdit,
  onDelete,
}: {
  subcategory: PlaceSubcategory;
  onEdit: (subcategory: PlaceSubcategory) => void;
  onDelete: (subcategory: PlaceSubcategory) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: subcategory.id,
    data: {
      type: 'subcategory',
      subcategory,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border  transition-colors hover:bg-muted/50',
        isDragging && 'opacity-50'
      )}
    >
      <div {...listeners} className="flex items-center gap-2 cursor-move">
        <div className="flex items-center gap-3">
          <GripVerticalIcon className="w-4 h-4" />
        </div>
        {subcategory.icon && (
          <IconRenderer icon={subcategory.icon} className="w-5 h-5" />
        )}
        <div>
          <h3 className="text-sm font-medium line-clamp-1 ">
            {subcategory.name}
          </h3>
          {subcategory.description && (
            <p className="text-sm text-muted-foreground">
              {subcategory.description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center w-[60px] ">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onEdit(subcategory)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(subcategory)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

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
  const [editingSubcategory, setEditingSubcategory] =
    useState<PlaceSubcategory | null>(null);
  const { subcategories, isLoading } = usePlaceSubcategories();

  const handleEdit = (subcategory: PlaceSubcategory) => {
    setEditingSubcategory(subcategory);
    setIsFormOpen(true);
  };

  const handleDelete = (subcategory: PlaceSubcategory) => {
    setEditingSubcategory(subcategory);
    setIsDeleteDialogOpen(true);
  };

  // if (!groupingId) {
  //   return (
  //     <div className="text-center text-muted-foreground p-4">
  //       Select a grouping to manage subcategories
  //     </div>
  //   );
  // }

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
          <DraggableSubcategory
            key={subcategory.id}
            subcategory={subcategory}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-6">
          <SheetHeader>
            <SheetTitle>
              {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8 px-8">
            <SubcategoryForm
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
              Are you sure you want to delete this subcategory? This action
              cannot be undone.
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
