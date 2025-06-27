'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { usePlaceTypes } from '@/hooks/admin/use-place-types';
import { TypeForm } from './forms/TypeForm';
import type { PlaceType } from '@/types/place';

interface TypeListProps {
  subcategoryId: string;
}

export function TypeList({ subcategoryId }: TypeListProps) {
  const [selectedType, setSelectedType] = useState<PlaceType | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { types, isLoading, deleteType } = usePlaceTypes(subcategoryId);

  const handleEdit = (type: PlaceType) => {
    setSelectedType(type);
    setIsFormOpen(true);
  };

  const handleDelete = (type: PlaceType) => {
    setSelectedType(type);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedType) {
      await deleteType(selectedType.id);
      setIsDeleteDialogOpen(false);
      setSelectedType(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3 mt-3">
        {[1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3 mt-3">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-medium text-muted-foreground">Types</h4>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setSelectedType(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Type
        </Button>
      </div>

      <div className="space-y-2">
        {types?.map((type) => (
          <div
            key={type.id}
            className="flex items-center justify-between p-2 rounded-md border bg-muted/30"
          >
            <div className="flex items-center gap-2">
              {type.icon && (
                <IconRenderer icon={type.icon} className="w-4 h-4" />
              )}
              <div>
                <h5 className="text-sm font-medium">{type.name}</h5>
                {type.description && (
                  <p className="text-xs text-muted-foreground">
                    {type.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleEdit(type)}
              >
                <Pencil className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-red-500/10 dark:hover:bg-red-400/10 text-red-900 dark:text-red-100"
                onClick={() => handleDelete(type)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-6">
          <SheetHeader>
            <SheetTitle>{selectedType ? 'Edit Type' : 'Add Type'}</SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <TypeForm
              subcategoryId={subcategoryId}
              type={selectedType}
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
            <AlertDialogTitle>Delete Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this type? This action cannot be
              undone.
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
