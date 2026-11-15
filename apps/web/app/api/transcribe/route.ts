import { GHANA_VOCABULARY } from '@placia/core/voice';
import type { NextRequest } from 'next/server';
import OpenAI from 'openai';
import { rateLimited } from '../../_lib/rate-limit';

/**
 * POST /api/transcribe  (multipart: audio)
 * Speech to text for phones without built-in recognition. The prompt lists Ghanaian place words
 * so "Achimota", "KNUST" and "chop bar" come back spelled the way our search knows them.
 */

const MAX_BYTES = 2_000_000;
let client: OpenAI | null = null;

export async function POST(req: NextRequest) {
  if (rateLimited(req, 'transcribe', 30, 10 * 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const key = process.env.OPENAI_API_KEY;
  if (!key) return Response.json({ error: 'not_configured' }, { status: 503 });
  const form = await req.formData().catch(() => null);
  const audio = form?.get('audio');
  if (!(audio instanceof File) || audio.size === 0 || audio.size > MAX_BYTES) {
    return Response.json({ error: 'invalid_audio' }, { status: 400 });
  }
  client ??= new OpenAI({ apiKey: key, maxRetries: 1 });
  try {
    const t0 = performance.now();
    const res = await client.audio.transcriptions.create(
      {
        file: audio,
        model: process.env.AI_STT_MODEL || 'gpt-transcribe',
        language: 'en',
        prompt: GHANA_VOCABULARY,
      },
      { signal: AbortSignal.timeout(15_000) },
    );
    const text = res.text.trim().replace(/[.!?]+$/, '');
    return Response.json(
      { text },
      { headers: { 'Server-Timing': `stt;dur=${Math.round(performance.now() - t0)}` } },
    );
  } catch (err) {
    console.error('transcribe failed', err);
    return Response.json({ error: 'transcription_unavailable' }, { status: 503 });
  }
}
