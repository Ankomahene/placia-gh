'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  latitude?: number;
  longitude?: number;
  name?: string;
}

export function MapComponent({ 
  latitude = 5.6037, 
  longitude = -0.1870,
  name = 'Location'
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  
  useEffect(() => {
    if (!mapRef.current) return;
    
    // Fix for default marker icons
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
    
    // Create custom marker icon
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `
        <div style="
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%));
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid white;
          box-shadow: 0 4px 15px rgba(0,0,0,0.3), 0 0 0 1px hsl(262 83% 58% / 0.2);
        ">
          <div style="
            width: 26px;
            height: 26px;
            background-color: white;
            border-radius: 50%;
            transform: rotate(45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
            box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
          ">
            <div style="
              width: 20px;
              height: 20px;
              background: linear-gradient(135deg, hsl(262 83% 58%), hsl(262 83% 48%));
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 12px;
              font-weight: bold;
            ">📍</div>
          </div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 36],
      popupAnchor: [0, -36],
    });
    
    // Initialize map
    const map = L.map(mapRef.current).setView([latitude, longitude], 15);
    mapInstanceRef.current = map;
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);
    
    // Add marker
    const marker = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>${name}</b>`).openPopup();
    
    // Cleanup
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, name]);
  
  return <div ref={mapRef} className="h-full w-full" />;
}