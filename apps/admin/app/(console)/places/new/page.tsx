import { ChevronLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin, serviceDb } from '../../../_lib/auth';
import { categoryOptions } from '../../../_lib/places';
import { PlaceEditor } from '../place-editor';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Add place' };

export default async function NewPlacePage({
  searchParams,
}: {
  searchParams: Promise<{ lat?: string; lon?: string }>;
}) {
  await requireAdmin();
  const db = serviceDb();
  const sp = await searchParams;
  const lat = Number(sp.lat);
  const lon = Number(sp.lon);
  const categories = db ? await categoryOptions(db) : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8">
      <div>
        <Link
          href="/places"
          className="inline-flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Places
        </Link>
        <h1 className="mt-2 font-semibold text-2xl tracking-tight">Add place</h1>
      </div>
      <PlaceEditor
        id={null}
        categories={categories}
        initial={{
          name: '',
          alt_names: '',
          category_id: '',
          // Accra unless a point came with the link.
          lat: Number.isFinite(lat) && lat ? lat : 5.6037,
          lon: Number.isFinite(lon) && lon ? lon : -0.187,
          address: '',
          phone: '',
          website: '',
          email: '',
          hours: '',
          description: '',
          status: 'active',
        }}
      />
    </div>
  );
}
