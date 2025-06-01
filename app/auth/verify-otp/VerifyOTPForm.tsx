'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { verifyOTP, signUp } from '@/lib/services/auth';

export default function VerifyOTPForm() {
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [email, setEmail] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const verifyingEmail = sessionStorage.getItem('verifying_email');
    const resettingEmail = sessionStorage.getItem('resetting_email');

    setEmail(verifyingEmail || resettingEmail);
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  async function handleResend() {
    if (!email || countdown > 0) return;

    setIsResending(true);
    try {
      const isPasswordReset = !!sessionStorage.getItem('resetting_email');
      const password = sessionStorage.getItem('verifying_password');
      const fullName = sessionStorage.getItem('verifying_full_name');

      if (isPasswordReset) {
        const response = await fetch('/api/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'verification',
            email,
            isPasswordReset: true,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to resend verification code');
        }
      } else if (password && fullName) {
        const { error } = await signUp({
          email,
          password,
          fullName,
          confirmPassword: password,
        });
        if (error) throw error;
      }

      toast.success('Verification code resent!');
      setCountdown(30); // Start 30-second countdown
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to resend verification code'
      );
    } finally {
      setIsResending(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      const isPasswordReset = !!sessionStorage.getItem('resetting_email');

      const { error } = await verifyOTP(email, otp, isPasswordReset);
      if (error) throw error;

      toast.success('Email verified successfully!');

      router.push(isPasswordReset ? '/auth/reset-password' : '/dashboard');
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to verify OTP'
      );
    } finally {
      sessionStorage.removeItem('verifying_email');
      sessionStorage.removeItem('verifying_password');
      sessionStorage.removeItem('verifying_full_name');
      sessionStorage.removeItem('resetting_email');
      setIsLoading(false);
    }
  }

  if (!email) {
    return null;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          Verify Your Email
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-center text-muted-foreground mb-6">
          We sent a verification code to <strong>{email}</strong>
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            type="text"
            placeholder="Enter verification code"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="text-center text-lg tracking-widest"
            maxLength={6}
          />

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !otp || otp.length !== 6}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              'Verify Email'
            )}
          </Button>

          <div className="text-center mt-4">
            <Button
              type="button"
              variant="link"
              className="text-sm text-muted-foreground hover:text-primary"
              disabled={isResending || countdown > 0}
              onClick={handleResend}
            >
              {isResending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Resending...
                </>
              ) : countdown > 0 ? (
                `Resend code in ${countdown}s`
              ) : (
                "Didn't receive the code? Resend"
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
