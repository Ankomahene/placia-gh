import 'server-only';
import type { serviceDb } from './auth';

type Db = NonNullable<ReturnType<typeof serviceDb>>;

export interface CategoryOption {
  id: number;
  name: string;
  group: string;
}

/** Leaf categories (the ones places use), grouped by parent. */
export async function categoryOptions(db: Db): Promise<CategoryOption[]> {
  const { data } = await db.from('categories').select('id, name, parent_id, sort_order');
  const rows = data ?? [];
  const parents = new Map(rows.filter((r) => r.parent_id == null).map((r) => [r.id, r]));
  return rows
    .filter((r) => r.parent_id != null)
    .map((r) => {
      const p = parents.get(r.parent_id as number);
      return { id: r.id, name: r.name, group: p?.name ?? '', order: p?.sort_order ?? 0 };
    })
    .sort(
      (a, b) => a.order - b.order || a.group.localeCompare(b.group) || a.name.localeCompare(b.name),
    )
    .map(({ order: _, ...c }) => c);
}

/** PostGIS returns points as hex EWKB; read the lon/lat out of it. */
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

/** Opening hours as one editable line: free text as typed, OSM hours as their raw string. */
export function hoursText(h: unknown): string {
  if (!h || typeof h !== 'object') return '';
  const o = h as { text?: unknown; osm?: unknown };
  return typeof o.text === 'string' ? o.text : typeof o.osm === 'string' ? o.osm : '';
}
