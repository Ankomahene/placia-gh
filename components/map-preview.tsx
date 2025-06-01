"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";
import { featuredPlaces } from "@/lib/mock-data";

const DynamicMap = dynamic(() => import("@/components/map/dynamic-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-muted/20 animate-pulse rounded-xl"></div>
  ),
});

export function MapPreview() {
  const mapLocations = featuredPlaces.map((place) => ({
    id: place.id,
    name: place.name,
    position: [5.6037, -0.1870] as [number, number], // Example coordinates for Accra
    isOpen: place.isOpen,
    rating: place.rating,
  }));

  return (
    <div className="w-full relative">
      <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-primary/10 dark:border-primary/20">
        <div className="w-full h-64 md:h-80 lg:h-96 relative">
          <DynamicMap
            center={[5.6037, -0.1870]}
            zoom={13}
            locations={mapLocations}
            className="h-full w-full"
          />
        </div>
      </div>

      {/* Floating cards */}
      <div className="absolute -top-6 -left-2 md:top-8 md:-left-8 p-4 bg-card rounded-xl shadow-lg border border-border max-w-[200px] animate-float z-40">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-primary/10 dark:bg-primary/40 flex items-center justify-center">
            <div className="h-4 w-4 text-primary">📍</div>
          </div>
          <span className="font-medium text-sm">Nearby</span>
        </div>
        <p className="text-xs text-muted-foreground">
          15 new businesses opened in your area this month
        </p>
      </div>

      <div className="absolute -bottom-6 -right-6 md:bottom-8 md:-right-10 p-4 bg-card rounded-xl shadow-lg border border-border max-w-[200px] animate-float-delayed z-20">
        <div className="flex items-center space-x-2 mb-2">
          <div className="h-8 w-8 rounded-full bg-accent/10 dark:bg-accent/20 flex items-center justify-center">
            <div className="h-4 w-4 text-accent">⭐</div>
          </div>
          <span className="font-medium text-sm">Top Rated</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Discover the highest-rated services within walking distance
        </p>
      </div>
    </div>
  );
}