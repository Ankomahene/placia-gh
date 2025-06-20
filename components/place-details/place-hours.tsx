'use client';

import { PlaceResults } from '@/types/place';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, CalendarDays, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  getOpenStatusColor,
  formatOpenStatus,
  getCurrentDay,
  sortOpeningHours,
  isValidHours,
  isOpen24Hours,
  formatTime,
  formatHoursSimple,
  getMutedBackground,
} from '@/lib/utils/place-utils';

interface PlaceHoursProps {
  place: PlaceResults;
}

export function PlaceHours({ place }: PlaceHoursProps) {
  const openStatusColor = getOpenStatusColor(place.open_now);
  const currentDay = getCurrentDay();

  // Get today's hours
  const getTodaysHours = () => {
    if (!place.open_hours || place.open_hours.length === 0) return null;

    const todaysHours = place.open_hours.find((h) => h.day === currentDay);
    return todaysHours && isValidHours(todaysHours) ? todaysHours : null;
  };

  const todaysHours = getTodaysHours();

  if (!place.open_hours || place.open_hours.length === 0) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-center">
          <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Opening Hours</h2>
          <p className="text-muted-foreground">
            Opening hours information is not available for this place.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current status */}
      <div className="text-center">
        <div
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
            place.open_now
              ? 'bg-green-50 dark:bg-green-950'
              : 'bg-red-50 dark:bg-red-950'
          )}
        >
          {place.open_now ? (
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          ) : (
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          )}
          <span className={openStatusColor}>
            {formatOpenStatus(place.open_now)}
          </span>
        </div>

        {/* Today's hours */}
        {todaysHours && (
          <div className="mt-2 text-sm text-muted-foreground">
            Today: {formatHoursSimple(todaysHours)}
          </div>
        )}
      </div>

      <Separator />

      {/* Weekly hours */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Weekly Hours
        </h3>

        <div className="space-y-1">
          {(() => {
            const validHours = place.open_hours.filter(isValidHours);

            if (validHours.length === 0) {
              return (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Valid opening hours information is not available.
                  </p>
                </div>
              );
            }

            const sortedHours = sortOpeningHours(validHours);

            return sortedHours.map((hours, index) => {
              const isToday = hours.day === currentDay;

              return (
                <div
                  key={index}
                  className={cn(
                    'flex justify-between py-2 px-3 rounded-lg transition-colors',
                    isToday
                      ? 'bg-primary/5 border-primary/20 border'
                      : getMutedBackground()
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'font-medium',
                        isToday ? 'text-primary' : 'text-foreground'
                      )}
                    >
                      {hours.day}
                    </span>
                    {isToday && (
                      <Badge variant="secondary" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>

                  <span
                    className={cn(
                      'font-medium',
                      isToday ? 'text-primary' : 'text-muted-foreground'
                    )}
                  >
                    {formatHoursSimple(hours)}
                  </span>
                </div>
              );
            });
          })()}
        </div>
      </div>

      {/* Additional info */}
      <div className={cn('rounded-lg p-4', getMutedBackground())}>
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> Opening hours may vary on holidays or special
          occasions. Please contact the establishment directly to confirm
          current hours.
        </p>
      </div>
    </div>
  );
}
