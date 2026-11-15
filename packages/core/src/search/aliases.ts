import { areaKm, type SearchContext } from './context';
import { isInitials } from './rules';
import { normalize, words } from './text';

/** Initials in a query and the place name they stand for ("kbth" → Korle Bu Teaching Hospital). */
export interface Alias {
  token: string;
  /** Normalised name, searched as a phrase by the alias arm. */
  phrase: string;
  expansion: string;
}

/** A town in the query picks among names that share initials when one is this close (km). */
const NEAR_KM = 40;

/**
 * Words in the text that are initials of a place name learned from the data (place_acronyms).
 * Category words, town names and fillers are never read as initials ("bar", "spa", "ada").
 * With a point (the town in the query, else the user), initials several places share mean the
 * best-known name within 40 km of it: "ktu koforidua" is Koforidua Technical University, not
 * the better-known Kumasi one.
 */
export function findAliases(
  ctx: SearchContext,
  text: string | null | undefined,
  near?: { lat: number; lon: number } | null,
): Alias[] {
  if (!text) return [];
  const out: Alias[] = [];
  for (const w of new Set(words(normalize(text)))) {
    if (!isInitials(ctx, w)) continue;
    const best = ctx.acronyms.get(w);
    if (!best) continue;
    let pick: { phrase: string; expansion: string } = best;
    if (near) {
      const close = [best, ...best.others].find(
        (a) =>
          a.lat != null && a.lon != null && areaKm({ lat: a.lat, lon: a.lon }, near) <= NEAR_KM,
      );
      if (close) pick = close;
    }
    out.push({ token: w, phrase: pick.phrase, expansion: pick.expansion });
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
