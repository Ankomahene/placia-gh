'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Mic, Send, Bot, Loader2 } from 'lucide-react';
import { PlaceResults } from '@/types/place';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { SpeechListeningPopup } from '@/components/speech-listening-popup';
import { SafeImage } from '@/components/ui/safe-image';
import {
  PlaceSummaryResponse,
  PlaceQAResponse,
} from '@/lib/services/groq-place-summary';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  keyPoints?: string[];
  suggestedQuestions?: string[];
}

interface PlaceSummaryDrawerProps {
  place: PlaceResults;
  isOpen: boolean;
  onClose: () => void;
}

export function PlaceSummaryDrawer({
  place,
  isOpen,
  onClose,
}: PlaceSummaryDrawerProps) {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Speech recognition setup
  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.5,
    silenceTimeout: 3000,
  });

  // Initialize with summary when opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      fetchSummary();
    }
  }, [isOpen]);

  const fetchSummary = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/places/${place.id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, place }),
      });

      if (!response.ok) throw new Error('Failed to fetch summary');

      const data: PlaceSummaryResponse = await response.json();
      setMessages([
        {
          role: 'assistant',
          content: data.summary,
          keyPoints: data.key_points,
          suggestedQuestions: data.suggested_questions,
        },
      ]);
    } catch (error) {
      console.error('Error fetching summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendQuestion = async (question: string) => {
    if (!question.trim()) return;

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: question }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/places/${place.id}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, question, place }),
      });

      if (!response.ok) throw new Error('Failed to send question');

      const data: PlaceQAResponse = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer,
          suggestedQuestions: data.suggested_followups,
        },
      ]);
    } catch (error) {
      console.error('Error sending question:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Voice input handlers
  const handleVoiceStart = () => {
    speechRecognition.startListening();
  };

  const handleVoiceStop = () => {
    if (speechRecognition.transcript) {
      setInputValue(speechRecognition.transcript);
      sendQuestion(speechRecognition.transcript);
    }
    speechRecognition.stopListening();
  };

  const handleVoiceCancel = () => {
    speechRecognition.stopListening();
    speechRecognition.resetTranscript();
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-[90%] md:max-w-[800px] p-0"
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center gap-4">
              <div className="relative h-16 w-16 rounded-lg overflow-hidden flex-shrink-0">
                <SafeImage
                  src={place.main_image || place.gallery?.[0] || ''}
                  alt={place.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1">
                <SheetTitle className="text-xl mb-1">{place.name}</SheetTitle>
                <p className="text-sm text-muted-foreground">
                  {place.tagline || place.category?.name}
                </p>
              </div>
              <Bot className="h-5 w-5 text-muted-foreground" />
            </div>
          </SheetHeader>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col ${
                  message.role === 'assistant' ? 'items-start' : 'items-end'
                } w-full`}
              >
                {/* Message Content */}
                <div
                  className={`rounded-lg px-6 py-4 ${
                    message.role === 'assistant'
                      ? 'bg-muted w-full'
                      : 'bg-primary text-primary-foreground max-w-[80%]'
                  }`}
                >
                  <p className="text-base leading-relaxed">{message.content}</p>
                </div>

                {/* Key Points (for assistant's summary) */}
                {message.keyPoints && (
                  <div className="mt-6 space-y-3 w-full bg-muted/50 rounded-lg p-6">
                    <h4 className="font-medium text-base">Key Points:</h4>
                    <ul className="list-disc space-y-2 pl-4">
                      {message.keyPoints.map((point, i) => (
                        <li
                          key={i}
                          className="text-sm text-muted-foreground leading-relaxed"
                        >
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Suggested Questions */}
                {message.suggestedQuestions && (
                  <div className="mt-6 space-y-3 w-full">
                    <h4 className="font-medium text-base">
                      You might want to ask:
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {message.suggestedQuestions.map((question, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="default"
                          onClick={() => sendQuestion(question)}
                          className="text-sm h-auto py-2"
                        >
                          {question}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} /> {/* Scroll anchor */}
            {isLoading && (
              <div className="flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendQuestion(inputValue);
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask a question about this place..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleVoiceStart}
                className={speechRecognition.isListening ? 'text-red-500' : ''}
              >
                <Mic className="h-4 w-4" />
              </Button>
              <Button type="submit" size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>

        {/* Speech Recognition Popup */}
        <SpeechListeningPopup
          speechRecognition={speechRecognition}
          onStopAndSearch={handleVoiceStop}
          onCancel={handleVoiceCancel}
          description="Ask your question about this place. I'll automatically process after 3 seconds of silence."
        />
      </SheetContent>
    </Sheet>
  );
}
