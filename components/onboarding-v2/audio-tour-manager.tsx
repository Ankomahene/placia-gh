'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTour } from '@reactour/tour';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipForward,
  X,
  Settings,
  Volume1,
} from 'lucide-react';
import { useAudioTour } from './audio-tour-context';
import {
  AUDIO_FILES,
  SUBTITLE_TEXTS,
  AUDIO_TOUR_CONFIG,
  AUDIO_TOUR_STORAGE_KEYS,
} from '@/lib/onboarding-v2/audio-tour-data';
import { AlexChat } from './alex-chat';

export function AudioTourManager() {
  // React Tour hooks
  const { setIsOpen, isOpen, currentStep, setCurrentStep, steps } = useTour();

  // Audio Tour context
  const {
    hasCompletedTour,
    setHasCompletedTour,
    isPlaying,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    audioLoading,
    audioError,
    currentAudioStep,
    setCurrentAudioStep,
    showSubtitles,
    setShowSubtitles,
    audioVolume,
    setAudioVolume,
    resetTour,
  } = useAudioTour();

  // Local state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [isAgentReady, setIsAgentReady] = useState(false);
  const [showControls, setShowControls] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState('');
  const [showHelpMenu, setShowHelpMenu] = useState(false);
  const [showAlexChat, setShowAlexChat] = useState(false);

  // Handle first user interaction to unlock audio
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [shouldPlayIntroOnUnlock, setShouldPlayIntroOnUnlock] = useState(false);

  // Function to unlock audio context on first user interaction
  const unlockAudio = useCallback(async () => {
    if (audioUnlocked) return;

    setAudioUnlocked(true);

    // If we were waiting to play intro, play it now
    if (shouldPlayIntroOnUnlock) {
      try {
        setCurrentSubtitle(showSubtitles ? SUBTITLE_TEXTS.intro : '');
        await playAudio(AUDIO_FILES.intro);
      } catch (error) {
        console.error('Failed to play auto-intro audio:', error);
      }
    }
  }, [audioUnlocked, shouldPlayIntroOnUnlock, playAudio, showSubtitles]);

  // Add global click listener to unlock audio
  useEffect(() => {
    if (audioUnlocked) return;

    const handleInteraction = () => {
      unlockAudio();
    };

    // Listen for various user interactions
    document.addEventListener('click', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    document.addEventListener('touchstart', handleInteraction);

    return () => {
      document.removeEventListener('click', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
      document.removeEventListener('touchstart', handleInteraction);
    };
  }, [audioUnlocked, unlockAudio]);

  // Check completion status from localStorage on mount
  useEffect(() => {
    const hasCompleted =
      localStorage.getItem('placia_audio_tour_completed') === 'true';
    if (hasCompleted) {
      setHasCompletedTour(true);
    }
  }, [setHasCompletedTour]);

  // Check if user should see welcome modal on mount
  useEffect(() => {
    if (!hasCompletedTour && !isOpen) {
      // Add a slight delay for better UX
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        setIsAgentReady(true);
        // Set flag to play intro on first interaction
        setShouldPlayIntroOnUnlock(true);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [hasCompletedTour, isOpen]);

  // Handle step audio playback - waits for audio completion but NO auto-advance
  const handleStepAudio = useCallback(
    async (stepIndex: number) => {
      if (stepIndex < 0 || stepIndex >= AUDIO_FILES.steps.length) return;

      try {
        setCurrentSubtitle(
          showSubtitles ? SUBTITLE_TEXTS.steps[stepIndex] : ''
        );
        setCurrentAudioStep(stepIndex);

        // Wait for audio to complete - NO auto-advance
        await playAudio(AUDIO_FILES.steps[stepIndex]);

        // NO automatic advancement - user must click Next
      } catch (error) {
        console.error(`❌ Failed to play step ${stepIndex + 1} audio:`, error);
        // Fallback: just show visual content, no auto-advance
      }
    },
    [playAudio, setCurrentAudioStep, showSubtitles]
  );

  // Handle tour start (user clicked "Yes Show me")
  const handleStartTour = useCallback(async () => {
    setShowWelcomeModal(false);
    setShouldPlayIntroOnUnlock(false); // Cancel auto-play if not already happened

    try {
      // If audio hasn't been unlocked yet, unlock it and play intro
      if (!audioUnlocked) {
        setAudioUnlocked(true);
        setCurrentSubtitle(showSubtitles ? SUBTITLE_TEXTS.intro : '');
        await playAudio(AUDIO_FILES.intro);
      } else {
        setCurrentSubtitle(showSubtitles ? SUBTITLE_TEXTS.intro : '');
        await playAudio(AUDIO_FILES.intro);
      }

      // Start visual tour after intro completes
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
        setCurrentAudioStep(0);
        handleStepAudio(0);
      }, 500);
    } catch (error) {
      console.error('Failed to play intro audio:', error);
      // Fallback: start visual tour without intro audio
      setCurrentSubtitle('');
      setTimeout(() => {
        setIsOpen(true);
        setCurrentStep(0);
        setCurrentAudioStep(0);
        handleStepAudio(0);
      }, 300);
    }
  }, [
    playAudio,
    setIsOpen,
    setCurrentStep,
    setCurrentAudioStep,
    showSubtitles,
    handleStepAudio,
    audioUnlocked,
  ]);

  // Handle tour completion (only when tour actually completes all steps)
  const handleCompleteTour = useCallback(
    async (playCompletionAudio: boolean = true) => {
      // Only play completion audio if explicitly requested (actual completion)
      if (playCompletionAudio) {
        try {
          setCurrentSubtitle(showSubtitles ? SUBTITLE_TEXTS.completion : '');
          await playAudio(AUDIO_FILES.completion);
        } catch (error) {
          console.error('Failed to play completion audio:', error);
        }
      }

      // Mark as completed and cleanup
      setHasCompletedTour(true);
      setIsOpen(false);
      setIsAgentReady(false);
      setCurrentSubtitle('');

      // Save to localStorage
      localStorage.setItem(AUDIO_TOUR_STORAGE_KEYS.HAS_COMPLETED_TOUR, 'true');
    },
    [playAudio, setHasCompletedTour, setIsOpen, showSubtitles]
  );

  // Handle tour skip/cancel
  const handleSkipTour = useCallback(() => {
    stopAudio();
    setShowWelcomeModal(false);
    setIsOpen(false);
    setIsAgentReady(false);
    setCurrentSubtitle('');
    setShouldPlayIntroOnUnlock(false);
    setCurrentAudioStep(-1);

    // Mark as completed when stopped (so modal doesn't reappear)
    setHasCompletedTour(true);
    localStorage.setItem('placia_audio_tour_completed', 'true');
  }, [stopAudio, setIsOpen, setHasCompletedTour]);

  // Audio controls
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  }, [isPlaying, pauseAudio, resumeAudio]);

  // Handle tour closed by user (via X button or escape)
  const handleTourClosed = useCallback(() => {
    stopAudio();
    setCurrentSubtitle('');
    setIsAgentReady(false);
    setShouldPlayIntroOnUnlock(false);

    // Mark as completed when manually closed (so modal doesn't reappear)
    setHasCompletedTour(true);
    localStorage.setItem('placia_audio_tour_completed', 'true');
  }, [stopAudio, setHasCompletedTour]);

  // Listen for tour close events
  useEffect(() => {
    if (!isOpen && isAgentReady) {
      // Tour was closed while active
      handleTourClosed();
    }
  }, [isOpen, isAgentReady, handleTourClosed]);

  // Listen for step changes from @reactour/tour navigation
  useEffect(() => {
    if (isOpen && currentStep !== currentAudioStep && currentStep >= 0) {
      // Stop current audio and play new step audio
      stopAudio();
      handleStepAudio(currentStep);
    }
  }, [currentStep, currentAudioStep, isOpen, stopAudio, handleStepAudio]);

  // Manual tour start for testing
  const handleManualStart = useCallback(() => {
    resetTour();
    setShowWelcomeModal(true);
    setIsAgentReady(true);
  }, [resetTour]);

  // Expose global function for testing
  useEffect(() => {
    (window as any).startAudioTour = handleManualStart;
    return () => {
      delete (window as any).startAudioTour;
    };
  }, [handleManualStart]);

  return (
    <>
      {/* Welcome Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={handleSkipTour}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="relative z-10 w-full max-w-md"
            >
              <Card className="p-8 bg-white dark:bg-gray-900 shadow-2xl border-2 border-primary/20">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipTour}
                  className="absolute top-4 right-4 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>

                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-2xl font-bold">
                        <Bot className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>

                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Volume2 className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>

                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-semibold text-foreground">
                      Welcome to Placia! 🇬🇭
                    </h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Hi! I'm Alex, your virtual guide. I'd love to personally
                      walk you through our platform and show you how to discover
                      amazing places across Ghana with our smart features.
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Would you like me to give you a guided tour?
                    </p>

                    {shouldPlayIntroOnUnlock && (
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center justify-center gap-2">
                          <Bot className="w-4 h-4" />
                          Alex will start speaking as soon as click yes
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 mt-6">
                    <Button
                      onClick={handleStartTour}
                      className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-medium py-3 text-base"
                      disabled={audioLoading}
                    >
                      <Bot className="w-4 h-4 mr-2" />
                      {audioLoading
                        ? 'Getting Alex ready...'
                        : 'Yes, show me around!'}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={handleSkipTour}
                      className="w-full"
                    >
                      No I will explore myself
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Simplified Audio Controls (when tour is active) */}
      {isOpen && isAgentReady && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className="fixed bottom-20 right-6 z-40"
        >
          <Card className="p-3 bg-background/95 backdrop-blur-sm border shadow-lg">
            <div className="flex items-center gap-2">
              {/* Play/Pause control */}
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayPause}
                disabled={audioLoading}
                className="flex items-center gap-1"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                <span className="text-xs">{isPlaying ? 'Pause' : 'Play'}</span>
              </Button>

              {/* Progress indicator */}
              <Badge variant="outline" className="text-xs">
                Step {currentStep + 1}/{steps.length}
              </Badge>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Subtitle display */}
      {showSubtitles && currentSubtitle && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-20 left-6 right-6 z-30 max-w-4xl mx-auto"
        >
          <Card className="p-4 bg-background/95 backdrop-blur-sm border shadow-lg">
            <p className="text-sm leading-relaxed max-h-32 overflow-y-auto">
              {currentSubtitle}
            </p>
          </Card>
        </motion.div>
      )}

      {/* Error display */}
      {audioError && (
        <motion.div
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 100 }}
          className="fixed top-6 right-6 z-50"
        >
          <Card className="p-4 bg-red-50 border-red-200 text-red-700">
            <p className="text-sm">{audioError}</p>
          </Card>
        </motion.div>
      )}

      {/* Floating Help Menu for all users */}
      {!isOpen && !showWelcomeModal && !showAlexChat && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-6 right-6 z-40"
        >
          {showHelpMenu ? (
            <Card className="p-4 bg-background/95 backdrop-blur-sm border shadow-lg mb-2">
              <div className="flex flex-col gap-2 min-w-[160px]">
                <Button
                  onClick={() => {
                    setShowHelpMenu(false);
                    handleManualStart();
                  }}
                  variant="outline"
                  className="justify-start"
                >
                  <Bot className="w-4 h-4 mr-2" />
                  Start Tour
                </Button>
                <Button
                  onClick={() => {
                    setShowHelpMenu(false);
                    setShowAlexChat(true);
                  }}
                  variant="outline"
                  className="justify-start"
                >
                  <Volume2 className="w-4 h-4 mr-2" />
                  Talk to Alex
                </Button>
              </div>
            </Card>
          ) : null}

          <Button
            onClick={() => setShowHelpMenu(!showHelpMenu)}
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Bot className="w-6 h-6" />
          </Button>
        </motion.div>
      )}

      {/* Floating Stop Tour Button - appears when tour is active */}
      <AnimatePresence>
        {(isOpen || isPlaying) && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <Button
              onClick={handleSkipTour}
              variant="destructive"
              size="lg"
              className="bg-red-500 hover:bg-red-600 text-white shadow-lg border-2 border-red-400 rounded-full px-6 py-3 flex items-center gap-2 font-medium animate-pulse hover:animate-none transition-all duration-200"
            >
              <X className="w-5 h-5" />
              Stop Tour
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Talk to Alex Chat Popup */}
      <AnimatePresence>
        {showAlexChat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowAlexChat(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              className="relative z-10 w-full max-w-2xl max-h-[80vh]"
            >
              <Card className="bg-white dark:bg-gray-900 shadow-2xl border-2 border-primary/20 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary to-blue-600 text-white p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white/20">
                        <AvatarFallback className="bg-white/20 text-white font-bold">
                          A
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="text-xl font-semibold">
                          Chat with Alex
                        </h3>
                        <p className="text-white/80 text-sm">
                          Your Placia Assistant
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowAlexChat(false)}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* AlexChat Component */}
                <AlexChat onClose={() => setShowAlexChat(false)} />
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
