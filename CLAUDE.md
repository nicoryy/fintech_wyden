# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Wyden** is a personal finance mobile app with behavioral analysis. The core differentiator is not just tracking income/expenses, but generating behavioral insights — answering *why* the user spends, not just *where*.

The app is **local-first and single-user by design**: all data lives in a SQLite database on the user's own device. There is no backend, no server, no login — just a name collected once during onboarding. See "Why local-only" below.

## Architecture

```
Mobile App (React Native / Expo)
    ↓
src/data (business rules + queries)
    ↓
SQLite (on-device, expo-sqlite)
```

### Stack
- React Native + Expo + TypeScript
- NativeWind (styling), React Query (data fetching over the local DB), React Hook Form + Zod (forms/validation)
- `expo-sqlite` (storage), `expo-crypto` (id generation), `expo-file-system` + `expo-sharing` + `expo-document-picker` (backup export/import)

## Why local-only

Wyden is a **personal, single-user** app — there is no scenario where data needs to be reachable outside the user's own device, and bank data explicitly should not live in the cloud. An earlier version ran `apps/api` (NestJS) + PostgreSQL + Redis in Docker; that added a permanently-running server, exposed ports/credentials, and image/backup maintenance for a use case that never needed a network at all. That backend was removed (see git history and issue #1) in favor of the architecture above. Onboarding is just a name (`Welcome` screen) — no email, no password, no session.

## Module Map

**Frontend modules:** Dashboard, Transactions, Banks, Categories, Reports, Behavioral Insights, Goals, Settings, Backup

## Local Database Schema (`apps/src/data`, SQLite)

Money is stored in **integer cents**; dates are **epoch milliseconds**. There is no `user_id` on any table (single user) and no `insights` table (nothing has ever generated insights yet — see Behavioral Insights Engine below).

- **settings**: key, value — currently just `profile.name`
- **categories**: id, name, type (`income`\|`expense`), icon, color, created_at — global, seeded on first launch
- **banks**: id, name, short, color, initial_balance_cents, created_at — balance is *computed* at read time (`initial + Σincome − Σexpense`), not stored
- **transactions**: id, bank_id, category_id, amount_cents, type, description, occurred_at, is_impulse, created_at
- **goals**: id, title, target_cents, current_cents, deadline, status, created_at, updated_at

## Behavioral Insights Engine

The Insights module is meant to compute scores for:

- **Impulsivity** (0–100): based on purchase frequency, average purchase value, interval between transactions
- **Financial Consistency**: spending stability + budget compliance
- **Planning**: savings reserve + net worth evolution
- **Emotional Spending**: purchase time-of-day, leisure categories, unplanned consumption growth

Today, `useInsight()` always returns the honest "no insights yet" empty state — no engine has ever run locally or on the old API (`GET /insights` always returned `[]`). Only the per-transaction `is_impulse` heuristic (night/weekend + above-average amount — see `apps/src/data/impulse.ts`) is real. The real engine is Phase 2.

## Roadmap Phases

- **Phase 1 (MVP)**: Manual transaction tracking, banks, categories, dashboard, basic reports — now local-first, no login
- **Phase 2**: Insights engine, financial score, behavioral analysis, automatic recommendations
- **Phase 3**: Goals, emergency fund, scenario simulation, projections

## Monorepo Layout

npm workspace: `apps` (Expo). It has its own `CLAUDE.md` — read it before working in that area.

## Local Development (CI, local-first)

There is no server or Docker to run — `npx expo start` (or `npm run mobile`) is the whole dev loop. The CI pipeline mirrors what you run on your machine.

**Local-first CI** — one command reproduces CI exactly:
- `npm run ci` (root) = `typecheck` + `lint` + `test` + `build` (bundle export, `apps`) — 125 unit tests today
- `.github/workflows/ci.yml` runs the same on push/PR, Node 22
- `npm run setup:hooks` enables the versioned `.githooks/pre-push`, which runs `npm run ci` before every push (bypass with `git push --no-verify`)
- Run the workspace's own scripts directly: `npm run <script> --workspace=apps`

**Always validate before declaring done**: `npm run ci` must pass.
