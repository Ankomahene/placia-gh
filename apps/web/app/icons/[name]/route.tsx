import { brandIcon } from '../../_lib/brand-icon';

/** App icons for the manifest: /icons/192.png, /icons/512.png, /icons/maskable-512.png. */
const ICONS: Record<string, () => Response> = {
  '192.png': () => brandIcon(192, { padding: 0.14 }),
  '512.png': () => brandIcon(512, { padding: 0.14 }),
  'maskable-512.png': () => brandIcon(512, { padding: 0.24 }),
};

export function generateStaticParams() {
  return Object.keys(ICONS).map((name) => ({ name }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const make = ICONS[(await params).name];
  if (!make) return new Response('Not found', { status: 404 });
  return make();
}
