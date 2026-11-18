'use client';

/**
 * Every flow on the guide, as data. To change a flow: move or rename boxes (x, y, w, h are in
 * the diagram's own units), add or remove arrows, update its steps below.
 */

import {
  AudioLines,
  Binary,
  Bot,
  BrainCircuit,
  Camera,
  ChartNoAxesCombined,
  CircleCheck,
  CircleX,
  Cloud,
  Combine,
  Copy,
  Crosshair,
  Database,
  FileSearch,
  FlaskConical,
  Gauge,
  GitMerge,
  Globe,
  HardDriveDownload,
  Inbox,
  Languages,
  Layers,
  LayoutDashboard,
  Library,
  ListChecks,
  ListOrdered,
  Mail,
  Map as MapIcon,
  MapPin,
  Mic,
  Navigation,
  Network,
  Pencil,
  Scale,
  ScanSearch,
  ScrollText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  SpellCheck,
  Tags,
  Target,
  Timer,
  Trash2,
  Type,
  UserCog,
  Users,
  WandSparkles,
  Wrench,
} from 'lucide-react';
import type { DiagramSpec } from './diagram';
import { Figure, type Step } from './figure';

const C = ({ children }: { children: string }) => (
  <code className="rounded bg-surface-2 px-1 py-0.5 text-[0.85em] text-foreground">{children}</code>
);

/* 1 ─────────────────────────────────────────────────────────────── The big picture */

const bigPicture: DiagramSpec = {
  width: 1000,
  height: 560,
  nodes: [
    {
      id: 'people',
      x: 20,
      y: 70,
      w: 175,
      h: 70,
      title: 'People',
      sub: 'phone or computer',
      tone: 'person',
      icon: Smartphone,
    },
    {
      id: 'you',
      x: 20,
      y: 375,
      w: 175,
      h: 70,
      title: 'You',
      sub: 'admin',
      tone: 'person',
      icon: UserCog,
    },
    {
      id: 'web',
      x: 250,
      y: 55,
      w: 230,
      h: 100,
      title: 'Web app',
      sub: 'placiagh.up.railway.app\nNext.js on Railway',
      tone: 'app',
      icon: Globe,
    },
    {
      id: 'admin',
      x: 250,
      y: 360,
      w: 230,
      h: 100,
      title: 'Admin app',
      sub: 'this site\nNext.js on Railway',
      tone: 'app',
      icon: LayoutDashboard,
    },
    {
      id: 'db',
      x: 540,
      y: 185,
      w: 230,
      h: 175,
      title: 'Supabase',
      sub: 'Postgres database\nPostGIS · pgvector · pg_trgm\nsign-in (Auth)\nbackup photo storage',
      tone: 'data',
      icon: Database,
    },
    {
      id: 'openai',
      x: 815,
      y: 20,
      w: 175,
      h: 80,
      title: 'OpenAI',
      sub: 'understands queries\nmeaning · voice · Ask',
      tone: 'ai',
      icon: Sparkles,
    },
    {
      id: 'claude',
      x: 815,
      y: 120,
      w: 175,
      h: 80,
      title: 'Claude',
      sub: 'backup parser\nsearch reviews',
      tone: 'ai',
      icon: BrainCircuit,
    },
    {
      id: 'cloud',
      x: 815,
      y: 225,
      w: 175,
      h: 70,
      title: 'Cloudinary',
      sub: 'photos (main)',
      tone: 'ext',
      icon: Cloud,
    },
    {
      id: 'mail',
      x: 815,
      y: 315,
      w: 175,
      h: 60,
      title: 'Resend',
      sub: 'sign-in emails',
      tone: 'ext',
      icon: Mail,
    },
    {
      id: 'import',
      x: 540,
      y: 455,
      w: 230,
      h: 80,
      title: 'Data import',
      sub: 'pnpm ingest on the laptop\nDuckDB',
      tone: 'data',
      icon: HardDriveDownload,
    },
    {
      id: 'open',
      x: 815,
      y: 455,
      w: 175,
      h: 80,
      title: 'Open data',
      sub: 'OSM · Overture\nFoursquare · borders',
      tone: 'ext',
      icon: MapIcon,
    },
    {
      id: 'alive',
      x: 250,
      y: 480,
      w: 230,
      h: 60,
      title: 'Keep-alive',
      sub: 'pings Supabase every 2 days',
      tone: 'ext',
      icon: Timer,
    },
  ],
  edges: [
    { from: 'people', to: 'web', tone: 'app', flow: true, label: 'search' },
    {
      from: 'web',
      to: 'db',
      fs: 'b',
      ts: 'l',
      via: [[365, 275]],
      tone: 'data',
      flow: true,
      delay: 0.6,
      label: 'search_places()',
    },
    {
      from: 'web',
      to: 'openai',
      fs: 'r',
      ts: 'l',
      fromShift: -25,
      tone: 'ai',
      flow: true,
      delay: 0.3,
    },
    {
      from: 'web',
      to: 'claude',
      fs: 'r',
      ts: 'l',
      fromShift: 25,
      tone: 'fail',
      dashed: true,
      label: 'if OpenAI fails',
      labelAt: 0.75,
    },
    {
      from: 'web',
      to: 'cloud',
      fs: 't',
      ts: 'l',
      via: [
        [365, 12],
        [795, 12],
        [795, 260],
      ],
      tone: 'ext',
      label: 'photos',
      labelAt: 0.35,
    },
    { from: 'you', to: 'admin', tone: 'app', flow: true, delay: 1 },
    {
      from: 'admin',
      to: 'db',
      fs: 'r',
      ts: 'b',
      toShift: -50,
      via: [[600, 410]],
      tone: 'data',
      flow: true,
      delay: 1.4,
    },
    {
      from: 'admin',
      to: 'mail',
      fs: 'r',
      ts: 'l',
      fromShift: -25,
      via: [
        [795, 385],
        [795, 345],
      ],
      tone: 'ext',
    },
    { from: 'open', to: 'import', fs: 'l', ts: 'r', tone: 'data', flow: true, delay: 0.2 },
    {
      from: 'import',
      to: 'db',
      fs: 't',
      ts: 'b',
      fromShift: 40,
      toShift: 40,
      tone: 'data',
      flow: true,
      delay: 1.2,
      label: 'load',
    },
    {
      from: 'alive',
      to: 'db',
      fs: 'r',
      ts: 'l',
      toShift: 60,
      via: [
        [510, 510],
        [510, 335],
      ],
      tone: 'ext',
      dashed: true,
    },
  ],
};

const bigPictureSteps: Step[] = [
  {
    title: 'Two apps',
    text: 'The public web app and this admin app. Both run on Railway and share the same code packages.',
  },
  {
    title: 'One database',
    text: 'Supabase (Postgres) holds every place, photo record, contribution and search log. Search ranking runs inside it.',
  },
  {
    title: 'AI as a helper',
    text: 'OpenAI understands hard queries, turns text into meaning vectors, transcribes voice and powers Ask. Claude is the backup and writes search reviews.',
  },
  {
    title: 'Photos',
    text: 'Uploaded straight from the browser to Cloudinary (resized on the fly). If that fails, Supabase Storage.',
  },
  {
    title: 'The data',
    text: 'Built on the laptop from open data with pnpm ingest, then loaded into Supabase.',
  },
  {
    title: 'Always on',
    text: 'A tiny Railway job pings the database every 2 days so the free plan never pauses it.',
  },
];

/* 2 ─────────────────────────────────────────────────────────────── One search */

const oneSearch: DiagramSpec = {
  width: 1060,
  height: 470,
  nodes: [
    {
      id: 'q',
      x: 20,
      y: 150,
      w: 150,
      h: 76,
      title: 'Query',
      sub: 'typed or spoken',
      tone: 'person',
      shape: 'pill',
      icon: Search,
    },
    {
      id: 'clean',
      x: 200,
      y: 150,
      w: 165,
      h: 76,
      title: 'Clean up',
      sub: 'case · spacing\nk.n.u.s.t → knust',
      tone: 'app',
      step: 1,
      icon: WandSparkles,
    },
    {
      id: 'rules',
      x: 395,
      y: 145,
      w: 190,
      h: 86,
      title: 'Rule parse',
      sub: '~0.1 ms, offline\nwords · towns · initials',
      tone: 'rules',
      step: 2,
      icon: ListChecks,
    },
    {
      id: 'sure',
      x: 615,
      y: 133,
      w: 140,
      h: 110,
      title: 'Sure?',
      tone: 'rules',
      shape: 'diamond',
      icon: Scale,
    },
    {
      id: 'ai',
      x: 790,
      y: 20,
      w: 200,
      h: 84,
      title: 'AI parse',
      sub: 'gpt-6-luna → Claude\n≤ 2.5 s, then checked',
      tone: 'ai',
      step: 3,
      icon: Sparkles,
    },
    {
      id: 'intent',
      x: 800,
      y: 148,
      w: 180,
      h: 80,
      title: 'Intent',
      sub: 'what · where · near me\nopen now · cheap',
      tone: 'app',
      icon: Target,
    },
    {
      id: 'embed',
      x: 395,
      y: 20,
      w: 190,
      h: 84,
      title: 'Embed query',
      sub: '512-number meaning\n≤ 1.2 s, in parallel',
      tone: 'ai',
      icon: Binary,
    },
    {
      id: 'resolve',
      x: 20,
      y: 320,
      w: 185,
      h: 90,
      title: 'Find the place',
      sub: 'town · landmark\ninitials → name',
      tone: 'rules',
      step: 4,
      icon: MapPin,
    },
    {
      id: 'arms',
      x: 240,
      y: 312,
      w: 200,
      h: 106,
      title: 'search_places()',
      sub: '7 arms look for\nmatches in one\ndatabase call',
      tone: 'data',
      step: 5,
      icon: Layers,
    },
    {
      id: 'fuse',
      x: 475,
      y: 320,
      w: 185,
      h: 90,
      title: 'Fuse & rank',
      sub: 'RRF + nearness\n× confidence',
      tone: 'data',
      step: 6,
      icon: GitMerge,
    },
    {
      id: 'results',
      x: 695,
      y: 320,
      w: 175,
      h: 90,
      title: 'Results',
      sub: '+ meta: why each\nwas found',
      tone: 'app',
      step: 7,
      icon: ListOrdered,
    },
    {
      id: 'log',
      x: 900,
      y: 320,
      w: 145,
      h: 90,
      title: 'Logged',
      sub: 'search_events',
      tone: 'ext',
      step: 8,
      icon: ScrollText,
    },
  ],
  edges: [
    { from: 'q', to: 'clean', tone: 'app', flow: true },
    { from: 'clean', to: 'rules', tone: 'app', flow: true, delay: 0.3 },
    { from: 'rules', to: 'sure', tone: 'rules', flow: true, delay: 0.6 },
    {
      from: 'sure',
      to: 'intent',
      fs: 'r',
      ts: 'l',
      tone: 'rules',
      flow: true,
      delay: 0.9,
      label: 'yes',
    },
    {
      from: 'sure',
      to: 'ai',
      fs: 't',
      ts: 'l',
      via: [[685, 62]],
      tone: 'ai',
      label: 'no',
      labelAt: 0.3,
    },
    { from: 'ai', to: 'intent', fs: 'b', ts: 't', tone: 'ai', label: 'checked' },
    {
      from: 'ai',
      to: 'intent',
      fs: 'r',
      ts: 'r',
      via: [
        [1020, 62],
        [1020, 188],
      ],
      tone: 'fail',
      dashed: true,
      label: 'late → rules',
      labelAt: 0.5,
    },
    { from: 'rules', to: 'embed', fs: 't', ts: 'b', tone: 'ai', dashed: true, label: 'same time' },
    {
      from: 'intent',
      to: 'resolve',
      fs: 'b',
      ts: 't',
      via: [
        [890, 275],
        [112, 275],
      ],
      tone: 'app',
      flow: true,
      delay: 1.2,
      speed: 3,
    },
    { from: 'resolve', to: 'arms', tone: 'data', flow: true, delay: 1.6 },
    { from: 'arms', to: 'fuse', tone: 'data', flow: true, delay: 1.9 },
    { from: 'fuse', to: 'results', tone: 'data', flow: true, delay: 2.2 },
    { from: 'results', to: 'log', tone: 'ext', dashed: true },
    {
      from: 'fuse',
      to: 'arms',
      fs: 'b',
      ts: 'b',
      via: [
        [567, 450],
        [340, 450],
      ],
      tone: 'rules',
      dashed: true,
      label: 'under 3? widen ×3',
    },
  ],
};

const oneSearchSteps: Step[] = [
  { title: 'Clean up', text: 'Lower-case, tidy spaces, join dotted initials (K.N.U.S.T → knust).' },
  {
    title: 'Rule parse',
    text: 'Our own rules read the query in about 0.1 ms: kinds of place from local words, towns from the 11.5k gazetteer, landmarks, initials, "near me", "open now", "cheap".',
  },
  {
    title: 'AI parse (only if unsure)',
    text: (
      <>
        Hard queries go to the AI with a 2.5 s budget. Its answer is checked against real categories
        and towns. Too slow or failed? The rule parse is used. Meanwhile the query is turned into a
        meaning vector (≤ 1.2 s).
      </>
    ),
  },
  {
    title: 'Find the place',
    text: "Work out where: a town (and which one, if several share the name), a landmark to search around, or the person's position.",
  },
  {
    title: 'Seven arms search',
    text: (
      <>
        One database call, <C>search_places()</C>, runs 7 ways of matching at once (see “Seven arms,
        one ranking”).
      </>
    ),
  },
  {
    title: 'Fuse and rank',
    text: "Votes from all arms are added up (RRF), nearness counts as one more vote, and each place's confidence scales its score. Fewer than 3 results? The circle widens ×3 and it runs again.",
  },
  {
    title: 'Results + meta',
    text: 'Places come back with an explanation: which parser ran and why, the area, anchor, weights and timings.',
  },
  {
    title: 'Logged',
    text: 'After the reply is sent, the search is saved to search_events (no user id, location rounded to ~1 km) for Search insights.',
  },
];

/* 3 ─────────────────────────────────────────────────────────────── Rules or AI */

const rulesOrAi: DiagramSpec = {
  width: 1100,
  height: 380,
  nodes: [
    {
      id: 'rules',
      x: 20,
      y: 150,
      w: 180,
      h: 80,
      title: 'Rule parse',
      sub: 'always runs first',
      tone: 'rules',
      icon: ListChecks,
    },
    {
      id: 'checks',
      x: 235,
      y: 15,
      w: 370,
      h: 350,
      title: 'Rules unsure if any of these:',
      tone: 'ai',
      shape: 'group',
    },
    {
      id: 'c1',
      x: 255,
      y: 50,
      w: 330,
      h: 62,
      title: 'Phrased as a request',
      sub: '“where can i…”, “i need…”',
      tone: 'ai',
      icon: Languages,
    },
    {
      id: 'c2',
      x: 255,
      y: 125,
      w: 330,
      h: 62,
      title: 'Too vague',
      sub: 'a broad word → more than 3 kinds',
      tone: 'ai',
      icon: ScanSearch,
    },
    {
      id: 'c3',
      x: 255,
      y: 200,
      w: 330,
      h: 62,
      title: 'Contradicts itself',
      sub: '“near me” plus a named town',
      tone: 'ai',
      icon: Crosshair,
    },
    {
      id: 'c4',
      x: 255,
      y: 275,
      w: 330,
      h: 62,
      title: '4+ unknown words',
      sub: 'long descriptions',
      tone: 'ai',
      icon: Type,
    },
    {
      id: 'ai',
      x: 650,
      y: 40,
      w: 210,
      h: 96,
      title: 'Ask the AI',
      sub: 'gpt-6-luna → Claude\n2.5 s budget',
      tone: 'ai',
      icon: Bot,
    },
    {
      id: 'use',
      x: 650,
      y: 245,
      w: 210,
      h: 80,
      title: 'Use the rules',
      sub: 'most searches\ninstant, free',
      tone: 'rules',
      icon: Gauge,
    },
    {
      id: 'guard',
      x: 895,
      y: 40,
      w: 190,
      h: 96,
      title: 'Checked',
      sub: 'real categories only\ntowns must exist',
      tone: 'ok',
      icon: ShieldCheck,
    },
    {
      id: 'intent',
      x: 895,
      y: 245,
      w: 190,
      h: 80,
      title: 'Intent',
      sub: 'goes to search',
      tone: 'app',
      icon: Target,
    },
  ],
  edges: [
    { from: 'rules', to: 'checks', fs: 'r', ts: 'l', tone: 'rules', flow: true },
    {
      from: 'checks',
      to: 'ai',
      fs: 'r',
      ts: 'l',
      fromShift: -87,
      toShift: 0,
      via: [[625, 88]],
      tone: 'ai',
      flow: true,
      delay: 0.5,
      label: 'yes',
    },
    {
      from: 'checks',
      to: 'use',
      fs: 'r',
      ts: 'l',
      fromShift: 95,
      via: [[625, 285]],
      tone: 'rules',
      flow: true,
      delay: 0.5,
      label: 'no',
    },
    { from: 'ai', to: 'guard', tone: 'ai', flow: true, delay: 1 },
    { from: 'guard', to: 'intent', fs: 'b', ts: 't', tone: 'ok', flow: true, delay: 1.4 },
    { from: 'use', to: 'intent', tone: 'rules', flow: true, delay: 1 },
    {
      from: 'ai',
      to: 'use',
      fs: 'b',
      ts: 't',
      tone: 'fail',
      dashed: true,
      label: 'late · error · breaker open',
    },
  ],
};

const rulesOrAiSteps: Step[] = [
  {
    title: 'Rules first, always',
    text: 'They are instant, free and know Ghanaian words, towns and initials. On short searches ("pharmacy osu", "kbth") they are as good as AI or better.',
  },
  {
    title: 'AI only when it helps',
    text: 'Requests, vague or self-contradicting searches, and long descriptions. The reason is recorded in meta.parse.aiReason.',
  },
  {
    title: 'Nothing unchecked',
    text: 'The AI must answer in a fixed form. Categories must be real ones and towns must exist in our gazetteer, or they are dropped.',
  },
  {
    title: 'Never stuck',
    text: 'Too slow (2.5 s), an error, or a provider that failed 3 times in a row (circuit breaker, 1 minute): the rule parse answers.',
  },
];

/* 4 ─────────────────────────────────────────────────────────────── Seven arms */

const ARM_Y = [20, 86, 152, 218, 284, 350, 416];
const arms = [
  { id: 'title', title: 'Title', sub: 'every word in the name', icon: Type, tone: 'data' as const },
  {
    id: 'fts',
    title: 'Full text',
    sub: 'name › kind › area › address',
    icon: FileSearch,
    tone: 'data' as const,
  },
  {
    id: 'fuzzy',
    title: 'Fuzzy name',
    sub: 'typos: “acra mall”',
    icon: SpellCheck,
    tone: 'data' as const,
  },
  {
    id: 'cat',
    title: 'Category',
    sub: 'the kinds asked for, nearest',
    icon: Tags,
    tone: 'data' as const,
  },
  {
    id: 'sem',
    title: 'Meaning',
    sub: 'closest meaning (vectors)',
    icon: Sparkles,
    tone: 'ai' as const,
  },
  {
    id: 'near',
    title: 'Near',
    sub: 'closest, when nothing else',
    icon: Navigation,
    tone: 'data' as const,
  },
  {
    id: 'alias',
    title: 'Initials',
    sub: '“kbth” → Korle Bu…',
    icon: Library,
    tone: 'data' as const,
  },
];

const sevenArms: DiagramSpec = {
  width: 1000,
  height: 480,
  nodes: [
    {
      id: 'intent',
      x: 20,
      y: 205,
      w: 160,
      h: 90,
      title: 'Intent',
      sub: '+ meaning vector',
      tone: 'app',
      icon: Target,
    },
    ...arms.map((a, i) => ({
      id: a.id,
      x: 240,
      y: ARM_Y[i] as number,
      w: 270,
      h: 52,
      title: a.title,
      sub: a.sub,
      tone: a.tone,
      icon: a.icon,
    })),
    {
      id: 'fuse',
      x: 575,
      y: 180,
      w: 200,
      h: 140,
      title: 'RRF fusion',
      sub: 'Σ weight ÷ (60 + rank)\n+ nearness vote\n× confidence',
      tone: 'data',
      icon: Combine,
    },
    {
      id: 'list',
      x: 815,
      y: 195,
      w: 170,
      h: 110,
      title: 'Ranked list',
      sub: 'top 20, each with\nthe arms that\nfound it',
      tone: 'app',
      icon: ListOrdered,
    },
    {
      id: 'weights',
      x: 575,
      y: 355,
      w: 200,
      h: 110,
      title: 'Weights adapt',
      sub: '“near me” → nearness ↑\nkind only → meaning off\ninitials → names ½',
      tone: 'rules',
      icon: SlidersHorizontal,
    },
  ],
  edges: [
    ...arms.map((a, i) => ({
      from: 'intent',
      to: a.id,
      fs: 'r' as const,
      ts: 'l' as const,
      tone: 'app' as const,
      flow: i % 2 === 0,
      delay: i * 0.2,
    })),
    ...arms.map((a, i) => ({
      from: a.id,
      to: 'fuse',
      fs: 'r' as const,
      ts: 'l' as const,
      tone: a.tone,
      flow: true,
      delay: 0.8 + i * 0.15,
    })),
    { from: 'fuse', to: 'list', tone: 'data' as const, flow: true, delay: 2 },
    {
      from: 'weights',
      to: 'fuse',
      fs: 't' as const,
      ts: 'b' as const,
      tone: 'rules' as const,
      dashed: true,
    },
  ],
};

const sevenArmsSteps: Step[] = [
  {
    title: 'Seven arms, at once',
    text: 'Each arm makes its own ranked list of candidates within the search area. Different arms catch different kinds of query.',
  },
  {
    title: 'Why so many',
    text: 'Title and full text find exact names; fuzzy finds typos; category finds pharmacies not named "pharmacy"; meaning finds descriptions; initials find "kbth"; near covers "what\'s around me".',
  },
  {
    title: 'Votes, not scores',
    text: 'Arms score in different units, so we only use positions. Each arm gives a place weight ÷ (60 + its position). Points are added. Being high in several arms wins.',
  },
  {
    title: 'Then nearness and trust',
    text: "Distance from the search centre is one more vote, and the total is multiplied by the place's confidence (more sources agreeing = higher).",
  },
  {
    title: 'Weights adapt',
    text: 'The weights change with the query. Every result carries which arms found it, so any ranking can be explained.',
  },
];

/* 5 ─────────────────────────────────────────────────────────────── Data import */

const dataImport: DiagramSpec = {
  width: 1100,
  height: 470,
  nodes: [
    {
      id: 'osm',
      x: 20,
      y: 25,
      w: 200,
      h: 72,
      title: 'OpenStreetMap',
      sub: '31.7k places · 11.5k towns',
      tone: 'ext',
      icon: MapIcon,
    },
    {
      id: 'ov',
      x: 20,
      y: 115,
      w: 200,
      h: 72,
      title: 'Overture Maps',
      sub: '29.7k places',
      tone: 'ext',
      icon: MapIcon,
    },
    {
      id: 'fsq',
      x: 20,
      y: 205,
      w: 200,
      h: 72,
      title: 'Foursquare',
      sub: '28k records',
      tone: 'ext',
      icon: MapIcon,
    },
    {
      id: 'gb',
      x: 20,
      y: 295,
      w: 200,
      h: 72,
      title: 'geoBoundaries',
      sub: '16 regions · 260 districts',
      tone: 'ext',
      icon: MapIcon,
    },
    {
      id: 'stage',
      x: 255,
      y: 140,
      w: 180,
      h: 112,
      title: 'Stage',
      sub: 'one shape for all\none category list\nclip to Ghana',
      tone: 'data',
      step: 1,
      icon: Wrench,
    },
    {
      id: 'merge',
      x: 470,
      y: 15,
      w: 305,
      h: 380,
      title: '2 · Merge (same place?)',
      tone: 'rules',
      shape: 'group',
    },
    {
      id: 'block',
      x: 490,
      y: 45,
      w: 265,
      h: 56,
      title: 'Blocking',
      sub: '~440 m grid · same phone/site',
      tone: 'rules',
      icon: Network,
    },
    {
      id: 'sim',
      x: 490,
      y: 113,
      w: 265,
      h: 56,
      title: 'Name similarity',
      sub: 'soft TF-IDF + Jaro-Winkler',
      tone: 'rules',
      icon: SpellCheck,
    },
    {
      id: 'rule',
      x: 490,
      y: 181,
      w: 265,
      h: 56,
      title: 'Match rules',
      sub: 'name · phone · web · co-located',
      tone: 'rules',
      icon: ListChecks,
    },
    {
      id: 'clus',
      x: 490,
      y: 249,
      w: 265,
      h: 56,
      title: 'Clustering + guards',
      sub: 'no chains, no bridges',
      tone: 'rules',
      icon: Copy,
    },
    {
      id: 'surv',
      x: 490,
      y: 317,
      w: 265,
      h: 66,
      title: 'Survivorship',
      sub: 'OSM wins name & point\nconfidence from agreement',
      tone: 'rules',
      icon: CircleCheck,
    },
    {
      id: 'load',
      x: 815,
      y: 25,
      w: 190,
      h: 100,
      title: 'Load',
      sub: 'into Supabase\nkeep slugs\nrespect your edits',
      tone: 'data',
      step: 3,
      icon: Database,
    },
    {
      id: 'ment',
      x: 815,
      y: 150,
      w: 190,
      h: 66,
      title: 'Mentions',
      sub: 'same-name towns',
      tone: 'data',
      step: 4,
      icon: MapPin,
    },
    {
      id: 'acr',
      x: 815,
      y: 240,
      w: 190,
      h: 66,
      title: 'Initials',
      sub: '“kbth” pairs',
      tone: 'data',
      step: 5,
      icon: Library,
    },
    {
      id: 'emb',
      x: 815,
      y: 330,
      w: 190,
      h: 66,
      title: 'Embed',
      sub: 'meaning vectors',
      tone: 'ai',
      step: 6,
      icon: Binary,
    },
    {
      id: 'you',
      x: 255,
      y: 300,
      w: 180,
      h: 80,
      title: 'Your decisions',
      sub: 'edits · merges\ndeletes',
      tone: 'person',
      icon: UserCog,
    },
  ],
  edges: [
    { from: 'osm', to: 'stage', fs: 'r', ts: 'l', tone: 'ext', flow: true },
    { from: 'ov', to: 'stage', fs: 'r', ts: 'l', tone: 'ext', flow: true, delay: 0.3 },
    { from: 'fsq', to: 'stage', fs: 'r', ts: 'l', tone: 'ext', flow: true, delay: 0.6 },
    { from: 'gb', to: 'stage', fs: 'r', ts: 'l', tone: 'ext', flow: true, delay: 0.9 },
    {
      from: 'stage',
      to: 'block',
      fs: 'r',
      ts: 'l',
      via: [
        [455, 196],
        [455, 73],
      ],
      tone: 'data',
      flow: true,
      delay: 1,
    },
    { from: 'block', to: 'sim', fs: 'b', ts: 't', tone: 'rules' },
    { from: 'sim', to: 'rule', fs: 'b', ts: 't', tone: 'rules' },
    { from: 'rule', to: 'clus', fs: 'b', ts: 't', tone: 'rules' },
    { from: 'clus', to: 'surv', fs: 'b', ts: 't', tone: 'rules' },
    {
      from: 'surv',
      to: 'load',
      fs: 'r',
      ts: 'l',
      via: [
        [790, 350],
        [790, 75],
      ],
      tone: 'data',
      flow: true,
      delay: 1.6,
    },
    { from: 'load', to: 'ment', fs: 'b', ts: 't', tone: 'data' },
    { from: 'ment', to: 'acr', fs: 'b', ts: 't', tone: 'data' },
    { from: 'acr', to: 'emb', fs: 'b', ts: 't', tone: 'ai' },
    {
      from: 'you',
      to: 'load',
      fs: 'b',
      ts: 'r',
      via: [
        [345, 440],
        [1050, 440],
        [1050, 75],
      ],
      tone: 'person',
      dashed: true,
      label: 'ingest_overrides()',
      labelAt: 0.45,
    },
  ],
};

const dataImportSteps: Step[] = [
  {
    title: 'Stage',
    text: 'Each source is mapped to one shape (name, kind, point, phone, website, hours, address) and one list of 71 kinds of place. Records outside Ghana are clipped.',
  },
  {
    title: 'Merge',
    text: 'The same shop often appears in 2–3 sources. Nearby records are compared by name, phone and website with explainable rules; guards stop chains like Hostel–Hostel–Hostel. 94k records became 61.6k places.',
  },
  {
    title: 'Load',
    text: 'Upserted into Supabase. Web addresses (slugs) are kept forever. Deleted, merged and admin-edited places are left as you set them.',
  },
  {
    title: 'Mentions',
    text: 'Finds town names written in addresses, to tell same-name towns apart (which Atonsu?).',
  },
  {
    title: 'Initials',
    text: 'Learns short forms from names ("kbth" → Korle Bu Teaching Hospital): 2,605 pairs.',
  },
  { title: 'Embed', text: 'Turns new or changed places into meaning vectors for the meaning arm.' },
];

/* 6 ─────────────────────────────────────────────────────────────── Contributions */

const contributions: DiagramSpec = {
  width: 1110,
  height: 390,
  nodes: [
    {
      id: 'p',
      x: 20,
      y: 40,
      w: 165,
      h: 76,
      title: 'Someone',
      sub: 'signed in',
      tone: 'person',
      icon: Users,
    },
    {
      id: 'form',
      x: 220,
      y: 30,
      w: 205,
      h: 96,
      title: 'Contribute',
      sub: 'new place · edit\nreport · photos',
      tone: 'app',
      step: 1,
      icon: Pencil,
    },
    {
      id: 'extract',
      x: 220,
      y: 175,
      w: 205,
      h: 80,
      title: 'AI fills the form',
      sub: 'from a sentence',
      tone: 'ai',
      icon: Sparkles,
    },
    {
      id: 'photos',
      x: 460,
      y: 175,
      w: 195,
      h: 80,
      title: 'Photos',
      sub: 'Cloudinary, else\nSupabase',
      tone: 'ext',
      icon: Camera,
    },
    {
      id: 'pending',
      x: 460,
      y: 40,
      w: 195,
      h: 76,
      title: 'Pending',
      sub: 'contributions table',
      tone: 'data',
      step: 2,
      icon: Inbox,
    },
    {
      id: 'pre',
      x: 690,
      y: 175,
      w: 195,
      h: 80,
      title: 'AI pre-check',
      sub: 'spam · duplicate\nadvice only',
      tone: 'ai',
      icon: ShieldCheck,
    },
    {
      id: 'review',
      x: 690,
      y: 30,
      w: 195,
      h: 96,
      title: 'You review',
      sub: 'admin › Contributions',
      tone: 'person',
      step: 3,
      icon: UserCog,
    },
    {
      id: 'ok',
      x: 925,
      y: 20,
      w: 160,
      h: 70,
      title: 'Approve',
      sub: 'apply_contribution',
      tone: 'ok',
      step: 4,
      icon: CircleCheck,
    },
    {
      id: 'no',
      x: 925,
      y: 115,
      w: 160,
      h: 60,
      title: 'Reject',
      sub: 'nothing changes',
      tone: 'fail',
      icon: CircleX,
    },
    {
      id: 'live',
      x: 925,
      y: 240,
      w: 160,
      h: 120,
      title: 'Live',
      sub: 'place updated\nphotos attached\nre-embedded\ntrust +1',
      tone: 'app',
      step: 5,
      icon: Globe,
    },
  ],
  edges: [
    { from: 'p', to: 'form', tone: 'person', flow: true },
    { from: 'form', to: 'extract', fs: 'b', ts: 't', tone: 'ai', dashed: true, label: 'optional' },
    {
      from: 'form',
      to: 'pending',
      fs: 'r',
      ts: 'l',
      fromShift: -10,
      toShift: -10,
      tone: 'app',
      flow: true,
      delay: 0.4,
    },
    {
      from: 'form',
      to: 'photos',
      fs: 'r',
      ts: 't',
      fromShift: 30,
      via: [[557, 108]],
      tone: 'ext',
      label: 'upload',
      labelAt: 0.3,
    },
    {
      from: 'pending',
      to: 'review',
      fs: 'r',
      ts: 'l',
      fromShift: -10,
      toShift: -10,
      tone: 'data',
      flow: true,
      delay: 0.8,
    },
    {
      from: 'pending',
      to: 'pre',
      fs: 'r',
      ts: 'l',
      fromShift: 25,
      via: [
        [672, 103],
        [672, 215],
      ],
      tone: 'ai',
    },
    { from: 'pre', to: 'review', fs: 't', ts: 'b', tone: 'ai', label: 'flags' },
    {
      from: 'review',
      to: 'ok',
      fs: 'r',
      ts: 'l',
      fromShift: -23,
      tone: 'ok',
      flow: true,
      delay: 1.2,
    },
    { from: 'review', to: 'no', fs: 'r', ts: 'l', fromShift: 25, tone: 'fail' },
    {
      from: 'ok',
      to: 'live',
      fs: 'r',
      ts: 'r',
      via: [
        [1100, 55],
        [1100, 300],
      ],
      tone: 'ok',
      flow: true,
      delay: 1.6,
    },
  ],
};

const contributionSteps: Step[] = [
  {
    title: 'Contribute',
    text: 'Anyone signed in can add a place, suggest an edit, report it closed or a duplicate, or add photos. The AI can fill the form from one sentence ("new pharmacy opposite the Shell at Madina").',
  },
  {
    title: 'Pending',
    text: 'Nothing goes live yet. Photos are already uploaded, but stay hidden until approved.',
  },
  {
    title: 'You review',
    text: 'The AI pre-check flags spam, implausible entries and likely duplicates, but only advises. You decide.',
  },
  {
    title: 'Approve',
    text: 'One database step (apply_contribution) applies it: creates or edits the place, attaches photos (the first is the cover).',
  },
  {
    title: 'Live',
    text: "The place is re-embedded for meaning search, and the contributor's trust score goes up by 1.",
  },
];

/* 7 ─────────────────────────────────────────────────────────────── Admin controls */

const adminControls: DiagramSpec = {
  width: 1000,
  height: 400,
  nodes: [
    {
      id: 'you',
      x: 20,
      y: 160,
      w: 160,
      h: 76,
      title: 'You',
      sub: 'admin',
      tone: 'person',
      icon: UserCog,
    },
    {
      id: 'edit',
      x: 230,
      y: 15,
      w: 240,
      h: 76,
      title: 'Add / edit',
      sub: 'live at once\narea + meaning updated',
      tone: 'app',
      icon: Pencil,
    },
    {
      id: 'merge',
      x: 230,
      y: 110,
      w: 240,
      h: 86,
      title: 'Merge duplicates',
      sub: 'sources, photos, saves move\ncopy hidden, link redirects',
      tone: 'app',
      icon: GitMerge,
    },
    {
      id: 'del',
      x: 230,
      y: 215,
      w: 240,
      h: 76,
      title: 'Delete',
      sub: 'gone, and remembered',
      tone: 'fail',
      icon: Trash2,
    },
    {
      id: 'ph',
      x: 230,
      y: 310,
      w: 240,
      h: 70,
      title: 'Photos',
      sub: 'remove · cover · move',
      tone: 'app',
      icon: Camera,
    },
    {
      id: 'db',
      x: 530,
      y: 125,
      w: 200,
      h: 150,
      title: 'Database',
      sub: 'admin_edited_at\nmerged_into\nplace_removals',
      tone: 'data',
      icon: Database,
    },
    {
      id: 'imp',
      x: 790,
      y: 125,
      w: 195,
      h: 150,
      title: 'Next import',
      sub: 'skips deleted\nkeeps merges\nleaves your edits',
      tone: 'data',
      icon: HardDriveDownload,
    },
  ],
  edges: [
    { from: 'you', to: 'edit', fs: 'r', ts: 'l', tone: 'person', flow: true },
    { from: 'you', to: 'merge', fs: 'r', ts: 'l', tone: 'person', flow: true, delay: 0.3 },
    { from: 'you', to: 'del', fs: 'r', ts: 'l', tone: 'person', flow: true, delay: 0.6 },
    { from: 'you', to: 'ph', fs: 'r', ts: 'l', tone: 'person', flow: true, delay: 0.9 },
    { from: 'edit', to: 'db', fs: 'r', ts: 'l', toShift: -50, tone: 'data' },
    { from: 'merge', to: 'db', fs: 'r', ts: 'l', toShift: -15, tone: 'data' },
    { from: 'del', to: 'db', fs: 'r', ts: 'l', toShift: 20, tone: 'fail' },
    { from: 'ph', to: 'db', fs: 'r', ts: 'l', toShift: 55, tone: 'data' },
    { from: 'db', to: 'imp', tone: 'data', flow: true, delay: 1.2, label: 'overrides' },
  ],
};

const adminControlSteps: Step[] = [
  {
    title: 'Add or edit',
    text: 'Changes go live at once. Moving the pin recalculates the town and district; the meaning vector is rebuilt.',
  },
  {
    title: 'Merge',
    text: 'Everything from the copy moves to the place you keep, its name becomes an "other name", and its old web link redirects.',
  },
  {
    title: 'Delete',
    text: 'Removes the place, its photos and saves after a confirmation. The deletion is recorded so it never comes back.',
  },
  {
    title: 'Photos',
    text: 'Remove (the file is deleted too), make cover, or move to the right place.',
  },
  {
    title: 'Imports respect you',
    text: 'The data import reads ingest_overrides() first and leaves your work as you left it.',
  },
];

/* 8 ─────────────────────────────────────────────────────────────── Voice and Ask */

const voiceAsk: DiagramSpec = {
  width: 1000,
  height: 360,
  nodes: [
    {
      id: 'mic',
      x: 20,
      y: 25,
      w: 160,
      h: 76,
      title: 'Speak',
      sub: 'mic button',
      tone: 'person',
      icon: Mic,
    },
    {
      id: 'stt',
      x: 220,
      y: 20,
      w: 240,
      h: 86,
      title: 'Speech to text',
      sub: "phone's own, else\ngpt-transcribe + Ghana words",
      tone: 'ai',
      icon: AudioLines,
    },
    {
      id: 'search',
      x: 510,
      y: 25,
      w: 180,
      h: 76,
      title: 'Search',
      sub: 'same as typing',
      tone: 'app',
      icon: Search,
    },
    {
      id: 'q',
      x: 20,
      y: 205,
      w: 160,
      h: 76,
      title: 'Ask',
      sub: 'a question',
      tone: 'person',
      icon: Users,
    },
    {
      id: 'agent',
      x: 220,
      y: 195,
      w: 240,
      h: 96,
      title: 'Ask agent',
      sub: 'gpt-6-luna\nmay call two tools',
      tone: 'ai',
      icon: Bot,
    },
    {
      id: 'tool1',
      x: 510,
      y: 150,
      w: 180,
      h: 66,
      title: 'search_places',
      sub: 'our own search',
      tone: 'data',
      icon: Search,
    },
    {
      id: 'tool2',
      x: 510,
      y: 240,
      w: 180,
      h: 66,
      title: 'get_place',
      sub: 'details',
      tone: 'data',
      icon: FileSearch,
    },
    {
      id: 'check',
      x: 735,
      y: 190,
      w: 170,
      h: 106,
      title: 'Citation check',
      sub: 'every place needs\na P1-style ref\nmade-up → removed',
      tone: 'ok',
      icon: ShieldCheck,
    },
    { id: 'ans', x: 925, y: 210, w: 60, h: 66, title: '✓', tone: 'app' },
  ],
  edges: [
    { from: 'mic', to: 'stt', tone: 'person', flow: true },
    { from: 'stt', to: 'search', tone: 'ai', flow: true, delay: 0.4 },
    { from: 'q', to: 'agent', tone: 'person', flow: true, delay: 0.2 },
    {
      from: 'agent',
      to: 'tool1',
      fs: 'r',
      ts: 'l',
      fromShift: -25,
      tone: 'data',
      flow: true,
      delay: 0.6,
    },
    { from: 'agent', to: 'tool2', fs: 'r', ts: 'l', fromShift: 25, tone: 'data', dashed: true },
    {
      from: 'agent',
      to: 'check',
      fs: 'b',
      ts: 'b',
      via: [
        [340, 335],
        [820, 335],
      ],
      tone: 'ai',
      flow: true,
      delay: 1.2,
      speed: 3,
      label: 'answer with refs',
    },
    { from: 'check', to: 'ans', tone: 'ok', flow: true, delay: 2.2 },
  ],
};

const voiceAskSteps: Step[] = [
  {
    title: 'Voice',
    text: 'Phones with built-in speech recognition use it. Others record up to 8 s and send it to gpt-transcribe with a list of Ghanaian place and food words: errors fell from ~19% to ~3% of words.',
  },
  {
    title: 'Ask',
    text: 'A small AI agent answers questions ("which of these has parking?"). It may only use our own search and place details.',
  },
  {
    title: 'Grounded',
    text: "Places come back labelled P1, P2…, and the answer must cite them. Any ref we didn't issue is a made-up place and is removed before you see the answer.",
  },
  {
    title: 'Fallback',
    text: 'If the model fails or is too slow, people get the plain search results instead.',
  },
];

/* 9 ─────────────────────────────────────────────────────────────── Getting better */

const loop: DiagramSpec = {
  width: 1000,
  height: 340,
  nodes: [
    {
      id: 'real',
      x: 20,
      y: 120,
      w: 160,
      h: 80,
      title: 'Real searches',
      tone: 'person',
      icon: Users,
    },
    {
      id: 'log',
      x: 215,
      y: 120,
      w: 180,
      h: 80,
      title: 'search_events',
      sub: 'query · parse · results\nno user id',
      tone: 'data',
      icon: ScrollText,
    },
    {
      id: 'flags',
      x: 430,
      y: 25,
      w: 200,
      h: 80,
      title: 'Rule flags',
      sub: 'wrong kind · repeated\nno results · slow',
      tone: 'rules',
      icon: ListChecks,
    },
    {
      id: 'rev',
      x: 430,
      y: 215,
      w: 200,
      h: 80,
      title: 'AI review',
      sub: 'Claude Opus · on demand',
      tone: 'ai',
      icon: BrainCircuit,
    },
    {
      id: 'ins',
      x: 665,
      y: 120,
      w: 170,
      h: 80,
      title: 'Search insights',
      sub: 'admin page',
      tone: 'app',
      icon: ChartNoAxesCombined,
    },
    {
      id: 'fix',
      x: 865,
      y: 25,
      w: 120,
      h: 80,
      title: 'Fix',
      sub: 'rules · data\nweights',
      tone: 'person',
      icon: Wrench,
    },
    {
      id: 'eval',
      x: 865,
      y: 215,
      w: 120,
      h: 80,
      title: 'Eval',
      sub: '198 queries',
      tone: 'ok',
      icon: FlaskConical,
    },
  ],
  edges: [
    { from: 'real', to: 'log', tone: 'person', flow: true },
    {
      from: 'log',
      to: 'flags',
      fs: 'r',
      ts: 'l',
      fromShift: -15,
      tone: 'rules',
      flow: true,
      delay: 0.4,
    },
    { from: 'log', to: 'rev', fs: 'r', ts: 'l', fromShift: 15, tone: 'ai', dashed: true },
    {
      from: 'flags',
      to: 'ins',
      fs: 'r',
      ts: 'l',
      toShift: -15,
      tone: 'rules',
      flow: true,
      delay: 0.8,
    },
    { from: 'rev', to: 'ins', fs: 'r', ts: 'l', toShift: 15, tone: 'ai' },
    {
      from: 'ins',
      to: 'fix',
      fs: 'r',
      ts: 'b',
      via: [[925, 160]],
      tone: 'person',
      flow: true,
      delay: 1.2,
    },
    {
      from: 'fix',
      to: 'eval',
      fs: 'r',
      ts: 'r',
      via: [
        [995, 65],
        [995, 255],
      ],
      tone: 'ok',
    },
    {
      from: 'eval',
      to: 'real',
      fs: 'b',
      ts: 'b',
      via: [
        [925, 325],
        [100, 325],
      ],
      tone: 'ok',
      dashed: true,
      flow: true,
      delay: 1.8,
      speed: 3.5,
      label: 'better search',
    },
  ],
};

const loopSteps: Step[] = [
  {
    title: 'Every search is logged',
    text: 'Query, how it was understood, top results and timings. No user id; location rounded to ~1 km.',
  },
  {
    title: 'Rules flag problems',
    text: 'Free checks on every search: wrong kind of place in the top 5, searched again within 3 minutes, no results, place not found, slow.',
  },
  {
    title: 'AI reviews on demand',
    text: 'Claude Opus reads a flagged search and writes a verdict and a one-line fix ("matched cat to cathedral").',
  },
  {
    title: 'Fix and prove',
    text: 'Each fix is run against the eval sets (pnpm eval). It ships only if no case gets worse.',
  },
];

export function Figures() {
  return (
    <>
      <section id="big-picture" className="scroll-mt-20 space-y-3">
        <H2 n={1}>The big picture</H2>
        <Figure
          id="big-picture"
          title="The big picture"
          spec={bigPicture}
          steps={bigPictureSteps}
        />
      </section>
      <section id="search" className="scroll-mt-20 space-y-3">
        <H2 n={2}>One search, step by step</H2>
        <Figure
          id="one-search"
          title="One search, step by step"
          spec={oneSearch}
          steps={oneSearchSteps}
          minWidth={760}
        />
      </section>
      <section id="rules-ai" className="scroll-mt-20 space-y-3">
        <H2 n={3}>Rules or AI?</H2>
        <Figure
          id="rules-or-ai"
          title="When does the AI step in?"
          spec={rulesOrAi}
          steps={rulesOrAiSteps}
        />
      </section>
      <section id="ranking" className="scroll-mt-20 space-y-3">
        <H2 n={4}>Seven arms, one ranking</H2>
        <Figure
          id="seven-arms"
          title="Seven arms, one ranking"
          spec={sevenArms}
          steps={sevenArmsSteps}
        />
      </section>
    </>
  );
}

export function MoreFigures() {
  return (
    <>
      <section id="data" className="scroll-mt-20 space-y-3">
        <H2 n={5}>Where places come from</H2>
        <Figure
          id="data-import"
          title="Where places come from"
          spec={dataImport}
          steps={dataImportSteps}
        />
      </section>
      <section id="contributions" className="scroll-mt-20 space-y-3">
        <H2 n={6}>Contributions and review</H2>
        <Figure
          id="contributions"
          title="Contributions and review"
          spec={contributions}
          steps={contributionSteps}
        />
      </section>
      <section id="admin" className="scroll-mt-20 space-y-3">
        <H2 n={7}>Your admin controls</H2>
        <Figure
          id="admin-controls"
          title="Your admin controls"
          spec={adminControls}
          steps={adminControlSteps}
        />
      </section>
      <section id="voice-ask" className="scroll-mt-20 space-y-3">
        <H2 n={8}>Voice and Ask</H2>
        <Figure id="voice-ask" title="Voice and Ask" spec={voiceAsk} steps={voiceAskSteps} />
      </section>
      <section id="quality" className="scroll-mt-20 space-y-3">
        <H2 n={9}>How search gets better</H2>
        <Figure id="getting-better" title="How search gets better" spec={loop} steps={loopSteps} />
      </section>
    </>
  );
}

export function H2({ n, children }: { n?: number; children: string }) {
  return (
    <h2 className="flex items-center gap-2 font-semibold text-lg tracking-tight">
      {n ? (
        <span className="grid size-7 place-items-center rounded-full bg-primary text-primary-foreground text-sm tabular-nums">
          {n}
        </span>
      ) : null}
      {children}
    </h2>
  );
}
