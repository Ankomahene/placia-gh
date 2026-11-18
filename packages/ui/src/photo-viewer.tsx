'use client';

import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { cn } from './cn';

/** One photo: a large source for the viewer and an optional small one for thumbnails. */
export interface ViewerPhoto {
  src: string;
  thumb?: string;
  alt?: string;
  width?: number | null;
  height?: number | null;
}

/**
 * Full-screen photo viewer: big photo on a dark backdrop, previous/next buttons, arrow keys,
 * swipe on touch screens, a counter and a thumbnail strip. Esc, × or a tap on the backdrop
 * closes it. Controlled: `index` null means closed.
 */
export function PhotoViewer({
  photos,
  index,
  onIndex,
  onClose,
  title,
}: {
  photos: ViewerPhoto[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
  title?: string;
}) {
  const open = index != null && photos.length > 0;
  const i = open ? Math.min(Math.max(index, 0), photos.length - 1) : 0;
  const many = photos.length > 1;
  const closeRef = useRef<HTMLButtonElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState<string | null>(null);

  const go = useCallback(
    (step: number) => onIndex((i + step + photos.length) % photos.length),
    [i, photos.length, onIndex],
  );

  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      before?.focus?.();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight' && many) go(1);
      else if (e.key === 'ArrowLeft' && many) go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, many, go, onClose]);

  // Keep the current thumbnail in view, and warm the neighbours so next/previous is instant.
  useEffect(() => {
    if (!open) return;
    stripRef.current
      ?.querySelector('[aria-current="true"]')
      ?.scrollIntoView({ inline: 'center', block: 'nearest' });
    for (const n of [i + 1, i - 1]) {
      const p = photos[(n + photos.length) % photos.length];
      if (p) new Image().src = p.src;
    }
  }, [open, i, photos]);

  // A cached photo can finish loading before React attaches onLoad: check after each change.
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when the photo changes
  useEffect(() => {
    const el = imgRef.current;
    if (el?.complete && el.naturalWidth) setLoaded(photos[i]?.src ?? null);
  }, [open, i]);

  if (!open || typeof document === 'undefined') return null;
  const photo = photos[i] as ViewerPhoto;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Photos of ${title}` : 'Photos'}
      className="fixed inset-0 z-[100] flex flex-col bg-neutral-950 text-white"
      onTouchStart={(e) => {
        const t = e.touches[0];
        touch.current = t ? { x: t.clientX, y: t.clientY } : null;
      }}
      onTouchEnd={(e) => {
        const start = touch.current;
        const t = e.changedTouches[0];
        touch.current = null;
        if (!start || !t || !many) return;
        const dx = t.clientX - start.x;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(t.clientY - start.y)) go(dx < 0 ? 1 : -1);
      }}
    >
      <div className="flex h-14 shrink-0 items-center gap-3 px-3 sm:px-5">
        <span className="min-w-0 flex-1 truncate font-medium text-sm">{title}</span>
        {many ? (
          <span className="shrink-0 text-sm text-white/70 tabular-nums">
            {i + 1} / {photos.length}
          </span>
        ) : null}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="grid size-10 shrink-0 place-items-center rounded-full hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
      </div>

      {/* Tapping the dark area around the photo closes, like most viewers. */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Esc and the close button do the same for keyboards. */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: as above. */}
      <div
        className="relative flex min-h-0 flex-1 items-center justify-center px-2 sm:px-16"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* biome-ignore lint/performance/noImgElement: sized by the CDN, shown as is. */}
        <img
          ref={imgRef}
          key={photo.src}
          src={photo.src}
          alt={photo.alt ?? ''}
          width={photo.width ?? undefined}
          height={photo.height ?? undefined}
          onLoad={() => setLoaded(photo.src)}
          className={cn(
            'max-h-full max-w-full select-none object-contain transition-opacity duration-200',
            loaded === photo.src ? 'opacity-100' : 'opacity-0',
          )}
          draggable={false}
        />
        {loaded !== photo.src && photo.thumb ? (
          // biome-ignore lint/performance/noImgElement: the small copy, shown while the large one loads.
          <img
            src={photo.thumb}
            alt=""
            aria-hidden
            className="absolute max-h-full max-w-full scale-100 object-contain blur-sm"
          />
        ) : null}
        {many ? (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Previous photo"
              className="-translate-y-1/2 absolute top-1/2 left-2 hidden size-11 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:grid"
            >
              <ChevronLeft className="size-6" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Next photo"
              className="-translate-y-1/2 absolute top-1/2 right-2 hidden size-11 place-items-center rounded-full bg-white/10 backdrop-blur hover:bg-white/20 sm:grid"
            >
              <ChevronRight className="size-6" />
            </button>
          </>
        ) : null}
      </div>

      {many ? (
        <div
          ref={stripRef}
          className="no-scrollbar flex shrink-0 justify-start gap-2 overflow-x-auto px-3 py-3 sm:justify-center"
        >
          {photos.map((p, n) => (
            <button
              key={p.src}
              type="button"
              aria-label={`Photo ${n + 1}`}
              aria-current={n === i ? 'true' : undefined}
              onClick={() => onIndex(n)}
              className={cn(
                'size-14 shrink-0 overflow-hidden rounded-md ring-2 transition-opacity',
                n === i ? 'opacity-100 ring-white' : 'opacity-50 ring-transparent hover:opacity-90',
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: a small CDN copy. */}
              <img
                src={p.thumb ?? p.src}
                alt=""
                className="size-full object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

/**
 * A row of thumbnails that open the viewer. Shows at most `max`; the last one says "+N" when
 * there are more (plus `extra`: photos the place has that weren't sent along).
 * `thumbClassName` sets each thumbnail's size and rounding.
 */
export function PhotoThumbs({
  photos,
  title,
  max = 4,
  extra = 0,
  className,
  thumbClassName = 'size-16 rounded-lg',
}: {
  photos: ViewerPhoto[];
  title?: string;
  max?: number;
  extra?: number;
  className?: string;
  thumbClassName?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  if (!photos.length) return null;
  const shown = photos.slice(0, max);
  const more = photos.length - shown.length + extra;
  return (
    <>
      <div className={cn('flex gap-1.5', className)}>
        {shown.map((p, n) => (
          <button
            key={p.src}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(n);
            }}
            aria-label={`Open photo ${n + 1} of ${photos.length}${title ? ` of ${title}` : ''}`}
            className={cn(
              'relative shrink-0 overflow-hidden bg-surface-2 ring-primary transition hover:opacity-90 focus-visible:ring-2',
              thumbClassName,
            )}
          >
            {/* biome-ignore lint/performance/noImgElement: a small CDN copy. */}
            <img
              src={p.thumb ?? p.src}
              alt={p.alt ?? ''}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
            {more > 0 && n === shown.length - 1 ? (
              <span className="absolute inset-0 grid place-items-center bg-black/55 font-semibold text-sm text-white">
                +{more}
              </span>
            ) : null}
          </button>
        ))}
      </div>
      <PhotoViewer
        photos={photos}
        index={open}
        onIndex={setOpen}
        onClose={() => setOpen(null)}
        title={title}
      />
    </>
  );
}
