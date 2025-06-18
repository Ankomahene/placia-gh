import { PlaceResultsSummary } from '@/types/place';

export interface MapMarker {
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

export interface GoogleMapViewProps {
  places: PlaceResultsSummary[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
}

export interface GoogleMapClientProps {
  markers: MapMarker[];
  hoveredMarkerId: string | null;
  selectedMarkerId: string | null;
  onMarkerHover: (markerId: string | null) => void;
  onMarkerClick: (markerId: string) => void;
  flyToMarkerId?: string | null;
  userLocation?: { lat: number; lng: number } | null;
  directionsInfo?: DirectionsInfo | null;
  onDirectionsRequest?: (destinationId: string) => void;
}

export interface DirectionsInfo {
  destination: MapMarker;
  routes?: any; // google.maps.DirectionsResult
  isLoading?: boolean;
}

export interface CollapsibleSidebarProps {
  places: PlaceResultsSummary[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceClick: (placeId: string) => void;
  onDirectionsRequest?: (placeId: string) => void;
  isLoading: boolean;
  cardRefs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
}

export interface PlaceCardProps {
  place: PlaceResultsSummary;
  isHovered: boolean;
  isSelected: boolean;
  onHover: (placeId: string | null) => void;
  onClick: (placeId: string) => void;
  onDirectionsRequest?: (placeId: string) => void;
  mapMarker?: MapMarker;
  cardRef?: ((el: HTMLDivElement | null) => void) | null;
}

export interface MarkerInfoWindowProps {
  marker: MapMarker;
  isVisible: boolean;
  onClose: () => void;
  onDirectionsRequest?: () => void;
}
