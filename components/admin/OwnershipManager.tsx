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
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useOwnerships } from '@/hooks/admin/use-ownerships';
import { OwnershipForm } from './forms/OwnershipForm';
import type { Ownership } from '@/types/place';

export function OwnershipManager() {
  const [selectedOwnership, setSelectedOwnership] = useState<Ownership | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { ownerships, isLoading, deleteOwnership } = useOwnerships();

  const handleEdit = (ownership: Ownership) => {
    setSelectedOwnership(ownership);
    setIsFormOpen(true);
  };

  const handleDelete = (ownership: Ownership) => {
    setSelectedOwnership(ownership);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedOwnership) {
      await deleteOwnership(selectedOwnership.id);
      setIsDeleteDialogOpen(false);
      setSelectedOwnership(null);
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
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Ownerships</h2>
        <Button onClick={() => { setSelectedOwnership(null); setIsFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Add Ownership
        </Button>
      </div>

      <div className="grid gap-4">
        {ownerships?.map((ownership) => (
          <div
            key={ownership.id}
            className="flex items-center justify-between p-4 rounded-lg border bg-card"
          >
            <div className="flex items-center gap-3">
              {ownership.icon && (
                <span className="text-xl">{ownership.icon}</span>
              )}
              <div>
                <h3 className="font-medium">{ownership.name}</h3>
                {ownership.description && (
                  <p className="text-sm text-muted-foreground">
                    {ownership.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(ownership)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(ownership)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>
              {selectedOwnership ? 'Edit Ownership' : 'Add Ownership'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <OwnershipForm
              ownership={selectedOwnership}
              onSuccess={() => setIsFormOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Ownership</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this ownership type? This action cannot be undone.
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