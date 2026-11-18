'use client';

import { cn } from '@placia/ui/cn';
import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/** Submit button that shows it's working while the model reads the searches. */
export function ReviewButton({ children, small }: { children: ReactNode; small?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border bg-surface font-medium shadow-card transition-colors hover:bg-surface-2 disabled:opacity-60',
        small ? 'h-7 px-2.5 text-xs' : 'h-9 px-3.5 text-sm',
      )}
    >
      <Sparkles
        className={cn('text-primary', small ? 'size-3.5' : 'size-4', pending && 'animate-pulse')}
      />
      {pending ? 'Reviewing…' : children}
    </button>
  );
}
