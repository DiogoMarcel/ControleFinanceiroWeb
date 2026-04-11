# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace manifests (better layer caching)
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Install all workspace dependencies
RUN npm ci

# Copy source
COPY packages/shared/ ./packages/shared/
COPY apps/api/ ./apps/api/

# Build API (shared is types-only — erased at compile time)
RUN npm run build --workspace=apps/api

# ---- Runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only what's needed to install production deps
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN npm ci --omit=dev --workspace=apps/api --include-workspace-root

# Copy compiled API (includes generated Prisma client via tsc)
COPY --from=builder /app/apps/api/dist/ ./apps/api/dist/

EXPOSE 3001

CMD ["node", "apps/api/dist/server.js"]
