import { describe, expect, it } from 'vitest';
import { LEAVES, OVERTURE_TO_LEAF, TAXONOMY } from './taxonomy';

describe('taxonomy', () => {
  it('uses every slug once across groups and leaves (categories.slug is unique)', () => {
    const all = [...TAXONOMY.map((g) => g.slug), ...LEAVES.map((l) => l.slug)];
    expect(all.length).toBe(new Set(all).size);
  });

  it('maps every Overture category onto a real leaf', () => {
    const leaves = new Set(LEAVES.map((l) => l.slug));
    expect([...OVERTURE_TO_LEAF.values()].filter((s) => !leaves.has(s))).toEqual([]);
  });
});
