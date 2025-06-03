'use client';

import React from 'react';
import { DragOverlay } from '@dnd-kit/core';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import type { PlaceField, PlaceSubcategory } from '@/types/place';

interface DragOverlayProviderProps {
  draggedField: PlaceField | null;
  draggedSubcategory: PlaceSubcategory | null;
}

function DraggedFieldOverlay({ field }: { field: PlaceField }) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-2xl min-w-[200px]">
      <div className="flex-1">
        <p className="font-medium text-sm">{field.label}</p>
        <p className="text-xs text-muted-foreground">{field.name}</p>
      </div>
      <Badge variant="secondary" className="text-xs">
        {field.field_type}
        {field.is_array && '[]'}
      </Badge>
    </div>
  );
}

function DraggedSubcategoryOverlay({
  subcategory,
}: {
  subcategory: PlaceSubcategory;
}) {
  return (
    <div className="flex items-center gap-3 p-4 bg-background/95 backdrop-blur-sm border rounded-lg shadow-2xl min-w-[200px]">
      {subcategory.icon && (
        <IconRenderer
          icon={subcategory.icon}
          className="w-5 h-5 flex-shrink-0"
        />
      )}
      <div className="flex-1">
        <p className="font-medium text-sm">{subcategory.name}</p>
        {subcategory.description && (
          <p className="text-xs text-muted-foreground line-clamp-1">
            {subcategory.description}
          </p>
        )}
      </div>
    </div>
  );
}

export function DragOverlayProvider({
  draggedField,
  draggedSubcategory,
}: DragOverlayProviderProps) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <DragOverlay
      className="cursor-grabbing"
      style={{
        transform: 'rotate(5deg)',
      }}
    >
      {draggedField && <DraggedFieldOverlay field={draggedField} />}
      {draggedSubcategory && (
        <DraggedSubcategoryOverlay subcategory={draggedSubcategory} />
      )}
    </DragOverlay>,
    document.body
  );
}
