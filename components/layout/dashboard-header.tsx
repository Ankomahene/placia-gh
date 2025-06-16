'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { CurrentLocation } from '@/components/current-location';
import { Bell, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  isAdmin?: boolean;
  onToggleSidebar?: () => void;
}

export function DashboardHeader({
  isAdmin = false,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate page title based on current route
  const getPageTitle = () => {
    if (pathname === '/admin' || pathname === '/dashboard') {
      return isAdmin ? 'Admin Dashboard' : 'Dashboard';
    }

    // Extract and format page name from pathname
    const segments = pathname.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1];

    if (lastSegment) {
      // Convert kebab-case to Title Case
      return lastSegment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    }

    return isAdmin ? 'Admin Dashboard' : 'Dashboard';
  };

  // Generate breadcrumb for better navigation context
  const getBreadcrumb = () => {
    const segments = pathname.split('/').filter(Boolean);

    if (segments.length <= 1) return null;

    const breadcrumbItems = segments.map((segment, index) => {
      const isLast = index === segments.length - 1;
      const formattedSegment = segment
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

      return {
        label: formattedSegment,
        isLast,
        path: '/' + segments.slice(0, index + 1).join('/'),
      };
    });

    return breadcrumbItems;
  };

  const pageTitle = getPageTitle();
  const breadcrumb = getBreadcrumb();

  return (
    <header
      className={cn(
        'sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        isScrolled ? 'shadow-sm' : ''
      )}
    >
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left side - Mobile menu trigger and page info */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>

          {/* Page title and breadcrumb */}
          <div className="hidden md:block">
            {breadcrumb && breadcrumb.length > 1 ? (
              <div className="space-y-1">
                <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
                  {breadcrumb.map((item, index) => (
                    <span key={item.path} className="flex items-center">
                      {index > 0 && <span className="mx-1">/</span>}
                      <span
                        className={cn(
                          item.isLast
                            ? 'text-foreground font-medium'
                            : 'hover:text-foreground'
                        )}
                      >
                        {item.label}
                      </span>
                    </span>
                  ))}
                </nav>
                <h1 className="text-lg font-semibold">{pageTitle}</h1>
              </div>
            ) : (
              <h1 className="text-lg font-semibold">{pageTitle}</h1>
            )}
          </div>

          {/* Mobile page title */}
          <div className="md:hidden">
            <h1 className="text-lg font-semibold">{pageTitle}</h1>
          </div>
        </div>

        {/* Right side - Actions */}
        <div className="flex items-center gap-4">
          <div className="hidden lg:block">
            <CurrentLocation />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
