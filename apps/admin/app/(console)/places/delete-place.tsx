'use client';

import { cn } from '@placia/ui/cn';
import { LoaderCircle, Trash2 } from 'lucide-react';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { deletePlace } from './edit-actions';

/** Delete a wrong place, after a confirmation dialog. `icon` is the compact table version. */
export function DeletePlace({
  placeId,
  name,
  area,
  icon = false,
  goTo,
}: {
  placeId: string;
  name: string;
  area?: string;
  icon?: boolean;
  /** Where to go afterwards (the place's own page no longer exists). */
  goTo?: string;
}) {
  const router = useRouter();
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    const ok = await deletePlace(placeId, reason).catch(() => false);
    setBusy(false);
    if (!ok) {
      setFailed(true);
      return;
    }
    setOpen(false);
    if (goTo) router.push(goTo as Route);
    else router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title="Delete place"
        aria-label={`Delete ${name}`}
        className={cn(
          icon
            ? 'grid size-7 place-items-center rounded-md text-muted-foreground hover:bg-danger/10 hover:text-danger'
            : 'inline-flex h-9 items-center gap-1.5 rounded-md border border-danger/40 px-3 font-medium text-danger text-sm hover:bg-danger/10',
        )}
      >
        <Trash2 className={icon ? 'size-3.5' : 'size-4'} />
        {icon ? null : 'Delete place'}
      </button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-lg border bg-surface p-0 text-foreground shadow-card backdrop:bg-black/50"
      >
        <form
          method="dialog"
          className="space-y-4 p-5"
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
        >
          <div>
            <h2 className="font-semibold text-base">Delete {name}?</h2>
            {area ? <p className="mt-0.5 text-muted-foreground text-sm">{area}</p> : null}
            <p className="mt-3 text-sm">
              Its photos and saves are deleted too. This can't be undone.
            </p>
          </div>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            maxLength={300}
            placeholder="Reason (optional)"
            aria-label="Reason"
            className="h-10 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:border-primary"
          />
          {failed ? <p className="text-danger text-sm">Couldn't delete</p> : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="h-9 rounded-md border bg-surface px-4 font-medium text-sm hover:bg-surface-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-danger px-4 font-medium text-sm text-white hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
              Delete
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
