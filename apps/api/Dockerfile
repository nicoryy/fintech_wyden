# syntax=docker/dockerfile:1
# Multi-stage build for the NestJS API. Build context is the MONOREPO ROOT
# (see docker-compose.yml `build.context: .`) so npm workspaces resolve.

# ── Build stage ─────────────────────────────────────────────
FROM node:22-alpine AS build
# bcrypt is a native module; Alpine needs a toolchain to compile it.
RUN apk add --no-cache python3 make g++
WORKDIR /app

# Install deps using only the manifests first (better layer caching).
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/
RUN npm ci

# Build the API.
COPY apps/api ./apps/api
COPY packages/shared ./packages/shared
RUN npm run build --workspace=apps/api

# Drop devDependencies, keeping the compiled native bcrypt in node_modules.
RUN npm prune --omit=dev

# ── Runtime stage ───────────────────────────────────────────
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Run as the built-in non-root user.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/package.json ./package.json
USER node

EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
