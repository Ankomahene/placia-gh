import { TourStep, AgentConfig } from '@/types/onboarding';

export const AGENT_CONFIG: AgentConfig = {
  // Note: Replace with your actual ElevenLabs agent ID
  agentId: process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID,
  voice: {
    voiceId: '21m00Tcm4TlvDq8ikWAM', // Default ElevenLabs voice - Rachel
    stability: 0.75,
    similarity_boost: 0.75,
  },
  personality: {
    name: 'Alex',
    role: 'Placia Tour Guide',
    traits: ['friendly', 'knowledgeable', 'patient', 'enthusiastic'],
  },
};

// Reactour compatible steps
export const REACTOUR_STEPS = [
  {
    selector: '[data-tour="search-input"]',
    content:
      'Start your discovery journey with our intelligent AI-powered search that understands natural language.',
  },
  {
    selector: '[data-tour="search-examples"]',
    content:
      'Try these example searches or use voice search by clicking the microphone icon!',
  },
  {
    selector: '[data-tour="map-preview"]',
    content:
      'This interactive map shows places near your current location! Explore nearby restaurants, shops, and services with real-time information.',
  },
  {
    selector: '[data-tour="featured-places"]',
    content:
      'Discover handpicked amazing locations across Ghana, carefully curated by our team.',
  },
  {
    selector: '[data-tour="trending-places"]',
    content:
      'See what places are popular right now based on user activity and current events.',
  },
  {
    selector: '[data-tour="contribute-banner"]',
    content:
      'Help others discover amazing places by sharing your favorites. Click "Add a Place" to contribute!',
  },
];

// Voice prompts for each step (matches reactour steps by index)
export const VOICE_PROMPTS = [
  `Perfect! Let's start with the heart of Placia - our smart search feature. You can see the search bar highlighted here. This isn't just any ordinary search - it's powered by AI and understands natural language. You can ask for things like "affordable schools in my area" or "best restaurants near me" and our AI will understand exactly what you're looking for. Pretty cool, right? Ready to see what makes it special?`,

  `What makes our search special is that it understands context and location. These example searches show you how to use natural language like "Churches near me" or "Pharmacies open now within 5km of my location." Our AI will automatically detect your location and find relevant places. You can even use voice search by clicking the microphone icon! Shall we move on to see our featured places?`,

  `Perfect! Now let me show you this interactive map below. This map displays places near your current location in real-time. You'll see floating cards highlighting popular spots, and you can click on any place marker to get detailed information. The map automatically updates based on your location to show the most relevant nearby places. Pretty cool, right?`,

  `Now, let me show you our Featured Places section. These are carefully curated, amazing locations across Ghana that our team has handpicked for you. From cultural sites to natural wonders, these places showcase the best of what Ghana has to offer. Each place comes with detailed information, photos, and user reviews to help you plan your visit. Ready to see what's trending?`,

  `Next, we have our Trending Places section. These are the hottest spots that people are talking about and visiting right now. This section updates regularly based on user activity, reviews, and current events, so you'll always know what's buzzing in Ghana. It's a great way to discover new places that are gaining popularity. Want to see how you can contribute?`,

  `Finally, here's something really special - our "Know a Great Place?" section. Placia is all about community, and you can contribute too! If you know an amazing place that's not on our platform yet, you can easily add it by clicking "Add a Place." Your contributions help fellow explorers discover hidden gems and build a comprehensive database of Ghana's best locations. What do you think?`,
];

// Welcome message
export const WELCOME_MESSAGE = `Hi there! Welcome to Placia, your AI-powered place discovery platform for Ghana! I'm Alex, your friendly tour guide. I'm here to help you explore all the amazing features we have to offer. 

I'd love to give you a quick guided tour of the homepage to show you how everything works. I'll highlight each section and explain it, and you can respond to let me know when you're ready to continue. Would you like me to show you around? Just say "Yes, show me" if you'd like the tour, or "No thanks" if you'd prefer to explore on your own.`;

// Completion message
export const COMPLETION_MESSAGE = `And that's a wrap! You've now seen all the key features of Placia through our interactive tour. Remember, you can search for any type of place using natural language, explore our featured and trending places, and even contribute your own discoveries. Now go ahead and start exploring Ghana like never before! Have fun discovering amazing places with Placia!`;

// Storage keys
export const TOUR_STORAGE_KEYS = {
  HAS_COMPLETED_TOUR: 'placia_has_completed_landing_tour',
  TOUR_PREFERENCES: 'placia_tour_preferences',
} as const;

// Tour configuration
export const TOUR_CONFIG = {
  AUTO_ADVANCE_DELAY: 2000, // ms to wait after voice ends before auto-advancing
  VOICE_SETTINGS: {
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0,
  },
  // Preferred voice names in order of preference
  PREFERRED_VOICES: [
    // High-quality neural/natural voices
    'Google UK English Female',
    'Google US English Female',
    'Microsoft Zira - English (United States)',
    'Microsoft Hazel - English (Great Britain)',
    'Microsoft Emma - English (United States)', // Windows 11 neural voice
    'Microsoft Jenny - English (United States)', // Windows 11 neural voice

    // macOS voices (generally high quality)
    'Alex', // Male, very natural
    'Samantha', // Female, natural
    'Victoria', // British female
    'Karen', // Australian female
    'Veena', // Indian English female

    // Chrome/Chromium voices
    'Chrome OS US English Female',
    'Chrome OS UK English Female',

    // Android voices
    'Android Speech Female',
    'Android Speech Male',
  ],
} as const;
