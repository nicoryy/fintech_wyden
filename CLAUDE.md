# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wyden** is a personal finance mobile app with behavioral analysis. The core differentiator is not just tracking income/expenses, but generating behavioral insights — answering *why* the user spends, not just *where*.

## Architecture

```
Mobile App (React Native / Expo)
    ↓
REST API (NestJS)
    ↓
Business Rules + Insights Engine
    ↓
PostgreSQL + Redis
```

### Frontend Stack
- React Native + Expo + TypeScript
- NativeWind (styling), React Query (data fetching), React Hook Form + Zod (forms/validation)

### Backend Stack
- NestJS + TypeScript + Node.js
- JWT + Refresh Token auth, bcrypt for password hashing
- Rate limiting, validation pipes, input sanitization

### Infrastructure
- Docker on VPS
- Services: Frontend, Backend, PostgreSQL, Redis, Nginx

## Module Map

**Frontend modules:** Dashboard, Transactions, Banks, Categories, Reports, Behavioral Insights, Goals, Settings

**Backend modules:** Auth, Users, Transactions, Banks, Categories, Reports, Insights, Goals

## Database Schema (key tables)

- **User**: id, name, email, password_hash, created_at, updated_at
- **Bank**: id, user_id, name, initial_balance, current_balance, created_at
- **Category**: id, name, type, created_at
- **Transaction**: id, user_id, bank_id, category_id, amount, type, description, transaction_date, created_at
- **Insight**: id, user_id, type, score, title, description, generated_at
- **Goal**: id, user_id, title, target_amount, current_amount, deadline, status

## Behavioral Insights Engine

The Insights module computes scores for:

- **Impulsivity** (0–100): based on purchase frequency, average purchase value, interval between transactions
- **Financial Consistency**: spending stability + budget compliance
- **Planning**: savings reserve + net worth evolution
- **Emotional Spending**: purchase time-of-day, leisure categories, unplanned consumption growth

## Roadmap Phases

- **Phase 1 (MVP)**: Manual transaction tracking, banks, categories, dashboard, basic reports
- **Phase 2**: Insights engine, financial score, behavioral analysis, automatic recommendations
- **Phase 3**: Goals, emergency fund, scenario simulation, projections

## Monorepo Layout

npm workspaces: `apps/api` (NestJS), `apps/mobile` (Expo), `packages/shared` (types). Each has its own `CLAUDE.md` — read it before working in that area.

## Local Development (Docker + CI, local-first)

The whole stack runs locally via Docker; the CI pipeline mirrors what you run on your machine.

**Docker stack** (`docker-compose.yml`): `postgres` (5432), `redis` (6379), `api` (3000, built from `apps/api/Dockerfile`), `pgadmin` (5050).
- `npm run docker:up` — start the stack (api waits for postgres/redis healthchecks)
- `npm run docker:build` — rebuild images · `npm run docker:down` — stop · `npm run docker:logs`
- The API container runs `NODE_ENV=production` but with `DB_SYNCHRONIZE=true` so TypeORM auto-creates the schema and seeds the 15 default categories on boot. Real prod should use migrations instead (`synchronize` is gated by `DB_SYNCHRONIZE` / non-prod `NODE_ENV` in `database.module.ts`).

**Local-first CI** — one command reproduces CI exactly:
- `npm run ci` (root) = `typecheck` + `lint` + `test` + `build` across api + mobile (139 unit tests today)
- `.github/workflows/ci.yml` runs the same on push/PR (+ a Docker image build job), Node 22
- `npm run setup:hooks` enables the versioned `.githooks/pre-push`, which runs `npm run ci` before every push (bypass with `git push --no-verify`)
- Run a workspace check directly: `npm run <script> --workspace=apps/api`

**Always validate before declaring done**: `npm run ci` must pass. Integration/e2e tests against real Postgres are a future addition to the pipeline.
