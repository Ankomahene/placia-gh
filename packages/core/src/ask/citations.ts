/**
 * Grounding for Ask. The model refers to places only by short refs ([P1], [P2]) that our tools
 * handed it, never by id or URL, so every citation can be checked against what the tools really
 * returned. A ref we never issued is a made-up place and is dropped before the user sees it.
 */

export const CITATION = /\[(P\d{1,3})\]/g;

export interface CitationCheck {
  /** Refs cited that our tools issued, in first-cited order. */
  valid: string[];
  /** Refs cited that no tool issued: hallucinated. */
  invalid: string[];
}

export function checkCitations(text: string, issued: ReadonlySet<string>): CitationCheck {
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const m of text.matchAll(CITATION)) {
    const ref = m[1] as string;
    const list = issued.has(ref) ? valid : invalid;
    if (!list.includes(ref)) list.push(ref);
  }
  return { valid, invalid };
}

/** Removes citations of refs that were never issued, leaving the rest of the text as written. */
export function stripInvalid(text: string, issued: ReadonlySet<string>) {
  return text.replace(CITATION, (whole, ref: string) => (issued.has(ref) ? whole : ''));
}

export type Segment = { kind: 'text'; text: string } | { kind: 'cite'; ref: string };

/** Splits an answer into text and citation pieces for rendering (citations become place chips). */
export function segments(text: string): Segment[] {
  const out: Segment[] = [];
  let last = 0;
  for (const m of text.matchAll(CITATION)) {
    const at = m.index ?? 0;
    if (at > last) out.push({ kind: 'text', text: text.slice(last, at) });
    out.push({ kind: 'cite', ref: m[1] as string });
    last = at + m[0].length;
  }
  if (last < text.length) out.push({ kind: 'text', text: text.slice(last) });
  return out;
}
