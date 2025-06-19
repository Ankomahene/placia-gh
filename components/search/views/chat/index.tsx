'use client';

import React from 'react';
import { PlaceResultsSummary } from '@/types/place';
import { ChatProvider } from './ChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessagesList } from './ChatMessagesList';
import { ChatInput } from './ChatInput';
import { ListeningPopup } from './ListeningPopup';

interface ChatViewProps {
  places: PlaceResultsSummary[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
  initialQuery?: string;
}

export { ChatHeader } from './ChatHeader';
export { ChatMessage } from './ChatMessage';
export { ChatMessagesList } from './ChatMessagesList';
export { ChatInput } from './ChatInput';
export { ChatPlaceCard } from './ChatPlaceCard';
export { ListeningPopup } from './ListeningPopup';
export { ChatProvider, useChatContext } from './ChatContext';

export function ChatView({
  places,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceSelect,
  isLoading,
  initialQuery,
}: ChatViewProps) {
  return (
    <ChatProvider places={places} initialQuery={initialQuery}>
      <div className="h-full flex flex-col max-w-6xl mx-auto border my-2 rounded-md overflow-hidden shadow-md">
        {/* Header */}
        <ChatHeader />

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-4 space-y-4">
            <ChatMessagesList
              hoveredPlaceId={hoveredPlaceId}
              onPlaceHover={onPlaceHover}
              onPlaceSelect={onPlaceSelect}
            />
          </div>
        </div>

        {/* Input Area */}
        <ChatInput />

        {/* Listening Popup */}
        <ListeningPopup />
      </div>
    </ChatProvider>
  );
}
