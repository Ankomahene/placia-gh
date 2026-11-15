import type { SearchResult } from '../search/engine';
import { checkCitations, stripInvalid } from './citations';

/**
 * Ask: a short conversation about places, answered only from our own data.
 *
 * The model gets two tools (search our places, read one place's details) and must cite every
 * place it names with a ref the tools issued ([P1]). After the answer we check every citation;
 * made-up refs are removed and counted. If the model is slow, down or errors, the caller still
 * gets a plain result list from the same search engine (path "fallback"), so Ask never leaves the
 * user with nothing.
 */

export interface AskRequest {
  question: string;
  lat: number | null;
  lon: number | null;
  /** Earlier turns, oldest first, so follow-ups ("which is closest?") make sense. */
  history?: { role: 'user' | 'assistant'; text: string }[];
}

/** A place as the client shows it next to the answer. */
export interface AskPlace {
  ref: string;
  id: string;
  slug: string;
  name: string;
  categoryName: string | null;
  locality: string | null;
  lat: number;
  lon: number;
  distanceM: number | null;
}

export interface PlaceDetails {
  name: string;
  category: string | null;
  address: string | null;
  area: string | null;
  phone: string | null;
  website: string | null;
  hours: string | null;
  description: string | null;
}

export type AskEvent =
  | { type: 'status'; text: string }
  | { type: 'places'; places: AskPlace[] }
  | { type: 'delta'; text: string }
  | { type: 'done'; meta: AskMeta };

export interface AskMeta {
  path: 'agent' | 'fallback';
  model: string | null;
  latencyMs: number;
  firstTokenMs: number | null;
  toolCalls: number;
  citations: string[];
  /** Refs the model cited that no tool issued, removed from the answer. */
  invalidCitations: string[];
  inputTokens: number;
  outputTokens: number;
  error?: string;
  /** The answer after invalid citations were stripped; what the client should keep. */
  answer: string;
}

export interface ToolCall {
  id: string;
  name: string;
  args: string;
}

export interface TurnResult {
  text: string;
  toolCalls: ToolCall[];
  inputTokens: number;
  outputTokens: number;
}

/** One model vendor behind the shape Ask needs: a streamed turn that may call tools. */
export interface AskModel {
  readonly model: string;
  /** Starts a conversation. Each `turn` continues it; tool outputs feed the next one. */
  start(system: string, history: AskRequest['history'], question: string): AskSession;
}

export interface AskSession {
  turn(
    toolOutputs: { id: string; output: string }[],
    onDelta: (text: string) => void,
    signal: AbortSignal,
  ): Promise<TurnResult>;
}

export interface AskDeps {
  model: AskModel | null;
  search: (query: string, lat: number | null, lon: number | null) => Promise<SearchResult[]>;
  getPlace: (id: string) => Promise<PlaceDetails | null>;
  /** Whole-answer budget. */
  timeoutMs?: number;
  now?: () => Date;
}

export const TOOLS = [
  {
    name: 'search_places',
    description:
      "Search Placia's places in Ghana. Write what to look for and where in plain words, e.g. " +
      "'pharmacy near Osu', 'hostel near KNUST', 'chop bar'. Without a place in the query it " +
      "searches around the user's location when known. Returns up to 8 places with refs like P1.",
    parameters: {
      type: 'object',
      properties: { query: { type: 'string', description: 'What and where, in plain words' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_place',
    description:
      'Details of one place returned by search_places: address, phone, website, opening hours.',
    parameters: {
      type: 'object',
      properties: { ref: { type: 'string', description: 'A ref from search_places, e.g. P2' } },
      required: ['ref'],
      additionalProperties: false,
    },
  },
] as const;

const MAX_ROUNDS = 4;
const PER_SEARCH = 8;

export function systemPrompt(now: Date, located: boolean) {
  // Ghana is on GMT all year.
  const when = now.toLocaleString('en-GB', {
    timeZone: 'UTC',
    weekday: 'long',
    hour: '2-digit',
    minute: '2-digit',
  });
  return [
    'You are Placia, a helpful guide to places in Ghana.',
    'Answer only from what the tools return. Never invent a place, phone number, price or opening hours.',
    'Every time you name a place, put its ref in square brackets right after the name, like "Unicom Pharmacy [P1]". Only use refs the tools gave you.',
    'If the tools find nothing suitable, say so plainly and suggest a different search.',
    'Keep answers short for a phone screen: one to four sentences, or a short list of up to five places. No headings, no links, no markdown tables.',
    'Distances in tool results are from the user. Use Ghanaian-English place words naturally.',
    `It is ${when} in Ghana now (GMT).`,
    located ? "The user's location is known." : "The user's location is not known.",
  ].join('\n');
}

function fmtDistance(m: number | null) {
  if (m == null) return undefined;
  return m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`;
}

/** Runs one Ask turn, yielding events as they happen. Never throws: errors end in the fallback. */
export async function* runAsk(req: AskRequest, deps: AskDeps): AsyncGenerator<AskEvent> {
  const t0 = performance.now();
  const ms = () => Math.round(performance.now() - t0);
  const issued = new Map<string, AskPlace>();
  const byId = new Map<string, string>();
  let toolCalls = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let firstTokenMs: number | null = null;

  const issue = (r: SearchResult) => {
    const known = byId.get(r.id);
    if (known) return issued.get(known) as AskPlace;
    const place: AskPlace = {
      ref: `P${issued.size + 1}`,
      id: r.id,
      slug: r.slug,
      name: r.name,
      categoryName: r.categoryName,
      locality: r.locality,
      lat: r.lat,
      lon: r.lon,
      distanceM: r.distanceM,
    };
    issued.set(place.ref, place);
    byId.set(r.id, place.ref);
    return place;
  };

  const fallback = async function* (error: string): AsyncGenerator<AskEvent> {
    let results: SearchResult[] = [];
    try {
      results = await deps.search(req.question, req.lat, req.lon);
    } catch {
      // Both paths down: an empty list with the error in meta.
    }
    const places = results.slice(0, PER_SEARCH).map(issue);
    if (places.length) yield { type: 'places', places };
    yield {
      type: 'done',
      meta: {
        path: 'fallback',
        model: deps.model?.model ?? null,
        latencyMs: ms(),
        firstTokenMs: null,
        toolCalls,
        citations: [],
        invalidCitations: [],
        inputTokens,
        outputTokens,
        error,
        answer: '',
      },
    };
  };

  if (!deps.model) {
    yield* fallback('no_model');
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), deps.timeoutMs ?? 30_000);
  const session = deps.model.start(
    systemPrompt(deps.now?.() ?? new Date(), req.lat != null),
    req.history,
    req.question,
  );

  // Deltas arrive inside the model call; queue them so this generator can yield them in order.
  let answer = '';
  try {
    let outputs: { id: string; output: string }[] = [];
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const pending: string[] = [];
      let wake: (() => void) | null = null;
      let done = false;
      const turn = session
        .turn(
          outputs,
          (text) => {
            firstTokenMs ??= ms();
            pending.push(text);
            wake?.();
          },
          controller.signal,
        )
        .finally(() => {
          done = true;
          wake?.();
        });
      // Errors are rethrown by the `await turn` below; this only stops an unhandled rejection.
      turn.catch(() => {});
      while (!done || pending.length) {
        if (pending.length) {
          const text = pending.splice(0).join('');
          answer += text;
          yield { type: 'delta', text };
          continue;
        }
        await new Promise<void>((r) => {
          wake = r;
        });
        wake = null;
      }
      const res = await turn;
      inputTokens += res.inputTokens;
      outputTokens += res.outputTokens;
      if (!res.toolCalls.length) break;

      outputs = [];
      for (const call of res.toolCalls) {
        toolCalls++;
        const { output, status, places } = await runTool(call, req, deps, issued, issue);
        if (status) yield { type: 'status', text: status };
        if (places?.length) yield { type: 'places', places };
        outputs.push({ id: call.id, output });
      }
    }
    if (!answer.trim()) throw new Error('no_answer');
  } catch (err) {
    clearTimeout(timer);
    const reason = controller.signal.aborted ? 'timeout' : (err as Error).message || 'error';
    // Some text already reached the user: keep it rather than swapping in a list mid-read.
    if (!answer.trim()) {
      yield* fallback(reason);
      return;
    }
  }
  clearTimeout(timer);

  const refs = new Set(issued.keys());
  const check = checkCitations(answer, refs);
  yield {
    type: 'done',
    meta: {
      path: 'agent',
      model: deps.model.model,
      latencyMs: ms(),
      firstTokenMs,
      toolCalls,
      citations: check.valid,
      invalidCitations: check.invalid,
      inputTokens,
      outputTokens,
      answer: stripInvalid(answer, refs).trim(),
    },
  };
}

async function runTool(
  call: ToolCall,
  req: AskRequest,
  deps: AskDeps,
  issued: Map<string, AskPlace>,
  issue: (r: SearchResult) => AskPlace,
): Promise<{ output: string; status?: string; places?: AskPlace[] }> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(call.args || '{}');
  } catch {
    return { output: JSON.stringify({ error: 'arguments were not valid JSON' }) };
  }

  if (call.name === 'search_places') {
    const query = String(args.query ?? '').slice(0, 200);
    if (!query) return { output: JSON.stringify({ error: 'query is required' }) };
    const results = (await deps.search(query, req.lat, req.lon)).slice(0, PER_SEARCH);
    const places = results.map(issue);
    return {
      status: `Searching "${query}"`,
      places,
      output: JSON.stringify(
        places.map((p, i) => ({
          ref: p.ref,
          name: p.name,
          category: p.categoryName,
          area: p.locality,
          distance: fmtDistance(p.distanceM),
          hours: hoursText(results[i]?.openingHours),
        })),
      ),
    };
  }

  if (call.name === 'get_place') {
    const ref = String(args.ref ?? '');
    const place = issued.get(ref);
    if (!place) return { output: JSON.stringify({ error: `unknown ref ${ref}` }) };
    const d = await deps.getPlace(place.id);
    return {
      status: `Checking ${place.name}`,
      output: JSON.stringify(d ? { ref, ...d } : { error: 'not found' }),
    };
  }

  return { output: JSON.stringify({ error: `unknown tool ${call.name}` }) };
}

function hoursText(h: unknown) {
  if (h && typeof h === 'object' && 'osm' in h && typeof h.osm === 'string') return h.osm;
  if (h && typeof h === 'object' && 'text' in h && typeof h.text === 'string') return h.text;
  return undefined;
}
