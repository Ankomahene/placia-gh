'use client';

import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { sendCode } from './actions';

const input =
  'h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary';

const ERRORS = {
  invalid: 'Check the email address',
  limited: 'Too many tries, wait a few minutes',
  failed: "Couldn't send code",
} as const;

/** Email, then the 6-digit code. Only admins receive a code. */
export function SignInForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = async () => {
    setBusy(true);
    setError(null);
    const res = await sendCode(email).catch(() => ({ ok: false, error: 'failed' }) as const);
    setBusy(false);
    if (res.ok) setSent(true);
    else setError(ERRORS[res.error]);
  };

  const verify = async () => {
    setBusy(true);
    setError(null);
    const sb = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL as string,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    );
    const { error } = await sb.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: code.trim(),
      type: 'email',
    });
    setBusy(false);
    if (error) {
      setError('Wrong or expired code');
      return;
    }
    router.replace('/');
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
      <button
        type="submit"
        disabled={busy}
        className="h-12 w-full rounded-xl bg-primary font-medium text-primary-foreground transition-opacity disabled:opacity-50"
      >
        {busy ? '…' : sent ? 'Sign in' : 'Send code'}
      </button>
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
