'use client';

import { cn } from '@placia/ui/cn';
import { Logo } from '@placia/ui/logo';
import {
  BookOpen,
  ChartNoAxesCombined,
  Copy,
  Database,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  LogOut,
  MapPin,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { signOut } from '../signin/actions';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/places', label: 'Places', icon: MapPin },
  { href: '/duplicates', label: 'Duplicates', icon: Copy },
  { href: '/contributions', label: 'Contributions', icon: Inbox },
  { href: '/sources', label: 'Data sources', icon: Database },
  { href: '/search-insights', label: 'Search insights', icon: ChartNoAxesCombined },
  { href: '/evals', label: 'Evals', icon: FlaskConical },
  { href: '/how-it-works', label: 'How it works', icon: BookOpen },
];

const isActive = (path: string, href: string) =>
  href === '/' ? path === '/' : path.startsWith(href);

export function Sidebar({ email }: { email: string | null }) {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh print:hidden w-60 shrink-0 flex-col border-r bg-surface px-3 py-4 md:flex">
      <div className="px-2 pb-6">
        <Logo suffix="Admin" />
      </div>
      <nav aria-label="Admin" className="flex-1">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <a
                  href={href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-md px-2.5 font-medium text-sm transition-colors',
                    active
                      ? 'bg-primary-soft text-primary-soft-foreground'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
      <form action={signOut} className="border-t pt-3">
        {email ? (
          <p className="truncate px-2.5 pb-1 text-muted-foreground text-xs" title={email}>
            {email}
          </p>
        ) : null}
        <button
          type="submit"
          className="flex h-9 w-full items-center gap-3 rounded-md px-2.5 font-medium text-muted-foreground text-sm hover:bg-surface-2 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </form>
    </aside>
  );
}

/** Phones: logo bar plus a horizontally scrolling tab row. */
export function MobileNav() {
  const path = usePathname();
  const nav = useRef<HTMLElement>(null);
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-centre the active tab on every navigation
  useEffect(() => {
    nav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [path]);
  return (
    <header className="sticky top-0 z-20 border-b bg-surface/95 backdrop-blur md:hidden print:hidden">
      <div className="flex h-12 items-center justify-between px-4">
        <Logo suffix="Admin" />
        <form action={signOut}>
          <button
            type="submit"
            aria-label="Sign out"
            className="grid size-9 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <LogOut className="size-4" />
          </button>
        </form>
      </div>
      <nav
        ref={nav}
        aria-label="Admin"
        className="-mb-px flex gap-1 overflow-x-auto px-2 [scrollbar-width:none]"
      >
        {NAV.map(({ href, label }) => {
          const active = isActive(path, href);
          return (
            <a
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'shrink-0 border-b-2 px-3 py-2.5 font-medium text-sm',
                active
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground',
              )}
            >
              {label}
            </a>
          );
        })}
      </nav>
    </header>
  );
}
