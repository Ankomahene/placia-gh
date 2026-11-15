import OpenAI from 'openai';
import type { AskModel, AskRequest, AskSession, ToolCall, TurnResult } from './agent';
import { TOOLS } from './agent';

type Item = OpenAI.Responses.ResponseInputItem;

/** Ask on the OpenAI Responses API, streamed, stateless (store: false). */
export class OpenAIAskModel implements AskModel {
  private readonly client: OpenAI;

  constructor(
    apiKey: string,
    readonly model: string,
  ) {
    this.client = new OpenAI({ apiKey, maxRetries: 0 });
  }

  start(system: string, history: AskRequest['history'], question: string): AskSession {
    const items: Item[] = [
      ...(history ?? []).map(
        (h): Item => ({ role: h.role, content: h.text, type: 'message' }) as Item,
      ),
      { role: 'user', content: question, type: 'message' },
    ];
    const client = this.client;
    const model = this.model;

    return {
      async turn(toolOutputs, onDelta, signal): Promise<TurnResult> {
        for (const o of toolOutputs) {
          items.push({ type: 'function_call_output', call_id: o.id, output: o.output });
        }
        const stream = await client.responses.create(
          {
            model,
            instructions: system,
            input: items,
            tools: TOOLS.map((t) => ({
              type: 'function' as const,
              name: t.name,
              description: t.description,
              parameters: t.parameters as unknown as Record<string, unknown>,
              strict: true,
            })),
            reasoning: { effort: 'low' },
            // Stateless: reasoning comes back encrypted so the next turn can carry it.
            include: ['reasoning.encrypted_content'],
            store: false,
            max_output_tokens: 1500,
            stream: true,
          },
          { signal },
        );

        let text = '';
        let final: OpenAI.Responses.Response | null = null;
        for await (const ev of stream) {
          if (ev.type === 'response.output_text.delta') {
            text += ev.delta;
            onDelta(ev.delta);
          } else if (ev.type === 'response.completed' || ev.type === 'response.incomplete') {
            final = ev.response;
          } else if (ev.type === 'response.failed') {
            throw new Error(ev.response.error?.message ?? 'OpenAI response failed');
          } else if (ev.type === 'error') {
            throw new Error(ev.message);
          }
        }
        if (!final) throw new Error('OpenAI stream ended without a response');

        const toolCalls: ToolCall[] = [];
        for (const out of final.output) {
          // Everything the model produced goes back in, so the next turn sees its own calls.
          items.push(out as Item);
          if (out.type === 'function_call') {
            toolCalls.push({ id: out.call_id, name: out.name, args: out.arguments });
          }
        }
        return {
          text,
          toolCalls,
          inputTokens: final.usage?.input_tokens ?? 0,
          outputTokens: final.usage?.output_tokens ?? 0,
        };
      },
    };
  }
}
