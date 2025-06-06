'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';

// Fix for default markers in react-leaflet
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  isOpen?: boolean;
  rating?: number;
  category?: string;
  image?: string;
  address?: string;
}

interface SearchMapClientProps {
  markers: MapMarker[];
  hoveredMarkerId: string | null;
  selectedMarkerId: string | null;
  onMarkerHover: (markerId: string | null) => void;
  onMarkerClick: (markerId: string) => void;
  center?: [number, number];
  zoom?: number;
}

// Component to handle map view updates
function MapController({
  markers,
  selectedMarkerId,
}: {
  markers: MapMarker[];
  selectedMarkerId: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (markers.length > 0) {
      // Create bounds from all markers
      const bounds = L.latLngBounds(markers.map(marker => marker.position));
      
      // If we have a selected marker, center on it with higher zoom
      if (selectedMarkerId) {
        const selectedMarker = markers.find(m => m.id === selectedMarkerId);
        if (selectedMarker) {
          map.setView(selectedMarker.position, 15);
          return;
        }
      }
      
      // Otherwise fit to bounds of all markers
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, markers, selectedMarkerId]);

  // Force map to resize/invalidate when mounted to fix display issues
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

// Create custom marker icons
const createMarkerIcon = (isHovered: boolean, isSelected: boolean, isOpen: boolean = true) => {
  const size = isHovered || isSelected ? 40 : 30;
  const color = isOpen ? '#10b981' : '#ef4444'; // Green for open, red for closed
  const borderColor = isHovered || isSelected ? '#6366f1' : '#ffffff';
  const borderWidth = isHovered || isSelected ? 3 : 2;
  
  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background-color: ${color};
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${borderWidth}px solid ${borderColor};
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        transition: all 0.3s ease;
      ">
        <div style="
          width: ${size - 10}px;
          height: ${size - 10}px;
          background-color: white;
          border-radius: 50%;
          transform: rotate(45deg);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="
            width: ${size - 16}px;
            height: ${size - 16}px;
            background-color: ${color};
            border-radius: 50%;
            opacity: 0.8;
          "></div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size],
  });
};

export function SearchMapClient({
  markers,
  hoveredMarkerId,
  selectedMarkerId,
  onMarkerHover,
  onMarkerClick,
  center = [5.6037, -0.187], // Default to Accra, Ghana
  zoom = 12,
}: SearchMapClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Add custom CSS for markers
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-marker-icon {
        transition: transform 0.2s ease-out;
      }
      .leaflet-marker-icon:hover {
        z-index: 1000 !important;
      }
      .marker-selected {
        z-index: 1000 !important;
        transform: scale(1.2);
      }
      .marker-hovered {
        z-index: 999 !important;
        transform: scale(1.1);
      }
      .leaflet-popup-content-wrapper {
        border-radius: 8px;
        padding: 0;
        overflow: hidden;
      }
      .leaflet-popup-content {
        margin: 0;
        width: 250px !important;
      }
      .custom-popup {
        width: 100%;
      }
      .custom-popup-image {
        width: 100%;
        height: 120px;
        background-size: cover;
        background-position: center;
      }
      .custom-popup-content {
        padding: 12px;
      }
      .custom-popup-title {
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 4px;
      }
      .custom-popup-address {
        font-size: 12px;
        color: #666;
        margin-bottom: 8px;
      }
      .custom-popup-rating {
        display: flex;
        align-items: center;
        font-size: 12px;
        margin-bottom: 8px;
      }
      .custom-popup-rating-star {
        color: #f59e0b;
        margin-right: 4px;
      }
      .custom-popup-button {
        background-color: #6366f1;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      .custom-popup-button:hover {
        background-color: #4f46e5;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';
  const tileLayerUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

  // Calculate center from markers if available
  const calculateCenter = (): [number, number] => {
    if (markers.length === 0) return center;
    
    if (selectedMarkerId) {
      const selected = markers.find(m => m.id === selectedMarkerId);
      if (selected) return selected.position;
    }
    
    // Average of all marker positions
    const sumLat = markers.reduce((sum, marker) => sum + marker.position[0], 0);
    const sumLng = markers.reduce((sum, marker) => sum + marker.position[1], 0);
    return [sumLat / markers.length, sumLng / markers.length];
  };

  const mapCenter = calculateCenter();

  return (
    <MapContainer
      center={mapCenter}
      zoom={zoom}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
      whenCreated={(map) => {
        mapRef.current = map;
      }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileLayerUrl}
      />
      
      <MapController 
        markers={markers} 
        selectedMarkerId={selectedMarkerId} 
      />
      
      {markers.map((marker) => {
        const isHovered = marker.id === hoveredMarkerId;
        const isSelected = marker.id === selectedMarkerId;
        
        return (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createMarkerIcon(isHovered, isSelected, marker.isOpen)}
            eventHandlers={{
              mouseover: () => onMarkerHover(marker.id),
              mouseout: () => onMarkerHover(null),
              click: () => onMarkerClick(marker.id),
            }}
            zIndexOffset={isSelected ? 1000 : isHovered ? 900 : 0}
            className={isSelected ? 'marker-selected' : isHovered ? 'marker-hovered' : ''}
          >
            <Popup>
              <div className="custom-popup">
                <div 
                  className="custom-popup-image" 
                  style={{ 
                    backgroundImage: marker.image 
                      ? `url(${marker.image})` 
                      : 'linear-gradient(to right, #6366f1, #8b5cf6)' 
                  }}
                />
                <div className="custom-popup-content">
                  <div className="custom-popup-title">{marker.name}</div>
                  {marker.address && (
                    <div className="custom-popup-address">{marker.address}</div>
                  )}
                  {marker.rating && (
                    <div className="custom-popup-rating">
                      <span className="custom-popup-rating-star">★</span>
                      <span>{marker.rating}</span>
                    </div>
                  )}
                  <button 
                    className="custom-popup-button"
                    onClick={() => onMarkerClick(marker.id)}
                  >
                    View Details
                  </button>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}