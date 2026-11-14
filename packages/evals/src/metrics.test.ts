import { describe, expect, it } from 'vitest';
import { hitAt, ndcgAt, percentile, precisionAt, reciprocalRank } from './metrics';

describe('retrieval metrics', () => {
  it('reciprocal rank uses the first relevant result', () => {
    expect(reciprocalRank([false, false, true, true])).toBeCloseTo(1 / 3);
    expect(reciprocalRank([false, false])).toBe(0);
    expect(reciprocalRank([])).toBe(0);
  });

  it('hit@k', () => {
    expect(hitAt([false, true], 1)).toBe(0);
    expect(hitAt([false, true], 2)).toBe(1);
  });

  it('precision is over returned results', () => {
    expect(precisionAt([true, true, true], 10)).toBe(1);
    expect(precisionAt([true, false, false, false], 10)).toBe(0.25);
    expect(precisionAt([], 10)).toBe(0);
  });

  it('ndcg rewards relevant results first', () => {
    const early = ndcgAt([true, false, false, false], 10);
    const late = ndcgAt([false, false, false, true], 10);
    expect(early).toBeGreaterThan(late);
    expect(ndcgAt([true, true], 10)).toBe(1);
    expect(ndcgAt([false, false], 10)).toBe(0);
  });

  it('nearest-rank percentile', () => {
    const xs = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
    expect(percentile(xs, 50)).toBe(50);
    expect(percentile(xs, 95)).toBe(100);
    expect(percentile([7], 95)).toBe(7);
  });
});
