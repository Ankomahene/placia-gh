'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { LogOut, MessageSquare, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from './ui/button';
import { signOut } from '@/lib/services/auth';
import { useUser } from '@/hooks/use-user';
import { useState } from 'react';

export const UserMenu = ({ onLogout }: { onLogout?: () => void }) => {
  const { user } = useUser();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);
  async function handleSignOut() {
    try {
      setIsSigningOut(true);
      await signOut();
      onLogout?.();

      // Force a hard refresh of the page to clear all states
      window.location.href = '/';
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsSigningOut(false);
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={user?.avatar || ''}
              alt={user?.full_name || 'User'}
            />
            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-500 text-white">
              {getInitials(user?.full_name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {user?.full_name || 'User'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link
              href={pathname.startsWith('/admin') ? '/admin' : '/dashboard'}
            >
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={
                pathname.startsWith('/admin')
                  ? '/admin/profile'
                  : '/dashboard/profile'
              }
            >
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link
              href={
                pathname.startsWith('/admin')
                  ? '/admin/messages'
                  : '/dashboard/messages'
              }
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              <span>Messages</span>
            </Link>
          </DropdownMenuItem>
          {pathname.startsWith('/admin') && (
            <DropdownMenuItem asChild>
              <Link href="/admin/settings">
                <User className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </Link>
            </DropdownMenuItem>
          )}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
