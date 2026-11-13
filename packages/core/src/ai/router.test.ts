import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { LLMRouter } from './router';
import { AIError, type LLMProvider, ModelOutputError, type ProviderName } from './types';

type Behaviour = 'ok' | 'error' | 'refuse' | 'hang';

function fake(name: ProviderName, behaviour: () => Behaviour) {
  let calls = 0;
  const provider: LLMProvider & { calls: () => number } = {
    name,
    model: `${name}-test`,
    calls: () => calls,
    async generateText(_req, signal) {
      calls += 1;
      return respond(name, behaviour(), signal, 'hello');
    },
    async generateObject(_req, signal) {
      calls += 1;
      return respond(name, behaviour(), signal, { ok: true } as never);
    },
  };
  return provider;
}

function respond<T>(name: string, b: Behaviour, signal: AbortSignal, data: T) {
  if (b === 'error') return Promise.reject(Object.assign(new Error('boom'), { status: 529 }));
  if (b === 'refuse') return Promise.reject(new ModelOutputError('no', 'refusal'));
  if (b === 'hang') {
    return new Promise<never>((_, reject) => {
      signal.addEventListener('abort', () => reject(new Error('aborted')));
    });
  }
  return Promise.resolve({
    data,
    model: `${name}-test`,
    usage: { inputTokens: 1, outputTokens: 1 },
  });
}

const req = { system: 's', prompt: 'p' };

describe('LLMRouter', () => {
  it('uses the primary provider when it succeeds', async () => {
    const claude = fake('anthropic', () => 'ok');
    const openai = fake('openai', () => 'ok');
    const res = await new LLMRouter([claude, openai]).generateText(req);
    expect(res.provider).toBe('anthropic');
    expect(res.attempts).toHaveLength(1);
    expect(openai.calls()).toBe(0);
  });

  it('falls back on error, refusal and timeout', async () => {
    for (const b of ['error', 'refuse', 'hang'] as const) {
      const router = new LLMRouter([fake('anthropic', () => b), fake('openai', () => 'ok')], {
        timeoutMs: 20,
      });
      const res = await router.generateObject({
        ...req,
        schema: z.object({ ok: z.boolean() }),
        schemaName: 't',
      });
      expect(res.provider).toBe('openai');
      expect(res.attempts.map((a) => a.ok)).toEqual([false, true]);
      if (b === 'hang') expect(res.attempts[0]?.error).toBe('timeout');
    }
  });

  it('throws AIError with every attempt when all providers fail', async () => {
    const router = new LLMRouter([fake('anthropic', () => 'error'), fake('openai', () => 'error')]);
    const err = await router.generateText(req).catch((e) => e);
    expect(err).toBeInstanceOf(AIError);
    expect((err as AIError).attempts).toHaveLength(2);
  });

  it('opens the circuit after repeated failures and closes it after the cooldown', async () => {
    let now = 0;
    const claude = fake('anthropic', () => 'error');
    const openai = fake('openai', () => 'ok');
    const router = new LLMRouter([claude, openai], {
      failureThreshold: 2,
      cooldownMs: 1000,
      now: () => now,
    });

    await router.generateText(req);
    await router.generateText(req);
    expect(claude.calls()).toBe(2);

    const skipped = await router.generateText(req);
    expect(claude.calls()).toBe(2);
    expect(skipped.attempts[0]?.skipped).toBe('circuit_open');

    now = 1001;
    await router.generateText(req);
    expect(claude.calls()).toBe(3);
  });
});
