import type { Metadata } from 'next';
import { BottomNav, SiteHeader } from '../_components/nav';
import { AskView } from './ask-view';

export const metadata: Metadata = {
  title: 'Ask',
  description: 'Ask about places in Ghana and get answers from real listings.',
};

export default async function AskPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader active="/ask" />
      <AskView initial={q?.slice(0, 300) ?? ''} />
      <BottomNav active="/ask" />
    </div>
  );
}
