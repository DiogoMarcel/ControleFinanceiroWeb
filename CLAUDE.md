# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Launcher (Windows)

`iniciar.bat` — double-click or use the Desktop shortcut to start the full stack:
- Detects the current local IP and writes `apps/web/.env.local` with `VITE_API_URL=http://<IP>:3001/api/v1`
- Opens a terminal window running `npm run dev`
- Polls `localhost:3001/health` and `localhost:5173` until both are up
- Opens the browser automatically and prints both Desktop and mobile URLs

Run once to create the Desktop shortcut:
```powershell
powershell -ExecutionPolicy Bypass -File "criar-atalho-desktop.ps1"
```

`apps/web/.env.local` is gitignored — it is regenerated on every launch with the current IP.

## Commands

### Development (from repo root)
```bash
npm run dev        # starts both apps in parallel via Turborepo
npm run build      # builds all packages
npm run lint       # lints all packages
npm run test       # runs all tests
npm run clean      # removes dist/.turbo from all packages
```

### Per-app development
```bash
# API (apps/api)
cd apps/api
npm run dev        # tsx watch src/server.ts — API on :3001

# Web (apps/web)
cd apps/web
npm run dev        # vite — frontend on :5173
```

### Tests (API only — no frontend tests)
```bash
# Run all tests
cd apps/api && npm test

# Run a single test file
cd apps/api && node --experimental-vm-modules ../../node_modules/jest/bin/jest.js src/__tests__/routes/contas.test.ts
```

### Prisma
```bash
cd apps/api
npx prisma generate   # regenerate client after schema changes (output: src/generated/prisma/)
npx prisma db push    # sync schema to DB without migrations
```

## Architecture

### Monorepo layout
```
apps/api      — Fastify 5 REST API (Node ESM, TypeScript)
apps/web      — React 19 + Vite 8 SPA (TypeScript)
packages/shared — shared Zod schemas and TypeScript types (@cfweb/shared)
```
Turborepo orchestrates builds; npm workspaces handle dependencies. `@cfweb/shared` is consumed directly from source (no build step — `main` points to `./src/index.ts`).

### API (apps/api)
- **Entry**: `src/server.ts` — registers plugins (CORS, helmet, rate-limit) then calls `registerRoutes()`
- **Routes**: `src/routes/index.ts` — all modules mounted at `/api/v1`
- **Pattern**: each domain has `routes/<domain>.ts` → `services/<domain>.service.ts`; routes handle HTTP, services handle Prisma queries
- **Auth**: every route calls `authMiddleware` (preHandler) — verifies Firebase ID token, attaches `request.user: AuthUser`
- **Database**: Prisma 7 with `@prisma/adapter-pg` (pg Pool driver). Client generated into `src/generated/prisma/`. Schema at `prisma/schema.prisma` — existing PostgreSQL DB, no migrations (use `db push`)
- **Env**: `apps/api/.env` — `DATABASE_URL`, `FIREBASE_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`, `PORT`, `ALLOWED_ORIGIN`

### Frontend (apps/web)
- **Entry**: `src/main.tsx` → `App.tsx` — wraps with `BrowserRouter`, `QueryClientProvider`, `AuthProvider`
- **Auth flow**: `AuthProvider` subscribes to Firebase `onAuthStateChanged`, stores token in `sessionStorage`. `ProtectedRoute` guards all app routes. On 401, axios interceptor redirects to `/login`
- **API client**: `src/services/api.ts` — axios instance with `baseURL = VITE_API_URL`, auto-injects `Bearer` token from `sessionStorage`
- **State**: Zustand for auth (`src/store/auth.store.ts`); TanStack Query for all server state (staleTime 5 min, no refetch on window focus)
- **Feature structure**: `src/features/<domain>/` — each has `api.ts` (useQuery/useMutation hooks), page component, and `components/` subfolder
- **Routing**: React Router v7, all pages lazy-loaded as separate Vite chunks
- **Env**: `apps/web/.env` — `VITE_API_URL`, `VITE_FIREBASE_*`

### Key domain knowledge

**`conta` table**: `tipoconta='P'` = pagar, `tipoconta='R'` = receber. Field `marcado` is shared across all users (not per-user). Field `debitacartao=true` means the expense is tracked via credit card invoice — exclude these from totals to avoid double-counting.

**`saldodetalhadoportador`**: maintained by a PostgreSQL trigger (`saldoportador_upd_ins`). The trigger can insert rows with `saldototal = NULL` as a partial state — always filter `WHERE saldototal IS NOT NULL` and order by `idsaldodetalhadoportador DESC` to get the canonical balance.

**`saldoportador`**: `contacapital !== true` (not `!== false`) correctly handles nullable booleans — `null` and `false` should both be treated as non-capital.

**`saldoextrato`**: written automatically whenever `saldoportador` is created or updated via `portadores.service.ts`. The service uses `prisma.$transaction` to atomically update the portador balance and append a row to `saldoextrato`. The `descricao` format is `"{idportador} - {nomeportador}"` (max 50 chars). For new portadores (INSERT), `oldValor = 0` — this fixes a Delphi bug where new portadores were silently ignored. For updates, `oldValor` is fetched inside the transaction before the write. The `GET /extrato/evolucao-portadores` endpoint uses `LIKE (idportador::text || ' - %')` to correlate extrato rows with portadores (no FK exists).

**Date fields (`@db.Date`)**: PostgreSQL `date` columns are serialized as UTC midnight by Prisma, causing an off-by-one display when the client is in a UTC-negative timezone. Always render date-only fields with `{ timeZone: 'UTC' }`: `d.toLocaleDateString('pt-BR', { timeZone: 'UTC' })`.

**CORS**: always declare `methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']` explicitly — Fastify's default omits PATCH/DELETE/PUT.

### Tests
Tests live in `apps/api/src/__tests__/routes/`. Pattern: `jest.unstable_mockModule` to mock all service modules and `../../lib/prisma.js` before importing routes, then use `buildApp()` helper which creates a Fastify instance with all routes registered. Firebase auth middleware is mocked to accept `'Bearer test-token'` (`TEST_TOKEN`).

### react-hook-form + Zod
When a form has `select` inputs that depend on async data (members, creditors), the `reset()` call must wait for those queries to succeed — include `isSuccess` flags in the `useEffect` dependency array. Use `resolver: zodResolver(schema) as Resolver<FormData>` when the schema uses `z.coerce` fields to avoid TypeScript errors.

### Recharts — full-row hover on horizontal BarChart
To detect hover anywhere on a chart row (not just the bar shape itself), add `background={{ fill: 'transparent' }}` to the `<Bar>` component — this makes Recharts render a full-width invisible hit rectangle per row. Then handle hover on `<BarChart onMouseMove>` using `state.activeTooltipIndex` (guard with `typeof ... === 'number'` because the type is `number | string`). Do NOT use `isTooltipActive` as a guard — it is false in the empty row area.

```tsx
<BarChart
  onMouseMove={(state) => {
    const index = typeof state?.activeTooltipIndex === 'number'
      ? state.activeTooltipIndex : null;
    if (index !== null && index !== activeIndex) {
      setActiveIndex(index);
      onHoverChange?.(chartData[index]?.id ?? null);
    }
  }}
  onMouseLeave={() => { setActiveIndex(null); onHoverChange?.(null); }}
>
  <Bar dataKey="saldo" background={{ fill: 'transparent' }}>
    {/* Cell components for per-bar color */}
  </Bar>
</BarChart>
```

### Prisma raw queries with date literals
When injecting validated date strings into `Prisma.sql`, use `Prisma.raw()` for the literal and validate the format first:
```typescript
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
if (!dateRe.test(dateStr)) return reply.code(400).send({ error: 'Invalid date format' });
// then safely:
Prisma.raw(`'${dateStr}'`)::date
```
