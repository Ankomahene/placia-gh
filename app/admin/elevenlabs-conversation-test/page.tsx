'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Mic,
  MicOff,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  MessageSquare,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2,
  Download,
  Upload,
} from 'lucide-react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface ConversationMessage {
  id: string;
  type: 'user' | 'agent';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  duration?: number;
}

interface VoiceSettings {
  voice_id: string;
  model_id: string;
  stability: number;
  similarity_boost: number;
  style: number;
  use_speaker_boost: boolean;
}

// ElevenLabs voice options
const AVAILABLE_VOICES = [
  { id: 'Rachel', name: 'Rachel - Calm American Female' },
  { id: 'Drew', name: 'Drew - Well-rounded American Male' },
  { id: 'Clyde', name: 'Clyde - War Veteran American Male' },
  { id: 'Paul', name: 'Paul - Ground Reporter American Male' },
  { id: 'Domi', name: 'Domi - Strong American Female' },
  { id: 'Dave', name: 'Dave - Conversational British Male' },
  { id: 'Fin', name: 'Fin - Sailor Irish Male' },
  { id: 'Sarah', name: 'Sarah - News Presenter American Female' },
  { id: 'Antoni', name: 'Antoni - Well-rounded American Male' },
  { id: 'Thomas', name: 'Thomas - Calm American Male' },
];

const AVAILABLE_MODELS = [
  { id: 'eleven_monolingual_v1', name: 'Eleven Monolingual v1' },
  { id: 'eleven_multilingual_v1', name: 'Eleven Multilingual v1' },
  { id: 'eleven_multilingual_v2', name: 'Eleven Multilingual v2' },
  { id: 'eleven_turbo_v2', name: 'Eleven Turbo v2 (Fastest)' },
];

export default function ElevenLabsConversationTestPage() {
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Voice settings
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    voice_id: 'Rachel',
    model_id: 'eleven_turbo_v2',
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.5,
    use_speaker_boost: true,
  });

  // Manual text input for testing
  const [textInput, setTextInput] = useState('');
  const [conversationId] = useState(`conv_${Date.now()}`);

  // Audio refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const addMessage = (
    message: Omit<ConversationMessage, 'id' | 'timestamp'>
  ) => {
    const newMessage: ConversationMessage = {
      ...message,
      id: Date.now().toString(),
      timestamp: new Date(),
    };
    setConversation((prev) => [...prev, newMessage]);
    return newMessage.id;
  };

  const clearError = () => {
    setError(null);
    setSuccess(null);
  };

  const startRecording = async () => {
    try {
      clearError();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'audio/wav' });
        await processAudioInput(blob);

        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setSuccess('Recording started - speak now!');
    } catch (error) {
      console.error('Error starting recording:', error);
      setError(
        'Failed to start recording. Please check microphone permissions.'
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setSuccess('Recording stopped - processing...');
    }
  };

  const processAudioInput = async (audioBlob: Blob) => {
    setIsLoading(true);
    try {
      // Add user message (audio)
      const audioUrl = URL.createObjectURL(audioBlob);
      addMessage({
        type: 'user',
        content: 'Voice message',
        audioUrl: audioUrl,
      });

      // Send to ElevenLabs Conversational AI
      await sendToElevenLabsConversational(audioBlob);
    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Failed to process audio input');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTextToAgent = async () => {
    if (!textInput.trim()) return;

    setIsLoading(true);
    clearError();

    try {
      // Add user message
      addMessage({
        type: 'user',
        content: textInput,
      });

      const currentText = textInput;
      setTextInput('');

      // Convert text to speech first, then send to conversational AI
      await sendToElevenLabsConversational(currentText);
    } catch (error) {
      console.error('Error sending text:', error);
      setError('Failed to send message to agent');
    } finally {
      setIsLoading(false);
    }
  };

  const sendToElevenLabsConversational = async (input: Blob | string) => {
    try {
      // This is where you'd integrate with ElevenLabs Conversational AI API
      // For now, I'll create a mock response and use text-to-speech

      const isTextInput = typeof input === 'string';
      const userMessage = isTextInput ? input : 'Voice message received';

      // Mock AI response (replace with actual ElevenLabs Conversational AI call)
      const mockResponse = `I heard you say: "${userMessage}". This is a test response from the ElevenLabs AI agent. How can I help you further?`;

      // Generate speech from the response
      const audioBlob = await generateSpeech(mockResponse);

      if (audioBlob) {
        const audioUrl = URL.createObjectURL(audioBlob);

        // Add agent response
        addMessage({
          type: 'agent',
          content: mockResponse,
          audioUrl: audioUrl,
        });

        // Auto-play the response if not muted
        if (!isMuted) {
          playAudio(audioUrl);
        }

        setSuccess('Agent responded successfully!');
      }
    } catch (error) {
      console.error('Error with ElevenLabs API:', error);
      setError('Failed to get response from AI agent');
    }
  };

  const generateSpeech = async (text: string): Promise<Blob | null> => {
    try {
      // Call ElevenLabs Text-to-Speech API
      const response = await fetch('/api/elevenlabs/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice_id: voiceSettings.voice_id,
          model_id: voiceSettings.model_id,
          voice_settings: {
            stability: voiceSettings.stability,
            similarity_boost: voiceSettings.similarity_boost,
            style: voiceSettings.style,
            use_speaker_boost: voiceSettings.use_speaker_boost,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Error generating speech:', error);
      // Return null if speech generation fails
      return null;
    }
  };

  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const clearConversation = () => {
    setConversation([]);
    clearError();
    setSuccess('Conversation cleared');
  };

  const exportConversation = () => {
    const exportData = {
      conversation_id: conversationId,
      messages: conversation,
      voice_settings: voiceSettings,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `elevenlabs-conversation-${conversationId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            ElevenLabs Conversational AI Test
          </CardTitle>
          <p className="text-muted-foreground">
            Test ElevenLabs conversational AI with voice input/output and text
            messaging
          </p>
        </CardHeader>

        <CardContent>
          {/* Status Alerts */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-4 border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="conversation" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversation">Conversation</TabsTrigger>
              <TabsTrigger value="settings">Voice Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="conversation" className="space-y-4">
              {/* Main Controls */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isLoading}
                  variant={isRecording ? 'destructive' : 'default'}
                  size="lg"
                >
                  {isRecording ? (
                    <>
                      <Square className="h-5 w-5 mr-2" />
                      Stop Recording
                    </>
                  ) : (
                    <>
                      <Mic className="h-5 w-5 mr-2" />
                      Start Agent Conversation
                    </>
                  )}
                </Button>

                <Button
                  onClick={() => setIsMuted(!isMuted)}
                  variant="outline"
                  size="lg"
                >
                  {isMuted ? (
                    <>
                      <VolumeX className="h-5 w-5 mr-2" />
                      Unmute
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-5 w-5 mr-2" />
                      Mute
                    </>
                  )}
                </Button>

                <Button
                  onClick={clearConversation}
                  variant="outline"
                  size="lg"
                  disabled={conversation.length === 0}
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Clear Chat
                </Button>

                <Button
                  onClick={exportConversation}
                  variant="outline"
                  size="lg"
                  disabled={conversation.length === 0}
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export
                </Button>
              </div>

              {/* Text Input Alternative */}
              <div className="flex gap-2">
                <Input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Type a message to send to the AI agent..."
                  onKeyPress={(e) =>
                    e.key === 'Enter' && !e.shiftKey && sendTextToAgent()
                  }
                  disabled={isLoading}
                />
                <Button
                  onClick={sendTextToAgent}
                  disabled={isLoading || !textInput.trim()}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Send'
                  )}
                </Button>
              </div>

              {/* Conversation History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    Conversation History ({conversation.length} messages)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] pr-4">
                    {conversation.length === 0 ? (
                      <div className="text-center text-muted-foreground py-8">
                        <MessageSquare className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                        <p>
                          No conversation yet. Click "Start Agent Conversation"
                          to begin!
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {conversation.map((message) => (
                          <div
                            key={message.id}
                            className={`flex gap-3 p-3 rounded-lg ${
                              message.type === 'user'
                                ? 'bg-blue-50 border-l-4 border-l-blue-500'
                                : 'bg-green-50 border-l-4 border-l-green-500'
                            }`}
                          >
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <Badge
                                  variant={
                                    message.type === 'user'
                                      ? 'default'
                                      : 'secondary'
                                  }
                                >
                                  {message.type === 'user' ? 'You' : 'AI Agent'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  {message.timestamp.toLocaleTimeString()}
                                </span>
                              </div>

                              <p className="text-sm mb-2">{message.content}</p>

                              {message.audioUrl && (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => playAudio(message.audioUrl!)}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Play Audio
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Voice Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Voice Configuration</h3>

                  <div className="space-y-2">
                    <Label htmlFor="voice-select">Voice</Label>
                    <Select
                      value={voiceSettings.voice_id}
                      onValueChange={(value) =>
                        setVoiceSettings((prev) => ({
                          ...prev,
                          voice_id: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_VOICES.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model-select">Model</Label>
                    <Select
                      value={voiceSettings.model_id}
                      onValueChange={(value) =>
                        setVoiceSettings((prev) => ({
                          ...prev,
                          model_id: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a model" />
                      </SelectTrigger>
                      <SelectContent>
                        {AVAILABLE_MODELS.map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Voice Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Voice Parameters</h3>

                  <div className="space-y-4">
                    <div>
                      <Label>Stability: {voiceSettings.stability}</Label>
                      <Slider
                        value={[voiceSettings.stability]}
                        onValueChange={([value]) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            stability: value,
                          }))
                        }
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>
                        Similarity Boost: {voiceSettings.similarity_boost}
                      </Label>
                      <Slider
                        value={[voiceSettings.similarity_boost]}
                        onValueChange={([value]) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            similarity_boost: value,
                          }))
                        }
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label>Style: {voiceSettings.style}</Label>
                      <Slider
                        value={[voiceSettings.style]}
                        onValueChange={([value]) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            style: value,
                          }))
                        }
                        max={1}
                        min={0}
                        step={0.1}
                        className="mt-2"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={voiceSettings.use_speaker_boost}
                        onChange={(e) =>
                          setVoiceSettings((prev) => ({
                            ...prev,
                            use_speaker_boost: e.target.checked,
                          }))
                        }
                        className="rounded"
                      />
                      <Label>Use Speaker Boost</Label>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Hidden audio element for playback */}
          <audio
            ref={audioRef}
            onEnded={handleAudioEnded}
            style={{ display: 'none' }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
