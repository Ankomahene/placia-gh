import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BackLink } from '../_components/back-link';
import { BottomNav, SiteHeader } from '../_components/nav';
import { categoryOptions } from '../_lib/categories';
import { db } from '../_lib/db';
import { parsePoint } from '../_lib/format';
import { getViewer } from '../_lib/supabase/server';
import { ContributeForm, type Kind, type PlaceDraft } from './contribute-form';

export const metadata: Metadata = { title: 'Add a place', robots: { index: false } };

const TITLES: Record<Kind, string> = {
  new_place: 'Add a place',
  edit: 'Suggest an edit',
  report: 'Report a problem',
  photo: 'Add a photo',
};

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{ place?: string; kind?: string }>;
}) {
  const sp = await searchParams;
  const viewer = await getViewer();
  if (!viewer) {
    const here = `/contribute${sp.place ? `?place=${encodeURIComponent(sp.place)}&kind=${sp.kind ?? 'edit'}` : ''}`;
    redirect(`/signin?next=${encodeURIComponent(here)}` as never);
  }

  let place: PlaceDraft | null = null;
  if (sp.place) {
    const { data } = await db()
      .from('places')
      .select('id, slug, name, category_id, phone, website, address, opening_hours, location')
      .eq('slug', sp.place)
      .maybeSingle();
    const pt = data ? parsePoint(data.location) : null;
    if (data && pt) {
      const h = data.opening_hours as { osm?: string; text?: string } | null;
      place = {
        id: data.id,
        slug: data.slug,
        name: data.name,
        category_id: data.category_id,
        phone: data.phone ?? '',
        website: data.website ?? '',
        address: data.address ?? '',
        hours: h?.text ?? h?.osm ?? '',
        ...pt,
      };
    }
  }
  const kind: Kind = place
    ? sp.kind === 'report' || sp.kind === 'photo'
      ? sp.kind
      : 'edit'
    : 'new_place';

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/contribute" />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-4 pb-28 md:pt-10">
        <div className="mb-5 flex items-center gap-2">
          {place ? <BackLink className="-ml-2 hover:bg-surface-2" /> : null}
          <div className="min-w-0">
            <h1 className="font-semibold text-2xl tracking-tight">{TITLES[kind]}</h1>
            {place ? <p className="truncate text-muted-foreground">{place.name}</p> : null}
          </div>
        </div>
        <ContributeForm
          kind={kind}
          place={place}
          categories={kind === 'new_place' || kind === 'edit' ? await categoryOptions() : []}
          userId={viewer.id}
        />
      </main>
      <BottomNav active="/contribute" />
    </div>
  );
}
