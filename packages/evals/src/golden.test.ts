import { describe, expect, it } from 'vitest';
import { GOLDEN, HOLDOUT, HOLDOUT_V2, HOLDOUT_V3, HOLDOUT_V4, LABEL_FIXES } from './golden';

describe('golden sets', () => {
  const all = [...GOLDEN, ...HOLDOUT, ...HOLDOUT_V2, ...HOLDOUT_V3, ...HOLDOUT_V4];

  it('has unique ids', () => {
    expect(new Set(all.map((c) => c.id)).size).toBe(all.length);
  });

  it('keeps the held-out queries out of the dev set', () => {
    const dev = new Set(GOLDEN.map((c) => c.q.toLowerCase()));
    expect(HOLDOUT.filter((c) => dev.has(c.q.toLowerCase()))).toEqual([]);
    expect(HOLDOUT.every((c) => c.id.startsWith('h-'))).toBe(true);
  });

  it('keeps held-out v2 apart from both earlier sets', () => {
    const seen = new Set([...GOLDEN, ...HOLDOUT].map((c) => c.q.toLowerCase()));
    expect(HOLDOUT_V2.filter((c) => seen.has(c.q.toLowerCase()))).toEqual([]);
    expect(HOLDOUT_V2.every((c) => c.id.startsWith('v-'))).toBe(true);
  });

  it('keeps held-out v3 apart from every earlier set', () => {
    const seen = new Set([...GOLDEN, ...HOLDOUT, ...HOLDOUT_V2].map((c) => c.q.toLowerCase()));
    expect(HOLDOUT_V3.filter((c) => seen.has(c.q.toLowerCase()))).toEqual([]);
    expect(HOLDOUT_V3.every((c) => c.id.startsWith('w-'))).toBe(true);
  });

  it('keeps held-out v4 apart from every earlier set', () => {
    const seen = new Set(
      [...GOLDEN, ...HOLDOUT, ...HOLDOUT_V2, ...HOLDOUT_V3].map((c) => c.q.toLowerCase()),
    );
    expect(HOLDOUT_V4.filter((c) => seen.has(c.q.toLowerCase()))).toEqual([]);
    expect(HOLDOUT_V4.every((c) => c.id.startsWith('x-'))).toBe(true);
  });

  it('only uses valid patterns and sensible areas', () => {
    for (const c of all) {
      const e = c.expect;
      if (e.kind === 'known') expect(() => new RegExp(e.name, 'i')).not.toThrow();
      else {
        expect(e.categories.length).toBeGreaterThan(0);
        expect(e.km).toBeGreaterThan(0);
        // Ghana's bounding box.
        expect(e.at[0]).toBeGreaterThan(4.5);
        expect(e.at[0]).toBeLessThan(11.2);
      }
    }
  });

  it('logs every label fix against a real case', () => {
    const ids = new Set(all.map((c) => c.id));
    for (const f of LABEL_FIXES) expect(ids.has(f.id)).toBe(true);
  });
});
