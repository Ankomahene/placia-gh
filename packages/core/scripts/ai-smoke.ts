/**
 * Live check of the AI layer: which provider answers, how fast, and whether structured output works.
 * Usage: pnpm ai:smoke   (reads keys from the repo-root .env.local)
 */
import { z } from 'zod';
import { aiStatus, createEmbedder, createLLM } from '../src/ai';

const status = aiStatus();
console.log('providers:', JSON.stringify(status, null, 2));

const llm = createLLM();
const QuerySchema = z.object({
  what: z.string(),
  where: z.string().nullable(),
  near_me: z.boolean(),
});

const res = await llm.generateObject({
  system: 'Extract the place search intent from a query about places in Ghana.',
  prompt: 'where can I get waakye around Osu?',
  schema: QuerySchema,
  schemaName: 'place_query',
  maxTokens: 1024,
});
console.log('object:', res.data);
console.log('served by:', res.provider, res.model, `${res.latencyMs}ms`, res.usage);
console.log('attempts:', res.attempts);

if (status.embeddings.configured) {
  const emb = await createEmbedder().embed(['chop bar in Osu']);
  console.log('embedding dims:', emb.vectors[0]?.length, 'tokens:', emb.usage.inputTokens);
}
