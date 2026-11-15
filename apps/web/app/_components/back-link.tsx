'use client';

import { cn } from '@placia/ui/cn';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

/** Back to where the user came from inside Placia (their results), else home. */
export function BackLink({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <Link
      href="/"
      aria-label="Back"
      onClick={(e) => {
        if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
          e.preventDefault();
          router.back();
        }
      }}
      className={cn('grid size-10 shrink-0 place-items-center rounded-full', className)}
    >
      <ArrowLeft className="size-5" />
    </Link>
  );
}
