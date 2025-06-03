'use client';

import { useState } from 'react';
import { DndContext, DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';
import { DragOverlayProvider } from './providers/DragOverlayProvider';
import { GroupingsPanel } from './panels/GroupingsPanel';
import { SchemaBuilderPanel } from './panels/SchemaBuilderPanel';
import { ResourcesPanel } from './panels/ResourcesPanel';
import { useSchemaActions } from './hooks/useSchemaActions';
import type {
  PlaceGrouping,
  PlaceField,
  PlaceSubcategory,
} from '@/types/place';
import { toast } from 'sonner';

function PlaceSchemaClientInner() {
  const { groupings, isLoading, error } = usePlaceGroupings();
  const [selectedGrouping, setSelectedGrouping] =
    useState<PlaceGrouping | null>(null);
  const [draggedField, setDraggedField] = useState<PlaceField | null>(null);
  const [draggedSubcategory, setDraggedSubcategory] =
    useState<PlaceSubcategory | null>(null);

  const { handleFieldDrop, handleSubcategoryDrop } = useSchemaActions();

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;

    if (active.data.current?.type === 'field') {
      setDraggedField(active.data.current.field);
      setDraggedSubcategory(null);
    } else if (active.data.current?.type === 'subcategory') {
      setDraggedSubcategory(active.data.current.subcategory);
      setDraggedField(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || !selectedGrouping) {
      setDraggedField(null);
      setDraggedSubcategory(null);
      return;
    }

    try {
      if (
        active.data?.current?.type === 'field' &&
        over.data?.current?.type === 'droppable'
      ) {
        const field = active.data.current.field;
        const isRequired = over.data.current.section === 'required';

        await handleFieldDrop({
          groupingId: selectedGrouping.id,
          fieldId: field.id,
          required: isRequired,
        });
      } else if (
        active.data?.current?.type === 'subcategory' &&
        over.data?.current?.type === 'grouping'
      ) {
        const subcategory = active.data.current.subcategory;

        await handleSubcategoryDrop({
          id: subcategory.id,
          groupingId: selectedGrouping.id,
        });
      }
    } catch (error) {
      toast.error('Failed to update schema');
    } finally {
      setDraggedField(null);
      setDraggedSubcategory(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-8 bg-muted rounded mb-4"></div>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <div key={j} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-destructive">
            Error loading schema
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            {error instanceof Error
              ? error.message
              : 'An unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-muted/30">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Place Schema Management
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure field requirements and categorization rules for different
            place types
          </p>
        </div>

        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-250px)] overflow-hidden">
            {/* Groupings Panel */}
            <div className="lg:col-span-1 h-[calc(100vh-250px)] overflow-y-auto">
              <div className="bg-card dark:bg-card/40 border rounded-lg overflow-hidden h-full flex flex-col">
                <GroupingsPanel
                  selectedGrouping={selectedGrouping}
                  onSelect={setSelectedGrouping}
                />
              </div>
            </div>

            {/* Schema Builder Panel */}
            <div className="lg:col-span-2 h-[calc(100vh-250px)] overflow-y-auto pb-2">
              <div className="bg-card dark:bg-card/40 border rounded-lg overflow-hidden h-full flex flex-col">
                <SchemaBuilderPanel
                  groupings={groupings || []}
                  selectedGroupingId={selectedGrouping?.id}
                />
              </div>
            </div>

            {/* Resources Panel */}
            <div className="lg:col-span-1 h-[calc(100vh-250px)] overflow-y-auto">
              <div className="bg-card dark:bg-card/40 border rounded-lg overflow-hidden h-full flex flex-col">
                <ResourcesPanel />
              </div>
            </div>
          </div>

          <DragOverlayProvider
            draggedField={draggedField}
            draggedSubcategory={draggedSubcategory}
          />
        </DndContext>
      </div>
    </div>
  );
}

export default function PlaceSchemaClient() {
  return <PlaceSchemaClientInner />;
}
