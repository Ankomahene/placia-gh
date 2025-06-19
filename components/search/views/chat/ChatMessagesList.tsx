'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, Bot } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { useChatContext } from './ChatContext';

interface ChatMessagesListProps {
  hoveredPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
}

export function ChatMessagesList({
  hoveredPlaceId,
  onPlaceHover,
  onPlaceSelect,
}: ChatMessagesListProps) {
  const { messages, isTyping, setInputValue, messagesEndRef } =
    useChatContext();

  if (messages.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h3 className="font-semibold mb-2">Start a conversation</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Ask me about places in Ghana. I can help you find hotels, restaurants,
          attractions, and more!
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          {[
            'Best hotels in Accra',
            'Restaurants near me',
            '24 hour pharmacies in Accra',
            'Find me something nearby',
            'Show me places',
          ].map((suggestion) => (
            <Button
              key={suggestion}
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setInputValue(suggestion)}
            >
              {suggestion}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      {messages.map((message) => (
        <ChatMessage
          key={message.id}
          message={message}
          hoveredPlaceId={hoveredPlaceId}
          onPlaceHover={onPlaceHover}
          onPlaceSelect={onPlaceSelect}
        />
      ))}

      {/* Typing indicator */}
      {isTyping && (
        <div className="flex gap-3 mb-6">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <Card className="bg-muted/30 border-border/50">
            <CardContent className="p-3">
              <div className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  AI is searching...
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  );
}
