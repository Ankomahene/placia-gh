'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  RotateCcw,
  Play,
  Square,
  SkipForward,
  SkipBack,
  Settings,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useTour } from '@reactour/tour';
import { useAudioTour } from './audio-tour-context';
import { useState } from 'react';

/**
 * Development-only component to test the audio tour functionality
 */
export function AudioTourTestButton() {
  const { setIsOpen, isOpen, currentStep, setCurrentStep, steps } = useTour();
  const {
    hasCompletedTour,
    resetTour,
    showSubtitles,
    setShowSubtitles,
    audioVolume,
    setAudioVolume,
    isPlaying,
    pauseAudio,
    resumeAudio,
    stopAudio,
    audioLoading,
    audioError,
  } = useAudioTour();

  const [showControls, setShowControls] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleStartTour = () => {
    // Use the exposed global function
    if ((window as any).startAudioTour) {
      (window as any).startAudioTour();
    } else {
      console.warn('Audio tour function not available');
    }
  };

  const handleStopTour = () => {
    stopAudio();
    setIsOpen(false);
  };

  const handleResetTour = () => {
    resetTour();
    setIsOpen(false);
  };

  const handleNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseAudio();
    } else {
      resumeAudio();
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-2">
      {/* Main Controls */}
      <div className="flex flex-col gap-2">
        <Button
          onClick={
            showControls ? () => setShowControls(false) : handleStartTour
          }
          disabled={isOpen && !showControls}
          size="sm"
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Bot className="w-4 h-4 mr-2" />
          {showControls ? 'Hide Controls' : 'Audio Tour'}
        </Button>

        {!showControls && hasCompletedTour && (
          <Button
            onClick={handleResetTour}
            size="sm"
            variant="outline"
            className="border-purple-600 text-purple-600 hover:bg-purple-50"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Tour
          </Button>
        )}

        <Button
          onClick={() => setShowControls(!showControls)}
          size="sm"
          variant="ghost"
          className="text-xs"
        >
          <Settings className="w-3 h-3 mr-1" />
          {showControls ? 'Hide' : 'Show'} Controls
        </Button>
      </div>

      {/* Advanced Controls Panel */}
      {showControls && (
        <Card className="p-3 bg-white/95 backdrop-blur-sm border-purple-200 shadow-lg max-w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-purple-800 text-sm">
                Audio Tour Controls
              </h3>
              <div className="flex gap-1">
                {!isOpen ? (
                  <Button
                    size="sm"
                    onClick={handleStartTour}
                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                    disabled={audioLoading}
                  >
                    <Play className="w-3 h-3" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleStopTour}
                    variant="destructive"
                    className="h-6 px-2 text-xs"
                  >
                    <Square className="w-3 h-3" />
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleResetTour}
                  variant="outline"
                  className="h-6 px-2 text-xs"
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </div>
            </div>

            {/* Audio Status */}
            <div className="text-xs space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Active:</strong> {isOpen ? '✅' : '❌'}
                </div>
                <div>
                  <strong>Playing:</strong> {isPlaying ? '🎵' : '⏸️'}
                </div>
              </div>
              <div>
                <strong>Current Step:</strong> {currentStep + 1} /{' '}
                {steps.length}
              </div>
              <div>
                <strong>Completed:</strong> {hasCompletedTour ? '✅' : '❌'}
              </div>
              {audioLoading && (
                <div className="text-yellow-600">
                  <strong>Status:</strong> Loading audio...
                </div>
              )}
              {audioError && (
                <div className="text-red-600">
                  <strong>Error:</strong> {audioError}
                </div>
              )}
            </div>

            {/* Audio Controls */}
            {isOpen && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={togglePlayPause}
                    disabled={audioLoading}
                    variant="outline"
                    className="h-6 px-2 text-xs flex-1"
                  >
                    {isPlaying ? (
                      <>
                        <Square className="w-3 h-3 mr-1" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 mr-1" />
                        Play
                      </>
                    )}
                  </Button>
                </div>

                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0 || audioLoading}
                    variant="outline"
                    className="h-6 px-2 text-xs flex-1"
                  >
                    <SkipBack className="w-3 h-3 mr-1" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNextStep}
                    disabled={currentStep === steps.length - 1 || audioLoading}
                    variant="outline"
                    className="h-6 px-2 text-xs flex-1"
                  >
                    Next
                    <SkipForward className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                {/* Step Selector */}
                <div className="space-y-1">
                  <div className="text-xs font-medium">Jump to Step:</div>
                  <div className="grid grid-cols-6 gap-1">
                    {steps.map((_, index) => (
                      <Button
                        key={index}
                        size="sm"
                        onClick={() => setCurrentStep(index)}
                        variant={currentStep === index ? 'default' : 'outline'}
                        className="h-6 px-1 text-xs"
                        disabled={audioLoading}
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Audio Settings */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Audio Settings:</div>

              {/* Volume Control */}
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <VolumeX className="w-3 h-3" />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={audioVolume}
                    onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <Volume2 className="w-3 h-3" />
                  <span className="text-xs">
                    {Math.round(audioVolume * 100)}%
                  </span>
                </div>
              </div>

              {/* Subtitles Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test-subtitles"
                  checked={showSubtitles}
                  onChange={(e) => setShowSubtitles(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="test-subtitles" className="text-xs">
                  Show Subtitles
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 bg-purple-50 p-2 rounded">
              <div className="font-medium mb-1">💡 Audio Tour Info:</div>
              <ul className="space-y-1 text-xs">
                <li>• Pre-recorded audio files in /public/audio/tour/</li>
                <li>• Synced with @reactour/tour visual highlighting</li>
                <li>• Automatic step progression</li>
                <li>• Audio controls and subtitles support</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
