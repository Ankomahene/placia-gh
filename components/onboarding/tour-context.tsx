'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import { TOUR_STORAGE_KEYS } from '@/lib/onboarding/tour-data';

interface PlaciatourContextType {
  hasCompletedTour: boolean;
  setHasCompletedTour: (completed: boolean) => void;
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;
  resetTour: () => void;
  // Speech control
  isSpeaking: boolean;
  setIsSpeaking: (speaking: boolean) => void;
  stopCurrentSpeech: () => void;
  registerSpeechController: (controller: SpeechController) => void;
}

interface SpeechController {
  stop: () => void;
}

const PlaciatourContext = createContext<PlaciatourContextType | undefined>(
  undefined
);

interface TourProviderProps {
  children: React.ReactNode;
}

export function TourProvider({ children }: TourProviderProps) {
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechController, setSpeechController] =
    useState<SpeechController | null>(null);

  // Load saved state from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompleted = localStorage.getItem(
        TOUR_STORAGE_KEYS.HAS_COMPLETED_TOUR
      );
      const preferences = localStorage.getItem(
        TOUR_STORAGE_KEYS.TOUR_PREFERENCES
      );

      if (hasCompleted === 'true') {
        setHasCompletedTour(true);
      }

      if (preferences) {
        try {
          const prefs = JSON.parse(preferences);
          if (prefs.showSubtitles !== undefined) {
            setShowSubtitles(prefs.showSubtitles);
          }
        } catch (error) {
          console.warn('Failed to parse tour preferences from localStorage');
        }
      }
    }
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferences = {
        showSubtitles,
      };
      localStorage.setItem(
        TOUR_STORAGE_KEYS.TOUR_PREFERENCES,
        JSON.stringify(preferences)
      );
    }
  }, [showSubtitles]);

  const resetTour = useCallback(() => {
    setHasCompletedTour(false);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOUR_STORAGE_KEYS.HAS_COMPLETED_TOUR);
    }
  }, []);

  const stopCurrentSpeech = useCallback(() => {
    console.log('🛑 Global speech stop requested');
    if (speechController) {
      speechController.stop();
    }
    setIsSpeaking(false);
  }, [speechController]);

  const registerSpeechController = useCallback(
    (controller: SpeechController) => {
      console.log('🎛️ Registering speech controller');
      setSpeechController(controller);
    },
    []
  );

  const contextValue: PlaciatourContextType = {
    hasCompletedTour,
    setHasCompletedTour,
    showSubtitles,
    setShowSubtitles,
    resetTour,
    isSpeaking,
    setIsSpeaking,
    stopCurrentSpeech,
    registerSpeechController,
  };

  return (
    <PlaciatourContext.Provider value={contextValue}>
      {children}
    </PlaciatourContext.Provider>
  );
}

// Hook to use tour context
export function useTour() {
  const context = useContext(PlaciatourContext);
  if (context === undefined) {
    throw new Error('useTour must be used within a TourProvider');
  }
  return context;
}
