// Keep for backwards compatibility but simplified
export interface TourStep {
  id: string;
  flag: string;
  title: string;
  description: string;
  targetElement?: string;
  scrollTarget?: string;
  voicePrompt: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  waitForUserResponse?: boolean;
}

export type TourFlag =
  | 'welcome-message'
  | 'show-landing-search-input'
  | 'explain-how-search-works'
  | 'show-featured-places'
  | 'show-trending-places'
  | 'show-contribute-banner'
  | 'end-tour';

export interface AgentConfig {
  agentId?: string;
  voice: {
    voiceId: string;
    stability: number;
    similarity_boost: number;
  };
  personality: {
    name: string;
    role: string;
    traits: string[];
  };
}

export interface TourPreferences {
  showSubtitles: boolean;
}
