'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';

const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

export interface LatLon {
  lat: number;
  lon: number;
}

/**
 * Move the map under a fixed pin to set a place's position (same picker as the public site).
 * `others` shows nearby places as small dots, so a duplicate next door is easy to spot.
 */
export default function LocationPicker({
  value,
  onChange,
  others = [],
  className,
}: {
  value: LatLon;
  onChange: (v: LatLon) => void;
  others?: (LatLon & { name: string })[];
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const cb = useRef(onChange);
  cb.current = onChange;
  const { resolvedTheme } = useTheme();

  // biome-ignore lint/correctness/useExhaustiveDependencies: created once; `value` changes recentre below.
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: resolvedTheme === 'dark' ? STYLES.dark : STYLES.light,
      center: [value.lon, value.lat],
      zoom: 16,
      attributionControl: { compact: true },
      pitchWithRotate: false,
      dragRotate: false,
      maxTileCacheSize: 60,
    });
    m.touchZoomRotate.disableRotation();
    m.once('load', () =>
      box.current
        ?.querySelector('.maplibregl-ctrl-attrib')
        ?.classList.remove('maplibregl-compact-show'),
    );
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    m.on('moveend', () => {
      const c = m.getCenter();
      cb.current({ lat: Number(c.lat.toFixed(6)), lon: Number(c.lng.toFixed(6)) });
    });
    map.current = m;
    return () => m.remove();
  }, []);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - value.lat) > 1e-5 || Math.abs(c.lng - value.lon) > 1e-5) {
      m.jumpTo({ center: [value.lon, value.lat], zoom: Math.max(m.getZoom(), 16) });
    }
  }, [value.lat, value.lon]);

  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const markers = others.map((o) => {
      const el = document.createElement('span');
      el.title = o.name;
      el.style.cssText =
        'width:12px;height:12px;border-radius:999px;background:var(--color-warning);border:2px solid var(--color-surface);box-shadow:0 1px 3px rgb(0 0 0/.3)';
      return new maplibregl.Marker({ element: el }).setLngLat([o.lon, o.lat]).addTo(m);
    });
    return () => {
      for (const mk of markers) mk.remove();
    };
  }, [others]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={box} className="size-full" />
      <svg
        viewBox="0 0 28 36"
        aria-hidden
        className="-translate-x-1/2 -translate-y-full pointer-events-none absolute top-1/2 left-1/2 z-[1] h-9 w-7 drop-shadow"
      >
        <path
          d="M14 1C7 1 1.5 6.4 1.5 13.2 1.5 22 14 35 14 35s12.5-13 12.5-21.8C26.5 6.4 21 1 14 1Z"
          fill="var(--color-primary)"
          stroke="var(--color-surface)"
          strokeWidth="2"
        />
        <circle cx="14" cy="13" r="4.5" fill="var(--color-primary-foreground)" />
      </svg>
    </div>
  );
}
