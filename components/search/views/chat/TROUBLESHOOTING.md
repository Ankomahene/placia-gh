# Voice Search Troubleshooting

## Common Issues and Solutions

### 🔴 Network Error
**Error:** `"Network connection issue. Check your internet or try again."`

**Causes:**
- Corporate firewall blocking Google's speech recognition service
- Internet connectivity issues
- Regional restrictions in some countries
- VPN interference

**Solutions:**
1. **Check Internet Connection** - Ensure stable internet
2. **Disable VPN** - Temporarily disable VPN if using one
3. **Try Different Network** - Switch to mobile hotspot or different WiFi
4. **Corporate Network** - Ask IT to whitelist speech recognition domains:
   - `*.google.com`
   - `*.googleapis.com` 
   - `speechapi.googleapis.com`

### 🔴 Permission Denied
**Error:** `"Microphone permission denied."`

**Solutions:**
1. **Grant Permission** - Click "Allow" when browser prompts for microphone access
2. **Check Browser Settings** - Go to browser settings → Privacy → Microphone → Allow for this site
3. **Check System Settings** - Ensure microphone is enabled in system settings

### 🔴 No Speech Detected
**Error:** `"No speech detected. Please try again."`

**Solutions:**
1. **Check Microphone** - Ensure microphone is working and not muted
2. **Speak Clearly** - Speak directly into microphone with clear pronunciation
3. **Reduce Background Noise** - Move to quieter environment
4. **Adjust Volume** - Ensure microphone sensitivity is adequate

### 🔴 Browser Not Supported
**Error:** `"Speech recognition is not supported in this browser"`

**Browser Compatibility:**
- ✅ **Chrome/Chromium** - Full support
- ✅ **Edge** - Full support
- ⚠️ **Safari** - Limited support
- ❌ **Firefox** - No support

**Solutions:**
1. **Use Chrome or Edge** - Switch to a supported browser
2. **Update Browser** - Ensure you're using latest version
3. **Enable Experimental Features** - In Chrome, go to `chrome://flags` and enable Web Speech API

### 🔴 HTTPS Required
**Error:** Various security-related errors

**Solutions:**
1. **Development** - Use `localhost` (works with HTTP)
2. **Production** - Ensure site is served over HTTPS
3. **Local Testing** - Use `https://localhost` or tools like ngrok

## Best Practices for Voice Search

### 🎤 **For Users:**
- Speak clearly and at normal pace
- Use natural language: "Find restaurants near me"
- Avoid very long sentences
- Try again if first attempt fails
- Use in quiet environment when possible

### 🎯 **Sample Effective Queries:**
- "Show me hotels in Accra"
- "Find restaurants near the airport" 
- "I need budget-friendly places to stay"
- "What attractions are popular in Kumasi?"

### ⚠️ **Avoid:**
- Very long, complex sentences
- Speaking too fast or too slow
- Technical jargon or unusual place names
- Background conversations or noise

## Alternative Options

If voice search continues to fail:

1. **Type Your Query** - Use the regular text input
2. **Try Different Browser** - Switch to Chrome or Edge
3. **Check Network** - Try different internet connection
4. **Contact Support** - Report persistent issues

## Performance Tips

- **Confidence Threshold**: Currently set to 60% - lower values accept less accurate transcriptions
- **Silence Timeout**: 2 seconds - recording stops after this period of silence
- **Language**: Currently set to English (US) - affects recognition accuracy

## Future Enhancements

If browser-based speech recognition proves insufficient, we're considering:
- Server-based speech recognition (OpenAI Whisper, Google Speech-to-Text)
- Offline speech recognition capabilities
- Custom vocabulary for place names in Ghana 