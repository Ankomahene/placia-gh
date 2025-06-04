'use client';

import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from 'next-themes';
import L from 'leaflet';
import { useEffect, useState } from 'react';

// Fix for default markers
const createIcon = (color: string, isUserLocation = false) => {
  if (isUserLocation) {
    return L.divIcon({
      className: 'user-location-marker',
      html: `
        <div class="user-location-pin">
          <div class="user-location-dot"></div>
          <div class="user-location-pulse"></div>
        </div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  }

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="marker-pin" style="background-color: ${color}"></div>`,
    iconSize: [30, 42],
    iconAnchor: [15, 42],
  });
};

export interface MapLocation {
  id: string;
  name: string;
  position: [number, number];
  isOpen?: boolean;
  rating?: number;
  isUserLocation?: boolean;
  category?: string;
  distance?: string;
  phone?: string;
  image?: string;
}

interface DynamicMapProps {
  center: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  className?: string;
  onMarkerHover?: (location: MapLocation | null) => void;
  userLocation?: { lat: number; lng: number };
}

export default function DynamicMap({
  center,
  zoom = 13,
  locations = [],
  className = '',
  onMarkerHover,
  userLocation,
}: DynamicMapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Add custom CSS for user location marker
    const style = document.createElement('style');
    style.textContent = `
      .user-location-pin {
        position: relative;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .user-location-dot {
        width: 12px;
        height: 12px;
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.3);
        z-index: 2;
      }
      
      .user-location-pulse {
        position: absolute;
        width: 20px;
        height: 20px;
        background: rgba(59, 130, 246, 0.3);
        border-radius: 50%;
        animation: pulse 2s infinite;
        z-index: 1;
      }
      
      @keyframes pulse {
        0% {
          transform: scale(1);
          opacity: 1;
        }
        70% {
          transform: scale(2);
          opacity: 0;
        }
        100% {
          transform: scale(2.5);
          opacity: 0;
        }
      }
      
      .marker-pin {
        width: 20px;
        height: 30px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        position: relative;
      }
      
      .marker-pin::after {
        content: '';
        width: 8px;
        height: 8px;
        background: white;
        border-radius: 50%;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%) rotate(45deg);
      }
      
      .custom-div-icon:hover {
        z-index: 1000;
      }
      
      .leaflet-marker-icon:hover {
        filter: brightness(1.1);
        transform: scale(1.1);
        transition: all 0.2s ease-in-out;
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

  const getMarkerColor = (location: MapLocation) => {
    if (location.isUserLocation) return '#3b82f6';
    if (location.isOpen) return '#059669'; // Green for open
    return '#dc2626'; // Red for closed
  };

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
        scrollWheelZoom={true}
        doubleClickZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileLayerUrl}
        />

        {/* User location accuracy circle */}
        {userLocation && (
          <Circle
            center={[userLocation.lat, userLocation.lng]}
            radius={100}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.1,
              weight: 1,
              opacity: 0.5,
            }}
          />
        )}

        {locations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            icon={createIcon(getMarkerColor(location), location.isUserLocation)}
            eventHandlers={{
              mouseover: () => onMarkerHover?.(location),
              mouseout: () => onMarkerHover?.(null),
            }}
          >
            <Popup>
              <div className="p-3 min-w-[200px]">
                <h3 className="font-semibold text-lg mb-2">{location.name}</h3>

                {location.rating && location.rating > 0 && (
                  <div className="flex items-center mb-2">
                    <div className="flex text-yellow-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < Math.floor(location.rating!)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">
                      {location.rating}
                    </span>
                  </div>
                )}

                {location.category && (
                  <div className="mb-2">
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                      {location.category}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        location.isOpen ? 'bg-green-500' : 'bg-red-500'
                      }`}
                    ></span>
                    <span
                      className={
                        location.isOpen ? 'text-green-600' : 'text-red-600'
                      }
                    >
                      {location.isOpen ? 'Open' : 'Closed'}
                    </span>
                  </div>

                  {location.distance && (
                    <span className="text-gray-500">{location.distance}</span>
                  )}
                </div>

                {location.isUserLocation && (
                  <div className="mt-2 text-sm text-blue-600 font-medium">
                    📍 Your current location
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
