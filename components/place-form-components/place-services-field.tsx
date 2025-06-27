'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { IconPicker } from '@/components/ui/icon-picker';
import { IconRenderer } from '@/components/ui/icon-renderer';
import { cn } from '@/lib/utils';
import { Plus, X } from 'lucide-react';

interface Service {
  label: string;
  icon: string;
}

interface PlaceServicesFieldProps {
  value?: Service[] | null;
  onChange: (value: Service[]) => void;
  error?: string;
  className?: string;
  label?: string;
}

export function PlaceServicesField({
  value = [],
  onChange,
  error,
  className,
  label = 'Services',
}: PlaceServicesFieldProps) {
  const [newService, setNewService] = useState<Service>({
    label: '',
    icon: '',
  });
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Ensure value is always an array
  const services = value || [];

  const addService = () => {
    if (newService.label.trim() && newService.icon.trim()) {
      onChange([
        ...services,
        { ...newService, label: newService.label.trim() },
      ]);
      setNewService({ label: '', icon: '' });
      setIsAddingNew(false);
    }
  };

  const removeService = (index: number) => {
    onChange(services.filter((_, i) => i !== index));
  };

  const updateService = (
    index: number,
    field: keyof Service,
    newValue: string
  ) => {
    const updated = [...services];
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
          Add Service
        </Button>
      </div>

      {/* Existing services */}
      {services.length > 0 && (
        <div className="space-y-3">
          {services.map((service, index) => (
            <div
              key={index}
              className="flex gap-3 items-start p-3 border rounded-lg"
            >
              <div className="flex-1 space-y-2">
                <Input
                  type="text"
                  value={service.label}
                  onChange={(e) =>
                    updateService(index, 'label', e.target.value)
                  }
                  placeholder="Service name (e.g., Delivery, Catering)"
                />
                <IconPicker
                  value={service.icon}
                  onChange={(icon) => updateService(index, 'icon', icon)}
                  allowCustom={true}
                />
              </div>
              <div className="flex items-center gap-2">
                {service.icon && (
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <IconRenderer icon={service.icon} className="w-4 h-4" />
                    <span className="truncate max-w-[100px]">
                      {service.label}
                    </span>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => removeService(index)}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add new service form */}
      {isAddingNew && (
        <div className="p-4 border-2 border-dashed rounded-lg space-y-3">
          <Label className="text-sm font-medium">Add New Service</Label>
          <Input
            type="text"
            value={newService.label}
            onChange={(e) =>
              setNewService({ ...newService, label: e.target.value })
            }
            placeholder="Service name (e.g., Delivery, Catering, Room Service)"
            onKeyDown={(e) => {
              if (
                e.key === 'Enter' &&
                newService.label.trim() &&
                newService.icon
              ) {
                e.preventDefault();
                addService();
              }
            }}
          />
          <IconPicker
            value={newService.icon}
            onChange={(icon) => setNewService({ ...newService, icon })}
            allowCustom={true}
          />
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={addService}
              disabled={!newService.label.trim() || !newService.icon}
              size="sm"
            >
              Add Service
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddingNew(false);
                setNewService({ label: '', icon: '' });
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
      {services.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <strong>Preview:</strong>
          <div className="mt-2 flex flex-wrap gap-2">
            {services.map((service, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-background px-2 py-1 rounded border"
              >
                {service.icon && (
                  <IconRenderer icon={service.icon} className="w-3 h-3" />
                )}
                <span className="text-xs">{service.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
