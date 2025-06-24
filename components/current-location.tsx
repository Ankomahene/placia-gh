import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2, RotateCw, Locate } from 'lucide-react';
import { useLocation } from '@/hooks/use-location';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CurrentLocation() {
  const { address, error, loading, refetch } = useLocation();

  const handleRefetch = async () => {
    try {
      const result = await refetch();
    } catch (err) {
      console.error('❌ Location refetch failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-1">
        <Badge variant="outline" className="flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span className="text-xs">Detecting location...</span>
        </Badge>
        <Locate className="h-3 w-3 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger>
            <Badge
              variant="outline"
              className="flex items-center gap-1 bg-destructive/10 hover:bg-destructive/20"
            >
              <MapPin className="h-3 w-3 text-destructive" />
              <span className="text-xs">Location unavailable</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{error}</p>
          </TooltipContent>
        </Tooltip>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={handleRefetch}
          title="Locate me"
        >
          <Locate className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Badge
        variant="outline"
        className="flex items-center gap-1 bg-primary/5 hover:bg-primary/10 w-[250px] truncate"
      >
        <MapPin className="h-3 w-3 text-primary" />
        <span
          className="text-xs w-full truncate"
          title={address || 'Location not found'}
        >
          {address || 'Location not found'}
        </span>
      </Badge>
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-6 w-6', loading && 'animate-spin')}
        onClick={handleRefetch}
        title="Locate me"
      >
        <Locate className="h-3 w-3" />
      </Button>
    </div>
  );
}
