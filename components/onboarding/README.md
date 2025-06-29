# Placia AI Onboarding System

A simplified conversational AI onboarding system that combines **@reactour/tour** for visual highlighting and step management with **ElevenLabs Conversational AI** for voice interaction.

## 🚀 Quick Start

The onboarding system is already integrated into the app. First-time users will automatically see a welcome modal when they visit the homepage.

## 🏗️ Architecture

### Core Components

1. **TourManager** (`tour-manager.tsx`) - Main orchestrator
   - Manages welcome modal and tour flow
   - Handles user responses and tour progression
   - Controls floating tour button for returning users

2. **TourAgent** (`tour-agent.tsx`) - Voice AI integration
   - Connects to ElevenLabs conversational AI
   - Handles voice prompts and user voice input
   - Falls back to browser speech synthesis if ElevenLabs fails

3. **TourProvider** (`tour-context.tsx`) - Simple state management
   - Tracks completion status and preferences
   - Manages localStorage persistence

### Integration with @reactour/tour

- **@reactour/tour** handles all visual highlighting and step management
- **ElevenLabs** provides voice narration and user interaction
- Steps are synchronized: voice prompts match tour step indices

## 📝 Tour Steps

The tour includes these steps with corresponding data attributes:

1. **Search Input** - `[data-tour="search-input"]`
2. **Search Examples** - `[data-tour="search-examples"]`
3. **Featured Places** - `[data-tour="featured-places"]`
4. **Trending Places** - `[data-tour="trending-places"]`
5. **Contribute Banner** - `[data-tour="contribute-banner"]`

## ⚙️ Configuration

### Environment Variables

```bash
# Required for ElevenLabs integration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_agent_id_here
```

### Tour Data

Edit `lib/onboarding/tour-data.ts` to modify:
- `REACTOUR_STEPS` - Visual tour steps for @reactour/tour
- `VOICE_PROMPTS` - Corresponding voice narration (must match indices)
- `WELCOME_MESSAGE` - Initial greeting message
- `COMPLETION_MESSAGE` - Tour completion message

### Adding New Tour Steps

1. Add data attribute to UI element:
   ```jsx
   <div data-tour="new-step">Content to highlight</div>
   ```

2. Add step to `REACTOUR_STEPS` in `tour-data.ts`:
   ```js
   {
     selector: '[data-tour="new-step"]',
     content: 'Description of this step',
   }
   ```

3. Add voice prompt to `VOICE_PROMPTS` array (same index as step)

## 🎙️ Voice Features

- **ElevenLabs Integration**: Primary voice system with natural conversation
- **Browser Fallback**: Automatic fallback to Web Speech API if ElevenLabs fails
- **Voice Commands**: Recognizes "yes", "no", "continue", "skip", etc.
- **Auto-advance**: Automatically moves to next step after voice narration

## 🔧 Development Tools

- **TourTestButton** - Development-only button to test tours

## 📱 User Experience

1. **First Visit**: Welcome modal appears with AI introduction
2. **Voice Interaction**: Users can respond with voice or click buttons
3. **Visual Highlighting**: @reactour/tour highlights relevant UI elements
4. **Progressive Steps**: Tour automatically advances after each voice prompt
5. **Completion Tracking**: Users won't see tour again after completion
6. **Return Access**: Floating button allows users to restart tour

## 🛠️ Customization

### Styling @reactour/tour

The tour appearance is customized in `app/layout.tsx`:

```tsx
<TourProvider 
  steps={REACTOUR_STEPS}
  styles={{
    popover: (base) => ({
      ...base,
      '--reactour-accent': '#7c3aed', // Purple theme
      borderRadius: 10,
    }),
    // ... other styles
  }}
>
```

### Voice Settings

Modify voice behavior in `tour-data.ts`:

```js
export const TOUR_CONFIG = {
  AUTO_ADVANCE_DELAY: 3000, // ms to wait after speech
  VOICE_SETTINGS: {
    volume: 0.8,
    rate: 0.9,
    pitch: 1.0,
  },
};
```

## 🔄 Migration from Previous System

The old complex tour state management has been replaced with:
- **@reactour/tour** for step management and highlighting
- **Simplified context** for completion tracking only
- **Direct ElevenLabs integration** without complex state synchronization

## 📦 Dependencies

- `@reactour/tour` - Visual tour management
- `@elevenlabs/react` - ElevenLabs voice AI integration
- `framer-motion` - Animations and transitions

## 🚨 Troubleshooting

**Tour not starting:**
- Check that `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` is set
- Clear localStorage: `placia_has_completed_landing_tour`

**Voice not working:**
- Ensure microphone permissions are granted
- Check browser console for errors
- System falls back to browser speech synthesis automatically

**Elements not highlighting:**
- Verify data attributes are present on target elements
- Check that selectors in `REACTOUR_STEPS` match the DOM

## 🎯 Best Practices

1. **Keep voice prompts conversational** - Users should feel they're talking to a friendly guide
2. **Match step indices** - Voice prompts array must align with tour steps
3. **Test fallbacks** - Always test without ElevenLabs to ensure browser speech works
4. **Mobile-friendly** - Voice features work on mobile devices with proper permissions 