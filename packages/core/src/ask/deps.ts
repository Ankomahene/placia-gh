import { type AIConfig, aiConfigFromEnv, createEmbedder, createLLM } from '../ai';
import { loadSearchContext, search } from '../search';
import type { AskDeps, PlaceDetails } from './agent';
import { OpenAIAskModel } from './openai';

type Rpc = (
  fn: string,
  args?: Record<string, unknown>,
) => PromiseLike<{ data: unknown; error: unknown }>;

// Loosely typed so core stays free of the generated database types.
interface PlacesClient {
  rpc: (fn: never, args?: never) => PromiseLike<{ data: unknown; error: unknown }>;
  from: (table: 'places') => {
    select: (cols: string) => {
      eq: (
        col: string,
        v: string,
      ) => {
        maybeSingle: () => PromiseLike<{ data: unknown; error: { message: string } | null }>;
      };
    };
  };
}

/** Ask wired to our search engine and database, the same way for the web app and the evals. */
export function askDeps(sb: PlacesClient, config: AIConfig = aiConfigFromEnv()): AskDeps {
  const rpc: Rpc = (fn, args) => sb.rpc(fn as never, args as never);
  const llm = config.anthropicApiKey || config.openaiApiKey ? createLLM(config) : null;
  const embedder = config.openaiApiKey ? createEmbedder(config) : null;
  const model = config.openaiApiKey
    ? new OpenAIAskModel(config.openaiApiKey, process.env.AI_ASK_MODEL || config.openaiModel)
    : null;

  return {
    model,
    async search(q, lat, lon) {
      const context = await loadSearchContext(rpc as never);
      const res = await search(
        { q, lat, lon, limit: 8 },
        { rpc: rpc as never, context, llm, embedder, aiBudgetMs: 2500 },
      );
      return res.results;
    },
    async getPlace(id) {
      const { data, error } = await sb
        .from('places')
        .select(
          'name, address, phone, website, description, opening_hours, categories(name), localities(name), districts(name)',
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (!data) return null;
      const p = data as Record<string, unknown> & {
        categories: { name: string } | null;
        localities: { name: string } | null;
        districts: { name: string } | null;
        opening_hours: { osm?: string; text?: string } | null;
      };
      const details: PlaceDetails = {
        name: p.name as string,
        category: p.categories?.name ?? null,
        address: (p.address as string) ?? null,
        area: [p.localities?.name, p.districts?.name].filter(Boolean).join(', ') || null,
        phone: (p.phone as string) ?? null,
        website: (p.website as string) ?? null,
        hours: p.opening_hours?.osm ?? p.opening_hours?.text ?? null,
        description: (p.description as string) ?? null,
      };
      return details;
    },
  };
}
