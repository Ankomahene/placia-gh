/** Only same-site paths: "/saved" yes, "//evil.com" and "https://…" no. */
export function safeNext(next: string | null | undefined, fallback = '/account') {
  return next && /^\/(?!\/)/.test(next) ? next : fallback;
}
