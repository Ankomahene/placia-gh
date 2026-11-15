import {
  Banknote,
  BedDouble,
  Church,
  Cross,
  Fuel,
  GraduationCap,
  Pill,
  ShoppingBasket,
  UtensilsCrossed,
} from 'lucide-react';
import Link from 'next/link';
import { BottomNav, SiteHeader } from './_components/nav';
import { NearYou } from './_components/near-you';
import { SearchBox } from './_components/search-box';

const CATEGORIES = [
  { label: 'Food', q: 'food', icon: UtensilsCrossed },
  { label: 'Pharmacy', q: 'pharmacy', icon: Pill },
  { label: 'Hotels', q: 'hotel', icon: BedDouble },
  { label: 'ATM & Banks', q: 'bank atm', icon: Banknote },
  { label: 'Fuel', q: 'filling station', icon: Fuel },
  { label: 'Hospitals', q: 'hospital', icon: Cross },
  { label: 'Groceries', q: 'supermarket', icon: ShoppingBasket },
  { label: 'Schools', q: 'school', icon: GraduationCap },
  { label: 'Worship', q: 'church mosque', icon: Church },
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

            <SearchBox />

            <section aria-label="Categories" className="-mx-4 md:mx-0">
              <ul className="no-scrollbar flex gap-2 overflow-x-auto px-4 md:flex-wrap md:overflow-visible md:px-0">
                {CATEGORIES.map(({ label, q, icon: Icon }) => (
                  <li key={label}>
                    <Link
                      href={`/search?q=${encodeURIComponent(q)}`}
                      className="flex h-10 items-center gap-2 whitespace-nowrap rounded-full border bg-surface px-4 font-medium text-sm transition-colors hover:border-primary hover:text-primary"
                    >
                      <Icon className="size-4 text-primary" />
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <section aria-labelledby="near-you" className="space-y-3">
            <h2 id="near-you" className="font-semibold text-lg tracking-tight md:sr-only">
              Near you
            </h2>
            <NearYou />
          </section>
        </div>
      </main>

      <BottomNav active="/" />
    </div>
  );
}
