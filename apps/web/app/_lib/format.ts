/** "350 m", "1.4 km", "12 km". */
export function formatDistance(m: number | null | undefined) {
  if (m == null) return null;
  if (m < 950) return `${Math.max(10, Math.round(m / 10) * 10)} m`;
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/**
 * A PostGIS point as PostgREST returns it: hex EWKB ("0101000020E6100000…").
 * Little-endian point with SRID: 1 byte order, 4 type, 4 SRID, then x and y as doubles.
 */
export function parsePoint(hex: unknown): { lat: number; lon: number } | null {
  if (typeof hex !== 'string' || hex.length < 50) return null;
  const bytes = new Uint8Array(hex.match(/../g)?.map((b) => Number.parseInt(b, 16)) ?? []);
  const view = new DataView(bytes.buffer);
  const little = bytes[0] === 1;
  const type = view.getUint32(1, little);
  const offset = type & 0x20000000 ? 9 : 5;
  const lon = view.getFloat64(offset, little);
  const lat = view.getFloat64(offset + 8, little);
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

const DAYS: Record<string, string> = {
  Mo: 'Mon',
  Tu: 'Tue',
  We: 'Wed',
  Th: 'Thu',
  Fr: 'Fri',
  Sa: 'Sat',
  Su: 'Sun',
  PH: 'Holidays',
};

/** OSM opening hours, one rule per line: "Mo-Fr 08:00-17:00" → "Mon–Fri 08:00–17:00". */
export function formatHours(hours: unknown): string[] {
  const osm = (hours as { osm?: unknown } | null)?.osm;
  if (typeof osm !== 'string' || !osm.trim()) return [];
  if (osm.trim() === '24/7') return ['Open 24 hours'];
  return osm
    .split(';')
    .map((rule) =>
      rule
        .trim()
        .replace(/\b(Mo|Tu|We|Th|Fr|Sa|Su|PH)\b/g, (d) => DAYS[d] ?? d)
        .replace(/-/g, '–')
        .replace(/,(?=\S)/g, ', ')
        .replace(/\boff\b/i, 'closed'),
    )
    .filter(Boolean);
}

/** "Accra", "Abeka · Okaikwei North" — the most useful two parts, never repeated. */
export function placeWhere(...parts: (string | null | undefined)[]) {
  const seen = new Set<string>();
  return parts
    .map((p) => p?.replace(/\s+(Municipal|Metropolitan|District)$/i, ''))
    .filter((p): p is string => !!p?.trim())
    .filter((p) => {
      const k = p.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 2)
    .join(' · ');
}
