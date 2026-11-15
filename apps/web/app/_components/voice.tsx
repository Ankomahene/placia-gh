'use client';

import { cn } from '@placia/ui/cn';
import { Loader2, Mic, Square } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

/*
 * Voice input with a fallback chain:
 *  1. The browser's own speech recognition (Chrome/Android: free and fast, but it needs Google's
 *     servers, so it fails on some networks and isn't in every browser).
 *  2. Record the audio and send it to /api/transcribe (works wherever there's a microphone).
 *  3. The keyboard, which is always there.
 */

type Phase = 'idle' | 'listening' | 'transcribing';
const MAX_RECORD_MS = 8000;

interface Recognition {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult:
    | ((e: {
        results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
      }) => void)
    | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
}

function recognitionCtor(): (new () => Recognition) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => Recognition)
    | null;
}

export function useVoice({
  onInterim,
  onFinal,
}: {
  onInterim?: (text: string) => void;
  onFinal: (text: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);
  const [supported, setSupported] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cb = useRef({ onInterim, onFinal });
  cb.current = { onInterim, onFinal };

  useEffect(() => {
    setSupported(
      !!recognitionCtor() ||
        (typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia),
    );
  }, []);

  const record = useCallback(async () => {
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setPhase('idle');
      setError('Microphone blocked');
      return;
    }
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) =>
      MediaRecorder.isTypeSupported(t),
    );
    const mr = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
    const chunks: Blob[] = [];
    mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    mr.onstop = async () => {
      for (const t of stream.getTracks()) t.stop();
      if (timer.current) clearTimeout(timer.current);
      recorder.current = null;
      const blob = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
      if (blob.size < 1000) {
        setPhase('idle');
        return;
      }
      setPhase('transcribing');
      try {
        const ext = blob.type.includes('mp4') ? 'mp4' : blob.type.includes('ogg') ? 'ogg' : 'webm';
        const form = new FormData();
        form.append('audio', blob, `voice.${ext}`);
        const res = await fetch('/api/transcribe', { method: 'POST', body: form });
        const data = (await res.json()) as { text?: string };
        if (!res.ok || !data.text) throw new Error();
        cb.current.onFinal(data.text);
      } catch {
        setError("Couldn't hear that");
      } finally {
        setPhase('idle');
      }
    };
    recorder.current = mr;
    mr.start();
    setPhase('listening');
    timer.current = setTimeout(() => mr.state === 'recording' && mr.stop(), MAX_RECORD_MS);
  }, []);

  const start = useCallback(() => {
    setError(null);
    const Ctor = recognitionCtor();
    if (!Ctor) {
      void record();
      return;
    }
    const r = new Ctor();
    r.lang = 'en-GH';
    r.interimResults = true;
    r.maxAlternatives = 1;
    r.continuous = false;
    let final = '';
    let failedOver = false;
    r.onresult = (e) => {
      let text = '';
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        text += res?.[0]?.transcript ?? '';
        if (res?.isFinal) final = text;
      }
      cb.current.onInterim?.(text);
    };
    r.onerror = (e) => {
      // Mic refused: nothing else will work either. Anything else (network, service): record.
      if (e.error === 'not-allowed') setError('Microphone blocked');
      else if (e.error !== 'no-speech' && e.error !== 'aborted') {
        failedOver = true;
        void record();
      }
    };
    r.onend = () => {
      rec.current = null;
      if (failedOver) return;
      setPhase('idle');
      if (final.trim()) cb.current.onFinal(final.trim());
    };
    rec.current = r;
    r.start();
    setPhase('listening');
  }, [record]);

  const stop = useCallback(() => {
    rec.current?.stop();
    if (recorder.current?.state === 'recording') recorder.current.stop();
  }, []);

  useEffect(
    () => () => {
      rec.current?.abort();
      if (recorder.current?.state === 'recording') recorder.current.stop();
    },
    [],
  );

  return { phase, error, supported, start, stop };
}

export function MicButton({
  voice,
  className,
}: {
  voice: ReturnType<typeof useVoice>;
  className?: string;
}) {
  if (!voice.supported) return null;
  const { phase } = voice;
  return (
    <button
      type="button"
      aria-label={phase === 'listening' ? 'Stop listening' : 'Search by voice'}
      title={voice.error ?? undefined}
      disabled={phase === 'transcribing'}
      onClick={phase === 'listening' ? voice.stop : voice.start}
      className={cn(
        'grid place-items-center rounded-full transition-colors',
        phase === 'listening'
          ? 'animate-pulse bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
        voice.error && phase === 'idle' && 'text-danger',
        className,
      )}
    >
      {phase === 'transcribing' ? (
        <Loader2 className="size-[18px] animate-spin" />
      ) : phase === 'listening' ? (
        <Square className="size-4 fill-current" />
      ) : (
        <Mic className="size-[18px]" />
      )}
    </button>
  );
}
