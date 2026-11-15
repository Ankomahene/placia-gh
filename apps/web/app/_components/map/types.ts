export interface MapPoint {
  id: string;
  name: string;
  lat: number;
  lon: number;
}

/** A small secondary marker: a place around the one in focus, linking to its page. */
export interface MapDot extends MapPoint {
  href: string;
}

export interface PlaceMapProps {
  points: MapPoint[];
  dots?: MapDot[];
  user?: { lat: number; lon: number } | null;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  /** Centre here instead of framing the pins. */
  focus?: { lat: number; lon: number; zoom?: number } | null;
  interactive?: boolean;
  className?: string;
}
