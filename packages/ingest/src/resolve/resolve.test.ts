import { describe, expect, it } from 'vitest';
import { canonical, placeId, refineCategory, resolve, type SourceRecord } from './index';
import { decide, type PairFeatures } from './match';
import {
  displayName,
  matchDomain,
  nameTokens,
  normName,
  normPhone,
  normWebsite,
} from './normalize';
import { haversine, jaroWinkler, softTfIdf } from './similarity';

describe('normalise', () => {
  it('folds punctuation, accents and abbreviations', () => {
    expect(normName('St. George′s Hotel, Ltd.')).toBe('saint georges hotel ltd');
    expect(nameTokens(normName('Melcom Ltd'))).toEqual(['melcom']);
  });

  it('turns Ghana phone formats into E.164', () => {
    expect(normPhone('024 412 3456')).toBe('+233244123456');
    expect(normPhone('+233 (0)24 412 3456')).toBe('+233244123456');
    expect(normPhone('00233302123456')).toBe('+233302123456');
    expect(normPhone('bad; 0501234567')).toBe('+233501234567');
    expect(normPhone('12')).toBeNull();
  });

  it('ignores platform hosts as identity', () => {
    expect(matchDomain(normWebsite('www.kfc.com.gh/menu'))).toBe('kfc.com.gh');
    expect(matchDomain(normWebsite('https://facebook.com/somebiz'))).toBeNull();
  });

  it('calms shouting names only', () => {
    expect(displayName('HAATSO ECOMOG JUNCTION')).toBe('Haatso Ecomog Junction');
    expect(displayName('GCB Bank')).toBe('GCB Bank');
    expect(displayName('KORLE BU TotalEnergies SERVICE STATION')).toBe(
      'Korle BU TotalEnergies Service Station',
    );
    expect(displayName("ST. MARY'S SCHOOL")).toBe("St. Mary's School");
    expect(displayName('KFC')).toBe('KFC');
  });
});

describe('similarity', () => {
  it('jaro-winkler matches the textbook value', () => {
    expect(jaroWinkler('martha', 'marhta')).toBeCloseTo(0.961, 3);
  });

  it('soft tf-idf separates similarity from containment', () => {
    const w = () => 1;
    const s = softTfIdf(['golden', 'tulip'], ['golden', 'tulip', 'hotel', 'accra'], w);
    expect(Math.max(s.ab, s.ba)).toBe(1);
    expect(Math.min(s.ab, s.ba)).toBe(0.5);
  });

  it('haversine is in metres', () => {
    expect(haversine(-0.2, 5.6, -0.2, 5.601)).toBeCloseTo(111, 0);
  });
});

const f = (over: Partial<PairFeatures>): PairFeatures => ({
  distance: 30,
  nameSim: 0,
  contain: 0,
  containInformative: true,
  phoneEq: false,
  domainEq: false,
  category: 'same',
  sameSource: false,
  bothOsm: false,
  informative: true,
  ...over,
});

describe('match rule', () => {
  it('merges near-identical names nearby', () => {
    expect(decide(f({ nameSim: 0.96 }), 'hotel', 'hotel').match).toBe(true);
  });

  it('never merges across conflicting categories by name alone', () => {
    expect(
      decide(f({ nameSim: 1, contain: 1, category: 'conflict' }), 'mall', 'fast-food').match,
    ).toBe(false);
  });

  it('keeps generic names apart unless they coincide', () => {
    expect(
      decide(f({ nameSim: 1, informative: false, distance: 120 }), 'hostel', 'hostel').match,
    ).toBe(false);
    expect(
      decide(f({ nameSim: 1, informative: false, distance: 10 }), 'hostel', 'hostel').match,
    ).toBe(true);
  });

  it('does not let a shared chain phone merge distant branches', () => {
    expect(
      decide(f({ phoneEq: true, nameSim: 1, informative: false, distance: 400 }), 'fuel', 'fuel')
        .match,
    ).toBe(false);
    expect(decide(f({ phoneEq: true, nameSim: 0.9, distance: 600 }), 'hotel', 'hotel').match).toBe(
      true,
    );
  });

  it('uses containment only when the short name identifies something', () => {
    expect(decide(f({ contain: 1, nameSim: 0.5 }), 'hotel', 'hotel').rule).toBe('containment');
    expect(
      decide(f({ contain: 1, nameSim: 0.5, containInformative: false }), 'hotel', 'hotel').match,
    ).toBe(false);
  });
});

let seq = 0;
const rec = (o: Partial<SourceRecord> & Pick<SourceRecord, 'name' | 'source'>): SourceRecord => {
  const norm = normName(o.name);
  return {
    idx: seq,
    sourceId: `x${seq++}`,
    norm,
    tokens: nameTokens(norm),
    altNames: [],
    category: 'hotel',
    categoryRaw: null,
    lon: -0.2,
    lat: 5.6,
    phone: null,
    website: null,
    domain: null,
    email: null,
    openingHours: null,
    address: null,
    brand: null,
    extra: {},
    sourceConfidence: o.source === 'osm' ? null : 0.8,
    ...o,
  };
};

/** Pad the corpus so IDF has realistic background frequencies. */
const background = Array.from({ length: 400 }, (_, i) =>
  rec({
    source: 'overture',
    name: `Hostel ${i % 2 ? 'Annex' : ''}`.trim(),
    category: 'hostel',
    lon: 1 + i * 0.01,
    lat: 9,
  }),
);

describe('resolve', () => {
  it('merges the same hotel from two sources and keeps OSM identity', () => {
    const a = rec({ source: 'osm', name: 'Golden Tulip', lon: -0.2, lat: 5.6 });
    const b = rec({
      source: 'overture',
      name: 'Golden Tulip Hotel Accra',
      lon: -0.2003,
      lat: 5.6002,
      phone: '+233302213161',
    });
    const { places } = resolve([a, b, ...background]);
    const merged = places.find((p) => p.members.length === 2);
    expect(merged?.name).toBe('Golden Tulip');
    expect(merged?.phone).toBe('+233302213161');
    expect(merged?.altNames).toContain('Golden Tulip Hotel Accra');
    expect(merged?.id).toBe(placeId(a));
  });

  it('does not chain generic names across a neighbourhood', () => {
    const chain = Array.from({ length: 6 }, (_, i) =>
      rec({
        source: 'overture',
        name: 'Hostel',
        category: 'hostel',
        lon: -0.2 + i * 0.001,
        lat: 5.6,
      }),
    );
    const { places } = resolve([...chain, ...background]);
    expect(Math.max(...places.map((p) => p.members.length))).toBe(1);
  });

  it('drops weak single-source records but keeps OSM ones', () => {
    expect(
      canonical([rec({ source: 'overture', name: 'X Spot', sourceConfidence: 0.2 })]),
    ).toBeNull();
    expect(canonical([rec({ source: 'osm', name: 'X Spot' })])).not.toBeNull();
  });

  it('refines generic worship records by name', () => {
    expect(refineCategory('Masjid Nur', 'worship')).toBe('mosque');
    expect(refineCategory('Grace Assemblies of God', 'worship')).toBe('church');
    expect(refineCategory('Grace Assemblies of God', 'school')).toBe('school');
  });
});
