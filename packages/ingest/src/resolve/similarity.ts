/** String and spatial similarity primitives for entity resolution. */

export function jaroWinkler(a: string, b: string) {
  if (a === b) return 1;
  const la = a.length;
  const lb = b.length;
  if (!la || !lb) return 0;
  const window = Math.max(0, Math.floor(Math.max(la, lb) / 2) - 1);
  const ma = new Array<boolean>(la).fill(false);
  const mb = new Array<boolean>(lb).fill(false);
  let m = 0;
  for (let i = 0; i < la; i++) {
    const lo = Math.max(0, i - window);
    const hi = Math.min(lb - 1, i + window);
    for (let j = lo; j <= hi; j++) {
      if (!mb[j] && a[i] === b[j]) {
        ma[i] = mb[j] = true;
        m++;
        break;
      }
    }
  }
  if (!m) return 0;
  let t = 0;
  for (let i = 0, k = 0; i < la; i++) {
    if (!ma[i]) continue;
    while (!mb[k]) k++;
    if (a[i] !== b[k]) t++;
    k++;
  }
  const jaro = (m / la + m / lb + (m - t / 2) / m) / 3;
  let p = 0;
  while (p < 4 && a[p] === b[p]) p++;
  return jaro + p * 0.1 * (1 - jaro);
}

/**
 * Inverse document frequency over all source names. Tokens like "church", "school", "pharmacy"
 * appear thousands of times and carry little identity; "korle", "tulip", "melcom" carry a lot.
 */
export class Idf {
  private readonly df = new Map<string, number>();
  private n = 0;

  add(tokens: Iterable<string>) {
    this.n++;
    for (const t of new Set(tokens)) this.df.set(t, (this.df.get(t) ?? 0) + 1);
  }

  weight(t: string) {
    return Math.log((this.n + 1) / ((this.df.get(t) ?? 0) + 1)) + 1;
  }

  /** The weight of a token seen in `docs` names, i.e. the bar for "informative". */
  weightAt(docs: number) {
    return Math.log((this.n + 1) / (docs + 1)) + 1;
  }
}

const R = 6_371_008.8;
const rad = (d: number) => (d * Math.PI) / 180;

export function haversine(lon1: number, lat1: number, lon2: number, lat2: number) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * Soft TF-IDF (Cohen, Ravikumar & Fienberg 2003): tokens match fuzzily (Jaro-Winkler ≥ 0.88)
 * and count by their IDF weight. Returns the score in each direction:
 * `ab` = how much of A is found in B. `min(ab, ba)` is symmetric similarity;
 * `max(ab, ba)` is containment ("Golden Tulip" ⊂ "Golden Tulip Hotel Accra").
 */
export function softTfIdf(
  a: readonly string[],
  b: readonly string[],
  weight: (t: string) => number,
) {
  const dir = (x: readonly string[], y: readonly string[]) => {
    let total = 0;
    let hit = 0;
    for (const t of x) {
      const w = weight(t);
      total += w;
      let best = 0;
      for (const u of y) {
        const s = t === u ? 1 : jaroWinkler(t, u);
        if (s > best) best = s;
        if (best === 1) break;
      }
      if (best >= 0.88) hit += w * best;
    }
    return total ? hit / total : 0;
  };
  return { ab: dir(a, b), ba: dir(b, a) };
}
