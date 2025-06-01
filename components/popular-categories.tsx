import { MapPin, Utensils, Hotel, ShoppingBag, Landmark, Hospital, School, Church, Umbrella, Trees as Tree, Dumbbell, Pill, Fuel } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { popularCategories } from "@/lib/mock-data";

const iconMap: Record<string, React.ReactNode> = {
  "utensils": <Utensils className="h-5 w-5" />,
  "hotel": <Hotel className="h-5 w-5" />,
  "shopping-bag": <ShoppingBag className="h-5 w-5" />,
  "landmark": <Landmark className="h-5 w-5" />,
  "hospital": <Hospital className="h-5 w-5" />,
  "school": <School className="h-5 w-5" />,
  "church": <Church className="h-5 w-5" />,
  "umbrella-beach": <Umbrella className="h-5 w-5" />,
  "tree": <Tree className="h-5 w-5" />,
  "dumbbell": <Dumbbell className="h-5 w-5" />,
  "pills": <Pill className="h-5 w-5" />,
  "gas-pump": <Fuel className="h-5 w-5" />
};

export default function PopularCategories() {
  return (
    <section>
      <h2 className="text-2xl md:text-3xl font-bold mb-6">Popular Categories</h2>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {popularCategories.map((category) => (
          <Card 
            key={category.id} 
            className="cursor-pointer hover:shadow-md transition-shadow"
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                {iconMap[category.icon] || <MapPin className="h-5 w-5" />}
              </div>
              <h3 className="font-medium mb-1">{category.name}</h3>
              <p className="text-xs text-muted-foreground">{category.count} places</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}