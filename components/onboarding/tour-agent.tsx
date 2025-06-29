'use client';

import React, { useEffect, useCallback, useRef, useState } from 'react';
import { useConversation } from '@elevenlabs/react';
import { useTour } from './tour-context';
import {
  AGENT_CONFIG,
  TOUR_CONFIG,
  VOICE_PROMPTS,
  WELCOME_MESSAGE,
  COMPLETION_MESSAGE,
} from '@/lib/onboarding/tour-data';

/**
 * TourAgent handles the voice interaction and speech synthesis for the onboarding tour.
 * It supports both ElevenLabs conversational AI and browser speech synthesis as fallback.
 *
 * VOICE QUALITY OPTIONS:
 *
 * 1. BROWSER SPEECH (Current Implementation)
 *    - Uses Web Speech API with enhanced voice selection
 *    - Automatically selects best available system voice
 *    - Quality depends on OS and installed voices
 *    - Windows 11: Microsoft Jenny/Emma (neural voices)
 *    - macOS: Alex, Samantha, Victoria (high quality)
 *    - Chrome: Google voices (cloud-based, high quality)
 *
 * 2. THIRD-PARTY TTS SERVICES (Integration Options)
 *
 *    A. Google Cloud Text-to-Speech
 *       - Neural voices (WaveNet/Neural2)
 *       - Add to .env: GOOGLE_CLOUD_TTS_API_KEY
 *       - Example: Journey, Neural2-A (very natural)
 *
 *    B. Amazon Polly
 *       - Neural voices
 *       - Add to .env: AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *       - Example: Joanna, Matthew (neural)
 *
 *    C. Azure Cognitive Services Speech
 *       - Neural voices
 *       - Add to .env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION
 *       - Example: en-US-JennyNeural, en-GB-LibbyNeural
 *
 *    D. OpenAI TTS
 *       - Very natural voices
 *       - Add to .env: OPENAI_API_KEY
 *       - Example: alloy, echo, fable, nova
 *
 * 3. INTEGRATION PATTERN:
 *    - Create /api/tts/[provider] routes
 *    - Modify speakMessage() to try: ElevenLabs → Third-party → Browser
 *    - Cache audio files for repeated phrases
 *    - Implement error handling and fallbacks
 *
 * 4. VOICE TESTING:
 *    - Use the Tour Test Button → "Test Voice" to preview current voice
 *    - Use "List All Voices" to see available system voices
 *    - Check browser console for voice selection logs
 */

interface TourAgentProps {
  onTourResponse: (
    response: 'yes' | 'no' | 'continue' | 'next',
    source?: 'voice' | 'button'
  ) => void;
  isWelcomeModal: boolean;
  currentStep: number; // -1 for welcome, 0-4 for tour steps
}

export function TourAgent({
  onTourResponse,
  isWelcomeModal,
  currentStep,
}: TourAgentProps) {
  const [isElevenLabsConnected, setIsElevenLabsConnected] = useState(false);
  const [useElevenLabs, setUseElevenLabs] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasSpokenForStep = useRef<number>(-2);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const handleUserInputRef = useRef<((transcript: string) => void) | null>(
    null
  );
  const stopCurrentSpeechRef = useRef<(() => void) | null>(null);
  const { setIsSpeaking: setGlobalIsSpeaking, registerSpeechController } =
    useTour();

  // ElevenLabs conversation hook
  const conversation = useConversation({
    onConnect: () => {
      console.log('🎙️ Connected to ElevenLabs');
      setIsElevenLabsConnected(true);
      setUseElevenLabs(true);
    },
    onDisconnect: () => {
      console.log('🎙️ Disconnected from ElevenLabs');
      setIsElevenLabsConnected(false);
      setIsSpeaking(false);
    },
    onMessage: (message) => {
      console.log('📝 ElevenLabs Message:', message);

      // Handle user input detection using ref to avoid stale closure
      if (
        message.source === 'user' &&
        message.message &&
        handleUserInputRef.current
      ) {
        handleUserInputRef.current(message.message);
      }
    },
    onError: (error) => {
      console.error('🚨 ElevenLabs Error:', error);
      setIsElevenLabsConnected(false);
      setUseElevenLabs(false);
    },
  });

  // Initialize conversation on mount
  useEffect(() => {
    initializeAgent();

    // Ensure voices are loaded for better voice selection
    if ('speechSynthesis' in window) {
      // Trigger voice loading if not already loaded
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.addEventListener('voiceschanged', () => {
          console.log(
            '🔄 Voices loaded:',
            window.speechSynthesis.getVoices().length
          );
        });
        // Trigger voice loading
        window.speechSynthesis.getVoices();
      }
    }

    return () => {
      cleanup();
    };
  }, []);

  // Handle step changes and speak appropriate message
  useEffect(() => {
    if (isWelcomeModal && hasSpokenForStep.current !== -1) {
      // Welcome message - wait for response
      speakMessage(WELCOME_MESSAGE, true);
      hasSpokenForStep.current = -1;
    } else if (
      currentStep >= 0 &&
      currentStep < VOICE_PROMPTS.length &&
      hasSpokenForStep.current !== currentStep
    ) {
      // Tour step message - auto advance
      console.log(
        '🎤 Speaking for step:',
        currentStep,
        'Previous:',
        hasSpokenForStep.current
      );
      speakMessage(VOICE_PROMPTS[currentStep], false);
      hasSpokenForStep.current = currentStep;
    } else if (
      currentStep >= VOICE_PROMPTS.length &&
      hasSpokenForStep.current !== 999
    ) {
      // Completion message
      speakMessage(COMPLETION_MESSAGE, false);
      hasSpokenForStep.current = 999;
    }
  }, [isWelcomeModal, currentStep]);

  // Reset speech tracking when tour starts fresh
  useEffect(() => {
    if (
      !isWelcomeModal &&
      currentStep === 0 &&
      hasSpokenForStep.current === -1
    ) {
      // Tour just started, reset tracking to allow step 0 to speak
      console.log('🔄 Tour started fresh, resetting speech tracking');
      hasSpokenForStep.current = -2;
    }
  }, [isWelcomeModal, currentStep]);

  // Initialize the agent (ElevenLabs or browser fallback)
  const initializeAgent = useCallback(async () => {
    // First, try ElevenLabs if agent ID is available
    if (AGENT_CONFIG.agentId) {
      try {
        console.log('🎙️ Attempting to connect to ElevenLabs...');
        await navigator.mediaDevices.getUserMedia({ audio: true });

        await conversation.startSession({
          agentId: AGENT_CONFIG.agentId,
        });

        console.log('✅ ElevenLabs initialized successfully');
        return;
      } catch (error) {
        console.warn(
          '⚠️ ElevenLabs initialization failed, using browser speech:',
          error
        );
      }
    } else {
      console.log(
        'ℹ️ No ElevenLabs agent ID provided, using browser speech synthesis.'
      );
    }

    // Fallback to browser speech synthesis
    setUseElevenLabs(false);
    setIsElevenLabsConnected(false);
  }, [conversation]);

  // Main speak message function
  const speakMessage = useCallback(
    async (message: string, waitForResponse: boolean) => {
      console.log(
        '🗣️ Speaking:',
        message.substring(0, 50) + '...',
        'via',
        useElevenLabs ? 'ElevenLabs' : 'Browser'
      );

      // Stop any ongoing speech FIRST
      stopCurrentSpeech();

      // Add a small delay to ensure cleanup is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      setIsSpeaking(true);

      // Only use ElevenLabs if connected and working
      if (
        useElevenLabs &&
        isElevenLabsConnected &&
        conversation.sendContextualUpdate
      ) {
        // Use ElevenLabs ONLY
        try {
          console.log('🎙️ Using ElevenLabs for speech');
          await conversation.sendContextualUpdate(
            `Please say this message to the user: "${message}"`
          );

          // Set up auto-advance for ElevenLabs (since we can't detect when it finishes easily)
          if (!waitForResponse) {
            timeoutRef.current = setTimeout(
              () => {
                setIsSpeaking(false);
                console.log('⏰ ElevenLabs auto-advance triggered');
                onTourResponse('next', 'voice');
              },
              estimateSpeechDuration(message) + TOUR_CONFIG.AUTO_ADVANCE_DELAY
            );
          } else {
            // For welcome message, just mark as not speaking after estimated duration
            timeoutRef.current = setTimeout(() => {
              setIsSpeaking(false);
            }, estimateSpeechDuration(message));
          }

          // SUCCESS - don't fallback to browser speech
          return;
        } catch (error) {
          console.error(
            '❌ ElevenLabs speech failed, falling back to browser:',
            error
          );
          // Reset speaking state before fallback
          setIsSpeaking(false);
          // Add delay before fallback
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }

      // Use browser speech synthesis (either as primary or fallback)
      console.log('🖥️ Using browser speech synthesis');
      speakWithBrowser(message, waitForResponse);
    },
    [useElevenLabs, isElevenLabsConnected, conversation, onTourResponse]
  );

  // Get the best available voice for speech synthesis
  const getBestVoice = useCallback(() => {
    if (!('speechSynthesis' in window)) return null;

    const voices = window.speechSynthesis.getVoices();
    console.log(
      '🎙️ Available voices:',
      voices.map((v) => `${v.name} (${v.lang})`)
    );

    // First try preferred voices from config
    for (const preferredName of TOUR_CONFIG.PREFERRED_VOICES) {
      const voice = voices.find((v) => v.name === preferredName);
      if (voice) {
        console.log('🎯 Selected voice:', voice.name, `(${voice.lang})`);
        return voice;
      }
    }

    // Fallback strategies
    const fallbackVoices = [
      // Any English female voice
      voices.find(
        (v) =>
          v.lang.startsWith('en') && v.name.toLowerCase().includes('female')
      ),
      voices.find(
        (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('woman')
      ),
      // Any English voice
      voices.find((v) => v.lang.startsWith('en-US')),
      voices.find((v) => v.lang.startsWith('en-GB')),
      voices.find((v) => v.lang.startsWith('en')),
      // Ultimate fallback
      voices[0],
    ].filter(Boolean);

    for (const voice of fallbackVoices) {
      if (voice) {
        console.log(
          '🎯 Selected fallback voice:',
          voice.name,
          `(${voice.lang})`
        );
        return voice;
      }
    }

    console.log('⚠️ No suitable voice found, using default');
    return null;
  }, []);

  // Browser speech synthesis
  const speakWithBrowser = useCallback(
    (text: string, waitForResponse: boolean) => {
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);

        // Set the best available voice
        const selectedVoice = getBestVoice();
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }

        utterance.rate = TOUR_CONFIG.VOICE_SETTINGS.rate;
        utterance.pitch = TOUR_CONFIG.VOICE_SETTINGS.pitch;
        utterance.volume = TOUR_CONFIG.VOICE_SETTINGS.volume;

        utterance.onstart = () => {
          setIsSpeaking(true);
          console.log(
            '🎤 Browser speech started with voice:',
            utterance.voice?.name || 'default'
          );
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
          console.log('🎤 Browser speech ended');

          if (!waitForResponse) {
            // Auto advance after a delay
            timeoutRef.current = setTimeout(() => {
              console.log('⏰ Browser auto-advance triggered');
              onTourResponse('next', 'voice');
            }, TOUR_CONFIG.AUTO_ADVANCE_DELAY);
          }
        };

        utterance.onerror = (error) => {
          console.error('❌ Browser speech error:', error);
          setIsSpeaking(false);
          currentUtteranceRef.current = null;
        };

        currentUtteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      }
    },
    [onTourResponse, getBestVoice]
  );

  // Estimate speech duration (roughly 150 words per minute)
  const estimateSpeechDuration = useCallback((text: string): number => {
    const wordsPerMinute = 150;
    const words = text.split(' ').length;
    const minutes = words / wordsPerMinute;
    return Math.max(2000, minutes * 60 * 1000); // Minimum 2 seconds
  }, []);

  // Stop any current speech
  const stopCurrentSpeech = useCallback(() => {
    console.log('🛑 Stopping all current speech');

    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Stop browser speech synthesis immediately
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      // Force stop any queued speech
      window.speechSynthesis.getVoices(); // This can help clear the queue
    }

    if (currentUtteranceRef.current) {
      currentUtteranceRef.current = null;
    }

    // Try to stop ElevenLabs if active (though we can't directly control it)
    if (isElevenLabsConnected && conversation) {
      try {
        // Note: ElevenLabs doesn't have a direct stop method, but we can try to interrupt
        // by sending a short message or pausing the conversation
        console.log('🛑 Attempting to interrupt ElevenLabs speech');
      } catch (error) {
        console.warn('Could not interrupt ElevenLabs:', error);
      }
    }

    setIsSpeaking(false);
  }, [isElevenLabsConnected, conversation]);

  // Cleanup function
  const cleanup = useCallback(() => {
    stopCurrentSpeech();

    if (conversation && isElevenLabsConnected) {
      try {
        conversation.endSession();
      } catch (error) {
        console.warn('Failed to end ElevenLabs session:', error);
      }
    }
  }, [conversation, isElevenLabsConnected]);

  // Handle user voice input
  const handleUserInput = useCallback(
    (transcript: string) => {
      const normalizedInput = transcript.toLowerCase().trim();
      console.log('👂 User input detected:', normalizedInput, 'Context:', {
        isWelcomeModal,
        currentStep,
      });

      // Stop current speech when user responds
      stopCurrentSpeech();

      // Context-aware response handling
      if (isWelcomeModal) {
        // Welcome modal responses
        if (
          normalizedInput.includes('yes') ||
          normalizedInput.includes('show me') ||
          normalizedInput.includes('sure') ||
          normalizedInput.includes('okay') ||
          normalizedInput.includes('ok') ||
          normalizedInput.includes('start')
        ) {
          console.log('✅ Welcome: User wants to start tour');
          onTourResponse('yes', 'voice');
        } else if (
          normalizedInput.includes('no') ||
          normalizedInput.includes('skip') ||
          normalizedInput.includes('thanks') ||
          normalizedInput.includes('not now') ||
          normalizedInput.includes('maybe later')
        ) {
          console.log('❌ Welcome: User declined tour');
          onTourResponse('no', 'voice');
        }
      } else {
        // During tour responses - treat positive responses as "continue"
        if (
          normalizedInput.includes('yes') ||
          normalizedInput.includes('sure') ||
          normalizedInput.includes('okay') ||
          normalizedInput.includes('ok') ||
          normalizedInput.includes('continue') ||
          normalizedInput.includes('next') ||
          normalizedInput.includes('go on') ||
          normalizedInput.includes('proceed') ||
          normalizedInput.includes('go') ||
          normalizedInput.includes('move on')
        ) {
          console.log('➡️ Tour: User wants to continue');
          onTourResponse('continue', 'voice');
        } else if (
          normalizedInput.includes('no') ||
          normalizedInput.includes('skip') ||
          normalizedInput.includes('stop') ||
          normalizedInput.includes('enough') ||
          normalizedInput.includes('done')
        ) {
          console.log('⏭️ Tour: User wants to skip/stop');
          onTourResponse('no', 'voice');
        }
      }
    },
    [onTourResponse, stopCurrentSpeech, isWelcomeModal, currentStep]
  );

  // Keep the ref updated with the latest handleUserInput function
  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  }, [handleUserInput]);

  // Keep the ref updated with the latest stopCurrentSpeech function
  useEffect(() => {
    stopCurrentSpeechRef.current = stopCurrentSpeech;
  }, [stopCurrentSpeech]);

  // Register speech controller with context on mount (only once)
  useEffect(() => {
    registerSpeechController({
      stop: () => {
        // Use the latest stopCurrentSpeech function via ref
        if (stopCurrentSpeechRef.current) {
          stopCurrentSpeechRef.current();
        }
      },
    });
    // Only register once, don't depend on changing functions
  }, [registerSpeechController]);

  // Update global speaking state when local state changes
  useEffect(() => {
    setGlobalIsSpeaking(isSpeaking);
  }, [isSpeaking, setGlobalIsSpeaking]);

  // This component doesn't render anything visible
  return null;
}
