'use client';

import { Skeleton } from '@/components/ui/skeleton';

export function PlaceDetailsSkeleton() {
  return (
    <div className="flex flex-col">
      {/* Header skeleton */}
      <div className="w-full h-64 md:h-80 bg-muted/30 relative">
        <Skeleton className="w-full h-full" />
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-background to-transparent h-32">
          <div className="container mx-auto px-4 pb-6">
            <Skeleton className="h-10 w-3/4 max-w-2xl mt-8" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs skeleton */}
            <div className="flex gap-2 border-b">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-24" />
              ))}
            </div>
            
            {/* Content skeleton */}
            <div className="bg-card rounded-lg border shadow-sm p-6 space-y-4">
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <Skeleton className="h-6 w-4/6" />
              
              <div className="grid grid-cols-2 gap-4 mt-6">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-full" />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Sidebar skeleton */}
          <div className="space-y-6">
            {/* Map skeleton */}
            <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
            
            {/* Contact skeleton */}
            <div className="bg-card rounded-lg border shadow-sm p-4 space-y-4">
              <Skeleton className="h-6 w-1/2" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex gap-2 items-center">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}