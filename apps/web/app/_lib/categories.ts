import 'server-only';
import { db } from './db';

export interface CategoryOption {
  id: number;
  slug: string;
  name: string;
  group: string;
  synonyms: string[];
}

let cache: { at: number; list: CategoryOption[] } | null = null;

/** Leaf categories (the ones places use), grouped by parent, cached for an hour. */
export async function categoryOptions(): Promise<CategoryOption[]> {
  if (cache && Date.now() - cache.at < 3_600_000) return cache.list;
  const { data, error } = await db()
    .from('categories')
    .select('id, slug, name, parent_id, sort_order, synonyms');
  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const parents = new Map(rows.filter((r) => r.parent_id == null).map((r) => [r.id, r]));
  const list = rows
    .filter((r) => r.parent_id != null)
    .map((r) => ({
      id: r.id,
      slug: r.slug,
      name: r.name,
      group: parents.get(r.parent_id as number)?.name ?? '',
      synonyms: r.synonyms ?? [],
      order: parents.get(r.parent_id as number)?.sort_order ?? 0,
    }))
    .sort(
      (a, b) => a.order - b.order || a.group.localeCompare(b.group) || a.name.localeCompare(b.name),
    )
    .map(({ order: _, ...c }) => c);
  cache = { at: Date.now(), list };
  return list;
}
