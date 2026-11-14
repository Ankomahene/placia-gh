import { beforeEach, describe, expect, it } from 'vitest';
import { LLMRouter } from '../ai/router';
import type { LLMProvider } from '../ai/types';
import { clearParseCache, parseQuery } from './ai-parse';
import { buildContext, type RawContext } from './context';
import { type SearchRpc, search } from './engine';
import { parseRules } from './rules';

const raw: RawContext = {
  categories: [
    [1, 'food-drink', 'Food & drink', null, ['eat', 'food']],
    [2, 'shopping', 'Shopping', null, ['buy']],
    [3, 'health', 'Health', null, []],
    [4, 'education', 'Education', null, ['study']],
    [5, 'stay', 'Stay', null, ['sleep']],
    [6, 'transport', 'Transport', null, []],
    [10, 'local-food', 'Local food', 1, ['chop bar', 'waakye']],
    [11, 'pharmacy', 'Pharmacy', 3, ['chemical shop', 'chemist']],
    [12, 'hospital', 'Hospital', 3, ['teaching hospital']],
    [13, 'university', 'University', 4, ['legon', 'knust']],
    [14, 'hostel', 'Hostel', 5, []],
    [15, 'hotel', 'Hotel', 5, []],
    [16, 'hardware', 'Hardware', 2, ['cement']],
    [17, 'shop', 'Shop', 2, ['shop', 'store']],
    [18, 'mall', 'Mall', 2, []],
    [19, 'driving-school', 'Driving school', 6, ['learn to drive']],
  ],
  regions: [
    [1, 'Ashanti', 6.7, -1.5],
    [2, 'Greater Accra', 5.7, -0.2],
  ],
  districts: [[1, 'Kumasi Metropolitan', 1, 6.69, -1.62]],
  localities: [
    [1, 'Madina', [], 'town', null, 5.68, -0.166, 400],
    [2, 'Madina', [], 'village', null, 9.0, -1.0, 2],
    [3, 'Osu', [], 'suburb', null, 5.556, -0.182, 300],
    [4, 'Kumasi', [], 'city', null, 6.69, -1.62, 3000],
    [5, 'East Legon', [], 'suburb', null, 5.635, -0.155, 500],
    [6, 'Kaneshie', [], 'suburb', null, 5.565, -0.235, 200],
    [7, 'Circle', [], 'landmark', null, 5.57, -0.215, 0],
    [8, 'Accra', [], 'city', null, 5.56, -0.2, 9000],
    [9, 'Kasoa', [], 'town', null, 5.53, -0.42, 300],
  ],
};
const ctx = buildContext(raw);

describe('rule parser', () => {
  it('reads "<kind> in <area>" as a hard area', () => {
    const i = parseRules('pharmacy in madina', ctx);
    expect(i.categories).toEqual(['pharmacy']);
    expect(i.area).toMatchObject({ name: 'Madina', kind: 'town', relation: 'in' });
    expect(i.text).toBe('pharmacy');
  });

  it('understands Ghanaian terms', () => {
    expect(parseRules('chop bar near osu', ctx)).toMatchObject({
      categories: ['local-food'],
      area: { name: 'Osu', relation: 'near' },
    });
    expect(parseRules('chemical shop kasoa', ctx)).toMatchObject({
      categories: ['pharmacy'],
      area: { name: 'Kasoa', relation: 'near' },
      text: 'chemical shop',
    });
  });

  it('keeps a leading town as part of a name, for ranking only', () => {
    const i = parseRules('accra mall', ctx);
    expect(i.area).toMatchObject({ name: 'Accra', relation: 'soft' });
    expect(i.text).toBe('accra mall');
  });

  it('never reads an area name as a category', () => {
    const i = parseRules('hostel east legon', ctx);
    expect(i.categories).toEqual(['hostel']);
    expect(i.area?.name).toBe('East Legon');
  });

  it('fixes misspelt areas and reads price and time words', () => {
    const i = parseRules('cheap hotel around kaneshi', ctx);
    expect(i.area?.name).toBe('Kaneshie');
    expect(i.cheap).toBe(true);
    expect(parseRules('pharmacy open now', ctx).openNow).toBe(true);
  });

  it('flags near-me without inventing an area', () => {
    const i = parseRules('nearest pharmacy', ctx);
    expect(i).toMatchObject({ nearMe: true, area: null, categories: ['pharmacy'] });
  });

  it('turns an unknown "near X" into a landmark to look up', () => {
    const i = parseRules('hostels near knust', ctx);
    expect(i.anchor).toBe('knust');
    expect(i.categories).toEqual(['hostel']);
  });

  it('matches phrases containing filler words and prefers specific categories', () => {
    expect(parseRules('learn to drive in accra', ctx).categories).toEqual(['driving-school']);
    expect(parseRules('where to buy cement in kasoa', ctx).categories).toEqual(['hardware']);
    expect(parseRules('universities in ashanti region', ctx)).toMatchObject({
      categories: ['university'],
      area: { kind: 'region', name: 'Ashanti' },
    });
  });

  it('picks the clashing area name nearest the user', () => {
    expect(parseRules('food in madina', ctx).area?.kind).toBe('town');
    const far = parseRules('food in madina', ctx, { user: { lat: 9.01, lon: -1.0 } });
    expect(far.area?.kind).toBe('village');
  });

  it('never returns an empty query', () => {
    expect(parseRules('the', ctx).text).toBe('the');
  });
});

/** A provider whose behaviour each test sets. */
function provider(answer: () => Promise<unknown>): LLMProvider {
  return {
    name: 'anthropic',
    model: 'test',
    generateText: () => Promise.reject(new Error('unused')),
    generateObject: async () => ({
      data: (await answer()) as never,
      model: 'test',
      usage: { inputTokens: 1, outputTokens: 1 },
    }),
  };
}

describe('AI parse', () => {
  beforeEach(() => clearParseCache());

  it('keeps only categories and areas we can verify', async () => {
    const llm = new LLMRouter([
      provider(async () => ({
        what: 'pharmacy',
        categories: ['pharmacy', 'made-up'],
        location: 'Madina',
        location_relation: 'near',
        near_me: false,
        open_now: true,
        cheap: false,
      })),
    ]);
    const r = await parseQuery('any drug store around madina still open', ctx, { llm });
    expect(r.path).toBe('ai');
    expect(r.intent.categories).toEqual(['pharmacy']);
    expect(r.intent.area).toMatchObject({ name: 'Madina', relation: 'near' });
    expect(r.intent.openNow).toBe(true);
  });

  it('falls back to rules within the budget when the model hangs', async () => {
    const llm = new LLMRouter([provider(() => new Promise(() => {}))]);
    const t0 = Date.now();
    const r = await parseQuery('pharmacy in madina', ctx, { llm, budgetMs: 50 });
    expect(Date.now() - t0).toBeLessThan(500);
    expect(r.path).toBe('rules');
    expect(r.fallback).toBe('budget_exceeded');
    expect(r.intent.categories).toEqual(['pharmacy']);
  });

  it('skips the model entirely while its circuit breaker is open', async () => {
    const llm = new LLMRouter(
      [provider(() => Promise.reject(Object.assign(new Error('down'), { status: 529 })))],
      { failureThreshold: 2 },
    );
    await parseQuery('a', ctx, { llm });
    await parseQuery('b', ctx, { llm });
    const r = await parseQuery('c', ctx, { llm });
    expect(r.fallback).toBe('circuit_open');
  });
});

describe('search engine', () => {
  const row = (name: string) => ({
    id: name,
    slug: name,
    name,
    category: 'pharmacy',
    locality: null,
    district: null,
    address: null,
    lat: 5.68,
    lon: -0.17,
    distance_m: 100,
    confidence: 0.8,
    opening_hours: null,
    score: 1,
    arms: { fts: 1 },
  });

  it('widens the radius instead of returning too little', async () => {
    const radii: (number | null)[] = [];
    const rpc: SearchRpc = async (_fn, args) => {
      radii.push(args.p_radius_m as number | null);
      const r = args.p_radius_m as number;
      return { data: r > 10_000 ? [row('a'), row('b'), row('c')] : [row('a')], error: null };
    };
    const res = await search({ q: 'pharmacy in madina' }, { rpc, context: ctx });
    expect(radii).toEqual([6000, 18000]);
    expect(res.meta.widenedTo).toBe(18000);
    expect(res.results).toHaveLength(3);
  });

  it('asks for a location when "near me" has none', async () => {
    const rpc: SearchRpc = async () => ({ data: [], error: null });
    const res = await search({ q: 'pharmacy near me' }, { rpc, context: ctx });
    expect(res.meta.needsLocation).toBe(true);
  });

  it('searches around a landmark it can find', async () => {
    const calls: Record<string, unknown>[] = [];
    const rpc: SearchRpc = async (_fn, args) => {
      calls.push(args);
      if (args.p_limit === 3)
        return { data: [{ ...row('KNUST Main Gate'), lat: 6.67 }], error: null };
      return { data: [row('x'), row('y'), row('z')], error: null };
    };
    const res = await search({ q: 'hostel near knust' }, { rpc, context: ctx });
    expect(res.meta.anchor).toEqual({ text: 'knust', place: 'KNUST Main Gate' });
    expect(calls[1]).toMatchObject({ p_lat: 6.67, p_radius_m: 2000, p_text: 'hostel' });
  });
});
