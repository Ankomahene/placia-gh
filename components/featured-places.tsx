"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import PlaceCard from "./place-card";
import { featuredPlaces } from "@/lib/mock-data";

export default function FeaturedPlaces() {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    
    const container = scrollContainerRef.current;
    const scrollAmount = 320; // Approximate card width + gap
    
    if (direction === "left") {
      container.scrollBy({ left: -scrollAmount, behavior: "smooth" });
    } else {
      container.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };
  
  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl md:text-3xl font-bold">Featured Places</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll("left")}
            className="rounded-full h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">Scroll left</span>
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => scroll("right")}
            className="rounded-full h-8 w-8"
          >
            <ArrowRight className="h-4 w-4" />
            <span className="sr-only">Scroll right</span>
          </Button>
        </div>
      </div>
      
      <div 
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-4 pb-4 -mx-4 px-4 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {featuredPlaces.map((place) => (
          <div key={place.id} className="min-w-[280px] max-w-[280px]">
            <PlaceCard place={place} />
          </div>
        ))}
      </div>
    </section>
  );
}