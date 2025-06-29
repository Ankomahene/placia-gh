'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Bot,
  RotateCcw,
  Play,
  Square,
  SkipForward,
  SkipBack,
  Settings,
} from 'lucide-react';
import { useTour } from '@reactour/tour';
import { useTour as usePlaciatour } from './tour-context';
import { useState } from 'react';

/**
 * Enhanced development-only component to test the tour functionality
 * Provides controls for both @reactour/tour and ElevenLabs integration
 */
export function TourTestButton() {
  const { setIsOpen, isOpen, currentStep, setCurrentStep, steps } = useTour();
  const {
    hasCompletedTour,
    resetTour,
    showSubtitles,
    setShowSubtitles,
    isSpeaking,
    stopCurrentSpeech,
  } = usePlaciatour();
  const [showControls, setShowControls] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const handleStartTour = () => {
    // Use the tour manager's exposed function if available
    if ((window as any).startTestTour) {
      (window as any).startTestTour();
    } else {
      // Fallback to direct reactour control
      setIsOpen(true);
    }
  };

  const handleStopTour = () => {
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

  const handleGoToStep = (stepIndex: number) => {
    setCurrentStep(stepIndex);
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
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Bot className="w-4 h-4 mr-2" />
          {showControls ? 'Hide Controls' : 'Start Tour'}
        </Button>

        {!showControls && hasCompletedTour && (
          <Button
            onClick={handleResetTour}
            size="sm"
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
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
        <Card className="p-3 bg-white/95 backdrop-blur-sm border-blue-200 shadow-lg max-w-80">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-800 text-sm">
                Tour Controls
              </h3>
              <div className="flex gap-1">
                {!isOpen ? (
                  <Button
                    size="sm"
                    onClick={handleStartTour}
                    className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
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

            {/* Tour Status */}
            <div className="text-xs space-y-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <strong>Active:</strong> {isOpen ? '✅' : '❌'}
                </div>
                <div>
                  <strong>Completed:</strong> {hasCompletedTour ? '✅' : '❌'}
                </div>
              </div>
              <div>
                <strong>Current Step:</strong> {currentStep + 1} /{' '}
                {steps.length}
              </div>
            </div>

            {/* Step Navigation */}
            {isOpen && (
              <div className="space-y-2">
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    onClick={handlePrevStep}
                    disabled={currentStep === 0}
                    variant="outline"
                    className="h-6 px-2 text-xs flex-1"
                  >
                    <SkipBack className="w-3 h-3 mr-1" />
                    Prev
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleNextStep}
                    disabled={currentStep === steps.length - 1}
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
                  <div className="grid grid-cols-5 gap-1">
                    {steps.map((_, index) => (
                      <Button
                        key={index}
                        size="sm"
                        onClick={() => handleGoToStep(index)}
                        variant={currentStep === index ? 'default' : 'outline'}
                        className="h-6 px-1 text-xs"
                      >
                        {index + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Settings:</div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="subtitles"
                  checked={showSubtitles}
                  onChange={(e) => setShowSubtitles(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="subtitles" className="text-xs">
                  Show Subtitles
                </label>
              </div>
            </div>

            {/* Voice Testing */}
            <div className="space-y-2">
              <div className="text-xs font-medium">Voice Testing:</div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={stopCurrentSpeech}
                  disabled={!isSpeaking}
                  variant="destructive"
                  className="h-6 px-2 text-xs flex-1"
                >
                  🛑 Stop Speech
                </Button>
                <div className="text-xs self-center">
                  {isSpeaking ? '🎤 Speaking' : '🔇 Silent'}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const voices = window.speechSynthesis.getVoices();
                    console.log('🎙️ Available voices:', voices);

                    // Test speech with best voice
                    const utterance = new SpeechSynthesisUtterance(
                      'Hello! This is a voice test for Placia tour.'
                    );

                    // Find and use a good voice (same logic as tour agent)
                    const preferredVoices = [
                      'Google UK English Female',
                      'Google US English Female',
                      'Microsoft Zira - English (United States)',
                      'Alex',
                      'Samantha',
                    ];

                    for (const voiceName of preferredVoices) {
                      const voice = voices.find((v) => v.name === voiceName);
                      if (voice) {
                        utterance.voice = voice;
                        console.log('🎯 Testing with voice:', voice.name);
                        break;
                      }
                    }

                    utterance.rate = 0.9;
                    utterance.pitch = 1.0;
                    utterance.volume = 0.8;

                    window.speechSynthesis.speak(utterance);
                  }
                }}
                variant="outline"
                className="h-6 px-2 text-xs w-full"
              >
                🎤 Test Voice
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  if ('speechSynthesis' in window) {
                    const voices = window.speechSynthesis.getVoices();
                    console.table(
                      voices.map((v) => ({
                        name: v.name,
                        language: v.lang,
                        local: v.localService,
                        default: v.default,
                      }))
                    );
                    alert(
                      `Found ${voices.length} voices. Check console for details.`
                    );
                  }
                }}
                variant="outline"
                className="h-6 px-2 text-xs w-full"
              >
                📊 List All Voices
              </Button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-600 bg-blue-50 p-2 rounded">
              <div className="font-medium mb-1">💡 Testing Tips:</div>
              <ul className="space-y-1 text-xs">
                <li>• Use browser dev tools to check data attributes</li>
                <li>• Check console for ElevenLabs connection status</li>
                <li>• Voice commands: "yes", "no", "continue", "skip"</li>
                <li>• Tour falls back to browser speech if ElevenLabs fails</li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
