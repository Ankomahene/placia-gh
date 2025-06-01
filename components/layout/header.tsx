'use client';

import { CurrentLocation } from '@/components/current-location';
import { Logo } from '@/components/logo';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { UserMenu } from '@/components/user-menu';
import { useUser } from '@/hooks/use-user';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const { user, refetch } = useUser();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
        <div className="flex items-center gap-2 font-bold text-xl">
          <Logo size="sm" />
        </div>
        <div className="hidden md:flex">
          <CurrentLocation />
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {user ? (
            <UserMenu
              onLogout={() => {
                refetch();
              }}
            />
          ) : (
            <>
              <Link href="/auth/login">
                <Button variant="outline" size="sm">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center md:hidden gap-3">
          <CurrentLocation />

          <ThemeToggle />

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <div className="flex flex-col gap-4 mt-8 p-8">
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button className="w-full">Get Started</Button>
                </Link>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
