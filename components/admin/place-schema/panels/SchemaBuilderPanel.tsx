'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSchemaMapping } from '@/hooks/admin/use-schema-mapping';
import { useSchemaActions } from '../hooks/useSchemaActions';
import { cn } from '@/lib/utils';
import type { PlaceGrouping, PlaceSubcategory } from '@/types/place';
import { useDroppable } from '@dnd-kit/core';
import { AlertCircle, Component, Database, Layers, X } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface SchemaBuilderPanelProps {
  groupings: PlaceGrouping[];
  selectedGroupingId?: string;
}

function DropZone({
  title,
  description,
  fields,
  type,
  icon: Icon,
  onRemove,
}: {
  title: string;
  description: string;
  fields: any[];
  type: 'required' | 'optional';
  icon: any;
  onRemove: (fieldId: string) => void;
}) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: `${type}-droppable`,
    data: {
      type: 'droppable',
      accepts: ['field'],
      section: type,
    },
  });

  const isActiveField = isOver && active?.data?.current?.type === 'field';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200 min-h-[300px]',
        isActiveField
          ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
          : 'border-muted-foreground/20 hover:border-muted-foreground/40'
      )}
    >
      {/* Drop indicator overlay */}
      {isActiveField && (
        <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Database className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Drop field here</p>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div
            className={cn(
              'p-2 rounded-lg',
              type === 'required'
                ? 'bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">{title}</h3>
              <Badge
                variant={type === 'required' ? 'destructive' : 'secondary'}
              >
                {fields.length}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>

        <div className="space-y-3">
          {fields.length === 0 ? (
            <div className="text-center py-8">
              <Database className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                {type === 'required'
                  ? 'No required fields yet'
                  : 'No optional fields yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag fields from the sidebar to add them
              </p>
            </div>
          ) : (
            fields.map((field) => (
              <div
                key={field.id}
                className="group flex items-center justify-between p-4 rounded-lg bg-card border transition-all duration-200 hover:shadow-md hover:border-primary/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-sm">{field.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {field.name}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {field.field_type}
                    {field.is_array && '[]'}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onRemove(field.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function SubcategoriesSection({
  grouping,
  onRemoveSubcategory,
}: {
  grouping: PlaceGrouping & { subcategories?: PlaceSubcategory[] };
  onRemoveSubcategory: (id: string) => void;
}) {
  const { setNodeRef, isOver, active } = useDroppable({
    id: 'subcategory-droppable',
    data: {
      type: 'grouping',
      accepts: ['subcategory'],
    },
  });

  const isActiveSubcategory =
    isOver && active?.data?.current?.type === 'subcategory';
  const subcategories = grouping.subcategories || [];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'relative rounded-xl border-2 border-dashed transition-all duration-200 min-h-[400px]',
        isActiveSubcategory
          ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
          : 'border-muted-foreground/20 hover:border-muted-foreground/40'
      )}
    >
      {/* Drop indicator overlay */}
      {isActiveSubcategory && (
        <div className="absolute inset-2 bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/30 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <Component className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium text-primary">Add to grouping</p>
          </div>
        </div>
      )}

      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
            <Component className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg">Subcategories</h3>
              <Badge variant="secondary">{subcategories.length}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Subcategories that belong to this grouping
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {subcategories.length === 0 ? (
            <div className="text-center py-8">
              <Component className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                No subcategories yet
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag subcategories from the sidebar to add them
              </p>
            </div>
          ) : (
            subcategories.map((subcategory) => (
              <div
                key={subcategory.id}
                className="group flex items-center justify-between p-4 rounded-lg bg-card border transition-all duration-200 hover:shadow-md hover:border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Component className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">{subcategory.name}</p>
                    {subcategory.description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {subcategory.description}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onRemoveSubcategory(subcategory.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function SchemaBuilderPanel({
  groupings,
  selectedGroupingId,
}: SchemaBuilderPanelProps) {
  const [activeTab, setActiveTab] = useState<'fields' | 'subcategories'>(
    'fields'
  );
  const { removeMapping } = useSchemaMapping();
  const { handleSubcategoryRemove } = useSchemaActions();

  // Find the selected grouping from the live groupings array
  const selectedGrouping = groupings.find((g) => g.id === selectedGroupingId);

  const handleRemoveField = (fieldId: string) => {
    if (!selectedGrouping) return;

    removeMapping({
      groupingId: selectedGrouping.id,
      fieldId,
    });
  };

  const handleRemoveSubcategory = async (subcategoryId: string) => {
    if (!selectedGrouping) return;

    try {
      await handleSubcategoryRemove({
        id: subcategoryId,
        groupingId: selectedGrouping.id,
      });
    } catch (error) {
      // Error is already handled in the hook with toast
    }
  };

  if (!selectedGrouping) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Schema Builder</h2>
          <p className="text-sm text-muted-foreground">
            Design the data structure for your groupings
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <AlertCircle className="h-16 w-16 text-muted-foreground/30 mx-auto" />
            <div>
              <h3 className="text-lg font-medium text-muted-foreground">
                Select a Grouping
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose a grouping from the sidebar to start building its schema
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Cast to include schema property - now using live data from React Query cache
  const groupingWithSchema = selectedGrouping as any;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            {groupingWithSchema.name} Schema
          </h2>
          <p className="text-sm text-muted-foreground">
            Define the data structure and organization for this grouping
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as any)}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="fields" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Fields Schema
            </TabsTrigger>
            <TabsTrigger
              value="subcategories"
              className="flex items-center gap-2"
            >
              <Component className="h-4 w-4" />
              Subcategories
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <Tabs value={activeTab} className="h-full">
          <TabsContent value="fields" className="space-y-6 mt-0">
            <div className="grid gap-6">
              <DropZone
                title="Required Fields"
                description="Essential data that must be provided"
                fields={groupingWithSchema.schema?.required || []}
                type="required"
                icon={AlertCircle}
                onRemove={handleRemoveField}
              />
              <DropZone
                title="Optional Fields"
                description="Additional data that can be provided"
                fields={groupingWithSchema.schema?.optional || []}
                type="optional"
                icon={Database}
                onRemove={handleRemoveField}
              />
            </div>
          </TabsContent>

          <TabsContent value="subcategories" className="mt-0">
            <SubcategoriesSection
              grouping={groupingWithSchema}
              onRemoveSubcategory={handleRemoveSubcategory}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
