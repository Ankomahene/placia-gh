'use client';

import { cn } from '@placia/ui/cn';
import { uploadPhoto } from '@placia/ui/photo-picker';
import { createBrowserClient } from '@supabase/ssr';
import { ImagePlus, LoaderCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { addPlacePhotos, signPhotoUpload } from './photo-actions';

/** Pick photos and they're live on the place: uploaded to Cloudinary (else Supabase), no review. */
export function AddPhotos({
  placeId,
  userId,
  label = 'Photos',
  className,
}: {
  placeId: string;
  userId: string;
  label?: string;
  className?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const add = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    setFailed(false);
    try {
      const bucket = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL as string,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
      ).storage.from('place-photos');
      const photos = await Promise.all(
        files.map((f) => uploadPhoto({ userId, sign: signPhotoUpload, bucket }, f)),
      );
      const added = await addPlacePhotos(placeId, photos);
      if (!added) setFailed(true);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <label
      title={failed ? "Couldn't add photos" : 'Add photos'}
      className={cn(
        'inline-flex h-7 cursor-pointer items-center gap-1 rounded-md px-2 font-medium text-muted-foreground text-xs hover:bg-surface-2 hover:text-foreground',
        failed && 'text-danger',
        busy && 'pointer-events-none opacity-60',
        className,
      )}
    >
      {busy ? (
        <LoaderCircle className="size-3.5 animate-spin" />
      ) : (
        <ImagePlus className="size-3.5" />
      )}
      {label}
      <input
        type="file"
        accept="image/*"
        multiple
        disabled={busy}
        className="sr-only"
        onChange={(e) => {
          const files = [...(e.target.files ?? [])]
            .filter((f) => f.type.startsWith('image/'))
            .slice(0, 10);
          e.target.value = '';
          void add(files);
        }}
      />
    </label>
  );
}
