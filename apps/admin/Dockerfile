# Placia admin, for Railway. Build from the repo root:
#   docker build -f apps/admin/Dockerfile .
# Runtime variables (set on the Railway service, never baked in):
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
#   RESEND_API_KEY, EMAIL_FROM (sign-in codes), OPENAI_API_KEY, ANTHROPIC_API_KEY (AI reviews)
# Only profiles with role "admin" can sign in: see app/_lib/auth.ts and proxy.ts.

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@placia/admin..."
ENV NEXT_TELEMETRY_DISABLED=1
# Next inlines NEXT_PUBLIC_* at build time; Railway passes service variables to declared ARGs.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm --filter @placia/admin build

# Only the standalone server Next traced, plus static assets: no dev dependencies, no source.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /repo/apps/admin/.next/standalone ./
COPY --from=build /repo/apps/admin/.next/static ./apps/admin/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/admin/server.js"]
