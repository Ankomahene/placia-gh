'use client';

import { buttonVariants } from '@placia/ui/button';
import { Check, Share2 } from 'lucide-react';
import { useState } from 'react';

/** The phone's share sheet where there is one (WhatsApp is how places get passed on), else copy. */
export function ShareButton({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className={buttonVariants({ size: 'lg', variant: 'outline' })}
      onClick={async () => {
        const url = window.location.href;
        if (navigator.share) {
          try {
            await navigator.share({ title, url });
          } catch {
            // Dismissed.
          }
          return;
        }
        try {
          await navigator.clipboard.writeText(url);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // Clipboard blocked: nothing more to do.
        }
      }}
    >
      {copied ? <Check /> : <Share2 />}
      {copied ? 'Copied' : 'Share'}
    </button>
  );
}
