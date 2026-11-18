'use client';

import { cn } from '@placia/ui/cn';
import { Check, LoaderCircle, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { type LatLon, LocationPicker } from '../../_components/map';
import type { CategoryOption } from '../../_lib/places';
import { type PlaceInput, savePlace } from './edit-actions';

export interface PlaceValues {
  name: string;
  alt_names: string;
  category_id: string;
  lat: number;
  lon: number;
  address: string;
  phone: string;
  website: string;
  email: string;
  hours: string;
  description: string;
  status: 'active' | 'pending' | 'hidden' | 'closed';
}

const STATUSES = ['active', 'pending', 'hidden', 'closed'] as const;

/** Coordinates out of a pasted Google/Apple/OSM maps link, or a plain "lat, lon". */
export function parseCoords(s: string): LatLon | null {
  const pats = [
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // Google place pin (more exact than the @ view)
    /@(-?\d+\.\d+),(-?\d+\.\d+)/, // Google map view
    /[?&](?:q|ll|query|destination|mlat)=(-?\d+\.\d+)(?:,|%2C|&mlon=)(-?\d+\.\d+)/i,
    /^\s*(-?\d+\.\d+)\s*[,\s]\s*(-?\d+\.\d+)\s*$/,
  ];
  for (const p of pats) {
    const m = s.match(p);
    if (m) {
      const lat = Number(m[1]);
      const lon = Number(m[2]);
      if (lat > 4 && lat < 12 && lon > -4 && lon < 2) return { lat, lon };
    }
  }
  return null;
}

const input =
  'h-10 w-full rounded-md border bg-surface px-3 text-sm outline-none focus:border-primary';

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    // biome-ignore lint/a11y/noLabelWithoutControl: the control is the child.
    <label className={cn('block space-y-1.5', className)}>
      <span className="font-medium text-muted-foreground text-xs">{label}</span>
      {children}
    </label>
  );
}

/** Add a place, or correct one. Saves go live straight away. */
export function PlaceEditor({
  id,
  initial,
  categories,
  others = [],
}: {
  id: string | null;
  initial: PlaceValues;
  categories: CategoryOption[];
  others?: (LatLon & { name: string })[];
}) {
  const router = useRouter();
  const [v, setV] = useState(initial);
  const [paste, setPaste] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof PlaceValues>(k: K, val: PlaceValues[K]) => {
    setV((x) => ({ ...x, [k]: val }));
    setSaved(false);
  };
  // Fresh data from the server (after a save, a merge, or another admin's edit) replaces the
  // form, so a later save never writes back stale values.
  const initialKey = JSON.stringify(initial);
  // biome-ignore lint/correctness/useExhaustiveDependencies: keyed on the values, not the object.
  useEffect(() => {
    setV(initial);
  }, [initialKey]);
  const groups = useMemo(() => [...new Set(categories.map((c) => c.group))], [categories]);
  const moved = Math.abs(v.lat - initial.lat) > 1e-6 || Math.abs(v.lon - initial.lon) > 1e-6;

  const save = async () => {
    setBusy(true);
    setError(null);
    const all: PlaceInput = {
      id,
      name: v.name,
      alt_names: v.alt_names
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      category_id: v.category_id ? Number(v.category_id) : null,
      lat: v.lat,
      lon: v.lon,
      address: v.address,
      phone: v.phone,
      website: v.website,
      email: v.email,
      hours: v.hours,
      description: v.description,
      status: v.status,
    };
    // On an edit, send only what changed (keeps OSM hours and the area unless they changed).
    const body: PlaceInput = id ? { id } : all;
    if (id) {
      for (const k of Object.keys(initial) as (keyof PlaceValues)[]) {
        if (k === 'lat' || k === 'lon') continue;
        if (v[k] !== initial[k]) Object.assign(body, { [k]: all[k as keyof PlaceInput] });
      }
      if (moved) Object.assign(body, { lat: v.lat, lon: v.lon });
    }
    const res = await savePlace(body);
    setBusy(false);
    if ('error' in res) {
      setError(res.error);
      return;
    }
    if (!id) {
      router.push(`/places/${res.id}`);
      return;
    }
    setSaved(true);
    router.refresh();
  };

  const dirty =
    !id || (Object.keys(initial) as (keyof PlaceValues)[]).some((k) => v[k] !== initial[k]);

  return (
    <form
      className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div className="space-y-4 rounded-lg border bg-surface p-4 shadow-card">
        <Field label="Name">
          <input
            required
            minLength={2}
            maxLength={150}
            value={v.name}
            onChange={(e) => set('name', e.target.value)}
            className={input}
          />
        </Field>
        <Field label="Other names (comma separated)">
          <input
            value={v.alt_names}
            onChange={(e) => set('alt_names', e.target.value)}
            className={input}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Category">
            <select
              value={v.category_id}
              onChange={(e) => set('category_id', e.target.value)}
              className={input}
            >
              <option value="">None</option>
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
          </Field>
          <Field label="Status">
            <select
              value={v.status}
              onChange={(e) => set('status', e.target.value as PlaceValues['status'])}
              className={cn(input, 'capitalize')}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Address">
          <input
            maxLength={300}
            value={v.address}
            onChange={(e) => set('address', e.target.value)}
            className={input}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone">
            <input
              type="tel"
              maxLength={60}
              value={v.phone}
              onChange={(e) => set('phone', e.target.value)}
              className={input}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              maxLength={200}
              value={v.email}
              onChange={(e) => set('email', e.target.value)}
              className={input}
            />
          </Field>
        </div>
        <Field label="Website">
          <input
            maxLength={300}
            value={v.website}
            onChange={(e) => set('website', e.target.value)}
            className={input}
          />
        </Field>
        <Field label="Opening hours">
          <input
            maxLength={300}
            value={v.hours}
            onChange={(e) => set('hours', e.target.value)}
            placeholder="Mon–Sat 8am–6pm"
            className={input}
          />
        </Field>
        <Field label="Description">
          <textarea
            maxLength={1000}
            rows={3}
            value={v.description}
            onChange={(e) => set('description', e.target.value)}
            className={cn(input, 'h-auto py-2')}
          />
        </Field>
      </div>

      <div className="space-y-3 lg:sticky lg:top-6 lg:self-start">
        <div className="overflow-hidden rounded-lg border bg-surface shadow-card">
          <LocationPicker
            value={{ lat: v.lat, lon: v.lon }}
            onChange={(p) => {
              set('lat', p.lat);
              set('lon', p.lon);
            }}
            others={others}
            className="h-72 lg:h-96"
          />
          <div className="flex items-center gap-2 border-t px-3 py-2 text-xs">
            <MapPin className="size-3.5 shrink-0 text-primary" />
            <span className="tabular-nums">
              {v.lat.toFixed(6)}, {v.lon.toFixed(6)}
            </span>
            {moved && id ? (
              <button
                type="button"
                onClick={() => setV((x) => ({ ...x, lat: initial.lat, lon: initial.lon }))}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            ) : null}
          </div>
        </div>
        <input
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value);
            const p = parseCoords(e.target.value);
            if (p) {
              setV((x) => ({ ...x, ...p }));
              setSaved(false);
            }
          }}
          placeholder="Paste a map link or lat, lon"
          aria-label="Paste a map link or coordinates"
          aria-invalid={paste !== '' && !parseCoords(paste)}
          className={cn(input, 'aria-[invalid=true]:border-danger')}
        />

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy || !dirty}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-5 font-medium text-primary-foreground text-sm hover:opacity-90 disabled:opacity-50"
          >
            {busy ? <LoaderCircle className="size-4 animate-spin" /> : null}
            {id ? 'Save changes' : 'Add place'}
          </button>
          {saved ? (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" /> Saved
            </span>
          ) : null}
          {error ? <span className="text-danger text-sm">{error}</span> : null}
        </div>
      </div>
    </form>
  );
}
