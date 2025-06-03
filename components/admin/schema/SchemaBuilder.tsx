'use client';

import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { PlaceGrouping } from '@/types/place';

interface SchemaBuilderProps {
  grouping: PlaceGrouping | null;
  onFieldMove: (fieldId: string, required: boolean) => void;
}

function FieldSection({
  title,
  fields,
  type,
}: {
  title: string;
  fields: any[];
  type: 'required' | 'optional';
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${type}-droppable`,
    data: {
      type: 'droppable',
      accepts: ['field'],
      section: type,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'p-4 rounded-lg border-2 border-dashed transition-colors min-h-[200px]',
        isOver ? 'border-primary/50 bg-primary/5' : 'border-muted'
      )}
    >
      <h3 className="font-medium mb-4 flex items-center gap-2">
        {title}
        <Badge variant="secondary">{fields.length}</Badge>
      </h3>
      <div className="space-y-2">
        {fields.map((field) => (
          <div
            key={field.id}
            className="flex items-center justify-between p-2 rounded bg-muted/50"
          >
            <div>
              <p className="font-medium text-sm">{field.label}</p>
              <p className="text-xs text-muted-foreground">{field.name}</p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {field.field_type}
              {field.is_array && '[]'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SchemaBuilder({ grouping, onFieldMove }: SchemaBuilderProps) {
  if (!grouping) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Select a grouping to manage its schema
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1">{grouping.name} Schema</h2>
        <p className="text-sm text-muted-foreground">
          Drag and drop fields to define the schema for this grouping
        </p>
      </div>

      <div className="grid gap-6">
        <FieldSection
          title="Required Fields"
          fields={grouping.schema?.required || []}
          type="required"
        />
        <FieldSection
          title="Optional Fields"
          fields={grouping.schema?.optional || []}
          type="optional"
        />
      </div>
    </div>
  );
}