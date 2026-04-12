This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

# Kid Hub

A PWA educational companion for Khôi — a Vietnamese 1st-grader. Runs full-screen on an Android tablet in landscape mode. Features a live class schedule, grade tracker, gamified progress system, and mini-games (Math & English).

---

## Table of Contents

1. [Tech Stack](#tech-stack)
2. [Quick Start — Local Dev](#quick-start--local-dev)
3. [Docker Compose Dev Stack](#docker-compose-dev-stack)
4. [Environment Variables](#environment-variables)
5. [Data Model](#data-model)
6. [Project Structure](#project-structure)
7. [Parent Mode](#parent-mode)
8. [Deployment — Google Cloud Run](#deployment--google-cloud-run)

---

## Tech Stack

| Layer     | Technology                                               |
| --------- | -------------------------------------------------------- |
| Framework | Next.js 15 (App Router, TypeScript strict)               |
| Styling   | Tailwind CSS v4 (custom CSS properties, no plugin)       |
| Icons     | lucide-react                                             |
| Font      | Nunito (via `next/font/google`)                          |
| Database  | PostgreSQL 16 (Supabase in production)                   |
| ORM       | Prisma 6                                                 |
| Container | Docker (multi-stage → standalone output)                 |
| Hosting   | Google Cloud Run                                         |
| PWA       | `public/manifest.json` + `public/sw.js` (Service Worker) |

---

## Quick Start — Local Dev

### Prerequisites

- **Node.js** ≥ 20
- **PostgreSQL 16** running locally, **or** use the Docker Compose stack below

```bash
# 1. Install dependencies
npm install

# 2. Copy env file and fill in values
cp .env.example .env.local

# 3. Run Prisma migrations
npx prisma migrate dev

# 4. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — the app immediately redirects to `/dashboard`.

---

## Docker Compose Dev Stack

Spins up **PostgreSQL 16** + the **Next.js dev server** with hot-reload in one command:

```bash
docker compose up --build
```

| Service       | URL / Port            |
| ------------- | --------------------- |
| Next.js (dev) | http://localhost:3000 |
| PostgreSQL    | localhost:5432        |

Database credentials (dev only — change in production):

- User: `kidhub` · Password: `kidhub_dev` · DB: `kidhub`

---

## Environment Variables

| Variable         | Required        | Description                                                                                            |
| ---------------- | --------------- | ------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`   | ✅              | PostgreSQL connection string. E.g. `postgresql://kidhub:kidhub_dev@localhost:5432/kidhub`              |
| `SESSION_SECRET` | ✅ (production) | Long random string used to sign session cookies for Parent Mode. Generate with `openssl rand -hex 32`. |

Create a `.env.local` file in the project root (never commit this file):

```env
DATABASE_URL=postgresql://kidhub:kidhub_dev@localhost:5432/kidhub
SESSION_SECRET=replace_with_a_long_random_string
```

---

## Data Model

All shared TypeScript types live in [`types/index.ts`](types/index.ts). The Prisma schema is at [`prisma/schema.prisma`](prisma/schema.prisma).

### Core Entities

| Entity           | Storage                                    | Description                                              |
| ---------------- | ------------------------------------------ | -------------------------------------------------------- |
| `WeeklySchedule` | `localStorage` (`kid-hub:weekly-schedule`) | Khôi's weekly class timetable. Editable via Parent Mode. |
| `SubjectGrade[]` | `localStorage` (`kid-hub:grades`)          | Semester grades for 10 subjects (0–10 scale).            |
| `UserProgress`   | `localStorage` (`kid-hub:user-progress`)   | Points, streak, earned badges, and best game scores.     |
| `ParentPin`      | `localStorage` (`kid-hub:pin-data`)        | SHA-256 hashed 4-digit PIN for the Parent Mode gate.     |

> **Architecture note:** Persistence currently uses `localStorage`. The codebase is structured for future Supabase migration — Server Action stubs exist in `server/actions/` and follow the full actions → services → repositories layering.

### Seed Data

Static seed / fallback data lives in `lib/data/`:

| File               | Contents                                                                  |
| ------------------ | ------------------------------------------------------------------------- |
| `subjects.ts`      | 10 canonical subjects with Tailwind colour and Lucide icon                |
| `schedule.ts`      | Khôi's weekly timetable (Mon–Fri, 5 periods/day)                          |
| `grades.ts`        | Sample grade data used as `localStorage` fallback                         |
| `badges.ts`        | Badge definitions catalogue                                               |
| `mathLevels.ts`    | Seeded RNG question generator (3 difficulty levels, addition/subtraction) |
| `englishLevels.ts` | 50-word bank; letter-match and picture-word generators                    |

---

## Project Structure

```
app/                    # Next.js App Router — routes only, no business logic
  (dashboard)/          # Layout: sidebar chrome    (URLs: /dashboard, /schedule, /grades)
  (games)/              # Layout: fullscreen dark    (URLs: /math, /english)
  (parent)/             # Layout: PIN-gated shell    (URL:  /parent)
components/
  ui/                   # Primitive atoms: KidButton, KidCard, Badge, ProgressBar, ErrorBoundary …
  dashboard/            # Dashboard widgets: SubjectCard, TodayTimetable, StreakWidget …
  games/                # Game components: MathGame, EnglishGame, GameHud, GameResultScreen …
  layout/               # App chrome: AppSidebar, TabletPageContainer, ServiceWorkerRegistrar …
  parent/               # Parent-only editors: ScheduleManager, GradesManager
hooks/                  # Business logic: useSchedule, useGameSession, useUserProgress …
lib/
  data/                 # Static seed data (TypeScript constants)
  constants.ts          # App-wide readonly constants
  utils.ts              # Pure helper functions (cn, formatDate, calculateScore …)
types/index.ts          # Single source of truth for all shared interfaces
server/
  actions/              # 'use server' Server Actions (auth, grades, schedule)
  services/             # Business logic and validation layer
  repositories/         # Prisma queries only — no logic here
prisma/schema.prisma    # Database schema
public/
  manifest.json         # PWA manifest (display: standalone, orientation: landscape)
  sw.js                 # Service Worker (cache-first static, network-first navigation)
  sounds/               # Audio files: correct.mp3, wrong.mp3, complete.mp3, tap.mp3
  icons/                # PWA icons: icon-192.png, icon-512.png (maskable)
```

---

## Parent Mode

Parent Mode is a PIN-protected admin surface that lets a parent update Khôi's schedule and grade data directly on the tablet.

### Access

1. From any screen, navigate to **`/parent`** (or triple-tap the logo in the sidebar).
2. Enter the 4-digit PIN when prompted.
3. You land on the Parent dashboard after a successful PIN entry.

### First-time setup

On first visit (no PIN stored), you will be asked to **create** a 4-digit PIN, then **confirm** it. The PIN is stored as a SHA-256 hash — the raw digits are never stored anywhere.

### Security

| Property      | Detail                                                         |
| ------------- | -------------------------------------------------------------- |
| PIN storage   | SHA-256 hash only (Web Crypto API — no raw PIN ever written)   |
| Lockout       | 5 failed attempts → 60-second cooldown                         |
| Session scope | Client-side only; page refresh or tab close clears the session |

### What parents can do

- **Schedule Manager** — Add, edit, or delete class periods for any day of the week.
- **Grades Manager** — Enter or update subject scores (0–10) for either semester; badge tier is calculated automatically.

---

## Deployment — Google Cloud Run

The Docker image uses `output: 'standalone'` so it ships only the minimal Node.js runtime.

### 1. Build & push image

```bash
export PROJECT_ID=your-gcp-project-id
export REGION=asia-southeast1
export IMAGE=gcr.io/$PROJECT_ID/kid-hub

docker build -t $IMAGE .
docker push $IMAGE
```

### 2. Deploy

```bash
gcloud run deploy kid-hub \
  --image $IMAGE \
  --platform managed \
  --region $REGION \
  --allow-unauthenticated \
  --set-env-vars DATABASE_URL=<supabase-url>,SESSION_SECRET=<secret> \
  --port 3000
```

### 3. Secrets (recommended)

Use [Cloud Run Secret Manager integration](https://cloud.google.com/run/docs/configuring/secrets) to mount `DATABASE_URL` and `SESSION_SECRET` as secrets rather than plain env vars.
