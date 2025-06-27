import { cn } from '@/lib/utils';

interface ShimmerProps {
  className?: string;
}

export function Shimmer({ className }: ShimmerProps) {
  return (
    <div
      className={cn(
        'animate-shimmer bg-gradient-to-r from-muted via-muted/50 to-muted',
        'bg-[length:200%_100%] rounded-md',
        className
      )}
    />
  );
}

// Place card shimmer specifically for featured places
export function PlaceCardShimmer() {
  return (
    <div className="min-w-[280px] max-w-[280px] space-y-3">
      {/* Image shimmer */}
      <Shimmer className="h-48 w-full rounded-lg" />

      {/* Content shimmer */}
      <div className="space-y-2 p-1">
        {/* Title */}
        <Shimmer className="h-4 w-3/4" />

        {/* Location */}
        <Shimmer className="h-3 w-1/2" />

        {/* Rating and category */}
        <div className="flex items-center gap-2">
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-5 w-12 rounded-full" />
        </div>

        {/* Description */}
        <div className="space-y-1">
          <Shimmer className="h-3 w-full" />
          <Shimmer className="h-3 w-2/3" />
        </div>
      </div>
    </div>
  );
}
