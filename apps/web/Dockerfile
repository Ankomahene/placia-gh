# Placia web, for Railway. Build from the repo root:
#   docker build -f apps/web/Dockerfile .
# Runtime variables (set on the Railway service, never baked in):
#   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY (optional), ANTHROPIC_API_KEY (optional)

FROM node:22-alpine AS build
RUN corepack enable
WORKDIR /repo
COPY . .
RUN pnpm install --frozen-lockfile --filter "@placia/web..."
ENV NEXT_TELEMETRY_DISABLED=1
# Next inlines NEXT_PUBLIC_* at build time; Railway passes service variables to declared ARGs.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
RUN pnpm --filter @placia/web build

# Only the standalone server Next traced, plus static assets: no dev dependencies, no source.
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build /repo/apps/web/.next/standalone ./
COPY --from=build /repo/apps/web/.next/static ./apps/web/.next/static
USER node
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
