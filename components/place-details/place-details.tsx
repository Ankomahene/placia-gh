'use client';

import { useState } from 'react';
import { PlaceResults } from '@/types/place';
import { PlaceHeader } from './place-header';
import { PlaceInfo } from './place-info';
import { PlaceTabs } from './place-tabs';
import { PlaceReviews } from './place-reviews';
import { PlacePhotos } from './place-photos';
import { PlaceMap } from './place-map';
import { PlaceContact } from './place-contact';
import { PlaceChat } from './place-chat';
import { PlaceHours } from './place-hours';
import { useUser } from '@/hooks/use-user';

interface PlaceDetailsProps {
  place: PlaceResults;
  platformReviews?: any[];
  userUploadedPhotos?: any[];
  userReview?: any | null;
  userPhotos?: any[];
}

export function PlaceDetails({
  place,
  platformReviews = [],
  userUploadedPhotos = [],
  userReview = null,
  userPhotos = [],
}: PlaceDetailsProps) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('info');

  return (
    <div className="flex flex-col">
      {/* Header with cover image, name, and quick actions */}
      <PlaceHeader place={place} />

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs for different sections */}
            <PlaceTabs activeTab={activeTab} onTabChange={setActiveTab} />

            {/* Tab content */}
            <div className="bg-card rounded-lg border shadow-sm">
              {activeTab === 'info' && <PlaceInfo place={place} />}
              {activeTab === 'reviews' && (
                <PlaceReviews
                  place={place}
                  platformReviews={platformReviews}
                  userReview={userReview}
                  isLoggedIn={!!user}
                />
              )}
              {activeTab === 'photos' && (
                <PlacePhotos
                  place={place}
                  userUploadedPhotos={userUploadedPhotos}
                  userPhotos={userPhotos}
                  isLoggedIn={!!user}
                />
              )}
              {activeTab === 'hours' && <PlaceHours place={place} />}
              {activeTab === 'chat' && place.isBusinessPlace && (
                <div className="p-6">
                  <PlaceChat place={place} isLoggedIn={!!user} />
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <PlaceMap place={place} />

            {/* Contact information */}
            <PlaceContact place={place} />

            {/* Chat widget (if business) - desktop only */}
            {place.isBusinessPlace && (
              <div className="hidden lg:block">
                <PlaceChat place={place} isLoggedIn={!!user} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
