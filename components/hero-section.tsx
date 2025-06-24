'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Bot, Mic, Search, Sparkles, Zap } from 'lucide-react';
import React, { useEffect, useState, useRef } from 'react';
import { MapPreview } from './map-preview';
import { useSearchContext } from './search/hooks/use-search-context';
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';
import { SpeechListeningPopup } from './speech-listening-popup';

const exampleSearches = [
  'Affordable schools in my area',
  'Churches near me',
  'Best restaurants around my current location',
  'Pharmacies open now within 5km of my location',
  'Banks with ATM near me',
];

const floatingElements = [
  { icon: '🏥', label: 'Hospitals', delay: '0s' },
  { icon: '🏫', label: 'Schools', delay: '2s' },
  { icon: '🍽️', label: 'Restaurants', delay: '4s' },
  { icon: '🏪', label: 'Shops', delay: '6s' },
  { icon: '⛪', label: 'Churches', delay: '8s' },
];

export default function HeroSection() {
  const {
    previousSearchTerm,
    setSearchTerm,
    setChatSearchTerm,
    onSearch,
    onChatSearch,
    userLocation,
    performSearch,
    setSearchMode,
    restoreSearchState,
    getNavigationSource,
    setIsOpenSearchWindow,
  } = useSearchContext();
  const [searchInput, setSearchInput] = useState('');

  // Speech recognition functionality using the existing hook
  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
    confidenceThreshold: 0.5,
    silenceTimeout: 3000,
  });

  const wasCancelledRef = useRef(false);
  const isActiveVoiceSessionRef = useRef(false);

  // Reset speech recognition state when hero section mounts
  useEffect(() => {
    speechRecognition.resetTranscript();
    wasCancelledRef.current = false;
    isActiveVoiceSessionRef.current = false;
  }, []);

  // Speech recognition methods
  const startVoiceRecording = () => {
    wasCancelledRef.current = false;
    isActiveVoiceSessionRef.current = true;
    speechRecognition.resetTranscript();
    speechRecognition.startListening();
  };

  const stopVoiceRecording = () => {
    wasCancelledRef.current = false;
    speechRecognition.stopListening();
    if (speechRecognition.transcript.trim()) {
      setSearchInput(speechRecognition.transcript.trim());
    }
    // Keep session active until auto-search completes or is cancelled
  };

  const cancelVoiceRecording = () => {
    wasCancelledRef.current = true;
    isActiveVoiceSessionRef.current = false;
    speechRecognition.resetTranscript();
    speechRecognition.stopListening();
    setSearchInput('');
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
      !wasCancelledRef.current &&
      isActiveVoiceSessionRef.current
    ) {
      setSearchInput(speechRecognition.transcript.trim());
    }
  }, [speechRecognition.transcript, speechRecognition.isListening]);

  // Auto-search when speech recognition stops with content
  useEffect(() => {
    const transcript = speechRecognition.transcript.trim();

    if (
      !speechRecognition.isListening &&
      transcript &&
      searchInput.trim() === transcript &&
      !wasCancelledRef.current &&
      isActiveVoiceSessionRef.current // Only auto-search if we're in an active voice session
    ) {
      const timeoutId = setTimeout(async () => {
        // Mark session as completed
        isActiveVoiceSessionRef.current = false;

        setSearchMode('general');
        setSearchTerm(transcript);
        onSearch(transcript);
        if (transcript !== previousSearchTerm) {
          await performSearch(transcript, userLocation);
        }
      }, 800);

      return () => clearTimeout(timeoutId);
    }
  }, [
    speechRecognition.isListening,
    speechRecognition.transcript,
    searchInput,
    previousSearchTerm,
    setSearchMode,
    setSearchTerm,
    onSearch,
    performSearch,
    userLocation,
  ]);

  // Check for cached search state on mount and restore if needed
  useEffect(() => {
    const navigationSource = getNavigationSource();
    const shouldRestore = sessionStorage.getItem('placia_restore_search');

    if (
      navigationSource === 'general_search' ||
      navigationSource === 'chat_search' ||
      shouldRestore
    ) {
      // User returned from place details, restore search state
      const restored = restoreSearchState();
      if (restored) {
        setSearchMode(navigationSource === 'chat_search' ? 'chat' : 'general');
        setIsOpenSearchWindow(true);
        // Clear the navigation source and restore flag after using them
        sessionStorage.removeItem('placia_navigation_source');
        sessionStorage.removeItem('placia_restore_search');
      }
    }
  }, [
    getNavigationSource,
    restoreSearchState,
    setSearchMode,
    setIsOpenSearchWindow,
  ]);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (searchInput.trim()) {
      setSearchMode('general');
      setSearchTerm(searchInput);
      onSearch(searchInput);
      if (searchInput !== previousSearchTerm) {
        await performSearch(searchInput, userLocation);
      }
    }
  };

  const handleChatSearch = async () => {
    if (searchInput.trim()) {
      setSearchMode('chat');
      setChatSearchTerm(searchInput);
      onChatSearch(searchInput);
    }
  };

  const handleExampleClick = async (query: string) => {
    setSearchInput(query);
  };

  return (
    <section className="relative pt-24 pb-12 md:pt-32 md:pb-20 overflow-hidden min-h-screen flex items-center">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0">
        {/* Primary gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-blue-500/5 animate-gradient-shift"></div>

        {/* Secondary animated gradient */}
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/3 via-transparent to-green-500/3 animate-gradient-shift-reverse"></div>

        {/* Geometric patterns */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-primary/10 rounded-full blur-xl animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-blue-500/10 rounded-full blur-lg animate-float-delayed"></div>
          <div className="absolute bottom-40 left-20 w-28 h-28 bg-purple-500/10 rounded-full blur-xl animate-float-slow"></div>
        </div>

        {/* Floating place icons */}
        {floatingElements.map((element, index) => (
          <div
            key={index}
            className="absolute opacity-20 animate-float-gentle"
            style={{
              top: `${20 + index * 15}%`,
              left: `${10 + index * 20}%`,
              animationDelay: element.delay,
            }}
          >
            <div className="text-2xl">{element.icon}</div>
          </div>
        ))}
      </div>

      {/* Mesh gradient overlay */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-background/95 via-background/85 to-background/95"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center mb-12">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-fade-in">
            <Bot className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">
              AI-Powered Search
            </span>
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          </div>

          {/* Main heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent animate-gradient-text">
              Discover Ghana
            </span>
            <br />
            <span className="text-foreground/90">
              with{' '}
              <span className="relative">
                AI Magic
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full animate-expand"></div>
              </span>
            </span>
          </h1>

          <p className="text-xl md:text-2xl mb-8 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Find any place in Ghana using natural language. From local
            businesses to hidden gems,
            <span className="text-primary font-medium">
              {' '}
              just ask naturally
            </span>{' '}
            and let our AI guide you.
          </p>

          {/* Enhanced Search Interface */}
          <div className="relative max-w-3xl mx-auto mb-8">
            <Card className="p-2 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-grow">
                  <Input
                    type="text"
                    placeholder="e.g., 'Find me a good jollof restaurant near Accra Mall'"
                    className="pl-6 pr-16 py-6 text-lg border-0 bg-transparent focus-visible:ring-1 focus-visible:ring-primary/50"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleVoiceRecording}
                      className={`h-8 w-8 rounded-full transition-colors duration-200 ${
                        speechRecognition.isListening
                          ? 'text-red-500 bg-red-50 hover:bg-red-100 dark:bg-red-950 dark:hover:bg-red-900'
                          : 'text-muted-foreground hover:text-primary hover:bg-primary/10'
                      }`}
                    >
                      <Mic className="h-4 w-4" />
                      <span className="sr-only">
                        {speechRecognition.isListening
                          ? 'Stop voice search'
                          : 'Start voice search'}
                      </span>
                    </Button>
                  </div>
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="rounded-lg px-8 py-6 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 shadow-lg"
                  disabled={!searchInput.trim()}
                >
                  <Search className="h-5 w-5 mr-1" />
                  Search
                  {/* <Zap className="h-4 w-4 ml-2" /> */}
                </Button>
                <Button
                  type="button"
                  onClick={handleChatSearch}
                  size="lg"
                  variant="outline"
                  className="rounded-lg px-6 py-6 bg-primary/5 border-primary/30 hover:bg-primary/10 hover:border-primary/40"
                  disabled={!searchInput.trim()}
                >
                  <Bot className="h-5 w-5 mr-1" />
                  Chat
                </Button>
              </form>
            </Card>

            {/* Example searches with improved styling */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <span className="text-sm text-muted-foreground mb-2 w-full">
                Try asking:
              </span>
              {exampleSearches.map((search, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-primary/20 bg-primary/5 px-4 py-2 cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-all duration-200 hover:scale-105"
                  onClick={() => handleExampleClick(search)}
                >
                  {search}
                </Badge>
              ))}
            </div>
          </div>

          {/* Stats or Trust indicators */}
          <div className="flex flex-wrap justify-center gap-8 mb-12 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>10,000+ Places</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"
                style={{ animationDelay: '0.5s' }}
              ></div>
              <span>AI-Powered Results</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"
                style={{ animationDelay: '1s' }}
              ></div>
              <span>Real-Time Updates</span>
            </div>
          </div>
        </div>

        {/* Enhanced Map Preview */}
        <div
          className="relative mt-16 animate-fade-in-up"
          style={{ animationDelay: '0.3s' }}
        >
          <MapPreview />
        </div>
      </div>

      {/* Speech Listening Popup */}
      <SpeechListeningPopup
        speechRecognition={speechRecognition}
        onStopAndSearch={stopVoiceRecording}
        onCancel={cancelVoiceRecording}
        description="Speak your search query clearly. I'll automatically search after 3 seconds of silence, or click 'Stop & Search' to search immediately."
      />
    </section>
  );
}
