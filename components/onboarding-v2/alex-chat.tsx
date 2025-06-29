'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useConversation } from '@elevenlabs/react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AlexChatProps {
  onClose: () => void;
}

export function AlexChat({ onClose }: AlexChatProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // ElevenLabs conversation hook - following the tour-agent.tsx pattern
  const conversation = useConversation({
    onConnect: () => {
      setIsConnected(true);
      setConnectionError(null);
    },
    onDisconnect: () => {
      setIsConnected(false);
      setIsSpeaking(false);
      setIsListening(false);
    },
    onMessage: (message) => {
      // Handle different message types
      if (message.source === 'ai' && message.message) {
        // AI is speaking
        setIsSpeaking(true);
      } else if (message.source === 'user' && message.message) {
        // User spoke
        setIsListening(false);
      }
    },
    onError: (error) => {
      console.error('🚨 Alex ElevenLabs Error:', error);
      setConnectionError('Connection error: ' + (error || 'Unknown error'));
      setIsConnected(false);
      setIsSpeaking(false);
      setIsListening(false);
    },
  });

  // Initialize Alex agent on mount
  useEffect(() => {
    initializeAlex();

    return () => {
      cleanup();
    };
  }, []);

  const initializeAlex = useCallback(async () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;

    if (!agentId) {
      setConnectionError(
        'ElevenLabs Agent ID not configured. Please set NEXT_PUBLIC_ELEVENLABS_AGENT_ID in your environment variables.'
      );
      return;
    }

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start the conversation session
      const id = await conversation.startSession({
        agentId: agentId,
      });

      setConversationId(id);
    } catch (error) {
      console.error('❌ Failed to initialize Alex:', error);
      setConnectionError(
        error instanceof Error
          ? error.message
          : 'Failed to initialize Alex. Please check your microphone permissions and try again.'
      );
    }
  }, [conversation]);

  const cleanup = useCallback(async () => {
    try {
      if (isConnected) {
        await conversation.endSession();
      }
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }, [conversation, isConnected]);

  const handleRetry = useCallback(() => {
    setConnectionError(null);
    setIsConnected(false);
    initializeAlex();
  }, [initializeAlex]);

  const toggleMute = useCallback(async () => {
    try {
      if (conversation.setVolume) {
        await conversation.setVolume({ volume: isSpeaking ? 0 : 1 });
      }
    } catch (error) {
      console.error('Error toggling volume:', error);
    }
  }, [conversation, isSpeaking]);

  return (
    <div className="h-full flex flex-col">
      {/* Status Bar */}
      <div className="bg-gray-50 dark:bg-gray-800 p-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full ${
                isConnected
                  ? 'bg-green-500'
                  : connectionError
                    ? 'bg-red-500'
                    : 'bg-yellow-500'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isConnected
                ? 'Connected to Alex'
                : connectionError
                  ? 'Connection Error'
                  : 'Connecting...'}
            </span>
            {isSpeaking && (
              <Badge variant="secondary" className="text-xs animate-pulse">
                Alex is speaking
              </Badge>
            )}
            {isListening && (
              <Badge variant="default" className="text-xs animate-pulse">
                Listening...
              </Badge>
            )}
            {conversationId && (
              <Badge variant="outline" className="text-xs">
                ID: {conversationId.slice(-6)}
              </Badge>
            )}
          </div>

          {connectionError && (
            <Button
              onClick={handleRetry}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Retry
            </Button>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 p-4 overflow-y-auto">
        {connectionError ? (
          <Card className="p-4 bg-red-50 border-red-200 text-red-700">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium">Connection Error</p>
                <p className="text-xs mt-1">{connectionError}</p>
              </div>
            </div>
          </Card>
        ) : !isConnected ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
              <p className="text-sm text-muted-foreground">
                Connecting to Alex...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Please allow microphone access when prompted
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                🎤 <strong>Voice Chat Active:</strong> Alex is ready to help!
                Just start speaking naturally to ask questions about Placia.
              </p>
            </div>

            <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-green-700 dark:text-green-300 text-sm">
                ✨ <strong>Ask Alex about:</strong>
              </p>
              <ul className="text-green-700 dark:text-green-300 text-xs mt-2 ml-4 space-y-1">
                <li>• How to search for places</li>
                <li>• Different viewing modes (Map, List, Chat)</li>
                <li>• AI features and smart search</li>
                <li>• Finding specific types of places in Ghana</li>
                <li>• User dashboard and account features</li>
                <li>• Any other platform questions</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      {isConnected && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 border-t">
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={toggleMute}
              variant="outline"
              size="lg"
              className="rounded-full"
            >
              {isSpeaking ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-2">
            {isConnected
              ? 'Conversation active - speak naturally!'
              : 'Connecting...'}
          </p>
        </div>
      )}
    </div>
  );
}
