import { Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Place } from "@/lib/mock-data";

interface PlaceCardProps {
  place: Place;
  className?: string;
}

export default function PlaceCard({ place, className }: PlaceCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden transition-all duration-300 hover:shadow-md group pt-0", 
        className
      )}
    >
      <div className="aspect-[4/3] relative overflow-hidden">
        <div className="absolute inset-0 bg-black/5 group-hover:bg-black/10 transition-colors z-10"></div>
        <div 
          className="w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${place.image})` }}
        />
        <div className="absolute top-3 right-3 z-20">
          <Badge
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              place.isOpen 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-red-600 hover:bg-red-700"
            )}
          >
            {place.isOpen ? "Open" : "Closed"}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold line-clamp-1 mb-1">{place.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{place.address}</p>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 mr-1" />
            <span className="text-sm font-medium">{place.rating}</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {place.distance}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}