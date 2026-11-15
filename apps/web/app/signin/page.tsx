import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { BottomNav, SiteHeader } from '../_components/nav';
import { safeNext } from '../_lib/safe-next';
import { getViewer } from '../_lib/supabase/server';
import { SignInForm } from './sign-in-form';

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; failed?: string }>;
}) {
  const { next, failed } = await searchParams;
  const to = safeNext(next);
  if (await getViewer()) redirect(to as never);
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/account" />
      <main className="mx-auto w-full max-w-sm flex-1 px-4 pt-10 pb-28 md:pt-20">
        <h1 className="mb-6 font-semibold text-2xl tracking-tight">Sign in</h1>
        <SignInForm next={to} linkFailed={failed === '1'} />
      </main>
      <BottomNav active="/account" />
    </div>
  );
}
