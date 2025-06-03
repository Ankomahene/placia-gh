'use client';

import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { GroupingsSection } from '@/components/admin/schema/GroupingsSection';
import { FieldsSection } from '@/components/admin/schema/FieldsSection';
import { SchemaBuilder } from '@/components/admin/schema/SchemaBuilder';
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';
import type { PlaceGrouping, PlaceField } from '@/types/place';

export default function PlaceSchemaPage() {
  const [selectedGrouping, setSelectedGrouping] = useState<PlaceGrouping | null>(null);
  const [draggedField, setDraggedField] = useState<PlaceField | null>(null);
  const { groupings, isLoading } = usePlaceGroupings();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    // Handle dropping fields into required/optional sections
    if (active.data?.current?.type === 'field' && over.data?.current?.type === 'droppable') {
      // Update schema here
    }

    setDraggedField(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Place Schema Manager</h1>
        <p className="text-muted-foreground mt-2">
          Manage how place-related data is grouped and structured
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-3 p-4">
          <GroupingsSection 
            groupings={groupings}
            isLoading={isLoading}
            selectedGrouping={selectedGrouping}
            onSelect={setSelectedGrouping}
          />
        </Card>

        <Card className="lg:col-span-6 p-4">
          <DndContext onDragEnd={handleDragEnd}>
            <SchemaBuilder 
              grouping={selectedGrouping}
              onFieldMove={(fieldId, required) => {
                // Handle field movement between sections
              }}
            />
            <DragOverlay>
              {draggedField && (
                <div className="p-2 bg-background border rounded shadow-lg">
                  {draggedField.label}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </Card>

        <Card className="lg:col-span-3 p-4">
          <FieldsSection />
        </Card>
      </div>
    </div>
  );
}