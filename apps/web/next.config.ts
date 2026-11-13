import fs from 'node:fs';
import path from 'node:path';
import type { NextConfig } from 'next';

const root = path.join(import.meta.dirname, '../../');
// One .env.local at the repo root serves every app and package.
for (const file of ['.env.local', '.env']) {
  const p = path.join(root, file);
  if (fs.existsSync(p)) process.loadEnvFile(p);
}

const config: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: root,
  transpilePackages: ['@placia/ui', '@placia/core', '@placia/db'],
  typedRoutes: true,
  poweredByHeader: false,
  devIndicators: false,
};

export default config;
