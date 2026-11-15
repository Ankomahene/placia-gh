import { ImageResponse } from 'next/og';

// Brand tokens in hex (the icon renderer has no oklch). From packages/ui/src/styles.css.
const PRIMARY = '#006d47';
const ON_PRIMARY = '#f9fdfb';
const ACCENT = '#f2bb3b';

/**
 * The Placia mark as a PNG: a pin holding a star. `padding` leaves the safe zone a maskable icon
 * needs (Android crops it to a circle or squircle).
 */
export function brandIcon(size: number, { padding = 0, rounded = false } = {}) {
  const inner = size * (1 - padding * 2);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: PRIMARY,
        borderRadius: rounded ? size * 0.28 : 0,
      }}
    >
      <svg width={inner} height={inner} viewBox="6 5 20 22" aria-hidden="true">
        <path
          d="M16 6.5c-4.4 0-8 3.4-8 7.7 0 5.6 6.6 11.1 7.3 11.7.4.3 1 .3 1.4 0 .7-.6 7.3-6.1 7.3-11.7 0-4.3-3.6-7.7-8-7.7Z"
          fill={ON_PRIMARY}
        />
        <path
          d="m16 10.2 1.15 2.45 2.65.33-1.95 1.83.5 2.63L16 16.15l-2.35 1.29.5-2.63-1.95-1.83 2.65-.33L16 10.2Z"
          fill={ACCENT}
        />
      </svg>
    </div>,
    { width: size, height: size },
  );
}
