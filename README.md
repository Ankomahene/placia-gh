# Placia

Find places in Ghana by typing or speaking plain English.

> v2 is a ground-up rebuild of the 2025 hackathon project (tagged `v1-hackathon`).
> The plan and its reasoning are in [docs/V2_PLAN.md](docs/V2_PLAN.md).

## Repository layout

| Path                  | What it is                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `apps/web`            | Public, mobile-first Next.js app (port 3000)                                                                      |
| `apps/admin`          | Moderation, data and evaluation console (port 3001), deployed separately                                          |
| `packages/core`       | Search and AI logic: provider router (Claude primary, OpenAI fallback), and later query understanding and ranking |
| `packages/db`         | Supabase client helpers and generated database types                                                              |
| `packages/ui`         | Design tokens and shared components                                                                               |
| `supabase/migrations` | SQL source of truth for the database                                                                              |

## Getting started

```bash
pnpm install
cp .env.example .env.local   # fill in Supabase + AI keys
pnpm dev                     # web on :3000, admin on :3001
```

| Command                                      | Does                                                                    |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| `pnpm typecheck` / `pnpm test` / `pnpm lint` | Checks, as run in CI                                                    |
| `pnpm db:push`                               | Apply new migrations to the linked Supabase project                     |
| `pnpm db:types`                              | Regenerate `packages/db/src/database.types.ts`                          |
| `pnpm ai:smoke`                              | Live check of the AI providers: who answers, latency, structured output |

## AI providers

Every AI call goes through `LLMRouter` (`packages/core/src/ai`).

- Claude runs first whenever `ANTHROPIC_API_KEY` is set. Otherwise, or when Claude times out, errors or declines, the call moves to OpenAI.
- A circuit breaker skips a failing provider for a minute, so users don't wait on its timeout every time.
- Every result records which provider served it and how long each attempt took. This feeds observability and the evals.

## Data licences

Place data comes from OpenStreetMap (© OpenStreetMap contributors, ODbL), Overture Maps (CDLA-Permissive 2.0), Foursquare OS Places (Apache 2.0), GeoNames (CC-BY 4.0), Wikidata (CC0), and community contributions.
