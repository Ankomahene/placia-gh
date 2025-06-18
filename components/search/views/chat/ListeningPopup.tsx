'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';
import { useChatContext } from './ChatContext';

export function ListeningPopup() {
  const { isListening, handleVoiceRecording } = useChatContext();

  if (!isListening) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50">
      <div className="max-w-6xl mx-auto flex flex-col items-center">
        <div className="flex items-center gap-4 mb-3">
          <div className="relative">
            <div className="w-12 h-12 rounded-full bg-red-500 flex items-center justify-center">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75"></div>
          </div>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  animationDelay: `${i * 100}ms`,
                  height: `${[8, 16, 24, 16, 8][i]}px`,
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-sm font-medium mb-1">Listening...</p>
        <p className="text-xs text-muted-foreground mb-3">
          Speak clearly about the places you&apos;re looking for
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleVoiceRecording}
          className="text-xs"
        >
          Stop Recording
        </Button>
      </div>
    </div>
  );
}
