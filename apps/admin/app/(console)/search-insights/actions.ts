'use server';

import { aiConfigFromEnv, createReviewLLM } from '@placia/core/ai';
import { nextSearch, reviewSearch } from '@placia/core/search/insights';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from '../../_lib/auth';
import { getFlaggedSearches, service } from '../../_lib/search-insights';

/** At most this many model calls per click, so one click can't run up a bill. */
const MAX_PER_RUN = 20;

/** AI-review searches that have no review yet: one by id, or every flagged one in the period. */
export async function reviewSearches(form: FormData) {
  // Server actions are public endpoints: check the caller, not just the page that shows the button.
  await requireAdmin();
  const id = Number(form.get('id')) || null;
  const days = Number(form.get('days')) || 30;
  const cfg = aiConfigFromEnv();
  const db = service();
  const events = await getFlaggedSearches(days);
  if (!db || !events || !(cfg.openaiApiKey || cfg.anthropicApiKey)) return;
  const llm = createReviewLLM(cfg);

  const todo = events
    .map((e, i) => ({ e, i }))
    .filter(({ e }) => !e.review && (id ? e.id === id : e.problem))
    .slice(-MAX_PER_RUN);

  // A few at a time: fast enough, and gentle on rate limits.
  for (let k = 0; k < todo.length; k += 5) {
    await Promise.all(
      todo.slice(k, k + 5).map(async ({ e, i }) => {
        const review = await reviewSearch(llm, e, nextSearch(events, i));
        if (review) {
          await db
            .from('search_events')
            .update({ review } as never)
            .eq('id', e.id);
        }
      }),
    );
  }
  revalidatePath('/search-insights');
}
