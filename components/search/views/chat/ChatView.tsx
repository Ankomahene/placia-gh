'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Bot,
  User,
  Clock,
  Filter,
  SlidersHorizontal,
  Sparkles,
  Loader2,
  MoreHorizontal,
  RefreshCw,
} from 'lucide-react';
import { PlaceResultsSummary } from '@/types/place';
import { mockChatMessages, ChatMessage } from '../../mock-data';
import { ChatPlaceCard } from './ChatPlaceCard';
import { cn } from '@/lib/utils';

interface ChatViewProps {
  places: PlaceResultsSummary[];
  hoveredPlaceId: string | null;
  selectedPlaceId: string | null;
  onPlaceHover: (placeId: string | null) => void;
  onPlaceSelect: (placeId: string) => void;
  isLoading: boolean;
}

export function ChatView({
  places,
  hoveredPlaceId,
  selectedPlaceId,
  onPlaceHover,
  onPlaceSelect,
  isLoading,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTimestamp = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI processing delay
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: `I'm searching for "${inputValue}" and will show you the best results shortly...`,
        timestamp: new Date(),
        searchResults: places.slice(0, 6), // Limit to 6 results for chat
        metadata: {
          count: Math.min(6, places.length),
          executionTime: Math.floor(Math.random() * 500) + 100,
          searchQuery: inputValue,
          filters: ['relevant', 'nearby'],
          hasMore: places.length > 6,
        },
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleLoadMore = (messageId: string) => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId && msg.searchResults) {
          const currentCount = msg.searchResults.length;
          const nextResults = places.slice(currentCount, currentCount + 4);
          return {
            ...msg,
            searchResults: [...msg.searchResults, ...nextResults],
            metadata: msg.metadata
              ? {
                  ...msg.metadata,
                  count: currentCount + nextResults.length,
                  hasMore: currentCount + nextResults.length < places.length,
                }
              : undefined,
          };
        }
        return msg;
      })
    );
  };

  const renderMessage = (message: ChatMessage) => {
    const isBot = message.type === 'bot';

    return (
      <div
        key={message.id}
        className={cn('flex gap-3 mb-6', !isBot && 'flex-row-reverse')}
      >
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
                : 'bg-primary text-primary-foreground border-primary'
            )}
          >
            <CardContent className="p-3">
              <p className="text-sm leading-relaxed">{message.content}</p>
              {message.metadata && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/20">
                  <Clock className="w-3 h-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    Found {message.metadata.count} results in{' '}
                    {message.metadata.executionTime}ms
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
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">AI Places Assistant</h3>
              <p className="text-xs text-muted-foreground">
                Ask me about places in Ghana
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="text-xs"
            >
              <SlidersHorizontal className="w-3 h-3 mr-1" />
              Filters
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Filter Pills */}
        {showFilters && (
          <div className="mt-3 pt-3 border-t">
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
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 px-4">
        <div className="py-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Start a conversation</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Ask me about places in Ghana. I can help you find hotels,
                restaurants, attractions, and more!
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  'Best hotels in Accra',
                  'Restaurants near me',
                  'Things to do in Kumasi',
                  'Budget-friendly places',
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
          ) : (
            messages.map(renderMessage)
          )}

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
                      AI is thinking...
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t bg-background/95 backdrop-blur-sm p-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about places in Ghana..."
              className="pr-12"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
            <Button
              size="icon"
              variant="ghost"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2 text-center">
          Ask natural questions like &quot;Show me luxury hotels near the
          beach&quot; or &quot;Best restaurants in Kumasi&quot;
        </p>
      </div>
    </div>
  );
}
