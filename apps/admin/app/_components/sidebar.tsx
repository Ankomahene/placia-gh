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

const NAV = [
  { href: '/', label: 'Overview', icon: LayoutDashboard, active: true },
  { href: '/places', label: 'Places', icon: MapPin },
  { href: '/contributions', label: 'Contributions', icon: Inbox },
  { href: '/sources', label: 'Data sources', icon: Database },
  { href: '/search-insights', label: 'Search insights', icon: ChartNoAxesCombined },
  { href: '/evals', label: 'Evals', icon: FlaskConical },
];

export function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r bg-surface px-3 py-4 md:flex">
      <div className="px-2 pb-6">
        <Logo suffix="Admin" />
      </div>
      <nav aria-label="Admin" className="flex-1">
        <ul className="space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, active }) => (
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
          ))}
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
