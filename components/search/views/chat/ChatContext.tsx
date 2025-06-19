'use client';

/**
 * Chat Context with Groq Conversation Flow Integration
 *
 * Features:
 * - Groq-powered conversation analysis and follow-up detection
 * - Persistent chat sessions (localStorage + sessionStorage)
 * - Real-time search integration with refined queries
 * - Location-aware search capabilities
 * - Clarification handling for ambiguous queries
 */

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  ReactNode,
} from 'react';
import { PlaceResultsSummary } from '@/types/place';
import { mockChatMessages, ChatMessage } from '../../mock-data';
// Remove direct import - we'll use API route instead
// import { processConversationSearch } from '@/lib/services/groq-conversation-integration';

interface ChatContextType {
  // Chat state
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  showFilters: boolean;
  isRecording: boolean;
  isListening: boolean;
  sessionId: string;
  userLocation?: { lat: number; lng: number };

  // Actions
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;
  setUserLocation: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number } | undefined>
  >;

  // Methods
  handleSendMessage: () => Promise<void>;
  handleVoiceRecording: () => void;
  handleLoadMore: (messageId: string) => Promise<void>;
  clearMessages: () => void;
  scrollToBottom: () => void;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  places: PlaceResultsSummary[];
  initialQuery?: string;
}

export function ChatProvider({
  children,
  places,
  initialQuery,
}: ChatProviderProps) {
  const [sessionId] = useState(() => {
    // Use sessionStorage to persist across page refreshes but clear when browser closes
    if (typeof window !== 'undefined') {
      let id = sessionStorage.getItem('chat_session_id');
      if (!id) {
        id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem('chat_session_id', id);
      }
      return id;
    }
    return `session_${Date.now()}`;
  });

  // Helper function to deserialize messages from localStorage
  const deserializeMessages = (messagesJson: string): ChatMessage[] => {
    try {
      const parsed = JSON.parse(messagesJson);
      return parsed.map((message: any) => ({
        ...message,
        timestamp: new Date(message.timestamp), // Convert string back to Date
      }));
    } catch (error) {
      console.error('Error deserializing messages:', error);
      return [];
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Load messages from localStorage on mount
    if (typeof window !== 'undefined') {
      const savedMessages = localStorage.getItem(`chat_messages_${sessionId}`);
      if (savedMessages) {
        // If we have an initialQuery that's different from the last processed query,
        // start fresh instead of loading old messages
        if (initialQuery) {
          const lastProcessedQuery = sessionStorage.getItem(
            `chat_initial_query_${sessionId}`
          );
          if (lastProcessedQuery && lastProcessedQuery !== initialQuery) {
            // Clear old data and start fresh
            localStorage.removeItem(`chat_messages_${sessionId}`);
            sessionStorage.removeItem(`chat_initial_query_${sessionId}`);
            return [];
          }
        }
        return deserializeMessages(savedMessages);
      }
    }
    return [];
  });
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [userLocation, setUserLocation] = useState<
    { lat: number; lng: number } | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get user location if available
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      navigator.geolocation &&
      !userLocation
    ) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log('Location access denied or unavailable:', error);
        },
        { timeout: 10000 }
      );
    }
  }, [userLocation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Persist messages to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && messages.length > 0) {
      localStorage.setItem(
        `chat_messages_${sessionId}`,
        JSON.stringify(messages)
      );
    }
  }, [messages, sessionId]);

  // Handle initial query using sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionKey = `chat_initial_query_${sessionId}`;

    // Check if we have an initial query to process
    // Only process if we have an initial query, no messages, and it hasn't been processed yet
    if (initialQuery && messages.length === 0) {
      const alreadyProcessed = sessionStorage.getItem(sessionKey);

      // Check if this exact query was already processed OR if messages were just cleared
      if (!alreadyProcessed || alreadyProcessed !== initialQuery) {
        // Additional check: don't process if localStorage was just cleared (indicating user cleared chat)
        const wasJustCleared = sessionStorage.getItem(
          `chat_cleared_${sessionId}`
        );
        if (wasJustCleared) {
          // Remove the cleared flag and don't process initial query
          sessionStorage.removeItem(`chat_cleared_${sessionId}`);
          return;
        }

        // Mark as processing to prevent duplicates
        sessionStorage.setItem(sessionKey, initialQuery);

        const processInitialQuery = async () => {
          const userMessage: ChatMessage = {
            id: Date.now().toString(),
            type: 'user',
            content: initialQuery,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, userMessage]);
          setIsTyping(true);

          try {
            // Step 1: Process with Groq conversation flow
            const conversationResponse = await fetch(
              '/api/conversation-flow/groq',
              {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: initialQuery, sessionId }),
              }
            );

            if (!conversationResponse.ok) {
              throw new Error('Failed to process conversation');
            }

            const conversationData = await conversationResponse.json();
            if (!conversationData.success) {
              throw new Error(
                conversationData.error || 'Conversation processing failed'
              );
            }

            const conversationResult = conversationData.data;

            console.log('conversationResult', conversationResult);

            // Step 2: Create assistant message
            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              content: conversationResult.user_response,
              timestamp: new Date(),
            };

            setMessages((prev) => [...prev, assistantMessage]);

            // Step 3: If clarification needed, stop here
            if (conversationResult.needs_clarification) {
              setIsTyping(false);
              return;
            }

            // Step 4: Perform search
            const searchResponse = await fetch('/api/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: conversationResult.server_query,
                userLocation,
                useInitialQuery: true,
              }),
            });

            if (searchResponse.ok) {
              const searchData = await searchResponse.json();

              if (searchData.success && searchData.data.places.length > 0) {
                const searchResultsMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  type: 'bot',
                  content: `Found ${searchData.data.places.length} places for "${conversationResult.server_query}"`,
                  timestamp: new Date(),
                  searchResults: searchData.data.places.slice(0, 6),
                  metadata: {
                    count: Math.min(6, searchData.data.places.length),
                    executionTime: 750,
                    searchQuery: conversationResult.server_query,
                    filters: ['relevant', 'ai-refined'],
                    hasMore: searchData.data.places.length > 6,
                    allResults: searchData.data.places, // Store all results for client-side pagination
                    conversationAnalysis: {
                      is_followup: conversationResult.is_followup,
                      followup_type: conversationResult.followup_type,
                      confidence: conversationResult.confidence,
                    },
                  },
                };
                setMessages((prev) => [...prev, searchResultsMessage]);
              } else {
                const noResultsMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  type: 'bot',
                  content: `I couldn't find any places matching "${conversationResult.server_query}". Try being more specific or asking for a different type of place.`,
                  timestamp: new Date(),
                };
                setMessages((prev) => [...prev, noResultsMessage]);
              }
            }
          } catch (error) {
            console.error('Error in conversation flow:', error);
            const errorMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              content:
                "I'm having trouble processing your request right now. Please try again.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          } finally {
            setIsTyping(false);
          }
        };

        processInitialQuery();
      }
    }
  }, [initialQuery, messages.length, sessionId, userLocation]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    const currentInput = inputValue;
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // Step 1: Process with Groq conversation flow only (no OpenAI parsing)
      const conversationResponse = await fetch('/api/conversation-flow/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentInput,
          sessionId,
        }),
      });

      if (!conversationResponse.ok) {
        throw new Error('Failed to process conversation');
      }

      const conversationData = await conversationResponse.json();

      if (!conversationData.success) {
        throw new Error(
          conversationData.error || 'Conversation processing failed'
        );
      }

      const conversationResult = conversationData.data;

      console.log('conversationResult', conversationResult);

      // Step 2: Create assistant message with Groq response
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: conversationResult.user_response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Step 3: If clarification is needed, don't search
      if (conversationResult.needs_clarification) {
        setIsTyping(false);
        return;
      }

      // Step 4: Perform search with refined query (let /api/search handle OpenAI parsing)
      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: conversationResult.server_query,
          userLocation,
          useInitialQuery: true,
        }),
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();

        if (searchData.success && searchData.data.places.length > 0) {
          // Step 5: Create search results message
          const searchResultsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: `Found ${searchData.data.places.length} places for "${conversationResult.server_query}"`,
            timestamp: new Date(),
            searchResults: searchData.data.places.slice(0, 6),
            metadata: {
              count: Math.min(6, searchData.data.places.length),
              executionTime: 750, // Approximate
              searchQuery: conversationResult.server_query,
              filters: ['relevant', 'ai-refined'],
              hasMore: searchData.data.places.length > 6,
              allResults: searchData.data.places, // Store all results for client-side pagination
              conversationAnalysis: {
                is_followup: conversationResult.is_followup,
                followup_type: conversationResult.followup_type,
                confidence: conversationResult.confidence,
              },
            },
          };

          setMessages((prev) => [...prev, searchResultsMessage]);
        } else {
          // No results found
          const noResultsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: `I couldn't find any places matching "${conversationResult.server_query}". Try being more specific or asking for a different type of place.`,
            timestamp: new Date(),
          };

          setMessages((prev) => [...prev, noResultsMessage]);
        }
      }
    } catch (error) {
      console.error('Error in conversation flow:', error);

      // Fallback error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content:
          "I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsListening(false);
      // Here you would stop the actual recording and process the audio
      // For now, we'll just simulate adding text
      setTimeout(() => {
        setInputValue('Find me luxury hotels in Accra');
      }, 500);
    } else {
      // Start recording
      setIsRecording(true);
      setIsListening(true);
      // Here you would start the actual audio recording
    }
  };

  const handleLoadMore = async (messageId: string) => {
    const message = messages.find((msg) => msg.id === messageId);
    if (!message || !message.searchResults || !message.metadata?.hasMore) {
      return;
    }

    const allResults = message.metadata.allResults;
    if (!allResults) {
      console.error('No cached results found for load more');
      return;
    }

    const currentCount = message.searchResults.length;
    const nextBatch = allResults.slice(currentCount, currentCount + 6); // Load 6 more

    if (nextBatch.length > 0) {
      // Update the message with more results from cache
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id === messageId && msg.searchResults) {
            const newResults = [...msg.searchResults, ...nextBatch];
            return {
              ...msg,
              searchResults: newResults,
              metadata: msg.metadata
                ? {
                    ...msg.metadata,
                    count: newResults.length,
                    hasMore: newResults.length < allResults.length, // Check if more results available
                  }
                : undefined,
            };
          }
          return msg;
        })
      );
    }
  };

  const clearMessages = () => {
    setMessages([]);
    // Clear from localStorage and sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(`chat_messages_${sessionId}`);
      sessionStorage.removeItem(`chat_initial_query_${sessionId}`);
      // Set a flag to prevent initial query from running after clear
      sessionStorage.setItem(`chat_cleared_${sessionId}`, 'true');
    }
  };

  const value = {
    // State
    messages,
    inputValue,
    isTyping,
    showFilters,
    isRecording,
    isListening,
    sessionId,
    userLocation,

    // Setters
    setMessages,
    setInputValue,
    setIsTyping,
    setShowFilters,
    setIsRecording,
    setIsListening,
    setUserLocation,

    // Methods
    handleSendMessage,
    handleVoiceRecording,
    handleLoadMore,
    clearMessages,
    scrollToBottom,

    // Refs
    messagesEndRef,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
