'use client';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/services/auth';
import { cn } from '@/lib/utils';
import {
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Database,
  Heart,
  LayoutDashboard,
  List,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Settings,
  TestTube,
  User,
  Users,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

interface DashboardSidebarProps {
  isAdmin?: boolean;
  onCollapseChange?: (isCollapsed: boolean) => void;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: NavigationItem[];
}

export function DashboardSidebar({
  isAdmin = false,
  onCollapseChange,
}: DashboardSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['test-pages']);
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
      return;
    }
    router.push('/');
  };

  const toggleCollapse = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    onCollapseChange?.(newCollapsed);
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems((prev) =>
      prev.includes(itemName)
        ? prev.filter((item) => item !== itemName)
        : [...prev, itemName]
    );
  };

  const adminNavigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: LayoutDashboard,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: Users,
    },
    {
      name: 'Places Manager',
      href: '/admin/places-manager',
      icon: MapPin,
    },
    {
      name: 'Categories Manager',
      href: '/admin/categories-manager',
      icon: List,
    },
    {
      name: 'Place Schema',
      href: '/admin/place-schema',
      icon: Database,
    },
    {
      name: 'Places Ranking',
      href: '/admin/places-ranking-test',
      icon: BarChart3,
    },
    {
      name: 'Test Pages',
      href: '#',
      icon: TestTube,
      children: [
        {
          name: 'Search Test',
          href: '/admin/search-test',
          icon: Search,
        },
        {
          name: 'Ranking Test',
          href: '/admin/places-ranking-test',
          icon: BarChart3,
        },
        {
          name: 'ElevenLabs AI',
          href: '/admin/elevenlabs-conversation-test',
          icon: MessageSquare,
        },
      ],
    },
  ];

  const userNavigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
    },
    {
      name: 'Businesses',
      href: '/dashboard/businesses',
      icon: Building2,
    },
    {
      name: 'Contributed Places',
      href: '/dashboard/contributed-places',
      icon: MapPin,
    },
    {
      name: 'Favorites',
      href: '/dashboard/favorites',
      icon: Heart,
    },

    {
      name: 'Messages',
      href: '/dashboard/messages',
      icon: MessageSquare,
    },
    {
      name: 'Profile',
      href: '/dashboard/profile',
      icon: User,
    },
    // {
    //   name: 'Settings',
    //   href: '/dashboard/settings',
    //   icon: Settings,
    // },
  ];

  const navigation = isAdmin ? adminNavigation : userNavigation;

  const renderNavigationItem = (item: NavigationItem, depth = 0) => {
    // More precise active state logic to prevent multiple highlights
    const isExactMatch = pathname === item.href;
    const isSubRoute =
      item.href !== '#' &&
      item.href !== '/dashboard' &&
      item.href !== '/admin' &&
      pathname.startsWith(item.href);
    const isActive = isExactMatch || isSubRoute;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(
      item.name.toLowerCase().replace(' ', '-')
    );
    const Icon = item.icon;

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() =>
              toggleExpanded(item.name.toLowerCase().replace(' ', '-'))
            }
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
              'hover:bg-accent hover:text-accent-foreground',
              'focus:bg-accent focus:text-accent-foreground focus:outline-none',
              isCollapsed && 'justify-center px-2'
            )}
          >
            <Icon
              className={cn('h-5 w-5 flex-shrink-0', depth > 0 && 'h-4 w-4')}
            />
            {!isCollapsed && (
              <>
                <span className="flex-1 text-left">{item.name}</span>
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </>
            )}
          </button>
          {!isCollapsed && isExpanded && item.children && (
            <div className="ml-6 mt-1 space-y-1">
              {item.children.map((child) =>
                renderNavigationItem(child, depth + 1)
              )}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href}
        className={cn(
          'flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isActive
            ? 'bg-accent text-accent-foreground'
            : 'text-muted-foreground',
          isCollapsed && 'justify-center px-2',
          depth > 0 && 'text-xs py-1.5'
        )}
      >
        <Icon className={cn('h-5 w-5 flex-shrink-0', depth > 0 && 'h-4 w-4')} />
        {!isCollapsed && <span>{item.name}</span>}
      </Link>
    );
  };

  return (
    <div
      className={cn(
        'h-full bg-background flex flex-col transition-all duration-300 ease-in-out',
        isCollapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <Link
          href={isAdmin ? '/admin' : '/dashboard'}
          className={cn(
            'flex items-center gap-2 transition-opacity duration-300',
            isCollapsed && 'opacity-0 md:opacity-100 scale-0 md:scale-100'
          )}
        >
          <Logo size="sm" />
        </Link>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleCollapse}
          className="h-8 w-8 hidden md:flex"
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4">
        <nav className="space-y-2">
          {navigation.map((item) => renderNavigationItem(item))}
        </nav>
      </div>

      {/* Footer - Sign out only */}
      <div className="border-t p-4">
        {!isCollapsed ? (
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </Button>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>
        )}
      </div>
    </div>
  );
}
