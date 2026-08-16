# Kid Hub

A family learning hub for **Khôi**, a Vietnamese 1st-grader. A single household:
one **parent** account (email/password + PIN) and one **kid** profile. It ships as a
tablet-first **web PWA** and a native **mobile app**, sharing one backend and one
cross-platform contract.

- **Kid surface** — live class schedule, today's homework, grades, and learning games (Math & English).
- **Games** — native mini-games (counting / addition / shapes, alphabet / vocabulary / phonics) with stars & points.
- **Parent surface** — PIN-gated management of schedule, grades, homework, screen-time limits, and an activity feed.

---

## Monorepo layout

pnpm + Turborepo workspace:

```
kid-hub/
├── apps/
│   ├── web/          # Next.js 16 (App Router) — the PWA + REST API + system of record
│   └── mobile/       # Expo (SDK 56) / React Native app — consumes the web REST API
├── packages/
│   ├── shared/       # @kid-hub/shared — isomorphic contract: types, Zod schemas,
│   │                 #   domain logic, the pure game engine, constants, design tokens
│   ├── api-client/   # @kid-hub/api-client — transport-injected typed /api/v1 fetchers
│   └── assets/       # @kid-hub/assets — icon/media manifest + URL helper
├── docs/             # Architecture, product specs, deployment, and guides
└── CLAUDE.md         # Engineering protocol (layering rules, conventions)
```

Run scripts from the repo root via Turbo (`pnpm dev | build | type-check | test | lint`)
or per app (`pnpm -C apps/web <script>`).

---

## Tech Stack

| Layer            | Web (`apps/web`)                                   | Mobile (`apps/mobile`)                     |
| ---------------- | -------------------------------------------------- | ------------------------------------------ |
| Framework        | Next.js 16 (App Router, RSC, Server Actions)       | Expo SDK 56 · expo-router · React Native 0.85 |
| Language / UI    | TypeScript 5.9 (strict) · React 19                 | TypeScript 5.9 · React 19                  |
| Styling          | Tailwind CSS v4 (`@theme` tokens)                  | NativeWind (shared token preset)           |
| Data fetching    | Server Actions + `/api/v1` route handlers          | axios (Bearer + refresh) · TanStack Query  |
| Database / ORM   | PostgreSQL · Prisma 7 (`@prisma/adapter-pg`)       | — (talks to the web API only)              |
| Auth             | JWT (jose) in httpOnly cookies · argon2id + bcrypt-legacy | JWT in `expo-secure-store` (Bearer) |
| Rate limiting    | Upstash Redis (sliding window)                     | —                                          |
| Observability    | Sentry · Pino                                      | —                                          |
| Hosting          | **Vercel**                                         | EAS build (Android/iOS)                    |

The design tokens are a single source of truth in `packages/shared/src/tokens/tokens.json`;
running `pnpm -C packages/shared tokens` regenerates both the web `@theme` block and the
mobile NativeWind preset.

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** 10 (`corepack enable` picks up the pinned version)
- A **PostgreSQL** database — the project uses a hosted Postgres (Neon) via `DATABASE_URL`.
  (A local Postgres via `apps/web/docker-compose.yml` is optional.)

```bash
pnpm install
```

---

## Running the local website

```bash
# from the repo root
pnpm -C apps/web dev
```

- Opens at **http://localhost:3000** (Next may fall back to another port, e.g. 3001, if 3000 is busy).
- Loads `apps/web/.env.local` automatically (DATABASE_URL, SESSION_SECRET, …).
- First-time database setup:

```bash
pnpm -C apps/web prisma:migrate   # apply migrations
pnpm -C apps/web prisma:seed      # create the default user + parent account
```

Sign in at `/parent/login` with the seeded parent account (see [Parent account](#parent-account)).

---

## Running the mobile app on a phone

The mobile app targets Expo **SDK 56**, which is ahead of the public **Expo Go** build,
so it runs on a **development build** (`expo-dev-client`) — your own installable app —
not Expo Go. The native shell is built once in the cloud (EAS); Metro then serves the JS
bundle locally over your Wi-Fi. Full background: [`docs/eas.md`](docs/eas.md).

**Prerequisite:** the Kid Hub dev build (`.apk` on Android) is already installed on the
phone. If not, build it once (from `apps/mobile`, requires an Expo login):

```bash
cd apps/mobile && npx eas-cli build --profile development --platform android
```

**Each dev session:**

1. **Start the web API** (the mobile app calls it) in one terminal:

   ```bash
   pnpm -C apps/web dev            # note the port (default 3000)
   ```

2. **Point the app at your machine's LAN IP.** The phone reaches your PC over Wi-Fi by IP,
   not `localhost`. Find it and set it in `apps/mobile/.env.local`:

   ```bash
   hostname -I | awk '{print $1}'      # e.g. 192.168.1.205
   ```

   ```env
   # apps/mobile/.env.local  — match the web port from step 1
   EXPO_PUBLIC_API_URL=http://192.168.1.205:3000/api/v1
   ```

   > On **WSL2**, the IP can change between reboots — re-check it and update this file.
   > `EXPO_PUBLIC_*` is inlined at bundle time, so restart Metro with `--clear` after editing.

3. **Start Metro**, bound to that same LAN IP, in a second terminal:

   ```bash
   REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.205 pnpm -C apps/mobile start --dev-client --clear
   ```

4. **Open the Kid Hub dev build on the phone** — it connects to Metro automatically (or scan the QR).

**Quick checks / troubleshooting:**

- From the phone's browser: `http://<LAN_IP>:<web-port>` should load the site (API reachable),
  and `http://<LAN_IP>:8081/status` should return `packager-status:running` (Metro reachable).
- Phone stuck "loading" or connection reset → Windows Firewall is blocking the web port or
  Metro's port (8081) — allow them inbound.
- After editing `.env.local` → restart Metro with `--clear`.

---

## Environment Variables

Each app has a committed template listing every variable (required / recommended / optional).
Copy it to `.env.local` (git-ignored) and fill in real values:

```bash
cp apps/web/.env.example    apps/web/.env.local
cp apps/mobile/.env.example apps/mobile/.env.local
```

Essentials:

| Variable                     | App    | Notes                                                                 |
| ---------------------------- | ------ | --------------------------------------------------------------------- |
| `DATABASE_URL`               | web    | PostgreSQL connection string (required).                              |
| `SESSION_SECRET`             | web    | ≥ 32 chars; signs all JWTs. Generate: `openssl rand -base64 32`.      |
| `UPSTASH_REDIS_REST_URL/TOKEN` | web  | Rate limiting; no-op in dev if unset, required in production.         |
| `EXPO_PUBLIC_API_URL`        | mobile | Web REST base URL **including** `/api/v1` (use the LAN IP in dev).     |

See `apps/web/.env.example` for the full list (Sentry, log level, e2e test vars, …).

---

## Parent account

The seed (`apps/web/prisma/seed.ts`) creates the single household user (Khôi) and a
parent account:

- **Email:** `giang8692@gmail.com`
- **Password:** `Giang@123`

The seed is idempotent and only configures the account if it isn't already set. It does
not seed a parent PIN or kid unlock pattern — set those on first use from the parent area.

---

## Architecture (quick reference)

The web backend is strictly layered — see `CLAUDE.md` and `docs/guides/team-workflow.md`:

```
Page (Server Component) → Server Action ('use server')     ← web UI
                        → /api/v1 route handler (Bearer)   ← mobile
                              → Service ('server-only', all business rules)
                                    → Repository (Prisma only, userId scoped)
                                          → lib/db.ts (Prisma 7 + pg adapter)
```

Both apps import the same types, Zod schemas, game state-machine, and design tokens from
`@kid-hub/shared`, so a contract change breaks compilation in both apps at once.

Key directories (relative to `apps/web/`):

```
app/(dashboard|games|parent)/   # route groups: kid views, games, parent management
app/api/v1/                     # REST API consumed by the mobile app
server/{actions,services,repositories,lib}/
components/{ui,<domain>}/  hooks/  lib/
prisma/schema.prisma            # database schema
e2e/                            # Playwright specs
```

---

## Scripts

| Command                              | What it does                                    |
| ------------------------------------ | ----------------------------------------------- |
| `pnpm dev`                           | Turbo: run dev for all apps                     |
| `pnpm -C apps/web dev`               | Web dev server                                  |
| `pnpm -C apps/mobile start --dev-client` | Mobile Metro bundler                        |
| `pnpm type-check` · `pnpm lint`      | Type-check / lint all packages                  |
| `pnpm test`                          | Turbo: run tests (Vitest units + Playwright e2e) |
| `pnpm -C apps/web prisma:migrate`    | Apply database migrations                       |
| `pnpm -C apps/web prisma:seed`       | Seed the default user + parent account          |
| `pnpm -C packages/shared tokens`     | Regenerate design tokens for web + mobile       |

---

## Deployment

The web app deploys to **Vercel** (`output: 'standalone'`). Environment variables
(`DATABASE_URL`, `SESSION_SECRET`, `UPSTASH_*`, Sentry) are configured on the Vercel
project and injected in CI from GitHub secrets. Full setup and the required-variable
checklist: [`docs/deployment-setup.md`](docs/deployment-setup.md).

The mobile app is distributed via **EAS build** (`apps/mobile/eas.json` profiles:
`development`, `preview`, `production`) — see [`docs/eas.md`](docs/eas.md).
