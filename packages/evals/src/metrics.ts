/** Retrieval and parse metrics. Pure functions over relevance vectors, unit-tested. */

/** 1/rank of the first relevant result, 0 when none is retrieved. */
export function reciprocalRank(rel: boolean[]) {
  const i = rel.indexOf(true);
  return i < 0 ? 0 : 1 / (i + 1);
}

export function hitAt(rel: boolean[], k: number) {
  return rel.slice(0, k).some(Boolean) ? 1 : 0;
}

/**
 * Precision over the first k results actually returned. A small town with three pharmacies
 * that returns exactly those three scores 1, not 0.3; empty result lists score 0.
 */
export function precisionAt(rel: boolean[], k: number) {
  const top = rel.slice(0, k);
  return top.length ? top.filter(Boolean).length / top.length : 0;
}

/**
 * Binary nDCG@k where the ideal list is "every returned position relevant". Unlike plain
 * precision it rewards putting the relevant results first.
 */
export function ndcgAt(rel: boolean[], k: number) {
  const top = rel.slice(0, k);
  if (!top.length) return 0;
  const dcg = top.reduce((s, r, i) => s + (r ? 1 / Math.log2(i + 2) : 0), 0);
  const idcg = top.reduce((s, _r, i) => s + 1 / Math.log2(i + 2), 0);
  return dcg / idcg;
}

export function mean(xs: number[]) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

/** Nearest-rank percentile (p in 0..100). */
export function percentile(xs: number[], p: number) {
  if (!xs.length) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return sorted[idx] as number;
}

export const round = (x: number, dp = 3) => Math.round(x * 10 ** dp) / 10 ** dp;

/** Lowercase, drop punctuation, collapse spaces: "Korle-Bu, please." → "korle bu please". */
export function normalizeWords(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/** Word error rate: word-level edit distance over the reference length. */
export function wordErrorRate(reference: string, hypothesis: string) {
  const r = normalizeWords(reference);
  const h = normalizeWords(hypothesis);
  if (r.length === 0) return h.length === 0 ? 0 : 1;
  let prev = Array.from({ length: h.length + 1 }, (_, j) => j);
  for (let i = 1; i <= r.length; i++) {
    const cur = [i];
    for (let j = 1; j <= h.length; j++) {
      const sub = (prev[j - 1] as number) + (r[i - 1] === h[j - 1] ? 0 : 1);
      cur[j] = Math.min(sub, (prev[j] as number) + 1, (cur[j - 1] as number) + 1);
    }
    prev = cur;
  }
  return (prev[h.length] as number) / r.length;
}
