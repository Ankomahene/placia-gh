'use client';

import { cn } from '@placia/ui/cn';
import type { ReactNode } from 'react';
import { useFormStatus } from 'react-dom';

/** A form's submit button that disables itself while the action runs. */
export function PendingButton({
  children,
  pendingText,
  name,
  value,
  title,
  variant = 'outline',
  className,
}: {
  children: ReactNode;
  pendingText?: string;
  name?: string;
  value?: string;
  title?: string;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name={name}
      value={value}
      title={title}
      aria-label={title}
      disabled={pending}
      className={cn(
        'inline-flex h-8 items-center justify-center gap-1.5 rounded-md px-3 font-medium text-xs transition-colors disabled:opacity-60',
        variant === 'primary' && 'bg-primary text-primary-foreground hover:opacity-90',
        variant === 'outline' && 'border bg-surface hover:bg-surface-2',
        variant === 'ghost' && 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
        className,
      )}
    >
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
