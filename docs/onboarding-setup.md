# AI Onboarding Feature Setup

## Overview

The AI-powered onboarding feature provides new users with a conversational tour of Placia using ElevenLabs voice synthesis. The tour guide "Alex" walks users through key features using natural voice narration and interactive elements.

## Features

- 🎙️ **Voice-guided tour** using ElevenLabs conversational AI
- 🎯 **Interactive highlighting** of UI elements
- 📱 **Responsive design** that works across devices
- 🔊 **Subtitle support** for accessibility
- 💾 **Progress persistence** using localStorage
- 🎚️ **Audio controls** (volume, subtitles toggle)
- 🔄 **Graceful fallbacks** to browser speech synthesis

## Setup Instructions

### 1. ElevenLabs Configuration

1. Create an account at [ElevenLabs](https://elevenlabs.io)
2. Create a new Conversational AI agent in your dashboard
3. Copy your agent ID and add it to your environment variables:

```bash
# Add to your .env.local file
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### 2. Agent Configuration

The AI agent should be configured with the following personality in ElevenLabs dashboard:

**Name:** Alex
**Role:** Placia Tour Guide
**Personality Traits:** Friendly, knowledgeable, patient, enthusiastic

**Sample System Prompt:**
```
You are Alex, a friendly and enthusiastic tour guide for Placia, Ghana's AI-powered place discovery platform. Your role is to welcome new users and guide them through the key features of the homepage.

Guidelines:
- Be conversational and warm in your tone
- Keep explanations clear and concise
- Show enthusiasm for Ghana's amazing places
- Use natural speech patterns with brief pauses
- Respond to user inputs like "yes", "no", "continue" appropriately
- If users want to skip the tour, be gracious and encouraging
```

### 3. Voice Settings

Recommended voice settings in ElevenLabs:
- **Voice:** Rachel (or any clear, friendly voice)
- **Stability:** 0.75
- **Similarity Boost:** 0.75

## Tour Steps

The landing page tour includes these steps:

1. **Welcome Message** - Introduces Alex and asks if user wants the tour
2. **Smart Search** - Explains the AI-powered search functionality
3. **Search Examples** - Shows natural language examples
4. **Featured Places** - Highlights curated Ghana locations
5. **Trending Places** - Shows popular current destinations
6. **Contribute Banner** - Explains how users can add places
7. **Tour Complete** - Encourages exploration

## Customization

### Adding New Tour Steps

1. Edit `lib/onboarding/tour-data.ts`
2. Add new steps to `LANDING_PAGE_TOUR_STEPS` array
3. Add corresponding `data-tour` attributes to UI elements
4. Update tour flags in `types/onboarding.ts`

### Creating Tours for Other Pages

1. Create new tour data files (e.g., `search-page-tour.ts`)
2. Use the same context provider structure
3. Import `TourManager` component on the target page

### Styling Customization

Tour appearance can be customized in:
- `components/onboarding/tour-overlay.tsx` - Main tooltip styles
- `components/onboarding/tour-manager.tsx` - Welcome modal styles

## Accessibility Features

- **Subtitle support** - Visual text display of spoken content
- **Keyboard navigation** - Skip, next, previous controls
- **Screen reader friendly** - Proper ARIA labels and announcements
- **Fallback mode** - Browser speech synthesis if ElevenLabs fails
- **Respects user preferences** - Stores subtitle preferences

## Browser Support

- **Modern browsers** with Web Audio API support
- **Microphone access** required for voice interaction
- **Graceful degradation** to text-to-speech fallback
- **Mobile responsive** design

## Performance Considerations

- Tour data is loaded lazily
- Voice assets are cached when possible
- localStorage prevents tour from showing repeatedly
- Components are code-split for optimal loading

## Troubleshooting

### Common Issues

**Agent not speaking:**
- Check ElevenLabs agent ID in environment variables
- Verify microphone permissions are granted
- Check browser console for audio/network errors

**Tour not starting:**
- Clear localStorage: `placia_has_completed_landing_tour`
- Check if tour data is loading correctly
- Verify component imports and providers

**Voice recognition not working:**
- Ensure microphone permissions are granted
- Check browser compatibility with Web Audio API
- Verify ElevenLabs agent configuration

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('placia_tour_debug', 'true');
```

## Future Enhancements

- Multi-language support
- Voice customization options
- Advanced analytics and tracking
- A/B testing for different tour flows
- Integration with user onboarding metrics 