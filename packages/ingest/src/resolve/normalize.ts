/** Text and contact normalisation shared by matching and the canonical record. */

const STOP = new Set([
  'the',
  'ltd',
  'limited',
  'co',
  'company',
  'plc',
  'enterprise',
  'enterprises',
  'ent',
  'ventures',
  'int',
  'intl',
  'international',
  'gh',
  'and',
  'of',
]);

const ALIASES: Record<string, string> = {
  st: 'saint',
  mt: 'mount',
  hosp: 'hospital',
  sch: 'school',
  univ: 'university',
};

/** "St. George′s Hotel, Ltd." → "saint georges hotel" */
export function normName(s: string) {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/['’′`]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((t) => ALIASES[t] ?? t)
    .join(' ');
}

/** Distinct informative tokens; falls back to all tokens if everything was a stop word. */
export function nameTokens(norm: string) {
  const all = norm.split(' ').filter(Boolean);
  const kept = all.filter((t) => !STOP.has(t));
  return [...new Set(kept.length ? kept : all)];
}

/**
 * Ghana numbers → E.164 (+233XXXXXXXXX). Accepts "024 123 4567", "+233 (0)24…", "00233…",
 * and lists like "0244…; 0302…" (first valid wins). Foreign numbers are kept if already E.164.
 */
export function normPhone(raw: string | null | undefined) {
  if (!raw) return null;
  for (const part of raw.split(/[;,/]|\bor\b/)) {
    let d = part.replace(/\(0\)/g, '').replace(/[^\d+]/g, '');
    const plus = d.startsWith('+');
    d = d.replace(/\+/g, '');
    if (d.startsWith('00')) d = d.slice(2);
    if (d.startsWith('233') && d.length === 12) return `+${d}`;
    if (d.startsWith('2330') && d.length === 13) return `+233${d.slice(4)}`;
    if (!plus && d.startsWith('0') && d.length === 10) return `+233${d.slice(1)}`;
    if (!plus && /^[235]\d{8}$/.test(d)) return `+233${d}`;
    if (plus && d.length >= 8 && d.length <= 15) return `+${d}`;
  }
  return null;
}

/** Hosts that identify a platform, not a business; never used as a match signal. */
const PLATFORM_HOSTS = [
  'facebook.com',
  'fb.com',
  'instagram.com',
  'twitter.com',
  'x.com',
  'linkedin.com',
  'tiktok.com',
  'youtube.com',
  'wa.me',
  'whatsapp.com',
  'linktr.ee',
  'google.com',
  'business.site',
  'goo.gl',
  'g.page',
  'blogspot.com',
  'wordpress.com',
  'wixsite.com',
  'tripadvisor.com',
  'booking.com',
];

export function normWebsite(raw: string | null | undefined) {
  if (!raw) return null;
  const s = raw.trim().split(/[\s;]+/)[0] ?? '';
  if (!s || s.includes('@')) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(s) ? s : `https://${s}`);
    if (!u.hostname.includes('.')) return null;
    return u.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

/** Registrable-ish host for matching ("www.kfc.com.gh" → "kfc.com.gh"); null for platforms. */
export function matchDomain(website: string | null) {
  if (!website) return null;
  const host = new URL(website).hostname.replace(/^www\./, '').toLowerCase();
  return PLATFORM_HOSTS.some((p) => host === p || host.endsWith(`.${p}`)) ? null : host;
}

export function normEmail(raw: string | null | undefined) {
  const e = raw
    ?.trim()
    .toLowerCase()
    .split(/[\s;,]+/)[0];
  return e && /^[^@\s]+@[^@\s]+\.[a-z]{2,}$/.test(e) ? e : null;
}

/**
 * Tidy free-text names: collapse spaces and calm SHOUTING. When most long words are upper-case,
 * those words are title-cased; short acronyms (GCB, SSNIT, KFC) and mixed-case brands stay as written.
 */
const MINOR = new Set(['of', 'and', 'the', 'at', 'in', 'on', 'by', 'for', 'de']);
const TITLE = new Set(['st', 'mt', 'dr', 'mr', 'mrs', 'no', 'new', 'old', 'top', 'god', 'way']);

export function displayName(s: string) {
  const t = s.replace(/\s+/g, ' ').trim();
  const long = t.split(' ').filter((w) => w.replace(/[^A-Za-z]/g, '').length >= 4);
  const shouting = long.filter((w) => w === w.toUpperCase() && /[A-Z]/.test(w));
  if (!long.length || shouting.length / long.length <= 0.5) return t;
  return t
    .split(' ')
    .map((w, i) => {
      const letters = w.replace(/[^A-Za-z]/g, '');
      const lower = w.toLowerCase();
      if (i > 0 && MINOR.has(lower)) return lower;
      if (letters.length < 4 && !TITLE.has(letters.toLowerCase()) && long.length > 1) return w;
      return w === w.toUpperCase()
        ? w.toLowerCase().replace(/(^|[^a-z'’])([a-z])/g, (_, p, c) => p + c.toUpperCase())
        : w;
    })
    .join(' ');
}
