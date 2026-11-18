'use client';

import { cn } from '@placia/ui/cn';
import { PhotoViewer, type ViewerPhoto } from '@placia/ui/photo-viewer';
import { ArrowRightLeft, LoaderCircle, Star, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { findPlaces, movePlacePhoto, removePlacePhoto, setPlaceCover } from './photo-actions';

export interface ManagedPhoto extends ViewerPhoto {
  id: string;
}

type Found = Awaited<ReturnType<typeof findPlaces>>[number];

/** Pick the place a photo really belongs to. */
function MoveDialog({
  placeId,
  onPick,
  onClose,
}: {
  placeId: string;
  onPick: (p: Found) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState('');
  const [found, setFound] = useState<Found[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      void findPlaces(q).then((r) => setFound(r.filter((p) => p.id !== placeId)));
    }, 250);
    return () => clearTimeout(t);
  }, [q, placeId]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-start bg-black/40 p-4 pt-[15vh]">
      <div className="mx-auto w-full max-w-md rounded-lg border bg-surface p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-medium text-sm">Move photo to</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-md hover:bg-surface-2"
          >
            <X className="size-4" />
          </button>
        </div>
        <input
          // biome-ignore lint/a11y/noAutofocus: the dialog exists to type a name.
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Place name"
          aria-label="Place name"
          className="h-10 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:border-primary"
        />
        <ul className="mt-2 max-h-72 overflow-y-auto">
          {found.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="w-full rounded-md px-2 py-2 text-left hover:bg-surface-2"
              >
                <span className="block truncate font-medium text-sm">{p.name}</span>
                <span className="block truncate text-muted-foreground text-xs">
                  {p.area || '—'} · {p.status}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/** A place's live photos: open large, make cover, move to the right place, remove. */
export function PhotoManager({
  placeId,
  title,
  photos,
}: {
  placeId: string;
  title: string;
  photos: ManagedPhoto[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState<number | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [moving, setMoving] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);

  const run = async (id: string, fn: () => Promise<boolean>) => {
    setBusy(id);
    setFailed(null);
    const ok = await fn().catch(() => false);
    if (!ok) setFailed(id);
    setBusy(null);
    router.refresh();
  };

  if (!photos.length)
    return <p className="py-6 text-center text-muted-foreground text-sm">No photos</p>;

  return (
    <>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {photos.map((p, n) => (
          <li
            key={p.id}
            className={cn(
              'group relative overflow-hidden rounded-lg border bg-surface-2',
              failed === p.id && 'border-danger',
            )}
          >
            <button
              type="button"
              onClick={() => setOpen(n)}
              aria-label={`Open photo ${n + 1}`}
              className="block aspect-[4/3] w-full"
            >
              {/* biome-ignore lint/performance/noImgElement: a small CDN copy. */}
              <img
                src={p.thumb ?? p.src}
                alt=""
                loading="lazy"
                className="size-full object-cover"
              />
            </button>
            {n === 0 ? (
              <span className="absolute top-2 left-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 font-medium text-[11px] text-white">
                <Star className="size-3 fill-current" /> Cover
              </span>
            ) : null}
            {busy === p.id ? (
              <span className="absolute inset-0 grid place-items-center bg-black/40">
                <LoaderCircle className="size-6 animate-spin text-white" />
              </span>
            ) : null}
            <div className="flex items-center justify-end gap-0.5 border-t bg-surface p-1">
              {n > 0 ? (
                <button
                  type="button"
                  title="Make cover"
                  aria-label="Make cover"
                  disabled={!!busy}
                  onClick={() => run(p.id, () => setPlaceCover(p.id))}
                  className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
                >
                  <Star className="size-4" />
                </button>
              ) : null}
              <button
                type="button"
                title="Move to another place"
                aria-label="Move to another place"
                disabled={!!busy}
                onClick={() => setMoving(p.id)}
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-surface-2 hover:text-foreground"
              >
                <ArrowRightLeft className="size-4" />
              </button>
              <button
                type="button"
                title="Remove"
                aria-label="Remove photo"
                disabled={!!busy}
                onClick={() => {
                  if (confirm('Remove this photo? The file is deleted too.')) {
                    void run(p.id, () => removePlacePhoto(p.id));
                  }
                }}
                className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <PhotoViewer
        photos={photos}
        index={open}
        onIndex={setOpen}
        onClose={() => setOpen(null)}
        title={title}
      />
      {moving ? (
        <MoveDialog
          placeId={placeId}
          onClose={() => setMoving(null)}
          onPick={(to) => {
            const id = moving;
            setMoving(null);
            if (confirm(`Move this photo to ${to.name}?`)) {
              void run(id, () => movePlacePhoto(id, to.id));
            }
          }}
        />
      ) : null}
    </>
  );
}
