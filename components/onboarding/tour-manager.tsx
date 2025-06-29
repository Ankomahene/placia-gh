'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Volume2, X } from 'lucide-react';
import { useTour } from '@reactour/tour';
import { useTour as usePlaciatour } from './tour-context';
import { TourAgent } from './tour-agent';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { TOUR_STORAGE_KEYS } from '@/lib/onboarding/tour-data';

export function TourManager() {
  const { setIsOpen, isOpen, currentStep, setCurrentStep } = useTour();
  const { hasCompletedTour, setHasCompletedTour } = usePlaciatour();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(false);
  const [isAgentReady, setIsAgentReady] = useState(false);

  // Show welcome modal for first-time users
  useEffect(() => {
    const hasCompletedStored = localStorage.getItem(
      TOUR_STORAGE_KEYS.HAS_COMPLETED_TOUR
    );
    if (hasCompletedStored !== 'true' && !hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowWelcomeModal(true);
        setHasSeenWelcome(true);
        // Small delay to ensure modal is rendered before agent starts
        setTimeout(() => setIsAgentReady(true), 300);
      }, 1500); // Delay to let the page load

      return () => clearTimeout(timer);
    }
  }, [hasSeenWelcome]);

  // Handle tour responses from voice agent
  const handleTourResponse = (
    response: 'yes' | 'no' | 'continue' | 'next',
    source: 'voice' | 'button' = 'voice'
  ) => {
    if (response === 'yes') {
      if (showWelcomeModal) {
        // Update all states immediately to prevent race conditions
        setShowWelcomeModal(false);
        setIsOpen(true);
        setCurrentStep(0);
      }
    } else if (response === 'no') {
      if (showWelcomeModal) {
        setShowWelcomeModal(false);
        handleSkipTour();
      } else {
        // User wants to skip during tour

        setIsOpen(false);
        handleCompleteTour();
      }
    } else if (response === 'continue' || response === 'next') {
      // Only allow progression if it's from voice or if there's no active speech
      if (source === 'voice' || !isAgentReady) {
        // Move to next step
        if (currentStep < 4) {
          // We have 5 steps (0-4)
          setCurrentStep(currentStep + 1);
        } else {
          // Tour complete

          setIsOpen(false);
          handleCompleteTour();
        }
      }
    }
  };

  // Handle manual tour start (from test button)
  const handleStartTour = () => {
    setShowWelcomeModal(true);
    setHasSeenWelcome(true);
    setIsAgentReady(true);
  };

  // Handle skip tour
  const handleSkipTour = () => {
    setShowWelcomeModal(false);
    setIsOpen(false);
    setIsAgentReady(false);
    handleCompleteTour();
  };

  // Handle tour completion
  const handleCompleteTour = () => {
    localStorage.setItem(TOUR_STORAGE_KEYS.HAS_COMPLETED_TOUR, 'true');
    setHasCompletedTour(true);
    setIsAgentReady(false);
  };

  // Handle tour close
  const handleCloseTour = () => {
    setIsOpen(false);
    setShowWelcomeModal(false);
    setIsAgentReady(false);
    handleCompleteTour();
  };

  // Expose start tour function for test button
  useEffect(() => {
    // Add global function for test button
    (window as any).startTestTour = handleStartTour;

    return () => {
      delete (window as any).startTestTour;
    };
  }, []);

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
                {/* Close button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSkipTour}
                  className="absolute top-4 right-4 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>

                {/* Agent Avatar */}
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-4 border-primary/20">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-white text-2xl font-bold">
                        <Bot className="w-10 h-10" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Speaking animation */}
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                    >
                      <Volume2 className="w-3 h-3 text-white" />
                    </motion.div>
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-2xl font-bold text-foreground">
                      Welcome to Placia! 👋
                    </h2>

                    <p className="text-muted-foreground leading-relaxed">
                      Hi there! I'm <strong>Alex</strong>, your AI tour guide.
                      I'd love to show you around and help you discover all the
                      amazing features Placia has to offer.
                    </p>

                    <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        🎙️ <strong>Voice-enabled tour:</strong> I can speak to
                        you and listen to your responses! Make sure your
                        microphone is enabled for the best experience.
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">
                      Would you like me to give you a quick guided tour of the
                      homepage?
                    </p>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-col w-full space-y-3">
                    <Button
                      onClick={() => handleTourResponse('yes', 'button')}
                      className="w-full bg-primary hover:bg-primary/90"
                      size="lg"
                    >
                      <Volume2 className="w-4 h-4 mr-2" />
                      Yes, show me around!
                    </Button>

                    <Button
                      onClick={() => handleTourResponse('no', 'button')}
                      variant="outline"
                      className="w-full"
                    >
                      No thanks, I'll explore myself
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    You can always restart this tour later from the help menu.
                  </p>
                </div>
              </Card>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tour Agent - Handles voice conversation */}
      {isAgentReady && (
        <TourAgent
          onTourResponse={handleTourResponse}
          isWelcomeModal={showWelcomeModal && !isOpen}
          currentStep={isOpen ? currentStep : -1}
        />
      )}

      {/* Floating tour trigger for completed users */}
      {hasCompletedTour && !isOpen && !showWelcomeModal && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="fixed bottom-6 right-6 z-40"
          onClick={handleStartTour}
        >
          <Button
            className="rounded-full w-14 h-14 shadow-lg bg-primary hover:bg-primary/90"
            size="lg"
          >
            <Bot className="w-6 h-6" />
          </Button>
        </motion.div>
      )}
    </>
  );
}
