import { type AskDeps, askDeps, runAsk } from '@placia/core/ask';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '../../_lib/db';
import { rateLimited } from '../../_lib/rate-limit';

/**
 * POST /api/ask  { question, lat?, lon?, history? }
 * Streams newline-delimited JSON events: status, places, delta (answer text), done (meta).
 */

const Body = z.object({
  question: z.string().trim().min(2).max(300),
  lat: z.number().min(-90).max(90).nullish(),
  lon: z.number().min(-180).max(180).nullish(),
  history: z
    .array(z.object({ role: z.enum(['user', 'assistant']), text: z.string().max(2000) }))
    .max(8)
    .optional(),
});

let deps: AskDeps | null = null;

export async function POST(req: NextRequest) {
  if (rateLimited(req, 'ask', 20, 10 * 60_000)) {
    return Response.json({ error: 'too_many_requests' }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: 'invalid_request' }, { status: 400 });
  deps ??= askDeps(db() as never);
  const b = parsed.data;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for await (const ev of runAsk(
        { question: b.question, lat: b.lat ?? null, lon: b.lon ?? null, history: b.history },
        { ...(deps as AskDeps), timeoutMs: 25_000 },
      )) {
        controller.enqueue(encoder.encode(`${JSON.stringify(ev)}\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
      // Stops proxies holding the stream back until it ends.
      'X-Accel-Buffering': 'no',
    },
  });
}
