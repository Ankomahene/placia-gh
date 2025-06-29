// Audio Tour System - V2 with Pre-recorded Audio
export { AudioTourProvider } from './audio-tour-context';
export { AudioTourManager } from './audio-tour-manager';
export { AudioTourProviderWrapper } from './audio-tour-provider-wrapper';
export { AudioTourTestButton } from './audio-tour-test-button';
export { AlexChat } from './alex-chat';

// Re-export types and data
export type {
  AudioFile,
  SubtitleText,
  AudioTourConfig,
} from '@/lib/onboarding-v2/audio-tour-data';

export {
  AUDIO_FILES,
  SUBTITLE_TEXTS,
  AUDIO_TOUR_STEPS,
  AUDIO_TOUR_CONFIG,
  AUDIO_TOUR_STORAGE_KEYS,
} from '@/lib/onboarding-v2/audio-tour-data';
