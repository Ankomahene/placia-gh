'use client';

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
} from 'react';

interface AudioTourContextType {
  // Tour state
  hasCompletedTour: boolean;
  setHasCompletedTour: (completed: boolean) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  currentAudioStep: number;
  setCurrentAudioStep: (step: number) => void;

  // Audio controls
  playAudio: (audioFile: string) => Promise<void>;
  stopAudio: () => void;
  pauseAudio: () => void;
  resumeAudio: () => void;

  // Audio state
  audioLoading: boolean;
  audioError: string | null;
  audioProgress: number;
  audioDuration: number;

  // Settings
  showSubtitles: boolean;
  setShowSubtitles: (show: boolean) => void;
  audioVolume: number;
  setAudioVolume: (volume: number) => void;

  // Utility
  resetTour: () => void;
}

const AudioTourContext = createContext<AudioTourContextType | undefined>(
  undefined
);

interface AudioTourProviderProps {
  children: React.ReactNode;
}

export function AudioTourProvider({ children }: AudioTourProviderProps) {
  // Tour state
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioStep, setCurrentAudioStep] = useState(-1);

  // Audio state
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);

  // Settings
  const [showSubtitles, setShowSubtitles] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0.8);

  // Audio element ref
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio element
  React.useEffect(() => {
    const audio = new Audio();
    audio.volume = audioVolume;
    audioRef.current = audio;

    // Audio event listeners
    const handleLoadStart = () => setAudioLoading(true);
    const handleCanPlay = () => setAudioLoading(false);
    const handleLoadedMetadata = () => {
      setAudioDuration(audio.duration);
    };
    const handlePlay = () => {
      setIsPlaying(true);
      startProgressTracking();
    };
    const handlePause = () => {
      setIsPlaying(false);
      stopProgressTracking();
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setAudioProgress(0);
      stopProgressTracking();
    };
    const handleError = () => {
      setAudioError('Failed to load audio');
      setAudioLoading(false);
      setIsPlaying(false);
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      stopProgressTracking();
    };
  }, [audioVolume]);

  // Progress tracking
  const startProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setAudioProgress(audioRef.current.currentTime);
      }
    }, 100);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  // Audio controls
  const playAudio = useCallback(async (audioFile: string): Promise<void> => {
    if (!audioRef.current) return;

    return new Promise((resolve, reject) => {
      const audio = audioRef.current!;

      try {
        setAudioError(null);
        setAudioLoading(true);

        // Stop current audio if playing
        audio.pause();
        audio.currentTime = 0;

        // Set up event listeners for this playback
        const handleEnded = () => {
          cleanup();
          resolve();
        };

        const handleError = () => {
          setAudioError('Failed to play audio');
          setIsPlaying(false);
          setAudioLoading(false);
          cleanup();
          reject(new Error('Audio playback failed'));
        };

        const cleanup = () => {
          audio.removeEventListener('ended', handleEnded);
          audio.removeEventListener('error', handleError);
        };

        audio.addEventListener('ended', handleEnded);
        audio.addEventListener('error', handleError);

        // Load and play new audio
        audio.src = audioFile;
        audio.load();
        audio
          .play()
          .then(() => {
            setAudioLoading(false);
          })
          .catch(handleError);
      } catch (error) {
        console.error('❌ Audio setup error:', error);
        setAudioError('Failed to setup audio');
        setIsPlaying(false);
        setAudioLoading(false);
        reject(error);
      }
    });
  }, []);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setAudioProgress(0);
    }
  }, []);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const resumeAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch(console.error);
    }
  }, []);

  // Update volume when it changes
  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = audioVolume;
    }
  }, [audioVolume]);

  // Reset tour
  const resetTour = useCallback(() => {
    setHasCompletedTour(false);
    setCurrentAudioStep(-1);
    stopAudio();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('placia_audio_tour_completed');
    }
  }, [stopAudio]);

  // Load saved state
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const completed = localStorage.getItem('placia_audio_tour_completed');
      if (completed === 'true') {
        setHasCompletedTour(true);
      }

      const preferences = localStorage.getItem('placia_audio_tour_preferences');
      if (preferences) {
        try {
          const prefs = JSON.parse(preferences);
          if (prefs.showSubtitles !== undefined) {
            setShowSubtitles(prefs.showSubtitles);
          }
          if (prefs.audioVolume !== undefined) {
            setAudioVolume(prefs.audioVolume);
          }
        } catch (error) {
          console.warn('Failed to parse audio tour preferences');
        }
      }
    }
  }, []);

  // Save preferences
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const preferences = {
        showSubtitles,
        audioVolume,
      };
      localStorage.setItem(
        'placia_audio_tour_preferences',
        JSON.stringify(preferences)
      );
    }
  }, [showSubtitles, audioVolume]);

  const contextValue: AudioTourContextType = {
    hasCompletedTour,
    setHasCompletedTour,
    isPlaying,
    setIsPlaying,
    currentAudioStep,
    setCurrentAudioStep,
    playAudio,
    stopAudio,
    pauseAudio,
    resumeAudio,
    audioLoading,
    audioError,
    audioProgress,
    audioDuration,
    showSubtitles,
    setShowSubtitles,
    audioVolume,
    setAudioVolume,
    resetTour,
  };

  return (
    <AudioTourContext.Provider value={contextValue}>
      {children}
    </AudioTourContext.Provider>
  );
}

export function useAudioTour() {
  const context = useContext(AudioTourContext);
  if (context === undefined) {
    throw new Error('useAudioTour must be used within an AudioTourProvider');
  }
  return context;
}
