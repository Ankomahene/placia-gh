'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { IconPicker } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface AccessibilityFeature {
  label: string;
  icon: string;
}

interface PlaceAccessibilityFieldProps {
  value?: AccessibilityFeature[] | null;
  onChange: (value: AccessibilityFeature[]) => void;
  error?: string;
  className?: string;
  label?: string;
}

export function PlaceAccessibilityField({
  value = [],
  onChange,
  error,
  className,
  label = 'Accessibility Features',
}: PlaceAccessibilityFieldProps) {
  const [newFeature, setNewFeature] = useState<AccessibilityFeature>({
    label: '',
    icon: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Ensure value is always an array
  const features = value || [];

  const addFeature = () => {
    if (newFeature.label.trim() && newFeature.icon.trim()) {
      onChange([
        ...features,
        { ...newFeature, label: newFeature.label.trim() },
      ]);
      setNewFeature({ label: '', icon: '' });
      setIsAddingNew(false);
    }
  };

  const removeFeature = (index: number) => {
    onChange(features.filter((_, i) => i !== index));
  };

  const updateFeature = (
    index: number,
    field: keyof AccessibilityFeature,
    newValue: string
  ) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [field]: newValue };
    onChange(updated);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">
          {label}
          <span className="text-muted-foreground ml-1">(Optional)</span>
        </Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsAddingNew(!isAddingNew)}
          className="h-8"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Feature
        </Button>
      </div>

      {/* Existing features */}
      {features.length > 0 && (
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex gap-3 items-start p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  value={feature.label}
                  onChange={(e) =>
                    updateFeature(index, 'label', e.target.value)
                  }
                  placeholder="Accessibility feature (e.g., Wheelchair Accessible, Braille Signage)"
                />
                <IconPicker
                  value={feature.icon}
                  onChange={(icon) => updateFeature(index, 'icon', icon)}
                  allowCustom={true}
                />
              </div>
              <div className="flex items-center gap-2">
                {feature.icon && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconRenderer icon={feature.icon} className="w-4 h-4" />
                    <span className="truncate max-w-[100px]">
                      {feature.label}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeFeature(index)}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new feature form */}
      {isAddingNew && (
        <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
          <Label className="text-sm font-medium">
            Add Accessibility Feature
          </Label>
          <Input
            type="text"
            value={newFeature.label}
            onChange={(e) =>
              setNewFeature({ ...newFeature, label: e.target.value })
            }
            placeholder="Accessibility feature (e.g., Wheelchair Accessible, Audio Assistance)"
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                newFeature.label.trim() &&
                newFeature.icon
              ) {
                e.preventDefault();
                addFeature();
              }
            }}
          />
          <IconPicker
            value={newFeature.icon}
            onChange={(icon) => setNewFeature({ ...newFeature, icon })}
            allowCustom={true}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addFeature}
              disabled={!newFeature.label.trim() || !newFeature.icon}
              size="sm"
            >
              Add Feature
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewFeature({ label: '', icon: '' });
              }}
              size="sm"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Preview */}
      {features.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <strong>Preview:</strong>
          <div className="mt-2 flex flex-wrap gap-2">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-background px-2 py-1 rounded border"
              >
                {feature.icon && (
                  <IconRenderer icon={feature.icon} className="w-3 h-3" />
                )}
                <span className="text-xs">{feature.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
