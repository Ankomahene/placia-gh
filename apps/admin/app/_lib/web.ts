/** The public site, for "open on Placia" links. */
export const WEB_URL = (process.env.WEB_URL || 'https://placiagh.up.railway.app').replace(
  /\/$/,
  '',
);
