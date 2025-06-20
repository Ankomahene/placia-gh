'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Info, 
  Star, 
  Image as ImageIcon,
  MessageCircle,
  Clock
} from 'lucide-react';

interface PlaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PlaceTabs({ activeTab, onTabChange }: PlaceTabsProps) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="grid grid-cols-4 md:grid-cols-5 w-full">
        <TabsTrigger value="info" className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span className="hidden sm:inline">Information</span>
        </TabsTrigger>
        
        <TabsTrigger value="reviews" className="flex items-center gap-2">
          <Star className="h-4 w-4" />
          <span className="hidden sm:inline">Reviews</span>
        </TabsTrigger>
        
        <TabsTrigger value="photos" className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Photos</span>
        </TabsTrigger>
        
        <TabsTrigger value="hours" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Hours</span>
        </TabsTrigger>
        
        <TabsTrigger value="chat" className="flex items-center gap-2 md:hidden">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Chat</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}