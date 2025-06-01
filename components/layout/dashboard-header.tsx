'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import { Logo } from '@/components/logo';
import { CurrentLocation } from '@/components/current-location';
import { Bell, LogOut, Menu } from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/services/auth';
import { toast } from 'sonner';

interface DashboardHeaderProps {
  isAdmin?: boolean;
}

export function DashboardHeader({ isAdmin = false }: DashboardHeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('Failed to sign out');
      return;
    }
  };

  const navigation = isAdmin
    ? [
        { name: 'Dashboard', href: '/admin' },
        { name: 'Users', href: '/admin/users' },
        { name: 'Place Manager', href: '/admin/place-manager' },
        { name: 'Settings', href: '/admin/settings' },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard' },
        { name: 'My Places', href: '/dashboard/places' },
        { name: 'Favorites', href: '/dashboard/favorites' },
        { name: 'Settings', href: '/dashboard/settings' },
      ];

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b',
        isScrolled
          ? 'bg-background/95 backdrop-blur-md py-3 shadow-sm'
          : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link
            href={isAdmin ? '/admin' : '/dashboard'}
            className="flex items-center gap-2"
          >
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-primary',
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:block">
            <CurrentLocation />
          </div>

          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          <ThemeToggle />

          <Button
            variant="ghost"
            size="icon"
            onClick={handleSignOut}
            className="hidden md:inline-flex"
          >
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Sign out</span>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      'text-sm font-medium transition-colors hover:text-primary',
                      pathname === item.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    {item.name}
                  </Link>
                ))}
                <Button
                  variant="ghost"
                  className="justify-start px-0"
                  onClick={handleSignOut}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Sign out
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
