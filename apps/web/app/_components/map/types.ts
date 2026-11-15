export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

export interface PlaceMapProps {
  points: MapPoint[];
  user?: { lat: number; lon: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Centre here instead of framing the pins. */
  focus?: { lat: number; lon: number; zoom?: number } | null;
  interactive?: boolean;
  className?: string;
}
