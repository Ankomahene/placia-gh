'use client';

import { TourProvider, StepType } from '@reactour/tour';
import { AUDIO_TOUR_STEPS } from '@/lib/onboarding-v2/audio-tour-data';
import { useAudioTour } from './audio-tour-context';
import { useTheme } from 'next-themes';

interface AudioTourProviderWrapperProps {
  children: React.ReactNode;
}

export function AudioTourProviderWrapper({
  children,
}: AudioTourProviderWrapperProps) {
  const { stopAudio, resetTour, playAudio, setHasCompletedTour } =
    useAudioTour();
  const { theme, systemTheme } = useTheme();

  // Determine if we're in dark mode
  const isDark =
    theme === 'dark' || (theme === 'system' && systemTheme === 'dark');

  const handleBeforeClose = () => {
    stopAudio();

    // Mark as completed when manually closed (so modal doesn't reappear)
    setHasCompletedTour(true);
    localStorage.setItem('placia_audio_tour_completed', 'true');

    // Don't call resetTour() here as it would set hasCompletedTour back to false
  };

  const handleTourComplete = async () => {
    try {
      // Play completion audio
      await playAudio('/audio/tour/completion.mp3');
    } catch (error) {
      console.error('Failed to play completion audio:', error);
    }

    // Mark as completed
    setHasCompletedTour(true);
    localStorage.setItem('placia_audio_tour_completed', 'true');
  };

  return (
    <TourProvider
      steps={AUDIO_TOUR_STEPS as StepType[]}
      beforeClose={handleBeforeClose}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#7c3aed',
          borderRadius: 10,
          maxWidth: '320px',
          backgroundColor: isDark ? '#1f2937' : '#ffffff',
          color: isDark ? '#f9fafb' : '#111827',
          border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
          boxShadow: isDark
            ? '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
            : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }),
        maskArea: (base) => ({
          ...base,
          rx: 10,
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '-0.8125em',
          backgroundColor: '#7c3aed',
          color: '#ffffff',
        }),
        close: (base) => ({
          ...base,
          right: 'auto',
          left: 8,
          top: 8,
          backgroundColor: isDark ? '#374151' : '#f3f4f6',
          color: isDark ? '#f9fafb' : '#374151',
          '&:hover': {
            backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
          },
        }),
        // Add styling for tour content
        maskWrapper: (base) => ({
          ...base,
          color: isDark ? '#374151' : '#111827',
        }),
      }}
      onClickMask={({ setIsOpen }) => setIsOpen(false)}
      disableInteraction
      disableKeyboardNavigation={false}
      className="audio-tour"
      padding={{ mask: [5, 5] }}
      prevButton={({ currentStep, setCurrentStep, stepsLength, steps }) => {
        return currentStep > 0 ? (
          <button
            onClick={() => setCurrentStep(Math.max(currentStep - 1, 0))}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              isDark
                ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            Back
          </button>
        ) : null;
      }}
      nextButton={({
        currentStep,
        setCurrentStep,
        stepsLength,
        setIsOpen,
        steps,
      }) => {
        const isLastStep = currentStep === stepsLength - 1;
        return (
          <button
            onClick={async () => {
              if (isLastStep) {
                await handleTourComplete();
                setIsOpen(false);
              } else {
                setCurrentStep(Math.min(currentStep + 1, stepsLength - 1));
              }
            }}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
          </button>
        );
      }}
    >
      {children}
    </TourProvider>
  );
}
