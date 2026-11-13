import { cn } from '@placia/ui/cn';
import { Bookmark, Compass, PlusCircle, UserRound } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Explore', icon: Compass, active: true },
  { href: '/saved', label: 'Saved', icon: Bookmark },
  { href: '/contribute', label: 'Add place', icon: PlusCircle },
  { href: '/account', label: 'Account', icon: UserRound },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-surface/90 pb-safe backdrop-blur-md"
    >
      <ul className="mx-auto grid max-w-xl grid-cols-4">
        {ITEMS.map(({ href, label, icon: Icon, active }) => (
          <li key={href}>
            <a
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center gap-1 pt-2.5 pb-1 font-medium text-[11px] transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Icon className="size-[22px]" strokeWidth={active ? 2.25 : 1.75} />
              {label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
