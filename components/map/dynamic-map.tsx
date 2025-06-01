"use client";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "next-themes";
import L from "leaflet";
import { useEffect, useState } from "react";

// Fix for default markers
const createIcon = (color: string) => {
  return L.divIcon({
    className: "custom-div-icon",
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
}

interface DynamicMapProps {
  center: [number, number];
  zoom?: number;
  locations?: MapLocation[];
  className?: string;
}

export default function DynamicMap({ 
  center, 
  zoom = 13, 
  locations = [],
  className = ""
}: DynamicMapProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const tileLayerUrl = isDark
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

  return (
    <div className={`relative rounded-xl overflow-hidden ${className}`}>
      <MapContainer
        center={center}
        zoom={zoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url={tileLayerUrl}
        />
        {locations.map((location) => (
          <Marker
            key={location.id}
            position={location.position}
            icon={createIcon(location.isOpen ? "#611cca" : "#873df5")}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{location.name}</h3>
                {location.rating && (
                  <div className="flex items-center mt-1">
                    <span className="text-yellow-500">★</span>
                    <span className="ml-1 text-sm">{location.rating}</span>
                  </div>
                )}
                <div className="text-sm mt-1">
                  {location.isOpen ? (
                    <span className="text-green-600">Open</span>
                  ) : (
                    <span className="text-red-600">Closed</span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}