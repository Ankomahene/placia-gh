import { Button } from '@placia/ui/button';
import { Logo } from '@placia/ui/logo';
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
  UserRound,
  UtensilsCrossed,
} from 'lucide-react';
import { BottomNav } from './_components/bottom-nav';

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
    <div className="mx-auto flex min-h-dvh max-w-xl flex-col">
      <header className="flex items-center justify-between px-4 pt-4 pb-2">
        <Logo />
        <Button variant="ghost" size="icon" aria-label="Account">
          <UserRound />
        </Button>
      </header>

      <main className="flex-1 space-y-6 px-4 pt-3 pb-28">
        <form action="/search" className="relative" role="search">
          <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-4 size-5 text-muted-foreground" />
          <input
            name="q"
            type="search"
            autoComplete="off"
            enterKeyHint="search"
            placeholder="Search places in Ghana"
            aria-label="Search places"
            className="h-14 w-full rounded-full border bg-surface pr-16 pl-12 text-base shadow-card outline-none placeholder:text-muted-foreground focus:border-primary"
          />
          <Button
            size="icon"
            aria-label="Search by voice"
            className="-translate-y-1/2 absolute top-1/2 right-2"
          >
            <Mic />
          </Button>
        </form>

        <section aria-label="Categories" className="-mx-4">
          <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4">
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

        <section aria-labelledby="near-you" className="space-y-3">
          <h2 id="near-you" className="font-semibold text-lg tracking-tight">
            Near you
          </h2>
          <div className="relative overflow-hidden rounded-xl border bg-surface shadow-card">
            <MapPreview />
            <div className="flex items-center justify-between gap-3 border-t p-3">
              <span className="font-medium text-sm">Accra</span>
              <Button variant="soft" size="sm">
                <LocateFixed />
                Use my location
              </Button>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

/** Decorative stand-in until the MapLibre map lands in Phase 3. */
function MapPreview() {
  return (
    <svg viewBox="0 0 400 180" className="block h-44 w-full" role="img" aria-label="Map preview">
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
