'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

// Dynamically import react-leaflet components
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), {
  ssr: false,
});

interface MapMarker {
  id: string;
  position: [number, number];
  name: string;
  isOpen?: boolean;
  rating?: number;
  category?: string;
  image?: string;
  address?: string;
  distance?: string;
}

interface SearchMapClientProps {
  markers: MapMarker[];
  hoveredMarkerId: string | null;
  selectedMarkerId: string | null;
  onMarkerHover: (markerId: string | null) => void;
  onMarkerClick: (markerId: string) => void;
  center?: [number, number];
  zoom?: number;
  flyToMarkerId?: string | null;
}

// Fix leaflet default icon issue
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

function MapController({
  markers,
  selectedMarkerId,
  flyToMarkerId,
}: {
  markers: MapMarker[];
  selectedMarkerId: string | null;
  flyToMarkerId?: string | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (flyToMarkerId) {
      const marker = markers.find((m) => m.id === flyToMarkerId);
      if (marker) {
        // Check if marker is currently in view
        const bounds = map.getBounds();
        const markerLatLng = L.latLng(marker.position);

        if (!bounds.contains(markerLatLng)) {
          // Fly to marker if it's not in view
          map.flyTo(marker.position, Math.max(map.getZoom(), 14), {
            duration: 1.5,
            easeLinearity: 0.5,
          });
        }
      }
    }
  }, [flyToMarkerId, markers, map]);

  useEffect(() => {
    if (markers.length > 0) {
      // Create bounds from all markers
      const bounds = L.latLngBounds(markers.map((marker) => marker.position));

      // If we have a selected marker, center on it with higher zoom
      if (selectedMarkerId) {
        const selectedMarker = markers.find((m) => m.id === selectedMarkerId);
        if (selectedMarker) {
          map.setView(selectedMarker.position, 15);
          return;
        }
      }

      // Otherwise fit all markers in view
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, [markers, selectedMarkerId, map]);

  return null;
}

// Create custom marker icons
const createMarkerIcon = (
  isHovered: boolean,
  isSelected: boolean,
  isOpen: boolean = true,
  imageUrl?: string
) => {
  const size = isHovered || isSelected ? 44 : 36;
  const borderWidth = isHovered || isSelected ? 3 : 2;

  const innerContent = imageUrl
    ? `<div style="
        width: ${size - 16}px;
        height: ${size - 16}px;
        background-image: url('${imageUrl}');
        background-size: cover;
        background-position: center;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.9);
      "></div>`
    : `<div style="
        width: ${size - 16}px;
        height: ${size - 16}px;
        background: linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%));
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: ${size / 3}px;
        font-weight: bold;
      ">📍</div>`;

  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        width: ${size}px;
        height: ${size}px;
        background: linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%));
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        display: flex;
        align-items: center;
        justify-content: center;
        border: ${borderWidth}px solid white;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 0 1px hsl(262 83% 58% / 0.2);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        position: relative;
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
          overflow: hidden;
          box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
        ">
          ${innerContent}
        </div>
        ${
          !isOpen
            ? `<div style="
          position: absolute;
          top: 2px;
          right: 2px;
          width: 10px;
          height: 10px;
          background-color: #ef4444;
          border-radius: 50%;
          border: 2px solid white;
          transform: rotate(45deg);
          z-index: 10;
        "></div>`
            : `<div style="
              position: absolute;
              top: 2px;
              right: 2px;
              width: 10px;
              height: 10px;
              background-color: #10b981;
              border-radius: 50%;
              border: 2px solid white;
              transform: rotate(45deg);
              z-index: 10;
            "></div>`
        }
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
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
  flyToMarkerId,
}: SearchMapClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Record<string, L.Marker>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle popup opening/closing when card is hovered
  useEffect(() => {
    if (mounted && mapRef.current) {
      // Close all popups first
      Object.values(markersRef.current).forEach((marker) => {
        if (marker && marker.closePopup) {
          marker.closePopup();
        }
      });

      // Open popup for hovered marker
      if (hoveredMarkerId && markersRef.current[hoveredMarkerId]) {
        const marker = markersRef.current[hoveredMarkerId];
        if (marker && marker.openPopup) {
          marker.openPopup();
        }
      }
    }
  }, [hoveredMarkerId, mounted]);

  // Add custom CSS for markers and popups
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .leaflet-container {
        font-family: inherit;
      }
      .leaflet-marker-icon {
        transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .leaflet-marker-icon:hover {
        z-index: 1000 !important;
        transform: scale(1.1);
      }
      .marker-selected .leaflet-marker-icon {
        z-index: 1000 !important;
        transform: scale(1.15);
      }
      .marker-hovered .leaflet-marker-icon {
        z-index: 999 !important;
        transform: scale(1.1);
      }
      .leaflet-popup-content-wrapper {
        border-radius: 12px;
        padding: 0;
        overflow: hidden;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15);
        border: 1px solid hsl(214.3 31.8% 91.4%);
      }
      .leaflet-popup-content {
        margin: 0;
        width: 280px !important;
        font-family: inherit;
      }
      .leaflet-popup-tip {
        background: white;
        border: 1px solid hsl(214.3 31.8% 91.4%);
        border-top: none;
        border-right: none;
      }
      .dark .leaflet-popup-content-wrapper {
        border-color: hsl(217.2 32.6% 17.5%);
        background: hsl(222.2 84% 4.9%);
      }
      .dark .leaflet-popup-tip {
        background: hsl(222.2 84% 4.9%);
        border-color: hsl(217.2 32.6% 17.5%);
        border-top: none;
        border-right: none;
      }
      .custom-popup {
        width: 100%;
      }
      .custom-popup-image {
        width: 100%;
        height: 140px;
        background-size: cover;
        background-position: center;
        position: relative;
      }
      .custom-popup-content {
        padding: 16px;
        background: white;
        color: hsl(222.2 84% 4.9%);
      }
      .dark .custom-popup-content {
        background: hsl(222.2 84% 4.9%);
        color: hsl(210 40% 98%);
      }
      .custom-popup-title {
        font-weight: 600;
        font-size: 16px;
        margin-bottom: 6px;
      }
      .custom-popup-address {
        font-size: 13px;
        color: hsl(215.4 16.3% 46.9%);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .dark .custom-popup-address {
        color: hsl(215.4 16.3% 65.9%);
      }
      .custom-popup-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        font-size: 12px;
      }
      .custom-popup-rating {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .custom-popup-rating-star {
        color: #f59e0b;
      }
      .custom-popup-status {
        display: flex;
        align-items: center;
        gap: 4px;
      }
      .custom-popup-status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
      .custom-popup-distance {
        color: hsl(215.4 16.3% 46.9%);
        font-size: 12px;
      }
      .dark .custom-popup-distance {
        color: hsl(215.4 16.3% 65.9%);
      }
      .custom-popup-button {
        background: hsl(262 83% 58%);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 6px;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s;
        width: 100%;
      }
      .custom-popup-button:hover {
        background: hsl(262 83% 48%);
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
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
      const selected = markers.find((m) => m.id === selectedMarkerId);
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
      ref={mapRef}
      minZoom={2}
      maxZoom={18}
      maxBounds={[
        [-90, -180],
        [90, 180],
      ]}
      maxBoundsViscosity={1.0}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={tileLayerUrl}
      />

      <MapController
        markers={markers}
        selectedMarkerId={selectedMarkerId}
        flyToMarkerId={flyToMarkerId}
      />

      {markers.map((marker) => {
        const isHovered = marker.id === hoveredMarkerId;
        const isSelected = marker.id === selectedMarkerId;

        return (
          <Marker
            key={marker.id}
            position={marker.position}
            icon={createMarkerIcon(
              isHovered,
              isSelected,
              marker.isOpen,
              marker.image
            )}
            ref={(ref) => {
              if (ref) {
                markersRef.current[marker.id] = ref;
              }
            }}
            eventHandlers={{
              mouseover: (e) => {
                onMarkerHover(marker.id);
                const markerInstance = e.target;
                if (markerInstance && markerInstance.openPopup) {
                  markerInstance.openPopup();
                }
              },
              mouseout: (e) => {
                onMarkerHover(null);
                const markerInstance = e.target;
                if (markerInstance && markerInstance.closePopup) {
                  markerInstance.closePopup();
                }
              },
              click: () => onMarkerClick(marker.id),
            }}
            zIndexOffset={isSelected ? 1000 : isHovered ? 900 : 0}
          >
            <Popup closeButton={false} autoClose={false} closeOnClick={false}>
              <div className="custom-popup">
                <div
                  className="custom-popup-image"
                  style={{
                    backgroundImage: marker.image
                      ? `url(${marker.image})`
                      : 'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))',
                  }}
                >
                  {marker.distance && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500',
                      }}
                    >
                      {marker.distance}
                    </div>
                  )}
                </div>
                <div className="custom-popup-content">
                  <div className="custom-popup-title">{marker.name}</div>
                  {marker.address && (
                    <div className="custom-popup-address">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      {marker.address}
                    </div>
                  )}

                  <div className="custom-popup-meta">
                    <div className="custom-popup-rating">
                      {marker.rating && (
                        <>
                          <span className="custom-popup-rating-star">★</span>
                          <span style={{ fontWeight: '500' }}>
                            {marker.rating}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="custom-popup-status">
                      <div
                        className="custom-popup-status-dot"
                        style={{
                          backgroundColor: marker.isOpen
                            ? '#10b981'
                            : '#ef4444',
                        }}
                      />
                      <span
                        style={{
                          color: marker.isOpen ? '#10b981' : '#ef4444',
                          fontWeight: '500',
                        }}
                      >
                        {marker.isOpen ? 'Open' : 'Closed'}
                      </span>
                    </div>
                  </div>

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
