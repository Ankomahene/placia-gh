'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
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
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FieldsSection() {
  const { fields, isLoading, search, setSearch } = usePlaceFields();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Fields</h2>
        <Button size="sm">
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
    </div>
  );
}