'use client';

import 'maplibre-gl/dist/maplibre-gl.css';
import maplibregl from 'maplibre-gl';
import { useTheme } from 'next-themes';
import { useEffect, useRef } from 'react';
import type { PlaceMapProps } from './types';

// OpenFreeMap: free vector tiles from OpenStreetMap, no key. Vector tiles are far fewer bytes than
// image tiles on a slow connection.
const STYLES = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

/** Ghana, for a map with nothing to show yet. */
const GHANA: [[number, number], [number, number]] = [
  [-3.3, 4.6],
  [1.3, 11.2],
];

export default function PlaceMap({
  points,
  user,
  selectedId,
  onSelect,
  focus,
  interactive = true,
  className,
}: PlaceMapProps) {
  const box = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef(new Map<string, { marker: maplibregl.Marker; el: HTMLElement }>());
  const userMarker = useRef<maplibregl.Marker | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === 'dark';

  // biome-ignore lint/correctness/useExhaustiveDependencies: created once; theme changes swap the style below.
  useEffect(() => {
    if (!box.current) return;
    const m = new maplibregl.Map({
      container: box.current,
      style: dark ? STYLES.dark : STYLES.light,
      bounds: GHANA,
      fitBoundsOptions: { padding: 24 },
      interactive,
      attributionControl: { compact: true },
      // Cheap phones: no 3D tilt, fewer tiles kept around.
      pitchWithRotate: false,
      dragRotate: false,
      maxTileCacheSize: 60,
    });
    if (interactive) {
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    }
    m.touchZoomRotate.disableRotation();
    map.current = m;
    // The box can get its real size after the map is made (a panel opening, CSS arriving late):
    // resize and frame again, or the pins end up off to one side.
    let last = '';
    const ro = new ResizeObserver(([e]) => {
      const size = `${Math.round(e?.contentRect.width ?? 0)}x${Math.round(e?.contentRect.height ?? 0)}`;
      if (size === last) return;
      last = size;
      m.resize();
      frame.current();
    });
    ro.observe(box.current);
    return () => {
      ro.disconnect();
      m.remove();
      map.current = null;
      markers.current.clear();
    };
  }, []);

  useEffect(() => {
    map.current?.setStyle(dark ? STYLES.dark : STYLES.light);
  }, [dark]);

  // Result pins.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const keep = new Set(points.map((p) => p.id));
    for (const [id, { marker }] of markers.current) {
      if (!keep.has(id)) {
        marker.remove();
        markers.current.delete(id);
      }
    }
    points.forEach((p, i) => {
      const have = markers.current.get(p.id);
      if (have) {
        have.marker.setLngLat([p.lon, p.lat]);
        const label = have.el.querySelector('.placia-pin-body > span');
        if (label) label.textContent = String(i + 1);
        return;
      }
      const el = document.createElement('button');
      el.type = 'button';
      el.className = 'placia-pin';
      const body = document.createElement('span');
      body.className = 'placia-pin-body';
      const n = document.createElement('span');
      n.textContent = String(i + 1);
      body.append(n);
      el.append(body);
      el.setAttribute('aria-label', p.name);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onSelectRef.current?.(p.id);
      });
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([p.lon, p.lat])
        .addTo(m);
      markers.current.set(p.id, { marker, el });
    });
  }, [points]);

  // The user's own position.
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    if (!user) {
      userMarker.current?.remove();
      userMarker.current = null;
      return;
    }
    if (!userMarker.current) {
      const el = document.createElement('div');
      el.className = 'placia-me';
      userMarker.current = new maplibregl.Marker({ element: el }).setLngLat([user.lon, user.lat]);
      userMarker.current.addTo(m);
    } else userMarker.current.setLngLat([user.lon, user.lat]);
  }, [user]);

  // Frame what matters: a set focus, else every pin (and the user), else Ghana.
  const frame = useRef(() => {});
  frame.current = () => {
    const m = map.current;
    if (!m) return;
    if (focus) {
      m.jumpTo({ center: [focus.lon, focus.lat], zoom: focus.zoom ?? 15 });
      return;
    }
    const all = [...points, ...(user && points.length ? [user] : [])];
    if (!all.length) {
      if (user) m.jumpTo({ center: [user.lon, user.lat], zoom: 13 });
      return;
    }
    const bounds = new maplibregl.LngLatBounds();
    for (const p of all) bounds.extend([p.lon, p.lat]);
    m.fitBounds(bounds, { padding: 56, maxZoom: 15, duration: 0 });
  };
  // biome-ignore lint/correctness/useExhaustiveDependencies: frame reads these through the ref.
  useEffect(() => frame.current(), [points, user, focus]);

  // Highlight the selected pin and bring it into view.
  useEffect(() => {
    const m = map.current;
    for (const [id, { el }] of markers.current) {
      el.toggleAttribute('data-selected', id === selectedId);
      el.style.zIndex = id === selectedId ? '2' : '';
    }
    const sel = selectedId ? markers.current.get(selectedId) : null;
    if (m && sel) {
      const at = sel.marker.getLngLat();
      if (!m.getBounds().contains(at)) m.easeTo({ center: at, duration: 300 });
    }
  }, [selectedId]);

  return <div ref={box} className={className} />;
}
