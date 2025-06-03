'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
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
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import { GroupingForm } from './forms/GroupingForm';
import type { PlaceGrouping } from '@/types/place';

interface GroupingsSectionProps {
  groupings?: PlaceGrouping[];
  isLoading: boolean;
  selectedGrouping: PlaceGrouping | null;
  onSelect: (grouping: PlaceGrouping) => void;
  onCreateGrouping: (data: any) => Promise<void>;
  onUpdateGrouping: (id: string, data: any) => Promise<void>;
  onDeleteGrouping: (id: string) => Promise<void>;
  isCreating?: boolean;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function GroupingsSection({
  groupings = [],
  isLoading,
  selectedGrouping,
  onSelect,
  onCreateGrouping,
  onUpdateGrouping,
  onDeleteGrouping,
  isCreating,
  isUpdating,
  isDeleting,
}: GroupingsSectionProps) {
  const [search, setSearch] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingGrouping, setEditingGrouping] = useState<PlaceGrouping | null>(null);

  const filteredGroupings = groupings.filter((grouping) =>
    grouping.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (grouping: PlaceGrouping) => {
    setEditingGrouping(grouping);
    setIsFormOpen(true);
  };

  const handleDelete = (grouping: PlaceGrouping) => {
    setEditingGrouping(grouping);
    setIsDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groupings</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditingGrouping(null);
            setIsFormOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      <Input
        placeholder="Search groupings..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="space-y-2">
        {filteredGroupings.map((grouping) => (
          <div
            key={grouping.id}
            className={cn(
              'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
              selectedGrouping?.id === grouping.id
                ? 'bg-primary/10 border-primary/20'
                : 'hover:bg-muted/50'
            )}
            onClick={() => onSelect(grouping)}
          >
            <div className="flex items-center gap-3">
              {grouping.icon && (
                <IconRenderer icon={grouping.icon} className="h-5 w-5" />
              )}
              <div>
                <h3 className="font-medium">{grouping.name}</h3>
                {grouping.description && (
                  <p className="text-sm text-muted-foreground">
                    {grouping.description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(grouping);
                }}
              >
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(grouping);
                }}
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
              {editingGrouping ? 'Edit Grouping' : 'Add Grouping'}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-8">
            <GroupingForm
              grouping={editingGrouping}
              onSubmit={async (data) => {
                if (editingGrouping) {
                  await onUpdateGrouping(editingGrouping.id, data);
                } else {
                  await onCreateGrouping(data);
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
            <AlertDialogTitle>Delete Grouping</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this grouping? This action cannot
              be undone and will also delete all associated schema mappings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (editingGrouping) {
                  await onDeleteGrouping(editingGrouping.id);
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