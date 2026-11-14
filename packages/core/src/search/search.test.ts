import { beforeEach, describe, expect, it } from 'vitest';
import { LLMRouter } from '../ai/router';
import type { LLMProvider } from '../ai/types';
import { clearParseCache, parseQuery } from './ai-parse';
import { buildContext, type RawContext, sameNameAreas } from './context';
import { type SearchRpc, search } from './engine';
import { pairInPhrase, parseRules } from './rules';

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
    [20, 'fuel', 'Fuel station', 6, ['filling station']],
  ],
  regions: [
    [1, 'Ashanti', 6.7, -1.5],
    [2, 'Greater Accra', 5.7, -0.2],
    [3, 'Volta', 6.6, 0.4],
    [4, 'Eastern', 6.3, -0.5],
  ],
  districts: [
    [1, 'Kumasi Metropolitan', 1, 6.69, -1.62],
    [2, 'Anloga', 3, 5.8, 0.9],
    [3, 'Kwahu West Municipal', 4, 6.55, -0.8],
    [4, 'Akwapem North Municipal', 4, 5.95, -0.1],
    [5, 'Mampong Municipal', 1, 7.06, -1.4],
  ],
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
    // Same-name towns.
    [10, 'Anloga', [], 'town', 2, 5.794, 0.898, 42],
    [11, 'Anloga', [], 'suburb', 1, 6.678, -1.592, 33],
    [12, 'Atonsu', [], 'village', 3, 6.548, -0.82, 0],
    [13, 'Mampong', [], 'town', 5, 7.056, -1.404, 51],
    [14, 'Mampong', [], 'village', 4, 5.913, -0.14, 21],
    [15, 'Mampong', [], 'landmark', null, 5.601, -0.256, 0],
    // Bus stop names that are also category words, and a town one letter off "Ghana".
    [16, 'Station', [], 'landmark', null, 5.531, -0.421, 0],
    [17, 'Ghanata', [], 'village', null, 6.1, -0.5, 1],
  ],
  mentions: [
    // The Kumasi Atonsu, which the gazetteer lacks.
    [1, 'atonsu', 1, 6.6547, -1.5899, 43],
    // "Sunyani-Kumasi road": never outweighs Kumasi itself.
    [2, 'kumasi', null, 7.32, -2.31, 18],
    // Credits Asante Mampong.
    [3, 'mampong', 5, 7.0577, -1.4009, 27],
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

  it('fixes a misspelt town after a kind of place, but never bends a name into a town', () => {
    expect(parseRules('hotel kaneshi', ctx)).toMatchObject({
      categories: ['hotel'],
      area: { name: 'Kaneshie', relation: 'near' },
      text: 'hotel',
    });
    expect(parseRules('kaneshi', ctx).area).toBeNull();
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

  it('finds a suburb the gazetteer lacks from the addresses that name it', () => {
    expect(parseRules('pharmacy atonsu', ctx)).toMatchObject({
      categories: ['pharmacy'],
      area: { name: 'Atonsu', lat: 6.6547, relation: 'near' },
      text: 'pharmacy',
    });
    expect(ctx.areas.get('kumasi')?.some((a) => a.fromAddresses)).toBe(false);
    expect(ctx.areas.get('mampong')?.[0]).toMatchObject({ kind: 'town', mentions: 27 });
  });

  it('never takes a category word for a qualifier, or a name for a misspelt town', () => {
    expect(parseRules('filling station kasoa', ctx)).toMatchObject({
      categories: ['fuel'],
      area: { name: 'Kasoa', kind: 'town' },
      text: 'filling station',
    });
    expect(parseRules('university of ghana', ctx).area).toBeNull();
  });

  it('lets a second name say which town is meant', () => {
    expect(parseRules('pharmacy atonsu kumasi', ctx)).toMatchObject({
      area: { name: 'Atonsu', lat: 6.6547 },
      text: 'pharmacy',
    });
    expect(parseRules('hotel anloga volta', ctx).area).toMatchObject({ kind: 'town', lat: 5.794 });
    expect(parseRules('hotel in anloga kumasi', ctx).area).toMatchObject({
      kind: 'suburb',
      relation: 'in',
    });
    expect(parseRules('hotel anloga in kumasi', ctx)).toMatchObject({
      area: { kind: 'suburb', relation: 'in' },
      text: 'hotel',
    });
    // A district written without its compass word, and misspelt.
    expect(parseRules('hotel mampong akwapem', ctx).area).toMatchObject({ lat: 5.913 });
    expect(parseRules('hotel mampong akuapem', ctx).area).toMatchObject({ lat: 5.913 });
    expect(pairInPhrase(ctx, 'atonsu in kumasi')).toMatchObject({ lat: 6.6547 });
    // Each lies within the other's reach: the smaller one is meant, whichever comes first.
    expect(pairInPhrase(ctx, 'kumasi atonsu')).toMatchObject({ lat: 6.6547 });
    // Two names where neither is in the other are not a town and its qualifier.
    expect(pairInPhrase(ctx, 'osu kasoa')).toBeNull();
  });

  it('prefers the nearer same-name town, and a town over a bus stop', () => {
    const keta = { lat: 5.92, lon: 0.99 };
    const kumasi = { lat: 6.69, lon: -1.62 };
    expect(parseRules('pharmacy anloga', ctx, { user: keta }).area?.kind).toBe('town');
    expect(parseRules('pharmacy anloga', ctx, { user: kumasi }).area?.kind).toBe('suburb');
    const accra = parseRules('hotel mampong', ctx, { user: { lat: 5.6, lon: -0.19 } });
    expect(accra.area).toMatchObject({ kind: 'village', lat: 5.913 });
    expect(parseRules('hotel mampong', ctx).area).toMatchObject({ kind: 'town', lat: 7.056 });
  });

  it('lists the other towns with the same name, each with a query that picks it', () => {
    const volta = parseRules('hotel anloga volta', ctx).area;
    const same = volta && sameNameAreas(ctx, volta);
    expect(same?.where).toBe('Anloga, Volta');
    expect(same?.others).toEqual([
      expect.objectContaining({ name: 'Anloga', where: 'Kumasi, Ashanti', query: 'anloga kumasi' }),
    ]);
    expect(parseRules(`hotel ${same?.others[0]?.query}`, ctx).area?.kind).toBe('suburb');
    const osu = parseRules('hotel osu', ctx).area;
    expect(osu && sameNameAreas(ctx, osu)?.others).toEqual([]);
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
    const r = await parseQuery('pharmacy in madina', ctx, {
      llm,
      budgetMs: 50,
      aiPolicy: 'always',
    });
    expect(Date.now() - t0).toBeLessThan(500);
    expect(r.path).toBe('rules');
    expect(r.fallback).toBe('budget_exceeded');
    expect(r.intent.categories).toEqual(['pharmacy']);
  });

  it('asks the model only when the rules are unsure', async () => {
    let calls = 0;
    const llm = new LLMRouter([
      provider(async () => {
        calls++;
        return {
          what: 'tailor',
          categories: ['tailor'],
          location: 'Osu',
          location_relation: 'in',
          near_me: false,
          open_now: false,
          cheap: false,
        };
      }),
    ]);
    const sure = await parseQuery('pharmacy in madina', ctx, { llm });
    expect(sure).toMatchObject({ path: 'rules', fallback: 'rules_confident' });
    expect((await parseQuery('accra mall', ctx, { llm })).fallback).toBe('rules_confident');
    expect(calls).toBe(0);

    const asked = await parseQuery('where can i get a dress sewn in osu', ctx, { llm });
    expect(asked).toMatchObject({ path: 'ai', aiReason: 'request' });
    expect((await parseQuery('pharmacy near me in osu', ctx, { llm })).aiReason).toBe('conflict');
    expect(calls).toBe(2);
  });

  it('skips the model entirely while its circuit breaker is open', async () => {
    const llm = new LLMRouter(
      [provider(() => Promise.reject(Object.assign(new Error('down'), { status: 529 })))],
      { failureThreshold: 2 },
    );
    const always = { llm, aiPolicy: 'always' as const };
    await parseQuery('a', ctx, always);
    await parseQuery('b', ctx, always);
    const r = await parseQuery('c', ctx, always);
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

  it('embeds what is being looked for, not where', async () => {
    const seen: string[][] = [];
    const embedder = {
      model: 'test',
      dimensions: 2,
      embed: async (texts: string[]) => {
        seen.push(texts);
        return { vectors: [[0.1, 0.2]], usage: { inputTokens: 1, outputTokens: 0 } };
      },
    };
    let sent: unknown;
    const rpc: SearchRpc = async (_fn, args) => {
      sent = args.p_embedding;
      return { data: [row('a'), row('b'), row('c')], error: null };
    };
    const res = await search({ q: 'watch football in osu' }, { rpc, context: ctx, embedder });
    expect(seen).toEqual([['watch football']]);
    expect(sent).toBe('[0.10000,0.20000]');
    expect(res.meta.semantic).toBe(true);
  });

  it('treats a pure category query as browsing: no embedding, name arms turned down', async () => {
    let embedded = false;
    const embedder = {
      model: 'test',
      dimensions: 2,
      embed: async () => {
        embedded = true;
        return { vectors: [[0.1, 0.2]], usage: { inputTokens: 1, outputTokens: 0 } };
      },
    };
    const rpc: SearchRpc = async () => ({ data: [row('a'), row('b'), row('c')], error: null });
    const res = await search({ q: 'pharmacy in madina' }, { rpc, context: ctx, embedder });
    expect(embedded).toBe(false);
    expect(res.meta.pureBrowse).toBe(true);
    expect(res.meta.weights).toMatchObject({ semantic: 0, title: 0.5, name: 0.5 });
  });

  it('still answers when the embedding call fails', async () => {
    const embedder = {
      model: 'test',
      dimensions: 2,
      embed: () => Promise.reject(new Error('down')),
    };
    const rpc: SearchRpc = async () => ({ data: [row('a'), row('b'), row('c')], error: null });
    const res = await search({ q: 'pharmacy in kasoa' }, { rpc, context: ctx, embedder });
    expect(res.meta.semantic).toBe(false);
    expect(res.results).toHaveLength(3);
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
