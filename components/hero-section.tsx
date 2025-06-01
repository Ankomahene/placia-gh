"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, Search, MapPin, Star, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {MapPreview} from "./map-preview";

const exampleSearches = [
  "Affordable schools in my area",
  "Churches near me",
  "Best restaurants around my current location",
  "Pharmacies open now within 5km of my location",
  "Banks with ATM near me"
];

export default function HeroSection() {
  const [searchInput, setSearchInput] = useState("");
  
  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-full w-full bg-repeat pattern-map-pins"></div>
      </div>
      
      {/* Gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/90 via-background/60 to-background"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-500">Discover Places</span> in Ghana with AI
          </h1>
          <p className="text-lg md:text-xl mb-8 text-muted-foreground">
            Find local businesses, services, and attractions with our AI-powered search
          </p>
          
          {/* Search input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Input
                  type="text"
                  placeholder="What are you looking for?"
                  className="pl-4 pr-12 py-6 text-lg rounded-full border border-input shadow-sm"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-primary dark:hover:text-gray-100 hover:bg-primary/20 rounded-full"
                >
                  <Mic className="h-5 w-5" />
                  <span className="sr-only">Voice search</span>
                </Button>
              </div>
              <Button className="rounded-full px-6 py-6">
                <Search className="h-5 w-5 mr-1" />
                Search
              </Button>
            </div>
            
            {/* Example searches */}
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {exampleSearches.map((search, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="border-primary/10 px-3 py-1 cursor-pointer hover:bg-primary/10 transition-colors"
                  onClick={() => setSearchInput(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Map preview */}
        <div className="relative mt-16 h-64 md:h-80 lg:h-96 rounded-xl shadow-xl">
          
            <MapPreview />
          
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent"></div>
            
        </div>
      </div>
    </section>
  );
}