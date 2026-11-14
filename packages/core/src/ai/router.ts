import {
  AIError,
  type AIResult,
  type Attempt,
  type LLMProvider,
  type ObjectRequest,
  type ProviderResult,
  type TextRequest,
} from './types';

export interface RouterOptions {
  /** Default per-call budget when a request doesn't set one. */
  timeoutMs?: number;
  /** Consecutive failures before a provider is skipped for `cooldownMs`. */
  failureThreshold?: number;
  cooldownMs?: number;
  /** Observability hook: called once per call with the final result or error. */
  onCall?: (event: { kind: 'text' | 'object'; attempts: Attempt[]; ok: boolean }) => void;
  now?: () => number;
}

interface Breaker {
  failures: number;
  openUntil: number;
}

/**
 * Tries providers in priority order. A provider that times out, errors or refuses hands the call
 * to the next one. A simple circuit breaker stops us from paying the timeout on every request
 * while a provider is down (or out of credits).
 */
export class LLMRouter {
  private readonly breakers = new Map<string, Breaker>();
  private readonly timeoutMs: number;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(
    readonly providers: LLMProvider[],
    private readonly options: RouterOptions = {},
  ) {
    if (providers.length === 0) throw new Error('LLMRouter needs at least one provider');
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.failureThreshold = options.failureThreshold ?? 3;
    this.cooldownMs = options.cooldownMs ?? 60_000;
    this.now = options.now ?? Date.now;
  }

  get primary() {
    return this.providers[0] as LLMProvider;
  }

  /**
   * False while every provider's breaker is open. Callers that have their own non-AI fallback
   * (search's rule parser) should skip the call then, instead of paying a timeout per request.
   */
  available() {
    return this.providers.some((p) => !this.isOpen(p));
  }

  generateText(req: TextRequest): Promise<AIResult<string>> {
    return this.run('text', req, (p, signal) => p.generateText(req, signal));
  }

  generateObject<T>(req: ObjectRequest<T>): Promise<AIResult<T>> {
    return this.run('object', req, (p, signal) => p.generateObject(req, signal));
  }

  private async run<T>(
    kind: 'text' | 'object',
    req: TextRequest,
    call: (p: LLMProvider, signal: AbortSignal) => Promise<ProviderResult<T>>,
  ): Promise<AIResult<T>> {
    const attempts: Attempt[] = [];
    const started = this.now();
    // If every breaker is open, still try them all: a stale breaker beats returning nothing.
    const anyClosed = this.providers.some((p) => !this.isOpen(p));

    for (const provider of this.providers) {
      if (anyClosed && this.isOpen(provider)) {
        attempts.push({
          provider: provider.name,
          model: provider.model,
          ok: false,
          latencyMs: 0,
          skipped: 'circuit_open',
        });
        continue;
      }
      const t0 = this.now();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), req.timeoutMs ?? this.timeoutMs);
      try {
        const result = await call(provider, controller.signal);
        attempts.push({
          provider: provider.name,
          model: result.model,
          ok: true,
          latencyMs: this.now() - t0,
        });
        this.recordSuccess(provider);
        this.options.onCall?.({ kind, attempts, ok: true });
        return { ...result, provider: provider.name, latencyMs: this.now() - started, attempts };
      } catch (err) {
        const message = controller.signal.aborted ? 'timeout' : errorMessage(err);
        attempts.push({
          provider: provider.name,
          model: provider.model,
          ok: false,
          latencyMs: this.now() - t0,
          error: message,
        });
        this.recordFailure(provider);
      } finally {
        clearTimeout(timer);
      }
    }

    this.options.onCall?.({ kind, attempts, ok: false });
    throw new AIError(
      `All AI providers failed: ${attempts.map((a) => `${a.provider}=${a.error ?? a.skipped}`).join(', ')}`,
      attempts,
    );
  }

  private key(p: LLMProvider) {
    return `${p.name}:${p.model}`;
  }

  private isOpen(p: LLMProvider) {
    const b = this.breakers.get(this.key(p));
    return !!b && b.openUntil > this.now();
  }

  private recordSuccess(p: LLMProvider) {
    this.breakers.delete(this.key(p));
  }

  private recordFailure(p: LLMProvider) {
    const b = this.breakers.get(this.key(p)) ?? { failures: 0, openUntil: 0 };
    b.failures += 1;
    if (b.failures >= this.failureThreshold) {
      b.openUntil = this.now() + this.cooldownMs;
      b.failures = 0;
    }
    this.breakers.set(this.key(p), b);
  }
}

function errorMessage(err: unknown) {
  if (err instanceof Error) {
    const status = (err as { status?: number }).status;
    return status ? `${status} ${err.message}`.slice(0, 300) : err.message.slice(0, 300);
  }
  return String(err).slice(0, 300);
}
