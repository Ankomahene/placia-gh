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
  /** Which provider is tried first when both keys are set; the other is the fallback. */
  primary: 'openai' | 'anthropic';
  claudeModel: string;
  /** Model for the admin's search reviews: rare calls where the write-up matters, not speed. */
  reviewModel: string;
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
    // Search parsing runs inside a 2.5 s budget. On the eval set (docs/EVALS.md, "Choosing the
    // parse model") gpt-6-luna was as accurate as Claude and the fastest, so it leads; Sonnet 5.5
    // matched it as the fallback, with Opus 5.5 closer to the budget and Haiku 5.5 too broad.
    primary: env.AI_PRIMARY === 'anthropic' ? 'anthropic' : 'openai',
    claudeModel: env.AI_CLAUDE_MODEL || 'claude-sonnet-5-5',
    reviewModel: env.AI_REVIEW_MODEL || 'claude-opus-5-5',
    openaiModel: env.AI_OPENAI_MODEL || 'gpt-6-luna',
    embeddingModel: env.AI_EMBEDDING_MODEL || 'text-embedding-3-small',
    embeddingDimensions: Number(env.AI_EMBEDDING_DIMENSIONS || 512),
    timeoutMs: Number(env.AI_TIMEOUT_MS || 8000),
  };
}

/**
 * Provider order follows `config.primary` (AI_PRIMARY); the other provider is the fallback.
 * Either key alone is enough to run.
 */
export function createLLM(config: AIConfig = aiConfigFromEnv(), options: RouterOptions = {}) {
  const providers: LLMProvider[] = [];
  if (config.anthropicApiKey)
    providers.push(new AnthropicProvider(config.anthropicApiKey, config.claudeModel));
  if (config.openaiApiKey) {
    const openai = new OpenAIProvider(config.openaiApiKey, config.openaiModel);
    if (config.primary === 'openai') providers.unshift(openai);
    else providers.push(openai);
  }
  if (providers.length === 0) {
    throw new Error('No AI provider configured: set ANTHROPIC_API_KEY and/or OPENAI_API_KEY');
  }
  return new LLMRouter(providers, { timeoutMs: config.timeoutMs, ...options });
}

/** The router for admin search reviews: Claude's review model first, the usual order after. */
export function createReviewLLM(config: AIConfig = aiConfigFromEnv()) {
  return createLLM(
    { ...config, primary: 'anthropic', claudeModel: config.reviewModel },
    { timeoutMs: 30_000 },
  );
}

export function createEmbedder(config: AIConfig = aiConfigFromEnv()): Embedder {
  if (!config.openaiApiKey) throw new Error('Embeddings need OPENAI_API_KEY');
  return new OpenAIEmbedder(config.openaiApiKey, config.embeddingModel, config.embeddingDimensions);
}

/** Which providers are configured, for status pages. Never exposes keys. */
export function aiStatus(config: AIConfig = aiConfigFromEnv()) {
  return {
    primary:
      config.anthropicApiKey && config.openaiApiKey
        ? config.primary
        : config.anthropicApiKey
          ? 'anthropic'
          : config.openaiApiKey
            ? 'openai'
            : null,
    reviewModel: config.anthropicApiKey ? config.reviewModel : config.openaiModel,
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
