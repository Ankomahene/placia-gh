import { cn } from '@placia/ui/cn';
import type { MapDot } from './types';

/*
 * A map made of plain tile images: no map library, no script, so it costs a cheap phone almost
 * nothing to show. CARTO's free basemaps (OpenStreetMap data), the same look as the interactive
 * map's style. Free for non-commercial use with attribution.
 */
const TILE = 256;
const TILES = {
  light: (z: number, x: number, y: number, r = '') =>
    `https://basemaps.cartocdn.com/light_all/${z}/${x}/${y}${r}.png`,
  dark: (z: number, x: number, y: number, r = '') =>
    `https://basemaps.cartocdn.com/dark_all/${z}/${x}/${y}${r}.png`,
};

/** Web Mercator: a point's position in pixels on the whole world map at zoom z. */
function worldPx(lat: number, lon: number, z: number) {
  const scale = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lon + 180) / 360) * scale,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * scale,
  };
}

export function StaticMap({
  lat,
  lon,
  zoom = 15,
  dots = [],
  className,
}: {
  lat: number;
  lon: number;
  zoom?: number;
  dots?: MapDot[];
  className?: string;
}) {
  const c = worldPx(lat, lon, zoom);
  const tx = Math.floor(c.x / TILE);
  const ty = Math.floor(c.y / TILE);
  // 5 × 3 tiles around the centre covers a 1000 × 500 px box: wide desktop cards and phones.
  const tiles: { x: number; y: number; left: number; top: number }[] = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      tiles.push({
        x: tx + dx,
        y: ty + dy,
        left: (tx + dx) * TILE - c.x,
        top: (ty + dy) * TILE - c.y,
      });
    }
  }
  const at = (la: number, lo: number) => {
    const p = worldPx(la, lo, zoom);
    return { left: `calc(50% + ${p.x - c.x}px)`, top: `calc(50% + ${p.y - c.y}px)` };
  };

  return (
    <div className={cn('relative overflow-hidden bg-surface-2', className)}>
      {tiles.map((t) => (
        <span
          key={`${t.x}-${t.y}`}
          className="absolute"
          style={{ left: `calc(50% + ${t.left}px)`, top: `calc(50% + ${t.top}px)` }}
        >
          {/* Only the theme's set is shown, and lazy images that aren't shown never download. */}
          {(['light', 'dark'] as const).map((theme) => (
            // biome-ignore lint/performance/noImgElement: plain tiles; next/image would proxy them.
            <img
              key={theme}
              src={TILES[theme](zoom, t.x, t.y)}
              srcSet={`${TILES[theme](zoom, t.x, t.y, '@2x')} 2x`}
              alt=""
              width={TILE}
              height={TILE}
              loading="lazy"
              decoding="async"
              draggable={false}
              className={cn(
                'max-w-none select-none',
                theme === 'light' ? 'dark:hidden' : 'hidden dark:block',
              )}
            />
          ))}
        </span>
      ))}
      {/* Decoration here: the nearby list carries the links, the live map makes dots tappable. */}
      {dots.map((d) => (
        <span
          key={d.id}
          aria-hidden
          className="placia-dot -translate-x-1/2 -translate-y-1/2 pointer-events-none absolute"
          style={at(d.lat, d.lon)}
        />
      ))}
      <span
        className="-translate-x-1/2 -translate-y-full pointer-events-none absolute z-[1]"
        style={at(lat, lon)}
      >
        <span className="placia-pin block">
          <span className="placia-pin-body">
            <span />
          </span>
        </span>
      </span>
      <span className="absolute right-1 bottom-1 rounded bg-surface/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        © OpenStreetMap © CARTO
      </span>
    </div>
  );
}
