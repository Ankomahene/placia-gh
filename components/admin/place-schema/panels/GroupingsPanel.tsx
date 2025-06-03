'use client';

import React, { useState } from 'react';
import { Plus, Search, Settings, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';
import { GroupingForm } from '../forms/GroupingForm';
import type { PlaceGrouping } from '@/types/place';
import { toast } from 'sonner';

interface GroupingsPanelProps {
  selectedGrouping: PlaceGrouping | null;
  onSelect: (grouping: PlaceGrouping | null) => void;
}

function GroupingCard({
  grouping,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
}: {
  grouping: PlaceGrouping & {
    schema?: { required?: any[]; optional?: any[] };
    subcategories?: any[];
  };
  isSelected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const fieldCount =
    (grouping.schema?.required?.length || 0) +
    (grouping.schema?.optional?.length || 0);
  const subcategoryCount = grouping.subcategories?.length || 0;

  return (
    <div
      className={cn(
        'group relative rounded-lg border p-4 cursor-pointer transition-all duration-200',
        'hover:shadow-md hover:border-primary/20',
        isSelected
          ? 'border-primary bg-primary/5 shadow-sm'
          : 'border-border hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-medium text-sm truncate',
                isSelected ? 'text-primary' : 'text-foreground'
              )}
            >
              {grouping.name}
            </h3>
            {grouping.description && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {grouping.description}
              </p>
            )}
          </div>

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

        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline" className="text-xs">
            {fieldCount} fields
          </Badge>
          <Badge variant="outline" className="text-xs">
            {subcategoryCount} subcategories
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function GroupingsPanel({
  selectedGrouping,
  onSelect,
}: GroupingsPanelProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGrouping, setEditingGrouping] = useState<PlaceGrouping | null>(
    null
  );

  const {
    groupings,
    isLoading,
    createGrouping,
    updateGrouping,
    deleteGrouping,
    isCreating,
    isUpdating,
    isDeleting,
  } = usePlaceGroupings();

  const filteredGroupings =
    groupings?.filter(
      (grouping) =>
        grouping.name.toLowerCase().includes(search.toLowerCase()) ||
        grouping.description?.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const handleCreate = async (data: any) => {
    return new Promise<void>((resolve, reject) => {
      createGrouping(data, {
        onSuccess: () => {
          toast.success('Grouping created successfully');
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
      updateGrouping(
        { id, ...data },
        {
          onSuccess: () => {
            toast.success('Grouping updated successfully');
            setIsFormOpen(false);
            setEditingGrouping(null);
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
    if (!editingGrouping) return;

    return new Promise<void>((resolve, reject) => {
      deleteGrouping(editingGrouping.id, {
        onSuccess: () => {
          toast.success('Grouping deleted successfully');
          setIsDeleteDialogOpen(false);
          setEditingGrouping(null);
          if (selectedGrouping?.id === editingGrouping.id) {
            onSelect(null);
          }
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
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Groupings</h2>
            <p className="text-sm text-muted-foreground">
              Organize places by categories
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingGrouping(null);
              setIsFormOpen(true);
            }}
            disabled={isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search groupings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        ) : filteredGroupings.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {search ? 'No groupings found' : 'No groupings yet'}
            </p>
            {!search && (
              <p className="text-xs text-muted-foreground mt-1">
                Create your first grouping to get started
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredGroupings.map((grouping) => (
              <GroupingCard
                key={grouping.id}
                grouping={grouping}
                isSelected={selectedGrouping?.id === grouping.id}
                onSelect={() => onSelect(grouping)}
                onEdit={() => {
                  setEditingGrouping(grouping);
                  setIsFormOpen(true);
                }}
                onDelete={() => {
                  setEditingGrouping(grouping);
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
              {editingGrouping ? 'Edit Grouping' : 'Create Grouping'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <GroupingForm
              grouping={editingGrouping}
              onSubmit={async (data) => {
                if (editingGrouping) {
                  await handleUpdate(editingGrouping.id, data);
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
            <AlertDialogTitle>Delete Grouping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{editingGrouping?.name}"? This
              will also remove all associated schema mappings. This action
              cannot be undone.
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
