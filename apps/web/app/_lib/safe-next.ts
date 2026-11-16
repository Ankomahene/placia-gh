/** Only same-site paths: "/saved" yes, "//evil.com" and "https://…" no. */
export function safeNext(next: string | null | undefined, fallback = '/account') {
  return next && /^\/(?!\/)/.test(next) ? next : fallback;
}

/**
 * The site's own address for links we send out. Never taken from request headers in production:
 * a forged Host header would otherwise put a working sign-in token in a link to someone else's site.
 */
export function siteOrigin(req: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '');
  return process.env.NODE_ENV === 'production' ? null : new URL(req.url).origin;
}
