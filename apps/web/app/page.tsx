import { Button } from '@placia/ui/button';
import {
  Banknote,
  BedDouble,
  Church,
  Cross,
  Fuel,
  GraduationCap,
  LocateFixed,
  Mic,
  Pill,
  Search,
  ShoppingBasket,
  UtensilsCrossed,
} from 'lucide-react';
import { BottomNav, SiteHeader } from './_components/nav';

const CATEGORIES = [
  { label: 'Food', icon: UtensilsCrossed },
  { label: 'Pharmacy', icon: Pill },
  { label: 'Hotels', icon: BedDouble },
  { label: 'ATM & Banks', icon: Banknote },
  { label: 'Fuel', icon: Fuel },
  { label: 'Hospitals', icon: Cross },
  { label: 'Groceries', icon: ShoppingBasket },
  { label: 'Schools', icon: GraduationCap },
  { label: 'Worship', icon: Church },
];

export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/" />

      <main className="mx-auto w-full max-w-xl flex-1 px-4 pt-3 pb-28 md:max-w-6xl md:px-8 md:pt-12 md:pb-16">
        <div className="grid grid-cols-[minmax(0,1fr)] gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-12">
          <div className="space-y-6 md:space-y-8 md:pt-6">
            <h1 className="hidden font-semibold text-4xl tracking-tight md:block lg:text-5xl">
              Find any place in Ghana
            </h1>

            <form action="/search" className="relative" role="search">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-5 text-muted-foreground md:left-5" />
              <input
                name="q"
                type="search"
                autoComplete="off"
                enterKeyHint="search"
                placeholder="Search places in Ghana"
                aria-label="Search places"
                className="h-14 w-full rounded-full border bg-surface pr-16 pl-12 text-base shadow-card outline-none placeholder:text-muted-foreground focus:border-primary md:h-16 md:pl-14 md:text-lg"
              />
              <Button
                size="icon"
                aria-label="Search by voice"
                className="-translate-y-1/2 absolute top-1/2 right-2 md:size-12"
              >
                <Mic />
              </Button>
            </form>

            <section aria-label="Categories" className="-mx-4 md:mx-0">
              <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:overflow-visible md:px-0">
                {CATEGORIES.map(({ label, icon: Icon }) => (
                  <li key={label}>
                    <a
                      href={`/search?category=${encodeURIComponent(label)}`}
                      className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full border bg-surface px-4 font-medium text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon className="size-4 text-primary" />
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-labelledby="near-you" className="space-y-3">
            <h2 id="near-you" className="font-semibold text-lg tracking-tight md:sr-only">
              Near you
            </h2>
            <div className="relative overflow-hidden rounded-xl border bg-surface shadow-card">
              <MapPreview />
              <div className="flex items-center justify-between gap-3 border-t p-3 md:px-5 md:py-4">
                <span className="font-medium text-sm">Accra</span>
                <Button variant="soft" size="sm">
                  <LocateFixed />
                  Use my location
                </Button>
              </div>
            </div>
          </section>
        </div>
      </main>

      <BottomNav active="/" />
    </div>
  );
}

/** Decorative stand-in until the MapLibre map lands in Phase 3. */
function MapPreview() {
  return (
    <svg
      viewBox="0 0 400 180"
      className="block h-44 w-full md:h-[26rem]"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Map preview"
    >
      <rect width="400" height="180" className="fill-surface-2" />
      <g className="stroke-border" strokeWidth="10" fill="none" strokeLinecap="round">
        <path d="M-10 120 C 80 100, 140 150, 230 110 S 360 60, 410 80" />
        <path d="M120 -10 C 130 60, 110 120, 150 190" />
        <path d="M280 -10 L 300 190" />
      </g>
      <g className="stroke-border" strokeWidth="3" fill="none">
        <path d="M-10 50 L 410 30" />
        <path d="M40 -10 L 70 190" />
        <path d="M200 -10 C 210 80, 190 120, 220 190" />
        <path d="M-10 160 L 410 150" />
      </g>
      {[
        [96, 92],
        [180, 64],
        [250, 124],
        [322, 80],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`} transform={`translate(${x} ${y})`}>
          <circle r="13" className="fill-primary/15" />
          <circle r="6" className="fill-primary stroke-surface" strokeWidth="2.5" />
        </g>
      ))}
      <g transform="translate(200 98)">
        <circle r="20" className="fill-accent/25" />
        <circle r="8" className="fill-accent stroke-surface" strokeWidth="3" />
      </g>
    </svg>
  );
}
