'use client';

import { useState, useEffect, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Clock, Plus, X } from 'lucide-react';

interface OpenHour {
  day: string;
  from: string;
  to: string;
}

interface PlaceOpenHoursFieldProps {
  value?: OpenHour[] | null;
  onChange: (value: OpenHour[]) => void;
  error?: string;
  className?: string;
  label?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

export function PlaceOpenHoursField({
  value = [],
  onChange,
  error,
  className,
  label = 'Opening Hours',
}: PlaceOpenHoursFieldProps) {
  // Ensure value is always an array - memoized to prevent unnecessary re-renders
  const hours = useMemo(() => value || [], [value]);

  const [selectedDays, setSelectedDays] = useState<Set<string>>(
    new Set(hours.map((h) => h.day))
  );

  // Update selected days when value changes
  useEffect(() => {
    setSelectedDays(new Set(hours.map((h) => h.day)));
  }, [hours]);

  const updateOpeningHours = (day: string, isChecked: boolean) => {
    const newSelectedDays = new Set(selectedDays);

    if (isChecked) {
      newSelectedDays.add(day);
      // Add default hours for new day
      const newHours = [...hours, { day, from: '09:00', to: '17:00' }];
      onChange(newHours);
    } else {
      newSelectedDays.delete(day);
      // Remove hours for unchecked day
      const newHours = hours.filter((h) => h.day !== day);
      onChange(newHours);
    }

    setSelectedDays(newSelectedDays);
  };

  const updateTimeRange = (day: string, field: 'from' | 'to', time: string) => {
    const newHours = hours.map((h) =>
      h.day === day ? { ...h, [field]: time } : h
    );
    onChange(newHours);
  };

  const addTimeRange = (day: string) => {
    const existingRanges = hours.filter((h) => h.day === day);
    const newRange = { day, from: '09:00', to: '17:00' };
    onChange([...hours, newRange]);
  };

  const removeTimeRange = (index: number) => {
    const newHours = hours.filter((_, i) => i !== index);
    onChange(newHours);

    // Update selected days if no more ranges for this day
    const dayHours = hours[index];
    const remainingForDay = newHours.filter((h) => h.day === dayHours.day);
    if (remainingForDay.length === 0) {
      const newSelectedDays = new Set(selectedDays);
      newSelectedDays.delete(dayHours.day);
      setSelectedDays(newSelectedDays);
    }
  };

  const getHoursForDay = (day: string) => {
    return hours.filter((h) => h.day === day);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <Label className="text-sm font-medium">
        {label}
        <span className="text-muted-foreground ml-1">(Optional)</span>
      </Label>

      <div className="space-y-3 border rounded-lg p-4">
        {DAYS_OF_WEEK.map((day) => {
          const dayHours = getHoursForDay(day);
          const isSelected = selectedDays.has(day);

          return (
            <div key={day} className="space-y-2">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={`day-${day}`}
                  checked={isSelected}
                  onCheckedChange={(checked) =>
                    updateOpeningHours(day, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`day-${day}`}
                  className="text-sm font-medium cursor-pointer flex-1"
                >
                  {day}
                </Label>
                {isSelected && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTimeRange(day)}
                    className="h-8 px-2"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Hours
                  </Button>
                )}
              </div>

              {isSelected && dayHours.length > 0 && (
                <div className="ml-6 space-y-2">
                  {dayHours.map((hourItem, index) => {
                    const globalIndex = hours.findIndex(
                      (h) =>
                        h.day === hourItem.day &&
                        h.from === hourItem.from &&
                        h.to === hourItem.to
                    );

                    return (
                      <div
                        key={`${day}-${index}`}
                        className="flex items-center gap-2"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <Input
                          type="time"
                          value={hourItem.from}
                          onChange={(e) =>
                            updateTimeRange(day, 'from', e.target.value)
                          }
                          className="w-28"
                        />
                        <span className="text-muted-foreground">to</span>
                        <Input
                          type="time"
                          value={hourItem.to}
                          onChange={(e) =>
                            updateTimeRange(day, 'to', e.target.value)
                          }
                          className="w-28"
                        />
                        {dayHours.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTimeRange(globalIndex)}
                            className="h-8 w-8"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {isSelected && dayHours.length === 0 && (
                <div className="ml-6 text-sm text-muted-foreground">
                  Click &quot;Add Hours&quot; to set opening times for {day}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {hours.length > 0 && (
        <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded">
          <strong>Preview:</strong>
          <div className="mt-2 space-y-1">
            {DAYS_OF_WEEK.filter((day) => selectedDays.has(day)).map((day) => (
              <div key={day} className="flex">
                <span className="font-medium w-24">{day}:</span>
                <div>
                  {getHoursForDay(day).map((h, i) => (
                    <span key={i}>
                      {h.from} - {h.to}
                      {i < getHoursForDay(day).length - 1 && ', '}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
