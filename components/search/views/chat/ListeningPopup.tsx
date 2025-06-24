'use client';

import React from 'react';
import { useChatContext } from './ChatContext';
import { SpeechListeningPopup } from '@/components/speech-listening-popup';

export function ListeningPopup() {
  const { speechRecognition, stopVoiceRecording, cancelVoiceRecording } =
    useChatContext();

  return (
    <SpeechListeningPopup
      speechRecognition={speechRecognition}
      onStopAndSearch={stopVoiceRecording}
      onCancel={cancelVoiceRecording}
      description="Speak your search query clearly. I'll automatically search after 3 seconds of silence, or click 'Stop & Search' to search immediately."
    />
  );
}
