'use client';

import { TourProvider, StepType } from '@reactour/tour';
import { AUDIO_TOUR_STEPS } from '@/lib/onboarding-v2/audio-tour-data';
import { useAudioTour } from './audio-tour-context';

interface AudioTourProviderWrapperProps {
  children: React.ReactNode;
}

export function AudioTourProviderWrapper({
  children,
}: AudioTourProviderWrapperProps) {
  const { stopAudio, resetTour, playAudio, setHasCompletedTour } =
    useAudioTour();

  const handleBeforeClose = () => {
    console.log(
      '🛑 Audio tour closing - stopping audio and marking as completed'
    );
    stopAudio();

    // Mark as completed when manually closed (so modal doesn't reappear)
    setHasCompletedTour(true);
    localStorage.setItem('placia_audio_tour_completed', 'true');

    // Don't call resetTour() here as it would set hasCompletedTour back to false
  };

  const handleTourComplete = async () => {
    console.log('🎉 Tour completed by user!');
    try {
      // Play completion audio
      await playAudio('/audio/tour/completion.mp3');
      console.log('✅ Completion audio finished');
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
        }),
        close: (base) => ({
          ...base,
          right: 'auto',
          left: 8,
          top: 8,
          backgroundColor: '#f3f4f6',
          color: '#374151',
          '&:hover': {
            backgroundColor: '#e5e7eb',
          },
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
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
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
