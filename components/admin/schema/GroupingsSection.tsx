'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import type { PlaceGrouping } from '@/types/place';

interface GroupingsSectionProps {
  groupings?: PlaceGrouping[];
  isLoading: boolean;
  selectedGrouping: PlaceGrouping | null;
  onSelect: (grouping: PlaceGrouping) => void;
}

export function GroupingsSection({
  groupings = [],
  isLoading,
  selectedGrouping,
  onSelect,
}: GroupingsSectionProps) {
  const [search, setSearch] = useState('');

  const filteredGroupings = groupings.filter((grouping) =>
    grouping.name.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Groupings</h2>
        <Button size="sm">
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
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}