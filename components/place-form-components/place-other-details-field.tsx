'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface PlaceOtherDetailsFieldProps {
  value?: Record<string, any>;
  onChange: (value: Record<string, any>) => void;
  error?: string;
  className?: string;
  label?: string;
}

export function PlaceOtherDetailsField({
  value = {},
  onChange,
  error,
  className,
  label = 'Other Details',
}: PlaceOtherDetailsFieldProps) {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const addDetail = () => {
    if (newKey.trim() && newValue.trim()) {
      onChange({
        ...value,
        [newKey.trim()]: newValue.trim(),
      });
      setNewKey('');
      setNewValue('');
    }
  };

  const removeDetail = (key: string) => {
    const updated = { ...value };
    delete updated[key];
    onChange(updated);
  };

  const updateDetail = (oldKey: string, newKey: string, newValue: string) => {
    const updated = { ...value };

    // If key changed, remove old key and add new one
    if (oldKey !== newKey) {
      delete updated[oldKey];
    }

    updated[newKey] = newValue;
    onChange(updated);
  };

  const detailEntries = Object.entries(value);

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      {/* Existing details */}
      {detailEntries.map(([key, val], index) => (
        <div key={`${key}-${index}`} className="flex gap-2 items-start">
          <div className="flex-1">
            <Input
              type="text"
              value={key}
              onChange={(e) => updateDetail(key, e.target.value, val)}
              placeholder="Property name"
              className="mb-2"
            />
            <Input
              type="text"
              value={String(val)}
              onChange={(e) => updateDetail(key, key, e.target.value)}
              placeholder="Property value"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => removeDetail(key)}
            className="shrink-0 mt-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Add new detail */}
      <div className="border-t pt-4 space-y-2">
        <Label className="text-sm text-muted-foreground">Add New Detail</Label>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <Input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Property name (e.g., wifi, parking)"
              className="mb-2"
              onKeyDown={(e) => {
                if (e.key === 'Tab' && newKey.trim()) {
                  // Move to value field
                }
              }}
            />
            <Input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Property value (e.g., free, available)"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addDetail();
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={addDetail}
            disabled={!newKey.trim() || !newValue.trim()}
            className="shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Preview */}
      {detailEntries.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <strong>Preview:</strong>
          <div className="mt-1 space-y-1">
            {detailEntries.map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium">{key}:</span>
                <span>{String(val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
