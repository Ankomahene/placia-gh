'use client';

import React from 'react';
import { PlaceResultsSummary } from '@/types/place';
import { useSearchContext } from '../../hooks/use-search-context';
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
  // Get shouldAutoRunChat flag from search context
  const { chatSearchTerm, shouldAutoRunChat, setShouldAutoRunChat } =
    useSearchContext();

  // Use the flag to determine if we should auto-run
  const shouldAutoRun = shouldAutoRunChat;

  // Reset the flag after using it
  React.useEffect(() => {
    if (shouldAutoRunChat) {
      // Reset the flag so it doesn't auto-run again when switching back to chat
      setShouldAutoRunChat(false);
    }
  }, [shouldAutoRunChat, setShouldAutoRunChat]);

  return (
    <ChatProvider
      places={places}
      initialQuery={chatSearchTerm || initialQuery || ''}
      shouldAutoRun={shouldAutoRun}
    >
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
