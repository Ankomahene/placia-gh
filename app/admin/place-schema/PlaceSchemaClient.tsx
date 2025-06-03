'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { GroupingsSection } from '@/components/admin/place-schema/GroupingsSection';
import { FieldsSection } from '@/components/admin/place-schema/FieldsSection';
import { SchemaBuilder } from '@/components/admin/place-schema/SchemaBuilder';
import { usePlaceGroupings } from '@/hooks/admin/use-place-groupings';
import { usePlaceFields } from '@/hooks/admin/use-place-fields';
import { useSchemaMapping } from '@/hooks/admin/use-schema-mapping';
import type { PlaceGrouping, PlaceField } from '@/types/place';

export default function PlaceSchemaClient() {
  const [selectedGrouping, setSelectedGrouping] =
    useState<PlaceGrouping | null>(null);
  const [draggedField, setDraggedField] = useState<PlaceField | null>(null);
  const [activeTab, setActiveTab] = useState<'fields' | 'subcategories'>('fields');
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

  // Wrap mutations to return Promise<void> and match expected signatures
  const handleCreateGrouping = (data: any) =>
    new Promise<void>((resolve, reject) => {
      createGrouping(data, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });
  const handleUpdateGrouping = (id: string, data: any) =>
    new Promise<void>((resolve, reject) => {
      updateGrouping(
        { id, ...data },
        {
          onSuccess: () => resolve(),
          onError: reject,
        }
      );
    });
  const handleDeleteGrouping = (id: string) =>
    new Promise<void>((resolve, reject) => {
      deleteGrouping(id, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });

  const handleCreateField = (data: any) =>
    new Promise<void>((resolve, reject) => {
      createField(data, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });
  const handleUpdateField = (id: string, data: any) =>
    new Promise<void>((resolve, reject) => {
      updateField(
        { id, ...data },
        {
          onSuccess: () => resolve(),
          onError: reject,
        }
      );
    });
  const handleDeleteField = (id: string) =>
    new Promise<void>((resolve, reject) => {
      deleteField(id, {
        onSuccess: () => resolve(),
        onError: reject,
      });
    });

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
    if (
      active.data?.current?.type === 'field' &&
      over.data?.current?.type === 'droppable'
    ) {
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
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-h-[calc(100vh-240px)] overflow-y-auto">
        <Card className="lg:col-span-3 p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <GroupingsSection
            groupings={groupings}
            isLoading={isLoadingGroupings}
            selectedGrouping={selectedGrouping}
            onSelect={setSelectedGrouping}
            onCreateGrouping={handleCreateGrouping}
            onUpdateGrouping={handleUpdateGrouping}
            onDeleteGrouping={handleDeleteGrouping}
            isCreating={isCreatingGrouping}
            isUpdating={isUpdatingGrouping}
            isDeleting={isDeletingGrouping}
          />
        </Card>
        <Card className="lg:col-span-6 p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
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
        <Card className="lg:col-span-3 p-4 overflow-y-auto max-h-[calc(100vh-250px)]">
          <Tabs value={activeTab} onValueChange={(value: 'fields' | 'subcategories') => setActiveTab(value)}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="fields" className="flex-1">Fields</TabsTrigger>
              <TabsTrigger value="subcategories" className="flex-1">Subcategories</TabsTrigger>
            </TabsList>
            <TabsContent value="fields">
          <FieldsSection
            onCreateField={handleCreateField}
            onUpdateField={handleUpdateField}
            onDeleteField={handleDeleteField}
          />
            </TabsContent>
            <TabsContent value="subcategories">
              <SubcategoriesSection
                groupingId={selectedGrouping?.id}
                onCreateSubcategory={handleCreateSubcategory}
                onUpdateSubcategory={handleUpdateSubcategory}
                onDeleteSubcategory={handleDeleteSubcategory}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
