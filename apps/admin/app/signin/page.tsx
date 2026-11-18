import { Logo } from '@placia/ui/logo';
import type { Metadata } from 'next';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in' };

export default function SignInPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo suffix="Admin" />
        <h1 className="font-semibold text-2xl tracking-tight">Sign in</h1>
        <SignInForm />
      </div>
    </main>
  );
}
