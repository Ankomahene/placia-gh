import React from 'react';
import { Button } from '../ui/button';
import {
  ChevronRight,
  Heart,
  Home,
  LayoutDashboard,
  MessageSquare,
  PlusCircle,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '../ui/scroll-area';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Add Business',
    href: '/dashboard/add-business',
    icon: PlusCircle,
  },
  {
    name: 'Messages',
    href: '/dashboard/messages',
    icon: MessageSquare,
  },
  {
    name: 'Favorites',
    href: '/dashboard/favorites',
    icon: Heart,
  },
  {
    name: 'Profile',
    href: '/dashboard/profile',
    icon: UserCircle,
  },
];

export const Sidebar = ({
  isCollapsed,
  setIsCollapsed,
}: {
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}) => {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'w-full bg-primary dark:bg-primary/50 rounded-lg shadow-2xl text-primary-foreground transition-all duration-300',
        isCollapsed ? 'w-[73px]' : 'w-[80px] md:w-[230px]'
      )}
    >
      <div className="flex h-full flex-col relative">
        <Button
          size="icon"
          className="absolute top-1 -right-5 z-40 rounded-full bg-primary-foreground hover:bg-primary-foreground/90 shadow-lg text-primary"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform',
              isCollapsed ? '' : 'rotate-180'
            )}
          />
        </Button>
        {/* Logo/Brand Section */}
        <div className="p-4 border-b border-primary-foreground/10">
          {!isCollapsed ? (
            <div>
              <h2 className="text-xl font-bold">Placia</h2>
              <p className="text-sm text-primary-foreground/70">Dashboard</p>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="h-8 w-8 rounded-lg bg-primary-foreground/10 flex items-center justify-center">
                <span className="text-sm font-bold">P</span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 transition- mt-2',
                    pathname === item.href &&
                      'bg-primary-foreground/20 text-primary-foreground shadow-sm'
                  )}
                >
                  <item.icon
                    className={cn('h-5 w-5', isCollapsed ? '' : 'mr-3')}
                  />
                  {!isCollapsed && item.name}
                </Button>
              </Link>
            ))}
          </div>

          {!isCollapsed && (
            <div className="mt-8 pt-6 border-t border-primary-foreground/10">
              <Link href="/">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Home className="h-5 w-5 mr-3" />
                  Go to Homepage
                </Button>
              </Link>
            </div>
          )}
        </ScrollArea>

        {/* Collapse Button */}
        <div className="p-4 border-t border-primary-foreground/10">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <ChevronRight
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed ? '' : 'rotate-180'
              )}
            />
            {!isCollapsed && <span className="ml-2">Collapse</span>}
          </Button>
        </div>
      </div>
    </aside>
  );
};
