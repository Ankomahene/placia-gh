'use client';

import { cn } from '@placia/ui/cn';
import { Logo } from '@placia/ui/logo';
import {
  ChartNoAxesCombined,
  Database,
  FlaskConical,
  Inbox,
  LayoutDashboard,
  MapPin,
  Settings,
} from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/places', label: 'Places', icon: MapPin },
  { href: '/contributions', label: 'Contributions', icon: Inbox },
  { href: '/sources', label: 'Data sources', icon: Database },
  { href: '/search-insights', label: 'Search insights', icon: ChartNoAxesCombined },
  { href: '/evals', label: 'Evals', icon: FlaskConical },
];

const isActive = (path: string, href: string) =>
  href === '/' ? path === '/' : path.startsWith(href);

export function Sidebar() {
  const path = usePathname();
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-surface px-3 py-4 md:flex">
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
      <a
        href="/settings"
        className="flex h-9 items-center gap-3 rounded-md px-2.5 font-medium text-muted-foreground text-sm hover:bg-surface-2 hover:text-foreground"
      >
        <Settings className="size-4" />
        Settings
      </a>
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
    <header className="sticky top-0 z-20 border-b bg-surface/95 backdrop-blur md:hidden">
      <div className="flex h-12 items-center px-4">
        <Logo suffix="Admin" />
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
