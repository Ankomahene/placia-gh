'use client';

import { cn } from '@placia/ui/cn';
import { Search, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { MicButton, useVoice } from './voice';

export function SearchBox({
  defaultValue = '',
  size = 'lg',
  className,
}: {
  defaultValue?: string;
  size?: 'lg' | 'md';
  className?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const input = useRef<HTMLInputElement>(null);

  const go = (text: string) => {
    const t = text.trim();
    if (!t) return;
    input.current?.blur();
    router.push(`/search?q=${encodeURIComponent(t)}`);
  };
  const voice = useVoice({
    onInterim: setQ,
    onFinal: (t) => {
      setQ(t);
      go(t);
    },
  });

  // A new search from elsewhere (a "did you mean" chip, back button) updates the box.
  useEffect(() => setQ(defaultValue), [defaultValue]);

  return (
    <form
      role="search"
      action="/search"
      className={cn('relative', className)}
      onSubmit={(e) => {
        e.preventDefault();
        go(q);
      }}
    >
      <Search
        className={cn(
          '-translate-y-1/2 pointer-events-none absolute top-1/2 text-muted-foreground',
          size === 'lg' ? 'left-4 size-5 md:left-5' : 'left-3.5 size-[18px]',
        )}
      />
      <input
        ref={input}
        name="q"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoComplete="off"
        enterKeyHint="search"
        maxLength={200}
        placeholder={voice.phase === 'listening' ? 'Listening…' : 'Search places in Ghana'}
        aria-label="Search places"
        className={cn(
          'w-full rounded-full border bg-surface pr-20 shadow-card outline-none placeholder:text-muted-foreground focus:border-primary [&::-webkit-search-cancel-button]:hidden',
          size === 'lg'
            ? 'h-14 pl-12 text-base md:h-16 md:pl-14 md:text-lg'
            : 'h-11 pl-10 text-base',
        )}
      />
      <div
        className={cn(
          '-translate-y-1/2 absolute top-1/2 flex items-center',
          size === 'lg' ? 'right-2 gap-0.5 md:right-3' : 'right-1.5',
        )}
      >
        {q ? (
          <button
            type="button"
            aria-label="Clear"
            onClick={() => {
              setQ('');
              input.current?.focus();
            }}
            className={cn(
              'grid place-items-center rounded-full text-muted-foreground hover:bg-surface-2 hover:text-foreground',
              size === 'lg' ? 'size-10' : 'size-8',
            )}
          >
            <X className="size-[18px]" />
          </button>
        ) : null}
        <MicButton voice={voice} className={size === 'lg' ? 'size-10' : 'size-8'} />
      </div>
    </form>
  );
}
