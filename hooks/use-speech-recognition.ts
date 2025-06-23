'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
}

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
  confidenceThreshold?: number;
  silenceTimeout?: number; // ms to stop listening after silence
  autoStart?: boolean;
}

interface UseSpeechRecognitionReturn {
  // State
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: string | null;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;

  // Settings
  language: string;
  setLanguage: (lang: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }

  interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    maxAlternatives: number;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onstart: ((this: SpeechRecognition, ev: Event) => any) | null;
    onend: ((this: SpeechRecognition, ev: Event) => any) | null;
    onerror:
      | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
      | null;
    onresult:
      | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
      | null;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }

  interface SpeechRecognitionErrorEvent extends Event {
    readonly error: string;
    readonly message: string;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  var SpeechRecognition: {
    new (): SpeechRecognition;
  };
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): UseSpeechRecognitionReturn {
  const {
    language = 'en-US',
    continuous = false,
    interimResults = true,
    maxAlternatives = 1,
    confidenceThreshold = 0.7,
    silenceTimeout = 3000,
    autoStart = false,
  } = options;

  // State
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isListeningRef = useRef(false);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser');
    }
  }, []);

  // Configure speech recognition
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;

    // Configure recognition settings
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;
    recognition.lang = currentLanguage;

    // Result handler
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptText = result[0].transcript;

        if (result.isFinal) {
          // Only accept results above confidence threshold
          if (result[0].confidence >= confidenceThreshold) {
            finalTranscript += transcriptText;
            setConfidence(result[0].confidence);
          }
        } else {
          interimText += transcriptText;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
        setInterimTranscript('');

        // Reset silence timeout on successful recognition
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // If not continuous, stop after getting a result
        if (!continuous) {
          stopListening();
        }
      } else {
        setInterimTranscript(interimText);
      }

      // Set silence timeout for continuous mode
      if (continuous && isListeningRef.current) {
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }

        // Only set silence timeout if we have some transcript content
        // This prevents stopping during initial silence or brief pauses
        if (finalTranscript || interimText) {
          silenceTimeoutRef.current = setTimeout(() => {
            if (isListeningRef.current) {
              stopListening();
            }
          }, silenceTimeout);
        }
      }
    };

    // Error handler
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('🚨 Speech recognition error:', {
        error: event.error,
        message: event.message,
        timeStamp: event.timeStamp,
        type: event.type,
      });

      switch (event.error) {
        case 'no-speech':
          setError('No speech detected. Please try again.');
          break;
        case 'audio-capture':
          setError('Microphone access denied or not available.');
          break;
        case 'not-allowed':
          setError('Microphone permission denied.');
          break;
        case 'network':
          setError(
            'Voice search blocked by network. Please type your search instead or try a different network.'
          );
          break;
        case 'service-not-allowed':
          setError('Speech recognition blocked by browser or security policy.');
          break;
        case 'aborted':
          // Don't show error for user-initiated stops
          setError(null);
          break;
        default:
          setError(`Speech recognition error: ${event.error}`);
      }

      setIsListening(false);
      isListeningRef.current = false;
    };

    // Start handler
    recognition.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
      setError(null);
    };

    // End handler
    recognition.onend = () => {
      setIsListening(false);
      isListeningRef.current = false;
      setInterimTranscript('');

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, [
    continuous,
    interimResults,
    maxAlternatives,
    currentLanguage,
    confidenceThreshold,
    silenceTimeout,
  ]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition not available');
      return;
    }

    if (isListeningRef.current) {
      return; // Already listening
    }

    try {
      setError(null);
      setInterimTranscript('');
      setTranscript(''); // Clear previous transcript

      recognitionRef.current.start();
    } catch (err) {
      console.error('❌ Immediate error calling start():', err);
      setError('Failed to initialize speech recognition');
    }
  }, [isSupported]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch (err) {
      console.error('Speech recognition stop error:', err);
    }

    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Auto start if requested
  useEffect(() => {
    if (autoStart && isSupported && !isListening) {
      startListening();
    }
  }, [autoStart, isSupported, isListening, startListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current && isListeningRef.current) {
        recognitionRef.current.stop();
      }
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    confidence,
    error,

    // Actions
    startListening,
    stopListening,
    resetTranscript,

    // Settings
    language: currentLanguage,
    setLanguage: setCurrentLanguage,
  };
}
