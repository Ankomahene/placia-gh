# Onboarding V2 - Pre-recorded Audio Tour

This is an alternative implementation of the tour system using pre-recorded audio files instead of live ElevenLabs conversation.

## Approach

1. **Pre-generated Audio Files**: All tour speeches are pre-recorded in ElevenLabs and stored as audio files
2. **React Tour Integration**: Uses @reactour/tour for visual highlighting 
3. **Audio Playback**: Plays corresponding audio for each tour step
4. **Better Performance**: No real-time API calls, faster loading
5. **Consistent Quality**: Same voice quality every time
6. **Offline Support**: Works without internet after initial load

## Audio Files Structure

```
public/audio/tour/
├── intro.mp3
├── step-1-search-input.mp3
├── step-2-search-examples.mp3
├── step-3-map-preview.mp3
├── step-4-featured-places.mp3
├── step-5-trending-places.mp3
├── step-6-contribute-banner.mp3
└── completion.mp3
```

## Components

- `AudioTourProvider` - Context for managing audio playback
- `AudioTourManager` - Main tour orchestration
- `AudioTourAgent` - Audio playback controller
- `TourProviderWrapper` - @reactour/tour integration

## Usage

The system automatically syncs audio with visual tour steps and provides controls for play/pause/skip. 