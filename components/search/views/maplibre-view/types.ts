export interface MaplibreMarker {
  id: string;
  position: { lat: number; lng: number };
  name: string;
  isOpen?: boolean;
  rating?: number;
  category?: string;
  image?: string;
  address?: string;
  distance?: string;
}

export interface MaplibreMapClientProps {
  markers: MaplibreMarker[];
  hoveredMarkerId: string | null;
  selectedMarkerId: string | null;
  onMarkerHover: (markerId: string | null) => void;
  onMarkerClick: (markerId: string) => void;
  flyToMarkerId?: string | null;
  isSidebarCollapsed?: boolean;
  hoverSource?: 'card' | 'marker' | null;
  center?: { lat: number; lng: number };
  zoom?: number;
}
