import 'server-only';
import {
  aiConfigFromEnv,
  createEmbedder,
  createLLM,
  type Embedder,
  type LLMRouter,
} from '@placia/core/ai';

let llm: LLMRouter | null | undefined;
let embedder: Embedder | null | undefined;

/** Shared AI clients for route handlers; null when no key is configured. */
export function ai() {
  if (llm === undefined) {
    const cfg = aiConfigFromEnv();
    llm = cfg.anthropicApiKey || cfg.openaiApiKey ? createLLM(cfg) : null;
    embedder = cfg.openaiApiKey ? createEmbedder(cfg) : null;
  }
  return { llm, embedder: embedder ?? null };
}
