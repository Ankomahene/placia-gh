'use client';

import { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface LocationMapProps {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  zoom?: number;
  height?: string;
  className?: string;
  draggable?: boolean;
  showControls?: boolean;
}

// Component to handle map click events
function MapClickHandler({
  onLocationChange,
}: {
  onLocationChange?: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (onLocationChange) {
        onLocationChange(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

// Component to update map view when coordinates change
function MapViewController({
  latitude,
  longitude,
  zoom,
}: {
  latitude?: number;
  longitude?: number;
  zoom?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], zoom || map.getZoom());
    }
  }, [latitude, longitude, zoom, map]);

  // Force map to resize/invalidate when mounted to fix display issues
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Custom draggable marker component
function DraggableMarker({
  latitude,
  longitude,
  onLocationChange,
  draggable = true,
}: {
  latitude?: number;
  longitude?: number;
  onLocationChange?: (lat: number, lng: number) => void;
  draggable?: boolean;
}) {
  const markerRef = useRef<L.Marker>(null);

  useEffect(() => {
    const marker = markerRef.current;
    if (marker && draggable) {
      marker.on('dragend', () => {
        const position = marker.getLatLng();
        onLocationChange?.(position.lat, position.lng);
      });
    }
  }, [draggable, onLocationChange]);

  if (latitude === undefined || longitude === undefined) {
    return null;
  }

  return (
    <Marker
      ref={markerRef}
      position={[latitude, longitude]}
      draggable={draggable}
    />
  );
}

export function SimpleLocationMap({
  latitude,
  longitude,
  onLocationChange,
  zoom,
  height = '400px',
  className = '',
  draggable = true,
  showControls = true,
}: LocationMapProps) {
  const [mounted, setMounted] = useState(false);

  // Default to Ghana center if no coordinates provided
  const defaultLat = 7.9465; // Ghana center
  const defaultLng = -1.0232; // Ghana center
  const defaultZoom = 7; // Country-level zoom
  const locationZoom = 15; // Specific location zoom

  const mapLat = latitude ?? defaultLat;
  const mapLng = longitude ?? defaultLng;
  const mapZoom =
    zoom ??
    (latitude != null && longitude != null ? locationZoom : defaultZoom);
  const hasLocation = latitude != null && longitude != null;

  // Only render map on client side
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={`bg-muted rounded-md flex items-center justify-center ${className}`}
        style={{ height }}
      >
        <div className="text-muted-foreground">Loading map...</div>
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-md border ${className}`}
      style={{ height }}
    >
      <MapContainer
        center={[mapLat, mapLng]}
        zoom={mapZoom}
        style={{ height: '100%', width: '100%', zIndex: 0 }}
        zoomControl={showControls}
        attributionControl={showControls}
        whenReady={() => {
          // Force invalidate size when map is ready
          setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
          }, 100);
        }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapViewController
          latitude={latitude}
          longitude={longitude}
          zoom={zoom}
        />
        <MapClickHandler onLocationChange={onLocationChange} />
        <DraggableMarker
          latitude={latitude}
          longitude={longitude}
          onLocationChange={onLocationChange}
          draggable={draggable}
        />
      </MapContainer>

      {draggable && (
        <div className="absolute top-2 left-2 bg-background/90 backdrop-blur-sm rounded-md px-2 py-1 text-xs text-muted-foreground">
          {hasLocation
            ? 'Drag the pin or click to update location'
            : 'Click to select location'}
        </div>
      )}
    </div>
  );
}
