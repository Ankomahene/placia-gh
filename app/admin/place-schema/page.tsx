'use client';

import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { GroupingsSection } from '@/components/admin/schema/GroupingsSection';
import { FieldsSection } from '@/components/admin/schema/FieldsSection';
import { SchemaBuilder } from '@/components/admin/schema/SchemaBuilder';
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { useSchemaMapping } from '@/hooks/admin/use-schema-mapping';
import type { PlaceGrouping, PlaceField } from '@/types/place';

export default function PlaceSchemaPage() {
  const [selectedGrouping, setSelectedGrouping] = useState<PlaceGrouping | null>(null);
  const [draggedField, setDraggedField] = useState<PlaceField | null>(null);
  const { updateMapping, removeMapping } = useSchemaMapping();
  const {
    groupings,
    isLoading: isLoadingGroupings,
    createGrouping,
    updateGrouping,
    deleteGrouping,
    isCreating: isCreatingGrouping,
    isUpdating: isUpdatingGrouping,
    isDeleting: isDeletingGrouping,
  } = usePlaceGroupings();

  const {
    createField,
    updateField,
    deleteField,
    isCreating: isCreatingField,
    isUpdating: isUpdatingField,
    isDeleting: isDeletingField,
  } = usePlaceFields();

  const handleDragStart = (event: DragStartEvent) => {
    if (event.active.data.current?.type === 'field') {
      setDraggedField(event.active.data.current.field);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !selectedGrouping) {
      setDraggedField(null);
      return;
    }

    // Handle dropping fields into required/optional sections
    if (active.data?.current?.type === 'field' && over.data?.current?.type === 'droppable') {
      const field = active.data.current.field;
      const isRequired = over.data.current.section === 'required';
      
      updateMapping({
        groupingId: selectedGrouping.id,
        fieldId: field.id,
        required: isRequired,
      });
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
            isLoading={isLoadingGroupings}
            selectedGrouping={selectedGrouping}
            onSelect={setSelectedGrouping}
            onCreateGrouping={createGrouping}
            onUpdateGrouping={updateGrouping}
            onDeleteGrouping={deleteGrouping}
            isCreating={isCreatingGrouping}
            isUpdating={isUpdatingGrouping}
            isDeleting={isDeletingGrouping}
          />
        </Card>

        <Card className="lg:col-span-6 p-4">
          <DndContext 
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SchemaBuilder 
              grouping={selectedGrouping}
              onRemoveField={(fieldId) => {
                if (selectedGrouping) {
                  removeMapping({
                    groupingId: selectedGrouping.id,
                    fieldId,
                  });
                }
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
          <FieldsSection
            onCreateField={createField}
            onUpdateField={updateField}
            onDeleteField={deleteField}
          />
        </Card>
      </div>
    </div>
  );
}