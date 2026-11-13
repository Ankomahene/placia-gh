import type { z } from 'zod';

export type ProviderName = 'anthropic' | 'openai';

/** How hard the model should think. Mapped per provider (Claude effort, OpenAI reasoning effort). */
export type Effort = 'low' | 'medium' | 'high';

export interface Usage {
  inputTokens: number;
  outputTokens: number;
}

export interface TextRequest {
  system: string;
  prompt: string;
  maxTokens?: number;
  effort?: Effort;
  /** Per-call budget. The router aborts the call and moves to the next provider when exceeded. */
  timeoutMs?: number;
}

export interface ObjectRequest<T> extends TextRequest {
  schema: z.ZodType<T>;
  /** Short identifier for the schema (OpenAI requires one). */
  schemaName: string;
}

export interface ProviderResult<T> {
  data: T;
  model: string;
  usage: Usage;
}

/** One LLM vendor behind a common shape. Adapters must throw on refusal or unparseable output. */
export interface LLMProvider {
  readonly name: ProviderName;
  readonly model: string;
  generateText(req: TextRequest, signal: AbortSignal): Promise<ProviderResult<string>>;
  generateObject<T>(req: ObjectRequest<T>, signal: AbortSignal): Promise<ProviderResult<T>>;
}

export interface Attempt {
  provider: ProviderName;
  model: string;
  ok: boolean;
  latencyMs: number;
  error?: string;
  skipped?: 'circuit_open';
}

/** What every AI call returns: the data plus enough metadata to log, evaluate and bill it. */
export interface AIResult<T> extends ProviderResult<T> {
  provider: ProviderName;
  latencyMs: number;
  /** Every provider tried, in order. More than one entry means a fallback happened. */
  attempts: Attempt[];
}

export interface Embedder {
  readonly model: string;
  readonly dimensions: number;
  embed(texts: string[], signal?: AbortSignal): Promise<{ vectors: number[][]; usage: Usage }>;
}

export class AIError extends Error {
  constructor(
    message: string,
    readonly attempts: Attempt[],
  ) {
    super(message);
    this.name = 'AIError';
  }
}

/** Thrown by adapters when the model declines or returns output that fails the schema. */
export class ModelOutputError extends Error {
  constructor(
    message: string,
    readonly reason: 'refusal' | 'invalid_output' | 'truncated',
  ) {
    super(message);
    this.name = 'ModelOutputError';
  }
}
