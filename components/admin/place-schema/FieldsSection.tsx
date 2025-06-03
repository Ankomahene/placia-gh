'use client';

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
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { FieldForm } from './forms/FieldForm';
import type { PlaceField } from '@/types/place';

function DraggableField({ field }: { field: PlaceField }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: field.id,
    data: {
      type: 'field',
      field,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border cursor-move transition-colors hover:bg-muted/50',
        isDragging && 'opacity-50'
      )}
    >
      <div className="flex items-center gap-3">
        <div>
          <h3 className="font-medium">{field.label}</h3>
          <p className="text-sm text-muted-foreground">{field.name}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {field.field_type}
          {field.is_array && '[]'}
        </Badge>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(field);
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
              handleDelete(field);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FieldsSection({
  onCreateField,
  onUpdateField,
  onDeleteField,
}: {
  onCreateField: (data: any) => Promise<void>;
  onUpdateField: (id: string, data: any) => Promise<void>;
  onDeleteField: (id: string) => Promise<void>;
}) {
  const {
    fields,
    isLoading,
    search,
    setSearch,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlaceFields();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<PlaceField | null>(null);

  const handleEdit = (field: PlaceField) => {
    setEditingField(field);
    setIsFormOpen(true);
  };

  const handleDelete = (field: PlaceField) => {
    setEditingField(field);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (editingField) {
      await onDeleteField(editingField.id);
      setIsDeleteDialogOpen(false);
      setEditingField(null);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fields</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditingField(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search fields..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="space-y-2">
        {fields?.map((field) => (
          <DraggableField key={field.id} field={field} />
        ))}
      </div>

      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px] px-4 md:px-6">
          <SheetHeader>
            <SheetTitle>
              {editingField ? 'Edit Field' : 'Add Field'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <FieldForm
              field={editingField}
              onSubmit={async (data) => {
                if (editingField) {
                  await onUpdateField(editingField.id, data);
                } else {
                  await onCreateField(data);
                }
                setIsFormOpen(false);
              }}
              isSubmitting={isCreating || isUpdating}
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
            <AlertDialogTitle>Delete Field</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this field? This action cannot
              be undone and will also remove it from all grouping schemas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (editingField) {
                  await onDeleteField(editingField.id);
                  setIsDeleteDialogOpen(false);
                }
              }}
              disabled={isDeleting}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}