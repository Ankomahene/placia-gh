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

### Error Handling
The system handles various error scenarios:
- Microphone permission denied
- No speech detected
- Network errors (for browser-based processing)
- Browser compatibility issues

## Configuration Options

### Language Support
```typescript
// Supported languages (browser dependent)
'en-US' // English (US)
'en-GB' // English (UK) 
'fr-FR' // French
'es-ES' // Spanish
// ... more based on browser support
```

### Confidence Thresholds
- **0.9+** - Excellent quality
- **0.7-0.9** - Good quality (recommended)
- **0.5-0.7** - Acceptable quality
- **<0.5** - Poor quality (filtered out)

### Timeout Settings
- **silenceTimeout**: Stop recording after silence (default: 2000ms)
- **continuous**: Keep listening after each result (default: false)
- **interimResults**: Show partial results while speaking (default: true)

## Future Enhancements

### Server-based Alternatives
If browser-based speech recognition proves insufficient, consider:

1. **OpenAI Whisper API**
   - Higher accuracy
   - Better noise handling
   - Consistent cross-browser experience
   - Cost: ~$0.006 per minute

2. **Google Speech-to-Text API**
   - Enterprise-grade accuracy
   - Custom vocabulary support
   - Multiple language support
   - Cost: ~$0.016 per minute

3. **Azure Speech Services**
   - Real-time streaming
   - Custom speech models
   - Integration with translation
   - Cost: ~$1.00 per hour

### Implementation Strategy
1. Start with browser-based for immediate feedback
2. Monitor usage patterns and error rates
3. Implement server fallback for unsupported browsers
4. Consider hybrid approach (browser first, server fallback)

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

## Testing

### Manual Testing
1. Test in different browsers
2. Try various accents and speech patterns
3. Test with background noise
4. Verify error handling
5. Check accessibility features

### Automated Testing
```typescript
// Example test structure
describe('Voice Search', () => {
  it('should start listening when button clicked', () => {
    // Test implementation
  });
  
  it('should handle microphone permission denial', () => {
    // Test implementation
  });
  
  it('should populate input with transcript', () => {
    // Test implementation
  });
});
```

## Deployment Considerations

### HTTPS Requirement
Speech recognition requires HTTPS in production. Ensure:
- SSL certificate is properly configured
- All assets are served over HTTPS
- No mixed content warnings

### Privacy Policy
Update privacy policy to mention:
- Voice data is processed locally in browser
- No voice data is sent to external servers (for browser-based)
- Microphone permission requirements

### Analytics
Track key metrics:
- Voice search usage rates
- Success/failure rates by browser
- Average transcript accuracy
- User fallback to text input rates 