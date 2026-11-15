'use client';

import { Button } from '@placia/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '../_lib/supabase/browser';

const input =
  'h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary';

/** Email, then the 6-digit code from the email. The link in the email works too. */
export function SignInForm({ next, linkFailed }: { next: string; linkFailed: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(linkFailed ? 'Link expired' : null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setBusy(false);
    if (error)
      setError(error.status === 429 ? 'Too many tries, wait a minute' : "Couldn't send code");
    else setSent(true);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabaseBrowser().auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      setError('Wrong or expired code');
      return;
    }
    router.replace(next as never);
    router.refresh();
  };

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        void (sent ? verify() : send());
      }}
    >
      <label className="block space-y-1.5">
        <span className="font-medium text-sm">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          value={email}
          disabled={sent}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
      </label>
      {sent ? (
        <label className="block space-y-1.5">
          <span className="font-medium text-sm">Code from the email</span>
          <input
            required
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]{6,10}"
            maxLength={10}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className={`${input} tracking-[0.3em]`}
          />
        </label>
      ) : null}
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <Button type="submit" className="h-12 w-full" disabled={busy}>
        {busy ? '…' : sent ? 'Sign in' : 'Send code'}
      </Button>
      {sent ? (
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setCode('');
          }}
          className="w-full py-2 text-muted-foreground text-sm hover:text-foreground"
        >
          Use another email
        </button>
      ) : null}
    </form>
  );
}
