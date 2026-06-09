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
