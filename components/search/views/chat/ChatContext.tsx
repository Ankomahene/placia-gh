'use client';

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

interface ChatContextType {
  // Chat state
  messages: ChatMessage[];
  inputValue: string;
  isTyping: boolean;
  showFilters: boolean;
  isRecording: boolean;
  isListening: boolean;

  // Actions
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
  setIsTyping: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFilters: React.Dispatch<React.SetStateAction<boolean>>;
  setIsRecording: React.Dispatch<React.SetStateAction<boolean>>;
  setIsListening: React.Dispatch<React.SetStateAction<boolean>>;

  // Methods
  handleSendMessage: () => Promise<void>;
  handleVoiceRecording: () => void;
  handleLoadMore: (messageId: string) => void;
  clearMessages: () => void;
  scrollToBottom: () => void;

  // Refs
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  places: PlaceResultsSummary[];
}

export function ChatProvider({ children, places }: ChatProviderProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const handleVoiceRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setIsListening(false);
      // Here you would stop the actual recording and process the audio
      // For now, we'll just simulate adding text
      setTimeout(() => {
        setInputValue('Find me luxury hotels near the beach');
      }, 500);
    } else {
      // Start recording
      setIsRecording(true);
      setIsListening(true);
      // Here you would start the actual audio recording
    }
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

  const clearMessages = () => {
    setMessages([]);
  };

  const value = {
    // State
    messages,
    inputValue,
    isTyping,
    showFilters,
    isRecording,
    isListening,

    // Setters
    setMessages,
    setInputValue,
    setIsTyping,
    setShowFilters,
    setIsRecording,
    setIsListening,

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
