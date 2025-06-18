'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Send, Mic, MicOff, SlidersHorizontal } from 'lucide-react';
import { useChatContext } from './ChatContext';
import { cn } from '@/lib/utils';

export function ChatInput() {
  const {
    inputValue,
    setInputValue,
    isTyping,
    showFilters,
    setShowFilters,
    isRecording,
    handleSendMessage,
    handleVoiceRecording,
  } = useChatContext();

  return (
    <div className="flex-shrink-0 border-t bg-background/95 backdrop-blur-sm p-4">
      {/* Quick Filter Pills */}
      {showFilters && (
        <div className="mb-4 pb-2">
          <div className="flex flex-wrap gap-2">
            {[
              'Hotels',
              'Restaurants',
              'Attractions',
              'Shopping',
              'Budget-friendly',
              'Highly rated',
            ].map((filter) => (
              <Badge
                key={filter}
                variant="secondary"
                className="cursor-pointer text-xs hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {filter}
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-1 items-center">
        <div className="flex-1 relative">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about places in Ghana..."
            className="pr-20 h-12 text-base"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
          />
          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-10 w-10 transition-colors',
                isRecording
                  ? 'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                  : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
              )}
              onClick={handleVoiceRecording}
              disabled={isTyping}
            >
              {isRecording ? (
                <MicOff className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-10 w-10 text-muted-foreground hover:text-primary hover:bg-primary/10"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="text-xs p-0 h-12"
          title="Filters"
        >
          <SlidersHorizontal className="w-3 h-3 mr-1" />
          <span className="hidden md:block">Filters</span>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 text-center">
        Ask natural questions like &quot;Show me luxury hotels near the
        beach&quot; or &quot;Best restaurants in Kumasi&quot;
      </p>
    </div>
  );
}
