'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Component } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { IconRenderer } from '@/components/ui/icon-renderer';
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
import { cn } from '@/lib/utils';
import { usePlaceSubcategories } from '@/hooks/admin/use-place-subcategories';
import { SubcategoryForm } from '../../place-manager/forms/SubcategoryForm';
import type { PlaceSubcategory } from '@/types/place';
import { toast } from 'sonner';

interface SubcategoriesManagerProps {
  search: string;
}

function DraggableSubcategory({
  subcategory,
  onEdit,
  onDelete,
}: {
  subcategory: PlaceSubcategory;
  onEdit: () => void;
  onDelete: () => void;
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
      className={cn(
        'group relative rounded-lg border p-4 transition-all duration-200',
        'hover:shadow-md hover:border-primary/20 hover:bg-muted/50',
        isDragging && 'opacity-50 scale-95'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Drag handle */}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 rounded hover:bg-muted/50 transition-colors"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Subcategory icon */}
        <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
          {subcategory.icon ? (
            <IconRenderer icon={subcategory.icon} className="h-4 w-4" />
          ) : (
            <Component className="h-4 w-4" />
          )}
        </div>

        {/* Subcategory info */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{subcategory.name}</h3>
          {subcategory.description && (
            <p className="text-xs text-muted-foreground truncate mt-1">
              {subcategory.description}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function SubcategoriesManager({ search }: SubcategoriesManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] =
    useState<PlaceSubcategory | null>(null);

  const { subcategories, isLoading, deleteSubcategory, isDeleting } =
    usePlaceSubcategories();

  const filteredSubcategories =
    subcategories?.filter(
      (subcategory) =>
        subcategory.name.toLowerCase().includes(search.toLowerCase()) ||
        subcategory.description?.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const handleDelete = () => {
    if (!editingSubcategory) return;

    deleteSubcategory(editingSubcategory.id, {
      onSuccess: () => {
        toast.success('Subcategory deleted successfully');
        setIsDeleteDialogOpen(false);
        setEditingSubcategory(null);
      },
      onError: (error) => {
        toast.error(error.message);
      },
    });
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingSubcategory(null);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Available Subcategories</h3>
            <p className="text-sm text-muted-foreground">
              Drag subcategories to add them to groupings
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingSubcategory(null);
              setIsFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Subcategories list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredSubcategories.length === 0 ? (
          <div className="text-center py-8">
            <Component className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No subcategories found' : 'No subcategories yet'}
            </p>
            {!search && (
              <p className="text-xs text-muted-foreground mt-1">
                Create your first subcategory to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSubcategories.map((subcategory) => (
              <DraggableSubcategory
                key={subcategory.id}
                subcategory={subcategory}
                onEdit={() => {
                  setEditingSubcategory(subcategory);
                  setIsFormOpen(true);
                }}
                onDelete={() => {
                  setEditingSubcategory(subcategory);
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Forms and Dialogs */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-8">
          <SheetHeader>
            <SheetTitle>
              {editingSubcategory ? 'Edit Subcategory' : 'Create Subcategory'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <SubcategoryForm
              subcategory={editingSubcategory}
              onSuccess={handleFormSuccess}
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
              Are you sure you want to delete "{editingSubcategory?.name}"? This
              will also remove it from all groupings. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
