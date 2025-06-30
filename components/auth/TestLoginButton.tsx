'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, TestTube } from 'lucide-react';
import { toast } from 'sonner';

interface TestLoginButtonProps {
  enabled?: boolean;
  className?: string;
}

export default function TestLoginButton({
  enabled = true,
  className = '',
}: TestLoginButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Don't render if not enabled
  if (!enabled) {
    return null;
  }

  const handleTestLogin = async () => {
    if (!pin.trim()) {
      toast.error('Please enter a PIN');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/test-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Test login failed');
      }

      toast.success('Test login successful!');
      setIsOpen(false);
      setPin('');

      // Redirect based on user role
      if (data.isAdmin) {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Test login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTestLogin();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`w-full flex items-center gap-2 border-dashed ${className}`}
          onClick={() => setIsOpen(true)}
        >
          <TestTube className="h-4 w-4" />
          Test Login
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Test Login</DialogTitle>
          <DialogDescription>
            Enter the test PIN to login with demo credentials
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              type="password"
              placeholder="Enter test PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setIsOpen(false);
                setPin('');
              }}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleTestLogin}
              disabled={isLoading || !pin.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
