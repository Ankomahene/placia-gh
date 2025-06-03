'use client';

import React, { useState } from 'react';
import { Plus, Pencil, Trash2, GripVertical, Database } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
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
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { FieldForm } from '../forms/FieldForm';
import type { PlaceField } from '@/types/place';
import { toast } from 'sonner';

interface FieldsManagerProps {
  search: string;
}

function DraggableField({
  field,
  onEdit,
  onDelete,
}: {
  field: PlaceField;
  onEdit: () => void;
  onDelete: () => void;
}) {
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

        {/* Field icon */}
        <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
          <Database className="h-4 w-4" />
        </div>

        {/* Field info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm truncate">{field.label}</h3>
            <Badge variant="outline" className="text-xs">
              {field.field_type}
              {field.is_array && '[]'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">{field.name}</p>
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

export function FieldsManager({ search }: FieldsManagerProps) {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<PlaceField | null>(null);

  const {
    fields,
    isLoading,
    createField,
    updateField,
    deleteField,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlaceFields();

  const filteredFields =
    fields?.filter(
      (field) =>
        field.label.toLowerCase().includes(search.toLowerCase()) ||
        field.name.toLowerCase().includes(search.toLowerCase()) ||
        field.field_type.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const handleCreate = async (data: any) => {
    return new Promise<void>((resolve, reject) => {
      createField(data, {
        onSuccess: () => {
          toast.success('Field created successfully');
          setIsFormOpen(false);
          resolve();
        },
        onError: (error) => {
          toast.error(error.message);
          reject(error);
        },
      });
    });
  };

  const handleUpdate = async (id: string, data: any) => {
    return new Promise<void>((resolve, reject) => {
      updateField(
        { id, ...data },
        {
          onSuccess: () => {
            toast.success('Field updated successfully');
            setIsFormOpen(false);
            setEditingField(null);
            resolve();
          },
          onError: (error) => {
            toast.error(error.message);
            reject(error);
          },
        }
      );
    });
  };

  const handleDelete = async () => {
    if (!editingField) return;

    return new Promise<void>((resolve, reject) => {
      deleteField(editingField.id, {
        onSuccess: () => {
          toast.success('Field deleted successfully');
          setIsDeleteDialogOpen(false);
          setEditingField(null);
          resolve();
        },
        onError: (error) => {
          toast.error(error.message);
          reject(error);
        },
      });
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Action bar */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">Available Fields</h3>
            <p className="text-sm text-muted-foreground">
              Drag fields to add them to schema
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingField(null);
              setIsFormOpen(true);
            }}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Fields list */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No fields found' : 'No fields yet'}
            </p>
            {!search && (
              <p className="text-xs text-muted-foreground mt-1">
                Create your first field to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredFields.map((field) => (
              <DraggableField
                key={field.id}
                field={field}
                onEdit={() => {
                  setEditingField(field);
                  setIsFormOpen(true);
                }}
                onDelete={() => {
                  setEditingField(field);
                  setIsDeleteDialogOpen(true);
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Forms and Dialogs */}
      <Sheet open={isFormOpen} onOpenChange={setIsFormOpen}>
        <SheetContent className="sm:max-w-[500px]">
          <SheetHeader>
            <SheetTitle>
              {editingField ? 'Edit Field' : 'Create Field'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FieldForm
              field={editingField}
              onSubmit={async (data) => {
                if (editingField) {
                  await handleUpdate(editingField.id, data);
                } else {
                  await handleCreate(data);
                }
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
              Are you sure you want to delete "{editingField?.label}"? This will
              also remove it from all schemas. This action cannot be undone.
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
