'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, User, Clock, MoreHorizontal } from 'lucide-react';
import { ChatMessage as ChatMessageType } from '../../mock-data';
import { ChatPlaceCard } from './ChatPlaceCard';
import { useChatContext } from './ChatContext';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: ChatMessageType;
  hoveredPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
}

export function ChatMessage({
  message,
  hoveredPlaceId,
  onPlaceHover,
  onPlaceSelect,
}: ChatMessageProps) {
  const { handleLoadMore } = useChatContext();
  const isBot = message.type === 'bot';

  const formatTimestamp = (timestamp: Date) => {
    // Ensure timestamp is a Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // Additional safety check for invalid dates
    if (isNaN(date.getTime())) {
      return 'Invalid time';
    }

    return date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={cn('flex gap-3 mb-6', !isBot && 'flex-row-reverse')}>
      {/* Avatar */}
      <div
        className={cn(
          'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
          isBot
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          'flex-1 max-w-[85%]',
          !isBot && 'flex flex-col items-end'
        )}
      >
        {/* Message Text */}
        <Card
          className={cn(
            'mb-2',
            isBot
              ? 'bg-muted/30 border-border/50'
              : 'bg-primary text-primary-foreground border-primary py-2'
          )}
        >
          <CardContent className="px-3">
            <p className="text-sm leading-relaxed">{message.content}</p>
            {message.metadata && (
              <div className="space-y-2 mt-2 pt-2 border-t border-border/20">
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Showing {message.metadata.count} results
                  </span>
                  {message.metadata.filters && (
                    <div className="flex gap-1 ml-2">
                      {message.metadata.filters.map((filter, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="text-xs"
                        >
                          {filter}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                {/* Conversation Analysis */}
                {message.metadata.conversationAnalysis && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-muted-foreground">
                      {(
                        message.metadata.conversationAnalysis.confidence * 100
                      ).toFixed(0)}
                      % confidence
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Search Results Grid */}
        {message.searchResults && message.searchResults.length > 0 && (
          <div className="w-full space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {message.searchResults.map((place) => (
                <ChatPlaceCard
                  key={place.id}
                  place={place}
                  onHover={onPlaceHover}
                  isSelected={hoveredPlaceId === place.id}
                  onClick={() => onPlaceSelect(place.id)}
                />
              ))}
            </div>

            {/* Load More Button */}
            {message.metadata?.hasMore && (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleLoadMore(message.id)}
                  className="text-xs"
                >
                  <MoreHorizontal className="w-3 h-3 mr-1" />
                  Show more results
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Timestamp */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1 text-xs text-muted-foreground',
            !isBot && 'justify-end'
          )}
        >
          <Clock className="w-3 h-3" />
          <span>{formatTimestamp(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
