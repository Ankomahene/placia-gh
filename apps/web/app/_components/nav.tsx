import { Button } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { Logo } from '@placia/ui/logo';
import { Bookmark, Compass, PlusCircle, UserRound } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Explore', icon: Compass },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/contribute', label: 'Add place', icon: PlusCircle },
];

/** Top bar: logo + account on phones; full navigation from `md` up. */
export function SiteHeader({ active = '/' }: { active?: string }) {
  return (
    <header className="sticky top-0 z-40 bg-background/85 backdrop-blur-md md:border-b">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-4 md:px-8">
        <a href="/" aria-label="Placia home">
          <Logo />
        </a>
        <nav aria-label="Main" className="hidden flex-1 md:block">
          <ul className="flex items-center gap-1">
            {ITEMS.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <a
                  href={href}
                  aria-current={active === href ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-2 rounded-full px-3.5 font-medium text-sm transition-colors',
                    active === href
                      ? 'bg-primary-soft text-primary-soft-foreground'
                      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                  )}
                >
                  <Icon className="size-4" />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <Button variant="ghost" size="icon" aria-label="Account">
          <UserRound />
        </Button>
      </div>
    </header>
  );
}

/** Thumb-reachable tab bar, phones and small tablets only. */
export function BottomNav({ active = '/' }: { active?: string }) {
  const items = [...ITEMS, { href: '/account', label: 'Account', icon: UserRound }];
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/90 pb-safe backdrop-blur-md md:hidden"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {items.map(({ href, label, icon: Icon }) => {
          const isActive = active === href;
          return (
            <li key={href}>
              <a
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 pt-2.5 pb-1 font-medium text-[11px] transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="size-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
