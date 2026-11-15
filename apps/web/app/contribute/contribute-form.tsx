'use client';

import { Button } from '@placia/ui/button';
import { cn } from '@placia/ui/cn';
import { Camera, Check, Crosshair, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LocationPicker } from '../_components/map';
import { readLocation, requestLocation } from '../_lib/location';
import { supabaseBrowser } from '../_lib/supabase/browser';

export type Kind = 'new_place' | 'edit' | 'report' | 'photo';

export interface PlaceDraft {
  id: string;
  slug: string;
  name: string;
  category_id: number | null;
  phone: string;
  website: string;
  address: string;
  hours: string;
  lat: number;
  lon: number;
}

interface Category {
  id: number;
  slug: string;
  name: string;
  group: string;
}

const ACCRA = { lat: 5.5571, lon: -0.1969 };
const field =
  'h-12 w-full rounded-xl border bg-surface px-4 text-base outline-none placeholder:text-muted-foreground focus:border-primary';

const REASONS = [
  { value: 'closed', label: 'Closed for good' },
  { value: 'not_here', label: 'Not at this location' },
  { value: 'duplicate', label: 'Listed twice' },
  { value: 'wrong_info', label: 'Wrong details' },
  { value: 'other', label: 'Something else' },
] as const;

export function ContributeForm({
  kind,
  place,
  categories,
  userId,
}: {
  kind: Kind;
  place: PlaceDraft | null;
  categories: Category[];
  userId: string;
}) {
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (body: unknown) => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/contributions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(
          data.error === 'no_changes'
            ? 'Nothing changed'
            : data.error === 'too_many_requests'
              ? 'Too many in a short time, try later'
              : "Couldn't send",
        );
        return;
      }
      setDone(true);
    } catch {
      setError("Couldn't send");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-primary-soft text-primary-soft-foreground">
          <Check className="size-7" />
        </span>
        <p className="font-semibold text-lg">Sent for review</p>
        <div className="flex gap-2">
          <Link href="/account" className="rounded-full border px-4 py-2 font-medium text-sm">
            My contributions
          </Link>
          <Link
            href={place ? `/place/${place.slug}` : '/'}
            className="rounded-full bg-primary px-4 py-2 font-medium text-primary-foreground text-sm"
          >
            Done
          </Link>
        </div>
      </div>
    );
  }

  const footer = (
    <>
      {error ? <p className="text-danger text-sm">{error}</p> : null}
      <Button type="submit" className="h-12 w-full" disabled={busy}>
        {busy ? 'Sending…' : 'Send for review'}
      </Button>
    </>
  );

  if (kind === 'report' && place)
    return <ReportForm place={place} submit={submit} footer={footer} />;
  if (kind === 'photo' && place)
    return <PhotoForm place={place} userId={userId} submit={submit} busy={busy} error={error} />;
  return (
    <PlaceForm kind={kind} place={place} categories={categories} submit={submit} footer={footer} />
  );
}

function PlaceForm({
  kind,
  place,
  categories,
  submit,
  footer,
}: {
  kind: Kind;
  place: PlaceDraft | null;
  categories: Category[];
  submit: (body: unknown) => Promise<void>;
  footer: React.ReactNode;
}) {
  const [describe, setDescribe] = useState('');
  const [filling, setFilling] = useState(false);
  const [fillFailed, setFillFailed] = useState(false);
  const [name, setName] = useState(place?.name ?? '');
  const [categoryId, setCategoryId] = useState<number | ''>(place?.category_id ?? '');
  const [address, setAddress] = useState(place?.address ?? '');
  const [phone, setPhone] = useState(place?.phone ?? '');
  const [website, setWebsite] = useState(place?.website ?? '');
  const [hours, setHours] = useState(place?.hours ?? '');
  const [note, setNote] = useState('');
  const [point, setPoint] = useState(place ? { lat: place.lat, lon: place.lon } : ACCRA);
  const [locating, setLocating] = useState(false);

  // A new place starts where the user is, when we already know.
  useEffect(() => {
    if (place) return;
    const loc = readLocation();
    if (loc) setPoint({ lat: loc.lat, lon: loc.lon });
  }, [place]);

  const groups = [...new Set(categories.map((c) => c.group))];

  const fill = async () => {
    setFilling(true);
    setFillFailed(false);
    try {
      const res = await fetch('/api/contributions/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: describe }),
      });
      const { fields } = (await res.json()) as {
        fields: {
          name: string;
          category_id: number | null;
          landmark: string;
          phone: string;
          hours: string;
        } | null;
      };
      if (!fields) setFillFailed(true);
      if (fields) {
        if (fields.name) setName(fields.name);
        if (fields.category_id) setCategoryId(fields.category_id);
        if (fields.landmark) setAddress(fields.landmark);
        if (fields.phone) setPhone(fields.phone);
        if (fields.hours) setHours(fields.hours);
      }
    } catch {
      setFillFailed(true);
    } finally {
      setFilling(false);
    }
  };

  const locate = async () => {
    setLocating(true);
    try {
      const loc = await requestLocation();
      setPoint({ lat: loc.lat, lon: loc.lon });
    } catch {
      // Denied or unavailable: the map stays where it is.
    } finally {
      setLocating(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const fields = {
      name: name.trim(),
      category_id: Number(categoryId),
      address: address.trim(),
      phone: phone.trim(),
      website: website.trim(),
      hours: hours.trim(),
    };
    if (kind === 'new_place' || !place) {
      void submit({
        kind: 'new_place',
        payload: { ...fields, ...point, note: note.trim() || undefined },
      });
      return;
    }
    // Only what changed, so the reviewer sees a clear diff.
    const before: Record<string, unknown> = {
      name: place.name,
      category_id: place.category_id,
      address: place.address,
      phone: place.phone,
      website: place.website,
      hours: place.hours,
    };
    const changes: Record<string, unknown> = Object.fromEntries(
      Object.entries(fields).filter(([k, v]) => v !== before[k]),
    );
    const moved = Math.abs(point.lat - place.lat) > 1e-5 || Math.abs(point.lon - place.lon) > 1e-5;
    if (moved) Object.assign(changes, point);
    void submit({
      kind: 'edit',
      place_id: place.id,
      payload: { changes, note: note.trim() || undefined },
    });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {kind === 'new_place' ? (
        <div className="space-y-2 rounded-2xl border border-dashed p-3">
          <textarea
            value={describe}
            onChange={(e) => setDescribe(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="e.g. New pharmacy opposite the Shell at Madina, open till 10pm"
            aria-label="Describe the place"
            className="w-full resize-none bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          <Button
            type="button"
            variant="soft"
            size="sm"
            disabled={describe.trim().length < 3 || filling}
            onClick={() => void fill()}
          >
            <Sparkles />
            {filling ? 'Filling in…' : 'Fill in for me'}
          </Button>
          {fillFailed ? <span className="ml-2 text-danger text-sm">Couldn't fill in</span> : null}
        </div>
      ) : null}

      <Label text="Name">
        <input
          required
          minLength={2}
          maxLength={120}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={field}
        />
      </Label>

      <Label text="Category">
        <select
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : '')}
          className={cn(field, 'appearance-none')}
        >
          <option value="">Choose…</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {categories
                .filter((c) => c.group === g)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </Label>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Location</span>
          <button
            type="button"
            onClick={() => void locate()}
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-medium text-primary text-sm hover:bg-primary-soft"
          >
            <Crosshair className="size-4" />
            {locating ? 'Finding you…' : "I'm here"}
          </button>
        </div>
        <LocationPicker
          value={point}
          onChange={setPoint}
          className="h-64 overflow-hidden rounded-xl border"
        />
      </div>

      <Label text="Landmark or address">
        <input
          maxLength={200}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={field}
        />
      </Label>
      <div className="grid gap-4 sm:grid-cols-2">
        <Label text="Phone">
          <input
            type="tel"
            inputMode="tel"
            maxLength={30}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className={field}
          />
        </Label>
        <Label text="Opening hours">
          <input
            maxLength={200}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="Mon–Sat 8am–9pm"
            className={field}
          />
        </Label>
      </div>
      <Label text="Website">
        <input
          type="url"
          inputMode="url"
          maxLength={200}
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          placeholder="https://"
          className={field}
        />
      </Label>
      <Label text="Note for the reviewer">
        <textarea
          maxLength={500}
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(field, 'h-auto py-3')}
        />
      </Label>
      {footer}
    </form>
  );
}

function ReportForm({
  place,
  submit,
  footer,
}: {
  place: PlaceDraft;
  submit: (body: unknown) => Promise<void>;
  footer: React.ReactNode;
}) {
  const [reason, setReason] = useState<(typeof REASONS)[number]['value'] | ''>('');
  const [note, setNote] = useState('');
  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!reason) return;
        void submit({
          kind: 'report',
          place_id: place.id,
          payload: { reason, note: note.trim() || undefined },
        });
      }}
    >
      <fieldset className="space-y-2">
        <legend className="sr-only">What's wrong</legend>
        {REASONS.map((r) => (
          <label
            key={r.value}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-xl border bg-surface px-4 py-3.5',
              reason === r.value && 'border-primary bg-primary-soft',
            )}
          >
            <input
              type="radio"
              name="reason"
              required
              value={r.value}
              checked={reason === r.value}
              onChange={() => setReason(r.value)}
              className="accent-[var(--color-primary)]"
            />
            {r.label}
          </label>
        ))}
      </fieldset>
      <Label text="Details">
        <textarea
          maxLength={500}
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className={cn(field, 'h-auto py-3')}
        />
      </Label>
      {footer}
    </form>
  );
}

/** Shrinks a photo on the phone before upload: a 12 MP picture becomes ~200 KB. */
async function shrink(file: File, max = 1600) {
  const img = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(img.width, img.height));
  const w = Math.round(img.width * scale);
  const h = Math.round(img.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
  img.close();
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.8));
  // Older Safari can't encode WebP and silently returns PNG: fall back to JPEG.
  if (blob && blob.type === 'image/webp') return { blob, w, h, ext: 'webp' as const };
  const jpeg = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.82));
  if (!jpeg) throw new Error('encode failed');
  return { blob: jpeg, w, h, ext: 'jpg' as const };
}

function PhotoForm({
  place,
  userId,
  submit,
  busy,
  error,
}: {
  place: PlaceDraft;
  userId: string;
  submit: (body: unknown) => Promise<void>;
  busy: boolean;
  error: string | null;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const send = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const { blob, w, h, ext } = await shrink(file);
      const path = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabaseBrowser()
        .storage.from('place-photos')
        .upload(path, blob, { contentType: blob.type, upsert: false });
      if (upErr) throw upErr;
      await submit({
        kind: 'photo',
        place_id: place.id,
        payload: { storage_path: path, width: w, height: h },
      });
    } catch {
      setUploadError("Couldn't upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void send();
      }}
    >
      <label className="relative grid aspect-[4/3] cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed bg-surface">
        {preview ? (
          // biome-ignore lint/performance/noImgElement: a local preview, not a served image.
          <img src={preview} alt="" className="absolute inset-0 size-full object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-2 text-muted-foreground">
            <Camera className="size-8" />
            Take or choose a photo
          </span>
        )}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          required
          className="sr-only"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </label>
      {uploadError || error ? <p className="text-danger text-sm">{uploadError ?? error}</p> : null}
      <Button type="submit" className="h-12 w-full" disabled={!file || uploading || busy}>
        {uploading || busy ? 'Sending…' : 'Send for review'}
      </Button>
    </form>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is passed in as children.
    <label className="block space-y-1.5">
      <span className="font-medium text-sm">{text}</span>
      {children}
    </label>
  );
}
