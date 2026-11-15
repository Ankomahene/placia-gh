import { describe, expect, it } from 'vitest';
import { checkCitations, segments, stripInvalid } from './citations';

const issued = new Set(['P1', 'P2']);

describe('checkCitations', () => {
  it('splits issued refs from made-up ones, once each, in order', () => {
    expect(checkCitations('Try A [P2], B [P7] or A again [P2] and C [P1].', issued)).toEqual({
      valid: ['P2', 'P1'],
      invalid: ['P7'],
    });
  });

  it('finds nothing in plain text', () => {
    expect(checkCitations('No places matched.', issued)).toEqual({ valid: [], invalid: [] });
  });
});

describe('stripInvalid', () => {
  it('drops only refs no tool issued', () => {
    expect(stripInvalid('A [P1], B [P9].', issued)).toBe('A [P1], B .');
  });
});

describe('segments', () => {
  it('turns citations into their own pieces', () => {
    expect(segments('Go to A [P1] today')).toEqual([
      { kind: 'text', text: 'Go to A ' },
      { kind: 'cite', ref: 'P1' },
      { kind: 'text', text: ' today' },
    ]);
  });
});
