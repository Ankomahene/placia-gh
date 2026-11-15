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
 * Pick a point by moving the map under a fixed pin, which is easier with a thumb than dragging
 * a marker. Reports the centre after every move.
 */
export default function LocationPicker({
  value,
  onChange,
  className,
}: {
  value: LatLon;
  onChange: (v: LatLon) => void;
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
    // The compact credit opens expanded on load and covers a small map; start it folded.
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

  // A new value from outside ("use my location") moves the map; the map's own moves don't loop.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const c = m.getCenter();
    if (Math.abs(c.lat - value.lat) > 1e-5 || Math.abs(c.lng - value.lon) > 1e-5) {
      m.jumpTo({ center: [value.lon, value.lat], zoom: Math.max(m.getZoom(), 16) });
    }
  }, [value.lat, value.lon]);

  return (
    <div className={className} style={{ position: 'relative' }}>
      <div ref={box} className="size-full" />
      <span className="-translate-x-1/2 -translate-y-full pointer-events-none absolute top-1/2 left-1/2 z-[1]">
        <span className="placia-pin block">
          <span className="placia-pin-body">
            <span />
          </span>
        </span>
      </span>
    </div>
  );
}
