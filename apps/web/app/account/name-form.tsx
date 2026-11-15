'use client';

import { Button } from '@placia/ui/button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabaseBrowser } from '../_lib/supabase/browser';

export function NameForm({ initial }: { initial: string }) {
  const router = useRouter();
  const [name, setName] = useState(initial);
  const [busy, setBusy] = useState(false);
  const changed = name.trim() !== initial;
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const sb = supabaseBrowser();
        const { data } = await sb.auth.getUser();
        if (data.user) {
          await sb
            .from('profiles')
            .update({ display_name: name.trim() || null })
            .eq('id', data.user.id);
        }
        setBusy(false);
        router.refresh();
      }}
    >
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={60}
        placeholder="Your name"
        aria-label="Your name"
        className="h-10 min-w-0 flex-1 rounded-lg border bg-surface px-3 text-base outline-none focus:border-primary"
      />
      <Button type="submit" variant="outline" disabled={!changed || busy}>
        Save
      </Button>
    </form>
  );
}
