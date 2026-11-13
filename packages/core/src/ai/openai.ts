import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import {
  type Effort,
  type Embedder,
  type LLMProvider,
  ModelOutputError,
  type ObjectRequest,
  type ProviderResult,
  type TextRequest,
} from './types';

const DEFAULT_MAX_TOKENS = 4096;

// Low-effort calls (parsing, classification) skip reasoning entirely for speed.
const REASONING: Record<Effort, 'none' | 'low' | 'medium' | 'high'> = {
  low: 'none',
  medium: 'low',
  high: 'medium',
};

/** OpenAI adapter on the Responses API. Used as the fallback LLM, and for embeddings. */
export class OpenAIProvider implements LLMProvider {
  readonly name = 'openai' as const;
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 0 });
  }

  async generateText(req: TextRequest, signal: AbortSignal): Promise<ProviderResult<string>> {
    const res = await this.client.responses.create(
      {
        model: this.model,
        instructions: req.system,
        input: req.prompt,
        max_output_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        reasoning: { effort: REASONING[req.effort ?? 'low'] },
        store: false,
      },
      { signal },
    );
    assertComplete(res);
    return { data: res.output_text, model: res.model, usage: toUsage(res.usage) };
  }

  async generateObject<T>(req: ObjectRequest<T>, signal: AbortSignal): Promise<ProviderResult<T>> {
    const res = await this.client.responses.parse(
      {
        model: this.model,
        instructions: req.system,
        input: req.prompt,
        max_output_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        reasoning: { effort: REASONING[req.effort ?? 'low'] },
        text: { format: zodTextFormat(req.schema, req.schemaName) },
        store: false,
      },
      { signal },
    );
    assertComplete(res);
    if (res.output_parsed == null) {
      throw new ModelOutputError(
        'OpenAI returned output that did not match the schema',
        'invalid_output',
      );
    }
    return { data: res.output_parsed as T, model: res.model, usage: toUsage(res.usage) };
  }
}

export class OpenAIEmbedder implements Embedder {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
    readonly dimensions: number,
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 2 });
  }

  async embed(texts: string[], signal?: AbortSignal) {
    const res = await this.client.embeddings.create(
      { model: this.model, input: texts, dimensions: this.dimensions },
      { signal },
    );
    const vectors = res.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    return { vectors, usage: { inputTokens: res.usage.prompt_tokens, outputTokens: 0 } };
  }
}

function assertComplete(res: OpenAI.Responses.Response) {
  const refused = res.output.some(
    (item) => item.type === 'message' && item.content.some((c) => c.type === 'refusal'),
  );
  if (refused) throw new ModelOutputError('OpenAI declined the request', 'refusal');
  if (res.status === 'incomplete') {
    throw new ModelOutputError(
      `OpenAI response incomplete: ${res.incomplete_details?.reason ?? 'unknown'}`,
      'truncated',
    );
  }
}

function toUsage(u: OpenAI.Responses.ResponseUsage | undefined) {
  return { inputTokens: u?.input_tokens ?? 0, outputTokens: u?.output_tokens ?? 0 };
}
