import type { SearchContext } from './context';
import { isCategoryWord } from './rules';
import { normalize, words } from './text';

/** Initials in a query and the place name they stand for ("kbth" → Korle Bu Teaching Hospital). */
export interface Alias {
  token: string;
  /** Normalised name, searched as a phrase by the alias arm. */
  phrase: string;
  expansion: string;
}

/**
 * Words in the text that are initials of a place name learned from the data (place_acronyms).
 * Category words, town names and fillers are never read as initials ("bar", "spa", "ada").
 */
export function findAliases(ctx: SearchContext, text: string | null | undefined): Alias[] {
  if (!text) return [];
  const out: Alias[] = [];
  for (const w of new Set(words(normalize(text)))) {
    if (w.length < 3 || w.length > 8 || /\d/.test(w)) continue;
    if (isCategoryWord(ctx, w) || ctx.areas.has(w)) continue;
    const a = ctx.acronyms.get(w);
    if (a) out.push({ token: w, phrase: a.phrase, expansion: a.expansion });
  }
  return out;
}

/** The text with each initialism written out: "kbth" means nothing to an embedding. */
export function expandAliases(text: string, aliases: Alias[]) {
  if (!aliases.length) return text;
  const by = new Map(aliases.map((a) => [a.token, a.expansion]));
  return words(normalize(text))
    .map((w) => by.get(w) ?? w)
    .join(' ');
}
