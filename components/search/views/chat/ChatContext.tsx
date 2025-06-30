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

import { PlaceResultsSummary } from '@/types/place';
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useSearchContext } from '../../hooks/use-search-context';
import { useLocation } from '@/hooks/use-location';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { ChatMessage } from '../../mock-data';
import { findExactPregeneratedQuery } from '@/lib/pregenerated-queries';

interface ChatContextType {
  // Chat state
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  showFilters: boolean;
  sessionId: string;
  userLocation?: { lat: number; lng: number };

  // Speech recognition state
  speechRecognition: {
    isSupported: boolean;
    isListening: boolean;
    transcript: string;
    interimTranscript: string;
    confidence: number;
    error: string | null;
  };

  // Actions
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  setUserLocation: React.Dispatch<
    React.SetStateAction<{ lat: number; lng: number } | undefined>
  >;

  // Speech recognition actions
  startVoiceRecording: () => void;
  stopVoiceRecording: () => void;
  cancelVoiceRecording: () => void;
  resetVoiceTranscript: () => void;

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
  places?: PlaceResultsSummary[];
  initialQuery: string;
  shouldAutoRun: boolean;
}

export function ChatProvider({
  children,
  initialQuery,
  shouldAutoRun,
}: ChatProviderProps) {
  // Get chat search term from search context
  const {
    chatSearchTerm,
    selectedPregeneratedQuery,
    setSelectedPregeneratedQuery,
    setShouldAutoRunChat,
  } = useSearchContext();

  // Get user location using the custom hook
  const { latitude, longitude } = useLocation();

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
  const [userLocation, setUserLocation] = useState<
    { lat: number; lng: number } | undefined
  >();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Flag to track if recording was manually cancelled
  const wasCancelledRef = useRef(false);

  // Initialize speech recognition hook
  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.5,
    silenceTimeout: 3000,
  });

  // Update userLocation when coordinates are available from the hook
  useEffect(() => {
    if (latitude != null && longitude != null) {
      setUserLocation({ lat: latitude, lng: longitude });
    }
  }, [latitude, longitude]);

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

  // Speech recognition methods
  const startVoiceRecording = () => {
    wasCancelledRef.current = false; // Reset cancellation flag
    speechRecognition.resetTranscript();
    speechRecognition.startListening();
  };

  const stopVoiceRecording = () => {
    wasCancelledRef.current = false; // Not a cancellation, normal stop
    speechRecognition.stopListening();
    // Add the final transcript to input if available
    if (speechRecognition.transcript.trim()) {
      setInputValue(speechRecognition.transcript.trim());
    }
  };

  const cancelVoiceRecording = () => {
    wasCancelledRef.current = true; // Mark as cancelled
    speechRecognition.resetTranscript(); // Clear transcript first
    speechRecognition.stopListening(); // Then stop listening
    setInputValue(''); // Clear any existing input
  };

  const resetVoiceTranscript = () => {
    speechRecognition.resetTranscript();
  };

  const handleVoiceRecording = () => {
    if (speechRecognition.isListening) {
      stopVoiceRecording();
    } else {
      startVoiceRecording();
    }
  };

  // Auto-update input with speech recognition results
  useEffect(() => {
    if (
      speechRecognition.transcript &&
      !speechRecognition.isListening &&
      !wasCancelledRef.current
    ) {
      setInputValue(speechRecognition.transcript.trim());
    }
  }, [speechRecognition.transcript, speechRecognition.isListening]);

  // Auto-search when speech recognition stops with content (due to timeout)
  useEffect(() => {
    const transcript = speechRecognition.transcript.trim();

    // Only auto-search if:
    // 1. Not currently listening (stopped)
    // 2. Have transcript content
    // 3. Not currently typing/searching
    // 4. Input field matches the transcript (meaning it was just populated)
    // 5. Was NOT manually cancelled
    if (
      !speechRecognition.isListening &&
      transcript &&
      !isTyping &&
      inputValue.trim() === transcript &&
      !wasCancelledRef.current
    ) {
      // Small delay to ensure the UI has updated and user can see the transcript
      const timeoutId = setTimeout(() => {
        handleSendMessage();
      }, 800); // Slightly longer delay for better UX

      return () => clearTimeout(timeoutId);
    }
  }, [
    speechRecognition.isListening,
    speechRecognition.transcript,
    isTyping,
    inputValue,
  ]);

  // Define handleSendMessage function
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

    // Check if we have a pregenerated query from suggestions and clear it after use
    let defaultStructuredQuery = undefined;
    if (selectedPregeneratedQuery) {
      defaultStructuredQuery = selectedPregeneratedQuery.structuredQuery;
      setSelectedPregeneratedQuery(null); // Clear after use since chat mode handles its own processing
    }

    try {
      // Step 1: Process with Groq conversation flow
      const conversationResponse = await fetch('/api/conversation-flow/groq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: currentInput,
          sessionId,
          defaultStructuredQuery,
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

      // Step 2: Create assistant message
      const locationData =
        latitude != null && longitude != null
          ? {
              latitude: Number(latitude),
              longitude: Number(longitude),
              address: null,
            }
          : null;

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: conversationResult.user_response,
        timestamp: new Date(),
        metadata: conversationResult.requesting_location_permission
          ? undefined
          : conversationResult.show_user_location && locationData
            ? {
                show_user_location: true,
                userLocation: locationData,
              }
            : undefined,
      };

      // If we need to show location and have coordinates, try to get the address
      if (
        !conversationResult.requesting_location_permission &&
        conversationResult.show_user_location &&
        locationData &&
        assistantMessage.metadata?.userLocation
      ) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=16&addressdetails=1`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (response.ok) {
            const data = await response.json();
            const address =
              data.display_name?.split(',').slice(0, 3).join(',') || null;
            assistantMessage.metadata.userLocation.address = address;
          }
        } catch (error) {
          console.error('Failed to get address:', error);
        }
      }

      setMessages((prev) => [...prev, assistantMessage]);

      // Step 3: If clarification needed, stop here
      if (conversationResult.needs_clarification) {
        setIsTyping(false);
        return;
      }

      // Step 4: Perform search
      // If we don't already have a structured query from suggestions, try to find one from the server query
      if (!defaultStructuredQuery) {
        const pregeneratedQuery = findExactPregeneratedQuery(
          conversationResult.server_query
        );
        defaultStructuredQuery = pregeneratedQuery?.structuredQuery;
      }

      const searchResponse = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: conversationResult.server_query,
          userLocation: locationData
            ? {
                lat: locationData.latitude,
                lng: locationData.longitude,
              }
            : undefined,
          sessionId,
          useInitialQuery: true,
          defaultStructuredQuery,
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
              allResults: searchData.data.places,
              conversationAnalysis: {
                is_followup: conversationResult.is_followup,
                followup_type: conversationResult.followup_type,
                confidence: conversationResult.confidence,
              },
              ...(assistantMessage.metadata?.userLocation && {
                show_user_location: true,
                userLocation: assistantMessage.metadata.userLocation,
              }),
            },
          };
          setMessages((prev) => [...prev, searchResultsMessage]);
        } else {
          const noResultsMessage: ChatMessage = {
            id: (Date.now() + 2).toString(),
            type: 'bot',
            content: `I couldn't find any places matching "${conversationResult.server_query}". Try being more specific or asking for a different type of place.`,
            timestamp: new Date(),
            metadata: assistantMessage.metadata?.userLocation
              ? {
                  show_user_location: true,
                  userLocation: assistantMessage.metadata.userLocation,
                }
              : undefined,
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

  // Handle initial query using sessionStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const sessionKey = `chat_initial_query_${sessionId}`;

    // Process if we have shouldAutoRun flag and an initial query
    if (shouldAutoRun && initialQuery) {
      const alreadyProcessed = sessionStorage.getItem(sessionKey);

      // Check if this exact query was already processed
      if (!alreadyProcessed || alreadyProcessed !== initialQuery) {
        // If this is a new query different from what's cached, clear old messages first
        if (alreadyProcessed && alreadyProcessed !== initialQuery) {
          setMessages([]);
          localStorage.removeItem(`chat_messages_${sessionId}`);
        }

        // Additional check: don't process if localStorage was just cleared (indicating user cleared chat)
        const wasJustCleared = sessionStorage.getItem(
          `chat_cleared_${sessionId}`
        );
        if (wasJustCleared) {
          // Remove the cleared flag and don't process initial query
          sessionStorage.removeItem(`chat_cleared_${sessionId}`);
          setShouldAutoRunChat(false);
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

            // Step 2: Create assistant message
            const locationData =
              latitude != null && longitude != null
                ? {
                    latitude: Number(latitude),
                    longitude: Number(longitude),
                    address: null,
                  }
                : null;

            const assistantMessage: ChatMessage = {
              id: (Date.now() + 1).toString(),
              type: 'bot',
              content: conversationResult.user_response,
              timestamp: new Date(),
              metadata: conversationResult.requesting_location_permission
                ? undefined
                : conversationResult.show_user_location && locationData
                  ? {
                      show_user_location: true,
                      userLocation: locationData,
                    }
                  : undefined,
            };

            // If we need to show location and have coordinates, try to get the address
            if (
              !conversationResult.requesting_location_permission &&
              conversationResult.show_user_location &&
              locationData &&
              assistantMessage.metadata?.userLocation
            ) {
              try {
                const response = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${locationData.latitude}&lon=${locationData.longitude}&zoom=16&addressdetails=1`,
                  { signal: AbortSignal.timeout(5000) }
                );

                if (response.ok) {
                  const data = await response.json();
                  const address =
                    data.display_name?.split(',').slice(0, 3).join(',') || null;
                  assistantMessage.metadata.userLocation.address = address;
                }
              } catch (error) {
                console.error('Failed to get address:', error);
              }
            }

            setMessages((prev) => [...prev, assistantMessage]);

            // Step 3: If clarification needed, stop here
            if (conversationResult.needs_clarification) {
              setIsTyping(false);
              return;
            }

            // Step 4: Perform search
            // Check for pregenerated query match
            const pregeneratedQuery = findExactPregeneratedQuery(
              conversationResult.server_query
            );
            const defaultStructuredQuery = pregeneratedQuery?.structuredQuery;

            const searchResponse = await fetch('/api/search', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                query: conversationResult.server_query,
                userLocation: locationData
                  ? {
                      lat: locationData.latitude,
                      lng: locationData.longitude,
                    }
                  : undefined,
                sessionId,
                useInitialQuery: true,
                defaultStructuredQuery,
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
                    allResults: searchData.data.places,
                    conversationAnalysis: {
                      is_followup: conversationResult.is_followup,
                      followup_type: conversationResult.followup_type,
                      confidence: conversationResult.confidence,
                    },
                    ...(assistantMessage.metadata?.userLocation && {
                      show_user_location: true,
                      userLocation: assistantMessage.metadata.userLocation,
                    }),
                  },
                };
                setMessages((prev) => [...prev, searchResultsMessage]);
              } else {
                const noResultsMessage: ChatMessage = {
                  id: (Date.now() + 2).toString(),
                  type: 'bot',
                  content: `I couldn't find any places matching "${conversationResult.server_query}". Try being more specific or asking for a different type of place.`,
                  timestamp: new Date(),
                  metadata: assistantMessage.metadata?.userLocation
                    ? {
                        show_user_location: true,
                        userLocation: assistantMessage.metadata.userLocation,
                      }
                    : undefined,
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
            // Reset the shouldAutoRunChat flag after processing is complete
            setShouldAutoRunChat(false);
          }
        };

        processInitialQuery();
      } else {
        // Query was already processed, reset the flag
        setShouldAutoRunChat(false);
      }
    }
  }, [shouldAutoRun, initialQuery, sessionId, userLocation]);

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
    sessionId,
    userLocation,

    // Speech recognition state
    speechRecognition: {
      isSupported: speechRecognition.isSupported,
      isListening: speechRecognition.isListening,
      transcript: speechRecognition.transcript,
      interimTranscript: speechRecognition.interimTranscript,
      confidence: speechRecognition.confidence,
      error: speechRecognition.error,
    },

    // Setters
    setMessages,
    setInputValue,
    setIsTyping,
    setShowFilters,
    setUserLocation,

    // Speech recognition actions
    startVoiceRecording,
    stopVoiceRecording,
    cancelVoiceRecording,
    resetVoiceTranscript,

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
