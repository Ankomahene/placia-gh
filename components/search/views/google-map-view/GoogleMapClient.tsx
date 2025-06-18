'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleMapClientProps, MapMarker } from './types';
import { MarkerInfoWindow } from './MarkerInfoWindow';

// Google Maps configuration
const GOOGLE_MAPS_CONFIG = {
  libraries: ['places', 'geometry'] as const,
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || '',
};

export function GoogleMapClient({
  markers,
  hoveredMarkerId,
  selectedMarkerId,
  onMarkerHover,
  onMarkerClick,
  flyToMarkerId,
  userLocation,
  directionsInfo,
  onDirectionsRequest,
}: GoogleMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const googleMapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userLocationMarkerRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoveredMarker, setHoveredMarker] = useState<MapMarker | null>(null);

  // Initialize Google Maps
  useEffect(() => {
    const initMap = async () => {
      try {
        if (!mapRef.current || !(window as any).google) return;

        // Create map
        googleMapRef.current = new (window as any).google.maps.Map(
          mapRef.current,
          {
            zoom: 12,
            center: { lat: 5.6037, lng: -0.187 }, // Default to Accra, Ghana
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }],
              },
            ],
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
          }
        );

        // Initialize directions renderer
        directionsRendererRef.current = new (
          window as any
        ).google.maps.DirectionsRenderer({
          draggable: false,
          suppressMarkers: false,
          suppressInfoWindows: true,
        });
        directionsRendererRef.current.setMap(googleMapRef.current);

        // Initialize info window
        infoWindowRef.current = new (window as any).google.maps.InfoWindow();

        setIsMapLoaded(true);
      } catch (error) {
        console.error('Error initializing Google Maps:', error);
      }
    };

    // Load Google Maps API
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_API_KEY}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = (error) => {
        console.error('Error loading Google Maps script:', error);
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  // Create custom marker element
  const createMarkerElement = useCallback(
    (marker: MapMarker, isHovered: boolean, isSelected: boolean) => {
      const size = isHovered || isSelected ? 44 : 36;
      const borderWidth = isHovered || isSelected ? 3 : 2;

      const markerElement = document.createElement('div');
      markerElement.style.cssText = `
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
      cursor: pointer;
    `;

      const innerDiv = document.createElement('div');
      innerDiv.style.cssText = `
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
    `;

      if (marker.image) {
        const img = document.createElement('div');
        img.style.cssText = `
        width: ${size - 16}px;
        height: ${size - 16}px;
        background-image: url('${marker.image}');
        background-size: cover;
        background-position: center;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.9);
      `;
        innerDiv.appendChild(img);
      } else {
        innerDiv.innerHTML = `
        <div style="
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
        ">📍</div>
      `;
      }

      // Status indicator
      const statusDiv = document.createElement('div');
      statusDiv.style.cssText = `
      position: absolute;
      top: 2px;
      right: 2px;
      width: 10px;
      height: 10px;
      background-color: ${marker.isOpen ? '#22c55e' : '#ef4444'};
      border-radius: 50%;
      border: 2px solid white;
      transform: rotate(45deg);
      z-index: 10;
    `;

      markerElement.appendChild(innerDiv);
      markerElement.appendChild(statusDiv);

      return markerElement;
    },
    []
  );

  // Update markers
  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current.clear();

    // Create new markers
    markers.forEach((marker) => {
      const isHovered = hoveredMarkerId === marker.id;
      const isSelected = selectedMarkerId === marker.id;

      const markerElement = createMarkerElement(marker, isHovered, isSelected);

      // Use regular marker if AdvancedMarkerElement is not available
      let googleMarker;
      if ((window as any).google.maps.marker?.AdvancedMarkerElement) {
        googleMarker = new (
          window as any
        ).google.maps.marker.AdvancedMarkerElement({
          position: marker.position,
          map: googleMapRef.current,
          content: markerElement,
          title: marker.name,
        });
      } else {
        // Fallback to regular marker
        googleMarker = new (window as any).google.maps.Marker({
          position: marker.position,
          map: googleMapRef.current,
          title: marker.name,
        });
      }

      // Add hover listeners
      markerElement.addEventListener('mouseenter', () => {
        onMarkerHover(marker.id);
        setHoveredMarker(marker);
      });

      markerElement.addEventListener('mouseleave', () => {
        onMarkerHover(null);
        setHoveredMarker(null);
      });

      // Add click listener
      markerElement.addEventListener('click', () => {
        onMarkerClick(marker.id);
      });

      markersRef.current.set(marker.id, googleMarker);
    });

    // Fit bounds to show all markers
    if (markers.length > 0) {
      const bounds = new (window as any).google.maps.LatLngBounds();
      markers.forEach((marker) => {
        bounds.extend(marker.position);
      });

      // Include user location in bounds if available
      if (userLocation) {
        bounds.extend(userLocation);
      }

      googleMapRef.current.fitBounds(bounds, { padding: 50 });
    }
  }, [
    markers,
    hoveredMarkerId,
    selectedMarkerId,
    isMapLoaded,
    createMarkerElement,
    onMarkerHover,
    onMarkerClick,
    userLocation,
  ]);

  // Handle user location
  useEffect(() => {
    if (!isMapLoaded || !googleMapRef.current) return;

    // Remove existing user location marker
    if (userLocationMarkerRef.current) {
      userLocationMarkerRef.current.setMap(null);
    }

    if (userLocation) {
      // Create pulsing user location marker
      const pulseElement = document.createElement('div');
      pulseElement.innerHTML = `
        <div style="
          position: relative;
          width: 20px;
          height: 20px;
        ">
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: #3b82f6;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 10px rgba(59, 130, 246, 0.3);
          "></div>
          <div style="
            position: absolute;
            width: 20px;
            height: 20px;
            background: rgba(59, 130, 246, 0.3);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
        </div>
        <style>
          @keyframes pulse {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.5); opacity: 0; }
          }
        </style>
      `;

      if ((window as any).google.maps.marker?.AdvancedMarkerElement) {
        userLocationMarkerRef.current = new (
          window as any
        ).google.maps.marker.AdvancedMarkerElement({
          position: userLocation,
          map: googleMapRef.current,
          content: pulseElement,
          title: 'Your Location',
        });
      } else {
        // Fallback to regular marker
        userLocationMarkerRef.current = new (window as any).google.maps.Marker({
          position: userLocation,
          map: googleMapRef.current,
          title: 'Your Location',
          icon: {
            url:
              'data:image/svg+xml;charset=UTF-8,' +
              encodeURIComponent(`
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(20, 20),
          },
        });
      }
    }
  }, [userLocation, isMapLoaded]);

  // Handle directions
  useEffect(() => {
    if (!isMapLoaded || !directionsRendererRef.current) return;

    if (directionsInfo?.routes) {
      directionsRendererRef.current.setDirections(directionsInfo.routes);
    } else {
      directionsRendererRef.current.setDirections({ routes: [] });
    }
  }, [directionsInfo, isMapLoaded]);

  // Handle fly to marker
  useEffect(() => {
    if (!flyToMarkerId || !isMapLoaded || !googleMapRef.current) return;

    const marker = markers.find((m) => m.id === flyToMarkerId);
    if (marker) {
      googleMapRef.current.panTo(marker.position);
      googleMapRef.current.setZoom(16);
    }
  }, [flyToMarkerId, markers, isMapLoaded]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full" />

      {/* Hover Info Window */}
      {hoveredMarker && (
        <MarkerInfoWindow
          marker={hoveredMarker}
          isVisible={true}
          onClose={() => setHoveredMarker(null)}
          onDirectionsRequest={
            onDirectionsRequest
              ? () => onDirectionsRequest(hoveredMarker.id)
              : undefined
          }
        />
      )}
    </div>
  );
}
