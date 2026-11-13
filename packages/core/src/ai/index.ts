import { AnthropicProvider } from './anthropic';
import { OpenAIEmbedder, OpenAIProvider } from './openai';
import { LLMRouter, type RouterOptions } from './router';
import type { Embedder, LLMProvider } from './types';

export * from './router';
export * from './types';
export { AnthropicProvider, OpenAIEmbedder, OpenAIProvider };

export interface AIConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  claudeModel: string;
  openaiModel: string;
  embeddingModel: string;
  embeddingDimensions: number;
  timeoutMs: number;
}

type Env = Record<string, string | undefined>;

export function aiConfigFromEnv(env: Env = process.env): AIConfig {
  return {
    anthropicApiKey: env.ANTHROPIC_API_KEY || undefined,
    openaiApiKey: env.OPENAI_API_KEY || undefined,
    claudeModel: env.AI_CLAUDE_MODEL || 'claude-opus-5-5',
    openaiModel: env.AI_OPENAI_MODEL || 'gpt-6-luna',
    embeddingModel: env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: Number(env.AI_EMBEDDING_DIMENSIONS || 512),
    timeoutMs: Number(env.AI_TIMEOUT_MS || 8000),
  };
}

/**
 * Provider order: Claude first whenever its key is set, OpenAI as the fallback.
 * With only an OpenAI key the app still works; adding ANTHROPIC_API_KEY makes Claude primary.
 */
export function createLLM(config: AIConfig = aiConfigFromEnv(), options: RouterOptions = {}) {
  const providers: LLMProvider[] = [];
  if (config.anthropicApiKey)
    providers.push(new AnthropicProvider(config.anthropicApiKey, config.claudeModel));
  if (config.openaiApiKey)
    providers.push(new OpenAIProvider(config.openaiApiKey, config.openaiModel));
  if (providers.length === 0) {
    throw new Error('No AI provider configured: set ANTHROPIC_API_KEY and/or OPENAI_API_KEY');
  }
  return new LLMRouter(providers, { timeoutMs: config.timeoutMs, ...options });
}

export function createEmbedder(config: AIConfig = aiConfigFromEnv()): Embedder {
  if (!config.openaiApiKey) throw new Error('Embeddings need OPENAI_API_KEY');
  return new OpenAIEmbedder(config.openaiApiKey, config.embeddingModel, config.embeddingDimensions);
}

/** Which providers are configured, for status pages. Never exposes keys. */
export function aiStatus(config: AIConfig = aiConfigFromEnv()) {
  return {
    primary: config.anthropicApiKey ? 'anthropic' : config.openaiApiKey ? 'openai' : null,
    providers: [
      {
        name: 'anthropic',
        label: 'Claude',
        model: config.claudeModel,
        configured: !!config.anthropicApiKey,
      },
      {
        name: 'openai',
        label: 'OpenAI',
        model: config.openaiModel,
        configured: !!config.openaiApiKey,
      },
    ],
    embeddings: {
      model: config.embeddingModel,
      dimensions: config.embeddingDimensions,
      configured: !!config.openaiApiKey,
    },
  } as const;
}
