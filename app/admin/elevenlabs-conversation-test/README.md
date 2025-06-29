# ElevenLabs Conversational AI Test Page

This test page allows you to test ElevenLabs conversational AI with voice input/output capabilities.

## Features

- 🎤 **Voice Recording**: Click "Start Agent Conversation" to begin voice recording
- 🔊 **Text-to-Speech**: AI responses are automatically converted to speech
- 💬 **Text Input**: Alternative text input for testing
- ⚙️ **Voice Settings**: Configurable voice parameters and models
- 📝 **Conversation History**: Full conversation tracking with audio playback
- 📥 **Export**: Export conversation data as JSON

## Setup

### 1. Environment Variables

Add your ElevenLabs API key to your `.env.local` file:

```env
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### 2. Get ElevenLabs API Key

1. Sign up at [ElevenLabs](https://elevenlabs.io/)
2. Go to your [API Keys page](https://elevenlabs.io/docs/api-reference/authentication)
3. Create a new API key
4. Copy the key to your environment variables

## Usage

### Starting a Conversation

1. Navigate to `/admin/elevenlabs-conversation-test`
2. Click the **"Start Agent Conversation"** button
3. Allow microphone permissions when prompted
4. Speak your message
5. Click **"Stop Recording"** when finished
6. The AI will respond with both text and speech

### Alternative Text Input

- Use the text input field to type messages instead of voice
- Press Enter or click "Send" to submit
- Useful for testing without microphone access

### Voice Settings

Switch to the "Voice Settings" tab to configure:

- **Voice**: Choose from available ElevenLabs voices
- **Model**: Select the AI model (Turbo v2 recommended for speed)
- **Stability**: Controls voice consistency (0-1)
- **Similarity Boost**: Enhances voice similarity (0-1)
- **Style**: Adjusts speaking style (0-1)
- **Speaker Boost**: Improves audio clarity

### Available Voices

- Rachel - Calm American Female
- Drew - Well-rounded American Male
- Clyde - War Veteran American Male
- Paul - Ground Reporter American Male
- Domi - Strong American Female
- Dave - Conversational British Male
- Fin - Sailor Irish Male
- Sarah - News Presenter American Female
- Antoni - Well-rounded American Male
- Thomas - Calm American Male

## Controls

- **🎤 Start Agent Conversation**: Begin voice recording
- **⏹️ Stop Recording**: End voice recording and process
- **🔊 Mute/Unmute**: Toggle auto-play of AI responses
- **🗑️ Clear Chat**: Clear conversation history
- **📥 Export**: Download conversation as JSON
- **▶️ Play Audio**: Replay any message audio

## API Integration

The test page uses a mock conversational AI response. To integrate with actual ElevenLabs Conversational AI:

1. Update the `sendToElevenLabsConversational` function in `page.tsx`
2. Replace the mock response with actual ElevenLabs Conversational AI API calls
3. Handle audio input processing and conversation context

## Troubleshooting

### No Audio Generated

- Check that `ELEVENLABS_API_KEY` is set correctly
- Verify your ElevenLabs account has sufficient credits
- Check browser console for API errors

### Microphone Issues

- Ensure microphone permissions are granted
- Try refreshing the page if recording fails
- Check browser compatibility with MediaRecorder API

### API Errors

- Check the Network tab in browser dev tools
- Verify the API key is valid and has credits
- Check ElevenLabs API status

## Browser Compatibility

- Chrome 49+ (recommended)
- Firefox 29+
- Safari 14.1+
- Edge 79+

Requires: MediaRecorder API, getUserMedia API, Web Audio API

## File Structure

```
app/admin/elevenlabs-conversation-test/
├── page.tsx              # Main test page component
├── README.md             # This documentation
└── ...

app/api/elevenlabs/
└── text-to-speech/
    └── route.ts           # ElevenLabs TTS API route
```

## Next Steps

To extend this test page:

1. Integrate with ElevenLabs Conversational AI API
2. Add speech-to-text for voice input processing
3. Implement conversation context management
4. Add more voice customization options
5. Integrate with your place search functionality 