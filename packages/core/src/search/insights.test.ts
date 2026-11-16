import { describe, expect, it } from 'vitest';
import { flagSearches, hasStutter, isRephrase, type LoggedSearch } from './insights';

const ev = (over: Partial<LoggedSearch>): LoggedSearch => ({
  id: 1,
  created_at: '2026-11-15T22:51:00Z',
  session_id: null,
  query: 'q',
  parsed: { text: 'x', categories: [] },
  parse_path: 'ai',
  error: null,
  result_count: 20,
  total_latency_ms: 1000,
  lat: 5.6,
  lon: -0.27,
  top: [],
  review: null,
  ...over,
});

const kinds = (e: LoggedSearch[]) => flagSearches(e).map((f) => f.map((x) => x.kind));

describe('flagSearches', () => {
  it('flags results of the wrong kind (the "buy a cat" case)', () => {
    const church = { name: 'Holy Spirit Cathedral', category: 'church', locality: 'Accra' };
    const [flags] = flagSearches([
      ev({ parsed: { text: 'cat', categories: ['shop'] }, top: [church, church, church, church] }),
    ]);
    expect(flags?.[0]).toEqual({
      kind: 'off_category',
      detail: 'Asked for shop; top results: church ×4',
    });
  });

  it('does not flag when most results are the asked-for kind', () => {
    const shop = { name: 'Pawlish Pet Shop', category: 'shop', locality: null };
    const other = { name: 'City Pets', category: 'other', locality: null };
    expect(
      kinds([ev({ parsed: { text: 'pet', categories: ['shop'] }, top: [shop, shop, other] })]),
    ).toEqual([[]]);
  });

  it('marks a search that was rephrased soon after by the same person', () => {
    const a = ev({ id: 1, query: 'specialist hospital around dummy' });
    const b = ev({
      id: 2,
      query: 'specialist hospital around dome Accra',
      created_at: '2026-11-15T22:51:40Z',
    });
    const far = ev({
      id: 3,
      query: 'something else',
      lat: 6.7,
      created_at: '2026-11-15T22:51:50Z',
    });
    const [fa, fb] = flagSearches([a, b, far]);
    expect(fa?.find((f) => f.kind === 'retried')?.detail).toBe(
      '40 s later: "specialist hospital around dome Accra"',
    );
    expect(fb?.some((f) => f.kind === 'retried')).toBe(false);
  });

  it('does not count a new topic as a retry', () => {
    const a = ev({ query: 'pharmacy near osu' });
    const b = ev({ query: 'hostel knust', created_at: '2026-11-15T22:51:30Z' });
    expect(kinds([a, b])[0]).not.toContain('retried');
    expect(
      isRephrase(
        'what are some bus and restaurants around my area',
        'what are some bars and restaurants around my area',
      ),
    ).toBe(true);
    expect(
      isRephrase(
        'Is there place in Accra where I can buy a cat',
        'Is there place in Accra where I can buy a pet',
      ),
    ).toBe(true);
  });

  it('ignores the same query repeated (a refresh, not a rephrase)', () => {
    const a = ev({ query: 'hostel knust' });
    const b = ev({ query: 'Hostel  KNUST', created_at: '2026-11-15T22:51:20Z' });
    expect(kinds([a, b])[0]).not.toContain('retried');
  });

  it('treats rules_confident as a choice, not an AI failure', () => {
    expect(kinds([ev({ error: 'rules_confident' })])[0]).not.toContain('ai_failed');
    expect(kinds([ev({ error: 'All AI providers failed: openai=timeout' })])[0]).toContain(
      'ai_failed',
    );
  });

  it('flags an anchor that resolved to nothing, only when that was logged', () => {
    expect(kinds([ev({ parsed: { text: 'x', anchor: 'dummy', anchorPlace: null } })])[0]).toContain(
      'unplaced',
    );
    expect(kinds([ev({ parsed: { text: 'x', anchor: 'dummy' } })])[0]).not.toContain('unplaced');
  });

  it('flags vague, empty, slow searches', () => {
    expect(kinds([ev({ parsed: { text: '', categories: [], nearMe: true } })])[0]).toContain(
      'vague',
    );
    expect(kinds([ev({ result_count: 0 })])[0]).toContain('no_results');
    expect(kinds([ev({ total_latency_ms: 9820 })])[0]).toContain('slow');
  });
});

describe('hasStutter', () => {
  it('spots repeated phrases from voice input', () => {
    expect(hasStutter('I want I want I want places')).toBe(true);
    expect(hasStutter('pharmacy pharmacy')).toBe(true);
    expect(hasStutter('bars and restaurants around my area')).toBe(false);
  });
});
