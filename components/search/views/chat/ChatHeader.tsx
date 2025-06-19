'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bot, RefreshCw, MapPin } from 'lucide-react';
import { useChatContext } from './ChatContext';

export function ChatHeader() {
  const { clearMessages, userLocation, sessionId } = useChatContext();

  return (
    <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur-sm px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center">
            <Bot className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">AI Places Assistant</h3>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground">
                Ask me about places in Ghana
              </p>
              {userLocation && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="w-3 h-3 mr-1" />
                  Location enabled
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
