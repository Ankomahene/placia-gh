'use client';

import { buttonVariants } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { Bookmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabaseBrowser } from '../../_lib/supabase/browser';

/** Saves to the account; signed-out users go to sign in and come back here. */
export function SaveButton({ placeId, slug }: { placeId: string; slug: string }) {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let live = true;
    const sb = supabaseBrowser();
    void sb.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id ?? null;
      if (!live || !uid) return;
      setUserId(uid);
      const { data: row } = await sb
        .from('saved_places')
        .select('place_id')
        .eq('place_id', placeId)
        .maybeSingle();
      if (live) setSaved(!!row);
    });
    return () => {
      live = false;
    };
  }, [placeId]);

  const toggle = async () => {
    if (!userId) {
      router.push(`/signin?next=${encodeURIComponent(`/place/${slug}`)}` as never);
      return;
    }
    setBusy(true);
    const sb = supabaseBrowser();
    const next = !saved;
    setSaved(next);
    const { error } = next
      ? await sb.from('saved_places').insert({ user_id: userId, place_id: placeId })
      : await sb.from('saved_places').delete().eq('place_id', placeId);
    if (error) setSaved(!next);
    setBusy(false);
  };

  return (
    <button
      type="button"
      onClick={() => void toggle()}
      disabled={busy}
      aria-pressed={saved}
      className={buttonVariants({ size: 'lg', variant: 'soft' })}
    >
      <Bookmark className={cn(saved && 'fill-current')} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
