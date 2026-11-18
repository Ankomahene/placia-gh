'use client';

import { cn } from '@placia/ui/cn';
import { formatHex, parse } from 'culori';
import { Download, Image as ImageIcon, Pause, Play } from 'lucide-react';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { UPDATED } from './content';
import { Diagram, type DiagramSpec, TONE, TONE_LABEL, type Tone } from './diagram';

const PAINT = ['fill', 'stroke', 'stop-color'] as const;
const FONT = 'Inter, "Segoe UI", Helvetica, Arial, sans-serif';
const HEAD = 64;

/**
 * A standalone copy of a diagram: theme colours written out as hex (oklch and color-mix don't
 * survive outside the page), a background, and a title strip. `still` drops the moving dots.
 */
function exportable(svg: SVGSVGElement, title: string, still: boolean) {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  const from = [svg, ...svg.querySelectorAll('*')];
  const to = [clone, ...clone.querySelectorAll('*')];
  from.forEach((el, i) => {
    const target = to[i] as Element;
    const cs = getComputedStyle(el);
    for (const prop of PAINT) {
      const attr = target.getAttribute(prop);
      if (!attr || !/var\(|color-mix/.test(attr)) continue;
      const c = parse(cs.getPropertyValue(prop));
      if (!c) continue;
      target.setAttribute(prop, formatHex(c));
      if (c.alpha != null && c.alpha < 1) target.setAttribute(`${prop}-opacity`, String(c.alpha));
    }
  });
  if (still) for (const dot of clone.querySelectorAll('.flow-dot')) dot.remove();

  const [, , w, h] = (svg.getAttribute('viewBox') ?? '0 0 1000 600').split(' ').map(Number) as [
    number,
    number,
    number,
    number,
  ];
  const root = getComputedStyle(document.documentElement);
  const color = (v: string, fallback: string) => {
    const c = parse(root.getPropertyValue(v).trim());
    return c ? formatHex(c) : fallback;
  };
  const bg = color('--color-surface', '#ffffff');
  const fg = color('--color-foreground', '#1a1a1a');
  const muted = color('--color-muted-foreground', '#666666');

  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  clone.setAttribute('viewBox', `-24 ${-HEAD} ${w + 48} ${h + HEAD + 24}`);
  clone.setAttribute('width', String(w + 48));
  clone.setAttribute('height', String(h + HEAD + 24));
  clone.setAttribute('font-family', FONT);
  clone.removeAttribute('class');
  const ns = 'http://www.w3.org/2000/svg';
  const rect = document.createElementNS(ns, 'rect');
  rect.setAttribute('x', '-24');
  rect.setAttribute('y', String(-HEAD));
  rect.setAttribute('width', String(w + 48));
  rect.setAttribute('height', String(h + HEAD + 24));
  rect.setAttribute('fill', bg);
  const head = document.createElementNS(ns, 'text');
  head.setAttribute('x', '0');
  head.setAttribute('y', String(-HEAD + 30));
  head.setAttribute('font-size', '20');
  head.setAttribute('font-weight', '700');
  head.setAttribute('fill', fg);
  head.textContent = title;
  const meta = document.createElementNS(ns, 'text');
  meta.setAttribute('x', String(w));
  meta.setAttribute('y', String(-HEAD + 30));
  meta.setAttribute('font-size', '12');
  meta.setAttribute('text-anchor', 'end');
  meta.setAttribute('fill', muted);
  meta.textContent = `PlaciaGh · how it works · ${UPDATED}`;
  clone.insertBefore(meta, clone.firstChild);
  clone.insertBefore(head, clone.firstChild);
  clone.insertBefore(rect, clone.firstChild);
  return {
    svg: new XMLSerializer().serializeToString(clone),
    width: w + 48,
    height: h + HEAD + 24,
    bg,
  };
}

function save(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function toPng(svg: string, width: number, height: number, bg: string) {
  const img = new Image();
  img.src = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  await img.decode();
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no canvas');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(img.src);
  return new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('png'))), 'image/png'),
  );
}

export interface Step {
  title: string;
  text: ReactNode;
}

/**
 * One diagram with its controls: play/pause the moving dots, download as SVG (animated) or
 * PNG, a colour key, and the same flow written out as numbered steps (readable on a phone).
 */
export function Figure({
  id,
  title,
  spec,
  steps,
  minWidth = 720,
  children,
}: {
  id: string;
  title: string;
  spec: DiagramSpec;
  steps?: Step[];
  /** Below this width the diagram scrolls sideways instead of shrinking past readable. */
  minWidth?: number;
  children?: ReactNode;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(true);
  const [busy, setBusy] = useState(false);
  const slug = `placia-${id}`;
  const tones = [
    ...new Set<Tone>([
      ...spec.nodes.filter((n) => n.shape !== 'group').map((n) => n.tone ?? 'app'),
      ...spec.edges.map((e) => e.tone ?? 'ext'),
    ]),
  ];

  // People who asked for less motion get a still diagram (they can still press play).
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) setPlaying(false);
  }, []);
  useEffect(() => {
    const svg = box.current?.querySelector('svg');
    if (!svg) return;
    if (playing) svg.unpauseAnimations();
    else svg.pauseAnimations();
  }, [playing]);

  const svgEl = () => box.current?.querySelector('svg') as SVGSVGElement | null;
  const downloadSvg = () => {
    const el = svgEl();
    if (!el) return;
    const out = exportable(el, title, false);
    save(new Blob([out.svg], { type: 'image/svg+xml' }), `${slug}.svg`);
  };
  const downloadPng = async () => {
    const el = svgEl();
    if (!el) return;
    setBusy(true);
    try {
      const out = exportable(el, title, true);
      save(await toPng(out.svg, out.width, out.height, out.bg), `${slug}.png`);
    } finally {
      setBusy(false);
    }
  };

  const btn =
    'inline-flex h-8 items-center gap-1.5 rounded-md border bg-surface px-2.5 font-medium text-xs hover:bg-surface-2 disabled:opacity-60';

  return (
    <figure className="break-inside-avoid-page overflow-hidden rounded-lg border bg-surface shadow-card">
      <figcaption className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <span className="font-semibold text-sm">{title}</span>
        <span className="flex gap-1.5 print:hidden">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className={btn}
            aria-label={playing ? 'Pause animation' : 'Play animation'}
          >
            {playing ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
            {playing ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={downloadSvg}
            className={btn}
            title="Animated, sharp at any size"
          >
            <Download className="size-3.5" /> SVG
          </button>
          <button
            type="button"
            onClick={downloadPng}
            disabled={busy}
            className={btn}
            title="Picture, for chats and slides"
          >
            <ImageIcon className="size-3.5" /> PNG
          </button>
        </span>
      </figcaption>

      <div ref={box} className="overflow-x-auto px-2 py-4 sm:px-4">
        <div style={{ minWidth }}>
          <Diagram spec={spec} title={title} id={id} />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t px-4 py-2.5 text-muted-foreground text-xs">
        {tones.map((t) => (
          <span key={t} className="inline-flex items-center gap-1.5">
            <span className="size-2.5 rounded-full" style={{ background: TONE[t] }} />
            {TONE_LABEL[t]}
          </span>
        ))}
      </div>

      {steps?.length ? (
        <ol className="grid gap-3 border-t px-4 py-4 sm:grid-cols-2">
          {steps.map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-full bg-primary-soft font-semibold text-primary-soft-foreground text-xs tabular-nums',
                )}
              >
                {i + 1}
              </span>
              <div className="min-w-0 text-sm">
                <p className="font-medium">{s.title}</p>
                <div className="mt-0.5 text-muted-foreground leading-relaxed">{s.text}</div>
              </div>
            </li>
          ))}
        </ol>
      ) : null}
      {children}
    </figure>
  );
}
