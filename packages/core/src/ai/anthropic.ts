import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import {
  type LLMProvider,
  ModelOutputError,
  type ObjectRequest,
  type ProviderResult,
  type TextRequest,
} from './types';

const DEFAULT_MAX_TOKENS = 4096;

/**
 * Claude adapter. Thinking stays adaptive (the default on current models); `effort` controls depth.
 * Refusals are surfaced as errors so the router can fall back to the next provider.
 */
export class AnthropicProvider implements LLMProvider {
  readonly name = 'anthropic' as const;
  private readonly client: Anthropic;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    // Retries are handled by the router (it falls back instead of retrying the same vendor).
    this.client = new Anthropic({ apiKey, maxRetries: 0 });
  }

  async generateText(req: TextRequest, signal: AbortSignal): Promise<ProviderResult<string>> {
    const res = await this.client.messages.create(
      {
        model: this.model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
        output_config: { effort: req.effort ?? 'low' },
      },
      { signal },
    );
    this.assertComplete(res.stop_reason);
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    return { data: text, model: res.model, usage: toUsage(res.usage) };
  }

  async generateObject<T>(req: ObjectRequest<T>, signal: AbortSignal): Promise<ProviderResult<T>> {
    const res = await this.client.messages.parse(
      {
        model: this.model,
        max_tokens: req.maxTokens ?? DEFAULT_MAX_TOKENS,
        system: req.system,
        messages: [{ role: 'user', content: req.prompt }],
        output_config: { effort: req.effort ?? 'low', format: zodOutputFormat(req.schema) },
      },
      { signal },
    );
    this.assertComplete(res.stop_reason);
    if (res.parsed_output == null) {
      throw new ModelOutputError(
        'Claude returned output that did not match the schema',
        'invalid_output',
      );
    }
    return { data: res.parsed_output as T, model: res.model, usage: toUsage(res.usage) };
  }

  private assertComplete(stopReason: string | null) {
    if (stopReason === 'refusal')
      throw new ModelOutputError('Claude declined the request', 'refusal');
    if (stopReason === 'max_tokens')
      throw new ModelOutputError('Claude hit max_tokens', 'truncated');
  }
}

function toUsage(u: Anthropic.Usage) {
  return { inputTokens: u.input_tokens, outputTokens: u.output_tokens };
}
