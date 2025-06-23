# Voice Search Implementation

## Overview

The voice search functionality has been implemented using browser-based speech recognition with a reusable hook approach. This provides real-time voice-to-text conversion for search queries.

## Browser Support & Efficiency

### ✅ Pros
- **Real-time processing** - No server latency
- **Works offline** - No internet required for speech recognition
- **No API costs** - Uses browser's built-in capabilities
- **Privacy-friendly** - No data sent to external servers
- **Built-in support** - Available in modern browsers

### ❌ Cons
- **Limited browser support** - Works best in Chrome/Edge
- **Accuracy varies** - Depends on accent, noise, and pronunciation
- **Language support** - Limited to browser's supported languages
- **No custom training** - Cannot improve accuracy for specific vocabulary

### Browser Compatibility
- ✅ **Chrome/Chromium** - Full support
- ✅ **Edge** - Full support  
- ⚠️ **Safari** - Limited support
- ❌ **Firefox** - No support
- ❌ **Mobile browsers** - Mixed support

## Architecture

### Hook: `useSpeechRecognition`
Location: `hooks/use-speech-recognition.ts`

**Features:**
- Configurable language and settings
- Confidence threshold filtering
- Silence timeout handling
- Real-time interim results
- Comprehensive error handling
- Auto-cleanup on unmount

**Usage:**
```typescript
const speechRecognition = useSpeechRecognition({
  language: 'en-US',
  continuous: false,
  interimResults: true,
  confidenceThreshold: 0.6,
  silenceTimeout: 2000,
});
```

### Integration: `ChatContext`
Location: `components/search/views/chat/ChatContext.tsx`

**Features:**
- Integrated with existing chat functionality
- Auto-population of input field
- State management for voice recording
- Error handling and user feedback

### UI Components

#### `ChatInput`
- Voice recording button with visual states
- Real-time transcript preview
- Input field highlighting during recording
- Accessibility tooltips

#### `ListeningPopup`
- Full-screen overlay during recording
- Animated microphone with pulse effect
- Live transcript display
- Confidence meter
- Error state handling

## Usage Examples

### Basic Voice Search
1. Click the microphone button in the chat input
2. Speak your search query clearly
3. The transcript appears in real-time
4. Click microphone again to stop (or wait for silence timeout)
5. The search automatically executes

### Example Queries
- "Find me restaurants near the airport"
- "Show me luxury hotels in Accra"
- "What are some popular attractions in Kumasi?"
- "I'm looking for budget-friendly places to stay"

## Integration in Other Components

To use voice search in other parts of the app:

```typescript
import { useSpeechRecognition } from '@/hooks/use-speech-recognition';

function MySearchComponent() {
  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    confidenceThreshold: 0.7,
  });

  const handleVoiceSearch = () => {
    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    } else {
      speechRecognition.startListening();
    }
  };

  // Auto-populate search field with transcript
  useEffect(() => {
    if (speechRecognition.transcript && !speechRecognition.isListening) {
      setSearchQuery(speechRecognition.transcript);
      // Optionally trigger search automatically
      performSearch(speechRecognition.transcript);
    }
  }, [speechRecognition.transcript, speechRecognition.isListening]);

  return (
    <div>
      <input 
        value={
          speechRecognition.isListening && speechRecognition.interimTranscript
            ? speechRecognition.transcript + speechRecognition.interimTranscript
            : searchQuery
        }
        placeholder={
          speechRecognition.isListening 
            ? "Listening..." 
            : "Search places..."
        }
        readOnly={speechRecognition.isListening}
      />
      <button 
        onClick={handleVoiceSearch}
        disabled={!speechRecognition.isSupported}
      >
        {speechRecognition.isListening ? 'Stop' : 'Voice Search'}
      </button>
      
      {speechRecognition.error && (
        <div className="error">{speechRecognition.error}</div>
      )}
    </div>
  );
}
```

## Performance Metrics

### Typical Response Times
- **Start listening**: <100ms
- **Interim results**: 200-500ms
- **Final transcript**: 500-1500ms
- **Search execution**: 1-3 seconds

### Accuracy Expectations
- **Clear speech, quiet environment**: 85-95%
- **Noisy environment**: 60-80%
- **Strong accents**: 50-75%
- **Technical terms**: 40-70%

## Future Server-based Alternatives

If browser-based speech recognition proves insufficient:

1. **OpenAI Whisper API** (~$0.006/minute)
2. **Google Speech-to-Text API** (~$0.016/minute)  
3. **Azure Speech Services** (~$1.00/hour)

Implementation strategy:
1. Start with browser-based (current)
2. Monitor usage and error rates
3. Add server fallback for unsupported browsers
4. Consider hybrid approach 