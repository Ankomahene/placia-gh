'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConversationFlowResponse {
  user_response: string;
  server_query: string;
  is_followup: boolean;
  followup_type:
    | 'refinement'
    | 'category_change'
    | 'new_search'
    | 'clarification_needed';
  confidence: number;
  needs_clarification: boolean;
  clarification_type?:
    | 'missing_place_type'
    | 'missing_location'
    | 'too_vague'
    | 'ambiguous_intent';
}

interface ChatMessage {
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: ConversationFlowResponse;
}

export default function GroqConversationTestPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => `session_${Date.now()}`);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: inputQuery,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/conversation-flow/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: inputQuery,
          sessionId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        const assistantMessage: ChatMessage = {
          type: 'assistant',
          content: result.data.user_response,
          timestamp: new Date(),
          metadata: result.data,
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        const errorMessage: ChatMessage = {
          type: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: ChatMessage = {
        type: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setInputQuery('');
    }
  };

  const clearConversation = async () => {
    try {
      await fetch('/api/conversation-flow/groq', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });
      setMessages([]);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Groq Conversation Flow Test
          </CardTitle>
          <p className="text-muted-foreground">
            Test the Groq-based conversation flow service that remembers context
            and determines follow-ups.
          </p>
          <div className="flex gap-2">
            <Badge variant="outline">Session ID: {sessionId}</Badge>
            <Button onClick={clearConversation} variant="outline" size="sm">
              Clear Conversation
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat Messages */}
          <div className="min-h-[400px] max-h-[600px] overflow-y-auto space-y-4 border rounded-lg p-4 bg-muted/20">
            {messages.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                Start a conversation by typing a search query below.
                <br />
                <span className="text-sm">
                  Example: &quot;Find me the best restaurants in Accra&quot;
                </span>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background border'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>

                  {message.metadata && (
                    <div className="mt-3 pt-3 border-t border-muted text-xs space-y-2">
                      <div className="font-semibold">Analysis:</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="font-medium">Follow-up:</span>{' '}
                          <Badge
                            variant={
                              message.metadata.is_followup
                                ? 'default'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {message.metadata.is_followup ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Type:</span>{' '}
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.followup_type}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium">Confidence:</span>{' '}
                          {(message.metadata.confidence * 100).toFixed(0)}%
                        </div>
                        <div>
                          <span className="font-medium">Clarification:</span>{' '}
                          <Badge
                            variant={
                              message.metadata.needs_clarification
                                ? 'destructive'
                                : 'default'
                            }
                            className="text-xs"
                          >
                            {message.metadata.needs_clarification
                              ? 'Needed'
                              : 'None'}
                          </Badge>
                        </div>
                      </div>
                      {message.metadata.clarification_type && (
                        <div>
                          <span className="font-medium">
                            Clarification Type:
                          </span>{' '}
                          <Badge variant="outline" className="text-xs">
                            {message.metadata.clarification_type}
                          </Badge>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Server Query:</span>
                        <div className="bg-muted p-2 rounded text-xs font-mono mt-1">
                          {message.metadata.server_query}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground mt-2">
                    {(message.timestamp instanceof Date
                      ? message.timestamp
                      : new Date(message.timestamp)
                    ).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[70%] rounded-lg p-3 bg-background border">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                    <span className="text-sm">Processing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Type your search query here..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading || !inputQuery.trim()}>
              Send
            </Button>
          </form>

          {/* Example Queries */}
          <div className="text-sm text-muted-foreground">
            <div className="font-medium mb-2">
              Try these example conversations:
            </div>
            <div className="space-y-1">
              <div className="font-medium text-green-700">Normal Searches:</div>
              <div>1. &quot;Find me the best restaurants in Accra&quot;</div>
              <div>2. &quot;show me ones with rooftop seating&quot;</div>
              <div>3. &quot;what about hotels instead&quot;</div>
              <div>4. &quot;Find budget friendly places near me&quot;</div>

              <div className="font-medium text-orange-700 mt-3">
                Clarification Needed:
              </div>
              <div>
                5. &quot;Find me something nearby&quot; (missing place type)
              </div>
              <div>6. &quot;Show me restaurants&quot; (missing location)</div>
              <div>7. &quot;Find me places&quot; (too vague)</div>
              <div>
                8. &quot;What do you recommend?&quot; (ambiguous intent)
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
