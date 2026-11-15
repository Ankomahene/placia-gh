import { buttonVariants } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { Clock, Globe, MapPin, Navigation, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { BackLink } from '../../_components/back-link';
import { PlaceMap } from '../../_components/map';
import { BottomNav, SiteHeader } from '../../_components/nav';
import { db } from '../../_lib/db';
import { formatDistance, formatHours, parsePoint, placeWhere } from '../../_lib/format';
import { ShareButton } from './share-button';

const SOURCE_NAMES: Record<string, string> = {
  osm: 'OpenStreetMap',
  overture: 'Overture Maps',
  foursquare: 'Foursquare',
  geonames: 'GeoNames',
  wikidata: 'Wikidata',
  community: 'Community',
};

interface Named {
  name: string;
}

const getPlace = cache(async (slug: string) => {
  const { data, error } = await db()
    .from('places')
    .select(
      'id, slug, name, alt_names, address, phone, website, email, opening_hours, description, location, status, categories(id, name, slug), localities(name), districts(name), regions(name), place_sources(source)',
    )
    .eq('slug', slug)
    .in('status', ['active', 'closed'])
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const point = parsePoint(data.location);
  if (!point) return null;
  const one = <T,>(v: T | T[] | null) => (Array.isArray(v) ? (v[0] ?? null) : v);
  return {
    ...data,
    ...point,
    category: one(data.categories as unknown as { id: number; name: string; slug: string }),
    locality: one(data.localities as unknown as Named)?.name ?? null,
    district: one(data.districts as unknown as Named)?.name ?? null,
    region: one(data.regions as unknown as Named)?.name ?? null,
    sources: [
      ...new Set(
        ((data.place_sources as unknown as { source: string }[]) ?? []).map((s) => s.source),
      ),
    ],
  };
});

type Place = NonNullable<Awaited<ReturnType<typeof getPlace>>>;

interface NearbyRow {
  id: string;
  slug: string;
  name: string;
  distance_m: number | null;
}

async function getNearby(p: Place) {
  if (!p.category) return [];
  const { data } = await db().rpc(
    'search_places' as never,
    {
      p_categories: [p.category.id],
      p_lat: p.lat,
      p_lon: p.lon,
      p_radius_m: 3000,
      p_limit: 7,
    } as never,
  );
  return ((data as NearbyRow[] | null) ?? []).filter((r) => r.id !== p.id).slice(0, 6);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = await getPlace((await params).slug);
  if (!p) return { title: 'Place not found' };
  const where = placeWhere(p.locality, p.district, p.region);
  return {
    title: p.name,
    description: [p.category?.name, where].filter(Boolean).join(' · '),
  };
}

export default async function PlacePage({ params }: { params: Promise<{ slug: string }> }) {
  const p = await getPlace((await params).slug);
  if (!p) notFound();
  const nearby = await getNearby(p);

  const where = placeWhere(p.locality, p.district, p.region);
  const hours = formatHours(p.opening_hours);
  const website = p.website
    ? p.website.startsWith('http')
      ? p.website
      : `https://${p.website}`
    : null;
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="hidden md:block">
        <SiteHeader />
      </div>

      <main className="mx-auto w-full max-w-6xl flex-1 pb-28 md:px-8 md:pt-8 md:pb-16">
        <div className="md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] md:gap-10">
          {/* Map: full-bleed header on phones, a card on the right on wide screens */}
          <div className="relative md:order-2">
            <div className="h-56 overflow-hidden md:sticky md:top-24 md:h-[28rem] md:rounded-xl md:border md:shadow-card">
              <PlaceMap
                points={[{ id: p.id, name: p.name, lat: p.lat, lon: p.lon }]}
                focus={{ lat: p.lat, lon: p.lon, zoom: 16 }}
                className="size-full"
              />
            </div>
            <BackButton className="absolute top-3 left-3 md:hidden" />
          </div>

          <div className="px-4 pt-5 md:px-0 md:pt-0">
            <BackButton className="mb-4 hidden md:inline-flex" />
            <h1 className="font-semibold text-2xl tracking-tight md:text-4xl">{p.name}</h1>
            <p className="mt-1.5 text-muted-foreground">
              {[p.category?.name, where].filter(Boolean).join(' · ')}
            </p>
            {p.status === 'closed' ? (
              <p className="mt-3 inline-flex rounded-full bg-danger/10 px-3 py-1 font-medium text-danger text-sm">
                Closed
              </p>
            ) : null}

            <div className="no-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
              <a
                href={directions}
                target="_blank"
                rel="noopener"
                className={buttonVariants({ size: 'lg' })}
              >
                <Navigation />
                Directions
              </a>
              {p.phone ? (
                <a
                  href={`tel:${p.phone}`}
                  className={buttonVariants({ size: 'lg', variant: 'soft' })}
                >
                  <Phone />
                  Call
                </a>
              ) : null}
              {website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener nofollow"
                  className={buttonVariants({ size: 'lg', variant: 'soft' })}
                >
                  <Globe />
                  Website
                </a>
              ) : null}
              <ShareButton title={p.name} />
            </div>

            {p.description ? <p className="mt-6 leading-relaxed">{p.description}</p> : null}

            <dl className="mt-6 divide-y rounded-xl border bg-surface">
              {p.address ? (
                <Detail icon={<MapPin />} label="Address">
                  {p.address}
                </Detail>
              ) : null}
              {hours.length ? (
                <Detail icon={<Clock />} label="Hours">
                  {hours.map((h) => (
                    <span key={h} className="block">
                      {h}
                    </span>
                  ))}
                </Detail>
              ) : null}
              {p.phone ? (
                <Detail icon={<Phone />} label="Phone">
                  <a href={`tel:${p.phone}`} className="text-primary hover:underline">
                    {p.phone}
                  </a>
                </Detail>
              ) : null}
              {website ? (
                <Detail icon={<Globe />} label="Website">
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener nofollow"
                    className="break-all text-primary hover:underline"
                  >
                    {website.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
                  </a>
                </Detail>
              ) : null}
              <Detail icon={<Navigation />} label="Coordinates">
                <span className="tabular-nums">
                  {p.lat.toFixed(5)}, {p.lon.toFixed(5)}
                </span>
              </Detail>
            </dl>

            {nearby.length ? (
              <section className="mt-8" aria-labelledby="nearby">
                <h2 id="nearby" className="font-semibold text-lg tracking-tight">
                  More {p.category?.name.toLowerCase()} nearby
                </h2>
                <ul className="mt-3 divide-y rounded-xl border bg-surface">
                  {nearby.map((n) => (
                    <li key={n.id}>
                      <Link
                        href={`/place/${n.slug}`}
                        className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-surface-2"
                      >
                        <span className="truncate font-medium">{n.name}</span>
                        <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
                          {formatDistance(n.distance_m)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {p.sources.length ? (
              <p className="mt-8 text-muted-foreground text-xs">
                Sources: {p.sources.map((s) => SOURCE_NAMES[s] ?? s).join(', ')}
              </p>
            ) : null}
          </div>
        </div>
      </main>

      <BottomNav active="/" />
    </div>
  );
}

function Detail({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 px-4 py-3.5 [&>svg]:mt-0.5 [&>svg]:size-[18px] [&>svg]:shrink-0 [&>svg]:text-muted-foreground">
      {icon}
      <div className="min-w-0">
        <dt className="sr-only">{label}</dt>
        <dd>{children}</dd>
      </div>
    </div>
  );
}

function BackButton({ className }: { className?: string }) {
  return (
    <BackLink
      className={cn(
        'bg-surface/90 shadow-card backdrop-blur-md hover:bg-surface md:size-9 md:bg-transparent md:shadow-none md:hover:bg-surface-2',
        className,
      )}
    />
  );
}
