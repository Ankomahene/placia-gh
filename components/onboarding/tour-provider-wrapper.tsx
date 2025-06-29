'use client';

import { TourProvider } from '@reactour/tour';
import { REACTOUR_STEPS } from '@/lib/onboarding/tour-data';
import { useTour } from './tour-context';

interface TourProviderWrapperProps {
  children: React.ReactNode;
}

export function TourProviderWrapper({ children }: TourProviderWrapperProps) {
  const { stopCurrentSpeech } = useTour();

  const handleBeforeClose = () => {
    console.log('🛑 Reactour closing - stopping speech');
    stopCurrentSpeech();
  };

  return (
    <TourProvider
      steps={REACTOUR_STEPS}
      beforeClose={handleBeforeClose}
      styles={{
        popover: (base) => ({
          ...base,
          '--reactour-accent': '#7c3aed',
          borderRadius: 10,
        }),
        maskArea: (base) => ({
          ...base,
          rx: 10,
        }),
        badge: (base) => ({
          ...base,
          left: 'auto',
          right: '-0.8125em',
        }),
        close: (base) => ({
          ...base,
          right: 'auto',
          left: 8,
          top: 8,
        }),
      }}
    >
      {children}
    </TourProvider>
  );
}
