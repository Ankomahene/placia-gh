import { StepType } from '@reactour/tour';

// Audio file configuration
export const AUDIO_FILES = {
  intro: '/audio/tour/intro.mp3',
  steps: [
    '/audio/tour/step-1-search-input.mp3',
    '/audio/tour/step-2-search-examples.mp3',
    '/audio/tour/step-3-map-preview.mp3',
    '/audio/tour/step-4-featured-places.mp3',
    '/audio/tour/step-5-trending-places.mp3',
    '/audio/tour/step-6-contribute-banner.mp3',
  ],
  completion: '/audio/tour/completion.mp3',
} as const;

// Subtitle texts (synchronized with audio)
export const SUBTITLE_TEXTS = {
  intro: `Hi there! Welcome to Placia - your AI-powered place discovery platform for Ghana! I'm Alex, your friendly virtual tour guide, and I'm absolutely excited to show you around today.

Placia is designed to help you discover amazing places across Ghana using the power of artificial intelligence. Whether you're looking for the best restaurants near you, want to find a specific service, or just exploring what's around, we've got you covered.

I'd love to give you a quick guided tour of our homepage to show you all the incredible features we've built just for you. I'll walk you through each section, explain how everything works, and show you some tips and tricks along the way.

Are you ready to explore? Just say "yes" or click the button if you'd like me to show you around, or "no thanks" if you prefer to dive in on your own. What do you say?`,

  steps: [
    // Step 1: Search Input
    `Fantastic! Let's start with the heart and soul of Placia - our intelligent search feature. You can see it's highlighted right here at the top of the page.

Now, this isn't just any ordinary search bar. This is powered by advanced AI that understands natural language, just like you're talking to a friend. Instead of typing keywords, you can ask questions like "Where can I find good jollof rice near Accra Mall?" or "Show me pharmacies open right now within 5 kilometers of my location."

The magic happens because our AI automatically detects your location and understands the context of what you're looking for. It's like having a local friend who knows everything about Ghana right at your fingertips!

Ready to see some examples of how natural and easy it is to use?`,

    // Step 2: Search Examples
    `Perfect! Now check out these example searches below the search bar. These are real examples of how you can talk to Placia using everyday language.

You can ask for "Affordable schools in my area" and we'll find educational institutions near you with pricing information. Try "Churches near me" and we'll show you places of worship in your vicinity. Or say "Best restaurants around my current location" and we'll recommend top-rated dining spots.

And here's something really cool - see that little microphone icon in the search bar? That's our voice search feature! Just click it and speak your question out loud. Our AI will understand your voice and search for exactly what you need. It's perfect when you're on the go or just prefer speaking instead of typing.

These examples show you the power of natural language search, but feel free to ask for anything - we understand all sorts of requests! Shall we move on to see something really exciting?`,

    // Step 3: Map Preview
    `Now this is where things get really exciting! Below the search section, you'll see our interactive map preview that shows places near your current location in real-time.

Look at those floating cards that appear on the map - those are highlighting some of the most popular spots around you right now. You can see restaurants, shops, services, and all sorts of interesting places, each with photos, ratings, and key information.

The beautiful thing about this map is that it's completely interactive. You can click on any place marker to get detailed information, read reviews, see photos, and even get directions. The floating cards move around gently to give you a dynamic view of what's available nearby.

And here's the best part - this map updates automatically based on your location. So whether you're in Accra, Kumasi, Tamale, or anywhere else in Ghana, you'll always see relevant places around you. It's like having a local guide wherever you go!

Pretty amazing, right? Let's continue to see our handpicked recommendations.`,

    // Step 4: Featured Places
    `Now let me show you something really special - our Featured Places section. These aren't just any random locations. These are carefully handpicked, absolutely amazing places across Ghana that our team has personally curated just for you.

We're talking about cultural heritage sites that tell the story of Ghana's rich history, breathtaking natural wonders that showcase the country's incredible beauty, vibrant markets where you can experience authentic Ghanaian culture, and hidden gems that even some locals don't know about.

Each featured place comes with stunning high-quality photos, detailed descriptions written by our local experts, genuine user reviews from people who've actually been there, and practical information like opening hours, entry fees, and how to get there.

Whether you're a tourist wanting to see the must-visit spots or a local looking to discover new places in your own country, this section is like having insider access to Ghana's best-kept secrets.

Want to see what's trending and popular right now?`,

    // Step 5: Trending Places
    `Excellent! Now we're looking at our Trending Places section, and this is where you can see what's hot and happening in Ghana right now.

This section is constantly updated based on real user activity, recent reviews, social media mentions, and current events. So if there's a new restaurant everyone's talking about, a cultural festival happening at a specific location, or a newly opened attraction that's getting lots of attention, you'll see it here first.

It's like having your finger on the pulse of Ghana's social scene. Maybe there's a new art gallery opening in Accra, a popular street food vendor in Kumasi that's gained fame, or a beautiful waterfall that's recently become Instagram-famous. This is where you'll discover it.

The trending algorithm is smart too - it considers your location, so you'll see trending places that are actually relevant to where you are or where you're planning to visit. It's real-time discovery at its finest!

Ready to see how you can be part of building this amazing community?`,

    // Step 6: Contribute Banner
    `And here's something I'm really excited to share with you - our "Know a Great Place?" contribution section. This is what makes Placia truly special - it's powered by community, and that includes you!

You see, while we work hard to discover and feature amazing places across Ghana, we know that the best recommendations often come from people like you who have actually experienced these places firsthand.

If you know an incredible local restaurant that serves the best banku in town, a hidden beach that's perfect for weekend getaways, a reliable mechanic shop, or any place that made your day better - you can easily share it with the Placia community by clicking "Add a Place."

When you contribute, you're not just adding a pin on a map. You're helping fellow Ghanaians and visitors discover amazing experiences they might never have found otherwise. Your local knowledge becomes part of our collective wisdom.

Plus, your contributions help build the most comprehensive and authentic database of places in Ghana, created by Ghanaians, for everyone who wants to explore this beautiful country.

What do you think? Pretty cool way to help others discover amazing places, right?`,
  ],

  completion: `And that's a wrap on our tour! Congratulations - you've now seen all the key features that make Placia your ultimate companion for discovering Ghana.

Let me quickly recap what you've learned: You can search for any type of place using natural language or voice commands, explore our interactive map to see what's around you in real-time, discover our handpicked featured places that showcase the best of Ghana, stay updated with trending spots that are popular right now, and contribute your own discoveries to help build our amazing community.

The best part? All of this is powered by AI that understands you, respects your location privacy, and gets smarter every day based on the experiences shared by our community.

Now it's time for the fun part - start exploring! Try searching for something you're curious about, discover new places on the map, or browse our featured and trending sections. Ghana is full of amazing places waiting to be discovered, and Placia is here to help you find them.

Thanks for taking this tour with me. I hope you have an absolutely wonderful time discovering incredible places with Placia. Happy exploring!`,
} as const;

// Tour steps for @reactour/tour (same as original but optimized for audio)
export const AUDIO_TOUR_STEPS: StepType[] = [
  {
    selector: '[data-tour="search-input"]',
    content:
      'Our AI-powered search understands natural language - ask questions like you would to a friend!',
  },
  {
    selector: '[data-tour="search-examples"]',
    content:
      'Try these example searches or use voice search by clicking the microphone icon.',
  },
  {
    selector: '[data-tour="map-preview"]',
    content:
      'Interactive map showing real-time places near your location with floating info cards.',
  },
  {
    selector: '[data-tour="featured-places"]',
    content:
      'Handpicked amazing locations across Ghana, curated by our local experts.',
  },
  {
    selector: '[data-tour="trending-places"]',
    content:
      'See what places are hot and trending right now based on user activity.',
  },
  {
    selector: '[data-tour="contribute-banner"]',
    content:
      'Help build our community by sharing your favorite places with other explorers.',
  },
];

// Audio tour configuration
export const AUDIO_TOUR_CONFIG = {
  AUTO_ADVANCE_DELAY: 1000, // Delay after audio ends before auto-advancing
  SUBTITLE_ANIMATION_DELAY: 200, // Delay for subtitle text animation
  VOLUME_DEFAULT: 0.8,
  VOLUME_STEP: 0.1,
  PLAYBACK_RATES: [0.5, 0.75, 1, 1.25, 1.5] as const,
  DEFAULT_PLAYBACK_RATE: 1,
} as const;

// Storage keys
export const AUDIO_TOUR_STORAGE_KEYS = {
  HAS_COMPLETED_TOUR: 'placia_audio_tour_completed',
  TOUR_PREFERENCES: 'placia_audio_tour_preferences',
  LAST_STEP: 'placia_audio_tour_last_step',
} as const;

// Type exports
export type AudioFile = typeof AUDIO_FILES;
export type SubtitleText = typeof SUBTITLE_TEXTS;
export type AudioTourConfig = typeof AUDIO_TOUR_CONFIG;
