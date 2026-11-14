import { describe, expect, it } from 'vitest';
import {
  FSQ_RULES,
  foursquareCategoryLeaf,
  foursquareLeaf,
  LEAVES,
  OVERTURE_TO_LEAF,
  TAXONOMY,
} from './taxonomy';

describe('taxonomy', () => {
  it('uses every slug once across groups and leaves (categories.slug is unique)', () => {
    const all = [...TAXONOMY.map((g) => g.slug), ...LEAVES.map((l) => l.slug)];
    expect(all.length).toBe(new Set(all).size);
  });

  it('maps every Overture category onto a real leaf', () => {
    const leaves = new Set(LEAVES.map((l) => l.slug));
    expect([...OVERTURE_TO_LEAF.values()].filter((s) => !leaves.has(s))).toEqual([]);
  });

  it('maps every Foursquare rule onto a real leaf or drops it', () => {
    const leaves = new Set(LEAVES.map((l) => l.slug));
    expect(Object.values(FSQ_RULES).filter((s) => s !== null && !leaves.has(s))).toEqual([]);
  });

  it('picks the longest matching Foursquare path', () => {
    const leaf = foursquareCategoryLeaf;
    expect(leaf('Dining and Drinking > Restaurant > Pizzeria')).toBe('fast-food');
    expect(leaf('Dining and Drinking > Restaurant > Italian Restaurant')).toBe('restaurant');
    expect(leaf('Dining and Drinking > Restaurant > African Restaurant')).toBe('local-food');
    expect(
      leaf('Business and Professional Services > Financial Service > Banking and Finance > ATM'),
    ).toBe('atm');
    expect(leaf('Business and Professional Services > Financial Service > Loans Agency')).toBe(
      'finance',
    );
    expect(
      leaf('Community and Government > Education > Primary and Secondary School > High School'),
    ).toBe('shs');
    expect(leaf('Community and Government > Education > Primary and Secondary School')).toBe(
      'school',
    );
    expect(leaf('Travel and Transportation > Road')).toBeNull();
    expect(leaf('Something New > Shop')).toBeUndefined();
  });

  it('prefers a specific Foursquare leaf and drops non-places', () => {
    expect(foursquareLeaf(['Retail', 'Retail > Pharmacy'])).toBe('pharmacy');
    expect(foursquareLeaf(['Retail > Pharmacy', 'Health and Medicine > Hospital'])).toBe(
      'pharmacy',
    );
    expect(
      foursquareLeaf(['Dining and Drinking > Bar', 'Dining and Drinking > Restaurant > Pizzeria']),
    ).toBe('bar');
    expect(foursquareLeaf(['Landmarks and Outdoors > Farm'])).toBe('other');
    expect(foursquareLeaf(null)).toBe('other');
    expect(foursquareLeaf(['Landmarks and Outdoors > States and Municipalities'])).toBeNull();
  });
});
