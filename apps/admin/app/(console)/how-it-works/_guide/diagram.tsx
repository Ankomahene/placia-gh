/**
 * A tiny diagram language: boxes and arrows as data, drawn as one SVG.
 * Changing a flow means editing the lists in figures.tsx, not drawing.
 *
 * Arrows run from a side of one box to a side of another, through optional bend points,
 * and `flow` sends dots along them (SVG <animateMotion>, so the downloaded SVG moves too).
 */

import type { LucideIcon } from 'lucide-react';

export type Tone = 'app' | 'ai' | 'rules' | 'data' | 'person' | 'ext' | 'fail' | 'ok';
export type Side = 't' | 'r' | 'b' | 'l';

export interface DNode {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  /** Second line(s), smaller. "\n" splits lines. */
  sub?: string;
  tone?: Tone;
  shape?: 'box' | 'diamond' | 'pill' | 'group';
  /** A step number shown in a badge. */
  step?: number;
  /** A picture of what the box is (search, database, AI…), drawn in its colour. */
  icon?: LucideIcon;
}

export interface DEdge {
  from: string;
  to: string;
  fs?: Side;
  ts?: Side;
  /** Bend points between the two ends. */
  via?: [number, number][];
  /** Slide the start / end along its side, in px (to keep arrows apart). */
  fromShift?: number;
  toShift?: number;
  label?: string;
  /** Where along the path the label sits, 0..1 (default middle). */
  labelAt?: number;
  dashed?: boolean;
  flow?: boolean;
  /** Seconds for one dot to travel the arrow. */
  speed?: number;
  delay?: number;
  tone?: Tone;
}

export interface DiagramSpec {
  width: number;
  height: number;
  nodes: DNode[];
  edges: DEdge[];
  /** Free text labels (lane titles and the like). */
  notes?: { x: number; y: number; text: string; anchor?: 'start' | 'middle' | 'end' }[];
}

/** Stroke colour per tone. --g-* are defined on the guide page for light and dark. */
export const TONE: Record<Tone, string> = {
  app: 'var(--color-primary)',
  ai: 'var(--g-ai)',
  rules: 'var(--g-rules)',
  data: 'var(--g-data)',
  person: 'var(--color-foreground)',
  ext: 'var(--color-muted-foreground)',
  fail: 'var(--color-danger)',
  ok: 'var(--color-success)',
};

export const TONE_LABEL: Record<Tone, string> = {
  app: 'Our apps',
  ai: 'AI',
  rules: 'Rules',
  data: 'Database',
  person: 'People',
  ext: 'Outside service',
  fail: 'Fallback / failure',
  ok: 'Success',
};

const soft = (tone: Tone) => `color-mix(in oklch, ${TONE[tone]} 12%, var(--color-surface))`;

function anchor(n: DNode, side: Side, shift = 0): [number, number] {
  if (side === 't') return [n.x + n.w / 2 + shift, n.y];
  if (side === 'b') return [n.x + n.w / 2 + shift, n.y + n.h];
  if (side === 'l') return [n.x, n.y + n.h / 2 + shift];
  return [n.x + n.w, n.y + n.h / 2 + shift];
}

/** Pick sensible sides when an edge doesn't say. */
function sides(a: DNode, b: DNode): [Side, Side] {
  const dx = b.x + b.w / 2 - (a.x + a.w / 2);
  const dy = b.y + b.h / 2 - (a.y + a.h / 2);
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? ['r', 'l'] : ['l', 'r'];
  return dy >= 0 ? ['b', 't'] : ['t', 'b'];
}

export function edgePoints(spec: DiagramSpec, e: DEdge): [number, number][] {
  const a = spec.nodes.find((n) => n.id === e.from);
  const b = spec.nodes.find((n) => n.id === e.to);
  if (!a || !b) return [];
  const [fs, ts] = e.fs && e.ts ? [e.fs, e.ts] : sides(a, b);
  const p0 = anchor(a, e.fs ?? fs, e.fromShift);
  const p1 = anchor(b, e.ts ?? ts, e.toShift);
  if (e.via) return [p0, ...e.via, p1];
  // Straight when lined up, else one elbow (horizontal first for side exits, vertical for top/bottom).
  if (Math.abs(p0[0] - p1[0]) < 1 || Math.abs(p0[1] - p1[1]) < 1) return [p0, p1];
  const horizontal = (e.fs ?? fs) === 'l' || (e.fs ?? fs) === 'r';
  if (horizontal) {
    const mx = (p0[0] + p1[0]) / 2;
    return [p0, [mx, p0[1]], [mx, p1[1]], p1];
  }
  const my = (p0[1] + p1[1]) / 2;
  return [p0, [p0[0], my], [p1[0], my], p1];
}

/** Rounded corners at each bend, so arrows read as one smooth line. */
function toPath(pts: [number, number][], r = 10) {
  if (pts.length < 2) return '';
  let d = `M${pts[0]?.[0]},${pts[0]?.[1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [px, py] = pts[i - 1] as [number, number];
    const [x, y] = pts[i] as [number, number];
    const [nx, ny] = pts[i + 1] as [number, number];
    const d1 = Math.hypot(x - px, y - py);
    const d2 = Math.hypot(nx - x, ny - y);
    const rr = Math.min(r, d1 / 2, d2 / 2);
    const ax = x - ((x - px) / d1) * rr;
    const ay = y - ((y - py) / d1) * rr;
    const bx = x + ((nx - x) / d2) * rr;
    const by = y + ((ny - y) / d2) * rr;
    d += ` L${ax},${ay} Q${x},${y} ${bx},${by}`;
  }
  const last = pts[pts.length - 1] as [number, number];
  return `${d} L${last[0]},${last[1]}`;
}

function pointAt(pts: [number, number][], t: number): [number, number] {
  const segs = pts.slice(1).map((p, i) => {
    const a = pts[i] as [number, number];
    return { a, b: p, len: Math.hypot(p[0] - a[0], p[1] - a[1]) };
  });
  const total = segs.reduce((s, x) => s + x.len, 0);
  let left = total * t;
  for (const s of segs) {
    if (left <= s.len) {
      const k = s.len ? left / s.len : 0;
      return [s.a[0] + (s.b[0] - s.a[0]) * k, s.a[1] + (s.b[1] - s.a[1]) * k];
    }
    left -= s.len;
  }
  return pts[pts.length - 1] as [number, number];
}

function Lines({
  text,
  x,
  y,
  size,
  color,
  weight,
  lh,
}: {
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  weight?: number;
  lh: number;
}) {
  const lines = text.split('\n');
  return (
    <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor="middle">
      {lines.map((l, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: fixed lines of a static label
        <tspan key={`${i}-${l}`} x={x} dy={i === 0 ? 0 : lh}>
          {l}
        </tspan>
      ))}
    </text>
  );
}

function Node({ n }: { n: DNode }) {
  const tone = n.tone ?? 'app';
  const cx = n.x + n.w / 2;
  const subLines = n.sub ? n.sub.split('\n').length : 0;
  const titleLines = n.title.split('\n').length;
  const diamond = n.shape === 'diamond';
  const Icon = n.icon;
  // Boxes: the icon sits on the left and the text centres in the rest. Diamonds: icon on top.
  const side = !!Icon && !diamond;
  const tx = side ? n.x + 50 + (n.w - 58) / 2 : cx;
  const lift = Icon && diamond ? 11 : 0;
  const block = 17 * titleLines + subLines * 15;
  const top = n.y + n.h / 2 - block / 2 + 13 + lift;
  const midY = n.y + n.h / 2;

  if (n.shape === 'group') {
    return (
      <g>
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={16}
          fill={`color-mix(in oklch, ${TONE[tone]} 5%, transparent)`}
          stroke={TONE[tone]}
          strokeOpacity={0.45}
          strokeDasharray="5 5"
        />
        <text x={n.x + 14} y={n.y + 22} fontSize={13} fontWeight={600} fill={TONE[tone]}>
          {n.title}
        </text>
      </g>
    );
  }

  return (
    <g>
      {n.shape === 'diamond' ? (
        <polygon
          points={`${cx},${n.y} ${n.x + n.w},${n.y + n.h / 2} ${cx},${n.y + n.h} ${n.x},${n.y + n.h / 2}`}
          fill={soft(tone)}
          stroke={TONE[tone]}
          strokeWidth={1.75}
        />
      ) : (
        <rect
          x={n.x}
          y={n.y}
          width={n.w}
          height={n.h}
          rx={n.shape === 'pill' ? n.h / 2 : 12}
          fill={soft(tone)}
          stroke={TONE[tone]}
          strokeWidth={1.75}
        />
      )}
      {Icon && side ? (
        <g>
          <circle
            cx={n.x + 27}
            cy={midY}
            r={18}
            fill="var(--color-surface)"
            stroke={TONE[tone]}
            strokeOpacity={0.35}
          />
          <Icon
            x={n.x + 17}
            y={midY - 10}
            width={20}
            height={20}
            color={TONE[tone]}
            strokeWidth={2}
          />
        </g>
      ) : null}
      {Icon && diamond ? (
        <Icon x={cx - 9} y={top - 34} width={18} height={18} color={TONE[tone]} strokeWidth={2} />
      ) : null}
      <Lines
        text={n.title}
        x={tx}
        y={top}
        size={15}
        weight={650}
        color="var(--color-foreground)"
        lh={17}
      />
      {n.sub ? (
        <Lines
          text={n.sub}
          x={tx}
          y={top + 18 + (titleLines - 1) * 17}
          size={12.5}
          color="var(--color-muted-foreground)"
          lh={15}
        />
      ) : null}
      {n.step ? (
        <g>
          <circle cx={n.x + 2} cy={n.y + 2} r={12} fill={TONE[tone]} />
          <text
            x={n.x + 2}
            y={n.y + 6.5}
            fontSize={12}
            fontWeight={700}
            textAnchor="middle"
            fill="var(--color-surface)"
          >
            {n.step}
          </text>
        </g>
      ) : null}
    </g>
  );
}

export function Diagram({ spec, title, id }: { spec: DiagramSpec; title: string; id: string }) {
  const tones = [...new Set(spec.edges.map((e) => e.tone ?? 'ext'))];
  return (
    <svg
      viewBox={`0 0 ${spec.width} ${spec.height}`}
      role="img"
      aria-label={title}
      className="h-auto w-full"
      fontFamily="var(--font-sans)"
      data-diagram={id}
    >
      <title>{title}</title>
      <defs>
        {tones.map((t) => (
          <marker
            key={t}
            id={`${id}-arrow-${t}`}
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={TONE[t]} />
          </marker>
        ))}
      </defs>

      {/* Groups first, so boxes and arrows sit on top. */}
      {spec.nodes
        .filter((n) => n.shape === 'group')
        .map((n) => (
          <Node key={n.id} n={n} />
        ))}

      {spec.edges.map((e, i) => {
        const pts = edgePoints(spec, e);
        const d = toPath(pts);
        const tone = e.tone ?? 'ext';
        const key = `${e.from}-${e.to}-${i}`;
        return (
          <g key={key}>
            <path
              d={d}
              fill="none"
              stroke={TONE[tone]}
              strokeWidth={1.75}
              strokeOpacity={0.85}
              strokeDasharray={e.dashed ? '6 5' : undefined}
              markerEnd={`url(#${id}-arrow-${tone})`}
            />
            {e.flow ? (
              <circle r={4.5} fill={TONE[tone]} className="flow-dot" opacity={0}>
                <animateMotion
                  dur={`${e.speed ?? 2.4}s`}
                  begin={`${e.delay ?? 0}s`}
                  repeatCount="indefinite"
                  path={d}
                />
                <animate
                  attributeName="opacity"
                  values="0;1;1;0"
                  keyTimes="0;0.1;0.85;1"
                  dur={`${e.speed ?? 2.4}s`}
                  begin={`${e.delay ?? 0}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ) : null}
          </g>
        );
      })}

      {spec.edges.map((e, i) => {
        if (!e.label) return null;
        const [x, y] = pointAt(edgePoints(spec, e), e.labelAt ?? 0.5);
        const w = e.label.length * 6.6 + 14;
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a static spec; two edges may join the same boxes
          <g key={`label-${e.from}-${e.to}-${i}`}>
            <rect
              x={x - w / 2}
              y={y - 10}
              width={w}
              height={20}
              rx={10}
              fill="var(--color-surface)"
              stroke={TONE[e.tone ?? 'ext']}
              strokeOpacity={0.5}
            />
            <text
              x={x}
              y={y + 4}
              fontSize={11.5}
              fontWeight={600}
              textAnchor="middle"
              fill={TONE[e.tone ?? 'ext']}
            >
              {e.label}
            </text>
          </g>
        );
      })}

      {spec.nodes
        .filter((n) => n.shape !== 'group')
        .map((n) => (
          <Node key={n.id} n={n} />
        ))}

      {spec.notes?.map((t) => (
        <text
          key={`${t.x}-${t.y}-${t.text}`}
          x={t.x}
          y={t.y}
          fontSize={12.5}
          fontWeight={600}
          textAnchor={t.anchor ?? 'start'}
          fill="var(--color-muted-foreground)"
        >
          {t.text}
        </text>
      ))}
    </svg>
  );
}
