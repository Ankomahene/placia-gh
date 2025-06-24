'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import Map, { Marker, Popup } from 'react-map-gl/maplibre';
import type { MapRef } from 'react-map-gl/maplibre';
import maplibregl from 'maplibre-gl';
import { MaplibreMapClientProps, MaplibreMarker } from './types';
import { PlacePopup, popupStyles } from '../shared/PlacePopup';
import 'maplibre-gl/dist/maplibre-gl.css';

export function MaplibreMapClient({
  markers,
  hoveredMarkerId,
  selectedMarkerId,
  onMarkerHover,
  onMarkerClick,
  flyToMarkerId,
  isSidebarCollapsed,
  hoverSource,
  center = { lat: 5.6037, lng: -0.187 }, // Default to Accra, Ghana
  zoom = 12,
  setNavigationSource,
}: MaplibreMapClientProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: center.lng,
    latitude: center.lat,
    zoom: zoom,
  });
  const [popupInfo, setPopupInfo] = useState<{
    marker: MaplibreMarker;
    longitude: number;
    latitude: number;
  } | null>(null);

  // Track hover source for popup behavior
  const hoverSourceRef = useRef<'card' | 'marker' | null>(null);
  const lastHoveredIdRef = useRef<string | null>(null);

  useEffect(() => {
    setMounted(true);

    // Add popup styles to document
    const style = document.createElement('style');
    style.textContent = `
      ${popupStyles}
      
      /* MapLibre-specific popup styling */
      .maplibregl-popup {
        max-width: 280px !important;
      }
      
      .maplibregl-popup-content {
        padding: 0 !important;
        border-radius: 12px !important;
        overflow: hidden !important;
        box-shadow: 0 10px 25px rgba(0,0,0,0.15) !important;
        border: 1px solid hsl(214.3 31.8% 91.4%) !important;
        background: white !important;
      }
      
      .dark .maplibregl-popup-content {
        border-color: hsl(217.2 32.6% 17.5%) !important;
        background: hsl(222.2 84% 4.9%) !important;
      }
      
      .maplibregl-popup-tip {
        border-bottom-color: white !important;
        border-width: 8px !important;
      }
      
      .dark .maplibregl-popup-tip {
        border-bottom-color: hsl(222.2 84% 4.9%) !important;
      }
      
      .maplibregl-popup-close-button {
        background: rgba(0,0,0,0.1) !important;
        border-radius: 50% !important;
        width: 24px !important;
        height: 24px !important;
        font-size: 14px !important;
        color: white !important;
        border: none !important;
        top: 8px !important;
        right: 8px !important;
        z-index: 10 !important;
      }
      
      .maplibregl-popup-close-button:hover {
        background: rgba(0,0,0,0.2) !important;
      }
      
      .dark .maplibregl-popup-close-button {
        background: rgba(255,255,255,0.1) !important;
        color: white !important;
      }
      
      .dark .maplibregl-popup-close-button:hover {
        background: rgba(255,255,255,0.2) !important;
      }
      
      /* Tip styling for top-anchored popup */
      .maplibregl-popup-anchor-top .maplibregl-popup-tip {
        border-bottom-color: white !important;
        border-top-color: transparent !important;
      }
      
      .dark .maplibregl-popup-anchor-top .maplibregl-popup-tip {
        border-bottom-color: hsl(222.2 84% 4.9%) !important;
        border-top-color: transparent !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);

  // Handle popup opening/closing based on hover source
  useEffect(() => {
    if (mounted) {
      // Update hover source from props
      hoverSourceRef.current = hoverSource || null;

      // Handle hover change
      if (hoveredMarkerId && hoveredMarkerId !== lastHoveredIdRef.current) {
        // New hover started - show popup for hovered marker
        const marker = markers.find((m) => m.id === hoveredMarkerId);
        if (marker) {
          setPopupInfo({
            marker,
            longitude: marker.position.lng,
            latitude: marker.position.lat,
          });
        }
      } else if (!hoveredMarkerId && lastHoveredIdRef.current) {
        // Hover ended - close popup only if it was from card hover
        if (hoverSourceRef.current === 'card') {
          setPopupInfo(null);
        }
      }

      lastHoveredIdRef.current = hoveredMarkerId;
    }
  }, [hoveredMarkerId, hoverSource, mounted, markers]);

  // Handle flying to a specific marker
  useEffect(() => {
    if (flyToMarkerId && mapRef.current) {
      const marker = markers.find((m) => m.id === flyToMarkerId);
      if (marker) {
        mapRef.current.flyTo({
          center: [marker.position.lng, marker.position.lat],
          zoom: 16,
          duration: 1500,
        });
      }
    }
  }, [flyToMarkerId, markers]);

  // Handle sidebar collapse/expand - resize map
  useEffect(() => {
    if (mapRef.current) {
      // Delay to allow CSS transition to complete
      const timeoutId = setTimeout(() => {
        mapRef.current?.resize();
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [isSidebarCollapsed]);

  // Fit bounds to show all markers when markers change
  useEffect(() => {
    if (mounted && mapRef.current && markers.length > 0) {
      const bounds = markers.reduce((bounds, marker) => {
        return bounds.extend([marker.position.lng, marker.position.lat]);
      }, new maplibregl.LngLatBounds());

      mapRef.current.fitBounds(bounds, {
        padding: { top: 50, bottom: 50, left: 50, right: 50 },
        maxZoom: 15,
      });
    }
  }, [markers, mounted]);

  // Create custom marker component
  const MarkerElement = useCallback(
    ({
      marker,
      isHovered,
      isSelected,
    }: {
      marker: MaplibreMarker;
      isHovered: boolean;
      isSelected: boolean;
    }) => {
      const size = isHovered || isSelected ? 44 : 36;
      const borderWidth = isHovered || isSelected ? 3 : 2;

      return (
        <div
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background:
              'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))',
            borderRadius: '50% 50% 50% 0',
            transform: 'rotate(-45deg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: `${borderWidth}px solid white`,
            boxShadow:
              '0 4px 15px rgba(0,0,0,0.3), 0 0 0 1px hsl(262 83% 58% / 0.2)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: `${size - 10}px`,
              height: `${size - 10}px`,
              backgroundColor: 'white',
              borderRadius: '50%',
              transform: 'rotate(45deg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            {marker.image ? (
              <div
                style={{
                  width: `${size - 16}px`,
                  height: `${size - 16}px`,
                  backgroundImage: `url('${marker.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.9)',
                }}
              />
            ) : (
              <div
                style={{
                  width: `${size - 16}px`,
                  height: `${size - 16}px`,
                  background:
                    'linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: `${size / 3}px`,
                  fontWeight: 'bold',
                }}
              >
                📍
              </div>
            )}
          </div>
          {/* Status indicator */}
          <div
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '10px',
              height: '10px',
              backgroundColor: marker.isOpen ? '#10b981' : '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
              transform: 'rotate(45deg)',
              zIndex: 10,
            }}
          />
        </div>
      );
    },
    []
  );

  const handleMarkerClick = useCallback(
    (marker: MaplibreMarker) => {
      onMarkerClick(marker.id);
    },
    [onMarkerClick]
  );

  const handleMarkerMouseEnter = useCallback(
    (marker: MaplibreMarker) => {
      hoverSourceRef.current = 'marker';
      onMarkerHover(marker.id);
      setPopupInfo({
        marker,
        longitude: marker.position.lng,
        latitude: marker.position.lat,
      });
    },
    [onMarkerHover]
  );

  const handleMarkerMouseLeave = useCallback(() => {
    onMarkerHover(null);
    // Don't close popup on mouseout from marker - let it stay open for interaction
  }, [onMarkerHover]);

  const handleMapClick = useCallback(() => {
    // Close popup when clicking on map
    setPopupInfo(null);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === 'dark';

  // Use a working style URL that doesn't require API keys
  const mapStyle = isDark
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => setViewState(evt.viewState)}
      onClick={handleMapClick}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle as any}
      attributionControl={false}
    >
      {/* Render markers */}
      {markers.map((marker) => {
        const isHovered = marker.id === hoveredMarkerId;
        const isSelected = marker.id === selectedMarkerId;

        return (
          <Marker
            key={marker.id}
            longitude={marker.position.lng}
            latitude={marker.position.lat}
            anchor="bottom"
          >
            <div
              onMouseEnter={() => handleMarkerMouseEnter(marker)}
              onMouseLeave={handleMarkerMouseLeave}
              onClick={() => handleMarkerClick(marker)}
              style={{
                transform: isSelected
                  ? 'scale(1.15)'
                  : isHovered
                    ? 'scale(1.1)'
                    : 'scale(1)',
                zIndex: isSelected ? 1000 : isHovered ? 900 : 0,
              }}
            >
              <MarkerElement
                marker={marker}
                isHovered={isHovered}
                isSelected={isSelected}
              />
            </div>
          </Marker>
        );
      })}

      {/* Render popup */}
      {popupInfo && (
        <Popup
          longitude={popupInfo.longitude}
          latitude={popupInfo.latitude}
          anchor="top"
          offset={[0, -60]}
          onClose={() => setPopupInfo(null)}
          closeButton={true}
          closeOnClick={false}
        >
          <PlacePopup
            name={popupInfo.marker.name}
            image={popupInfo.marker.image}
            address={popupInfo.marker.address}
            rating={popupInfo.marker.rating}
            isOpen={popupInfo.marker.isOpen}
            distance={popupInfo.marker.distance}
            onViewDetails={() => {
              handleMarkerClick(popupInfo.marker);
              setNavigationSource?.('general_search');
            }}
          />
        </Popup>
      )}
    </Map>
  );
}
