'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Info,
  Star,
  Image as ImageIcon,
  MessageCircle,
  Clock,
} from 'lucide-react';

interface PlaceTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function PlaceTabs({ activeTab, onTabChange }: PlaceTabsProps) {
  return (
    <div className="w-full">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 w-full h-12 bg-white dark:bg-zinc-900 rounded-xl p-1 shadow-sm border border-primary/20">
          <TabsTrigger
            value="info"
            className="flex items-center gap-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary dark:data-[state=active]:border-primary/50 data-[state=active]:text-primary dark:data-[state=active]:text-primary/70 rounded-lg"
          >
            <Info className="h-4 w-4" />
            <span className="hidden sm:inline">Info</span>
          </TabsTrigger>

          <TabsTrigger
            value="reviews"
            className="flex items-center gap-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary dark:data-[state=active]:border-primary/50 data-[state=active]:text-primary dark:data-[state=active]:text-primary/70 rounded-lg"
          >
            <Star className="h-4 w-4" />
            <span className="hidden sm:inline">Reviews</span>
          </TabsTrigger>

          <TabsTrigger
            value="photos"
            className="flex items-center gap-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary dark:data-[state=active]:border-primary/50 data-[state=active]:text-primary dark:data-[state=active]:text-primary/70 rounded-lg"
          >
            <ImageIcon className="h-4 w-4" />
            <span className="hidden sm:inline">Photos</span>
          </TabsTrigger>

          <TabsTrigger
            value="hours"
            className="flex items-center gap-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary dark:data-[state=active]:border-primary/50 data-[state=active]:text-primary dark:data-[state=active]:text-primary/70 rounded-lg"
          >
            <Clock className="h-4 w-4" />
            <span className="hidden sm:inline">Hours</span>
          </TabsTrigger>

          <TabsTrigger
            value="chat"
            className="flex items-center gap-2 text-sm font-medium data-[state=active]:border-b-2 data-[state=active]:border-primary dark:data-[state=active]:border-primary/50 data-[state=active]:text-primary dark:data-[state=active]:text-primary/70 dark:data-[state=active]:bg-zinc-800 rounded-lg"
          >
            <MessageCircle className="h-4 w-4" />
            <span className="hidden sm:inline">Chat</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
