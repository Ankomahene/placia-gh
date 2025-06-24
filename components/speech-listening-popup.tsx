'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Mic } from 'lucide-react';

interface SpeechRecognitionState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;
}

interface SpeechListeningPopupProps {
  speechRecognition: SpeechRecognitionState;
  onStopAndSearch: () => void;
  onCancel: () => void;
  className?: string;
  description?: string;
}

export function SpeechListeningPopup({
  speechRecognition,
  onStopAndSearch,
  onCancel,
  className = '',
  description = 'Speak your search query clearly. I\'ll automatically search after 3 seconds of silence, or click "Stop & Search" to search immediately.',
}: SpeechListeningPopupProps) {
  if (!speechRecognition.isListening) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50 ${className}`}
    >
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

        {speechRecognition.error ? (
          <>
            <p className="text-sm font-medium mb-1 text-red-600">Error</p>
            <p className="text-xs text-red-500 mb-3 text-center max-w-md">
              {speechRecognition.error}
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium mb-1">Listening...</p>
            <p className="text-xs text-muted-foreground mb-3 text-center max-w-md">
              {description}
            </p>
          </>
        )}

        {/* Live transcript display */}
        {(speechRecognition.transcript ||
          speechRecognition.interimTranscript) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-3 text-center max-w-md">
            <p className="text-sm">
              <span className="font-medium text-foreground">
                {speechRecognition.transcript}
              </span>
              <span className="text-muted-foreground italic">
                {speechRecognition.interimTranscript}
              </span>
            </p>
            {speechRecognition.confidence > 0 && (
              <div className="mt-2 flex items-center gap-2 justify-center">
                <span className="text-xs text-muted-foreground">
                  Confidence:
                </span>
                <div className="w-20 bg-muted rounded-full h-1">
                  <div
                    className="bg-green-500 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${speechRecognition.confidence * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {Math.round(speechRecognition.confidence * 100)}%
                </span>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onStopAndSearch}
            className="text-xs"
          >
            Stop & Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
