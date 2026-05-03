# Kid Hub — Project Summary

Generated: 2026-05-03 | Status: Living document

---

## Overview

Kid Hub is a Next.js 16 (App Router) family dashboard for a single household: one parent account
(PIN-protected) and one kid profile (grade 1–5 student). It is a Progressive Web App (PWA) built for
mobile-first use on a phone or tablet.

**Stack:** React 19 · Tailwind CSS v4 · Prisma 7 · PostgreSQL 16 · Server Actions · Upstash Redis ·
Playwright (E2E)

---

## Architecture: UI → Hooks → Actions → Service → Repository

All data flows in one direction. Each layer has a single responsibility.

```
Browser
  │
  ├── app/<route>/page.tsx          Server Component — fetches data, passes as props
  │     └── components/<domain>/   Presentational — receives props, no fetch calls
  │           └── components/ui/   UI Primitives — no domain knowledge (Button, Card, etc.)
  │
  ├── hooks/                        Client-only — calls Server Actions, owns optimistic state
  │
Server boundary ──────────────────────────────────────────────────────────────
  │
  ├── server/actions/               "use server" — requireParentSession + Zod + orchestrate only
  │     └── server/services/        server-only — pure functions, all business rules live here
  │           └── server/repositories/  Prisma only — no logic, userId in every mutation WHERE
  │
  └── lib/                          Pure utils — safe for client AND server (no Node.js APIs)
```

### Layer Rules (enforced in code review)

| Layer | Import Rule | Anti-pattern |
|---|---|---|
| Repository | Prisma only | No `fetch()`, no business logic |
| Service | `import 'server-only'` at top | No direct Prisma in actions |
| Action | Import `requireParentSession` from `server/lib/auth-guard.ts` | No copy-paste auth guard |
| Hook | No import from `server/` | Crashes the client bundle |
| Page | No direct DB calls | Must go through actions or services |

---

## Route Groups

| Group | Path prefix | Purpose |
|---|---|---|
| `(dashboard)` | `/dashboard`, `/grades`, `/schedule` | Kid-facing views |
| `(games)` | `/math`, `/english` | Interactive learning games |
| `(parent)` | `/parent`, `/parent/pin` | Parent management (PIN-protected) |

The root `/` page.tsx redirects to `/dashboard`.

---

## Data Models (Prisma)

| Model | Table | Key fields |
|---|---|---|
| `User` | `users` | `id`, `name`, `gradeLevel`, `avatarUrl` |
| `ParentPin` | `parent_pins` | `hash` (bcrypt), `attempts`, `lockedUntil` |
| `ClassPeriod` | `class_periods` | `userId`, `day` (enum), `periodNumber`, `startTime`, `endTime` |
| `SubjectGrade` | `subject_grades` | `userId`, `subjectId`, `score` (0–10), `badge`, `semester`, `academicYear` |
| `UserProgress` | `user_progress` | `totalPoints`, `currentStreak`, `lastActiveDate` |
| `EarnedBadge` | `earned_badges` | `userProgressId`, `badgeId` |
| `GameBestScore` | `game_best_scores` | `userProgressId`, `gameType`, `level`, `score`, `starsEarned` |

**Database-enforced uniqueness:**
- ClassPeriod: `(userId, day, periodNumber)` — prevents duplicate schedule slots
- SubjectGrade: `(userId, subjectId, semester, academicYear)`
- EarnedBadge: `(userProgressId, badgeId)`
- GameBestScore: `(userProgressId, gameType, level)`

---

## Tailwind CSS v4 Design System

**Token location: `app/globals.css` inside the `@theme {}` block only.**
Never put design tokens in `:root {}` — only `@theme {}` generates Tailwind utility classes.

### Subject Colours

| Token | Utility | Hex |
|---|---|---|
| `--color-math` | `bg-math`, `text-math` | `#3b82f6` (blue) |
| `--color-english` | `bg-english`, `text-english` | `#10b981` (emerald) |
| `--color-science` | `bg-science`, `text-science` | `#8b5cf6` (violet) |
| `--color-pe` | `bg-pe`, `text-pe` | `#f59e0b` (amber) |
| `--color-art` | `bg-art`, `text-art` | `#ec4899` (pink) |
| `--color-vietnamese` | `bg-vietnamese`, `text-vietnamese` | `#ef4444` (red) |
| `--color-music` | `bg-music`, `text-music` | `#f97316` (orange) |

### App Shell Backgrounds

| Token | Utility | Purpose |
|---|---|---|
| `--color-shell-dark` | `bg-shell-dark` | Admin / dark mode backgrounds |
| `--color-shell-light` | `bg-shell-light` | Light mode general pages |
| `--color-shell-kid` | `bg-shell-kid` | Primary kid-facing background (`#f0f9ff`) |

### Text Hierarchy

| Token | Utility | Purpose |
|---|---|---|
| `--color-text-primary` | `text-text-primary` | Body text (`#1e293b`) |
| `--color-text-secondary` | `text-text-secondary` | Supporting labels (`#64748b`) |
| `--color-text-muted` | `text-text-muted` | Placeholder / disabled (`#94a3b8`) |
| `--color-text-subtle` | `text-text-subtle` | Decorative lines (`#cbd5e1`) |

### Button Variants

| Token group | Utilities |
|---|---|
| Primary | `bg-btn-primary`, `hover:bg-btn-primary-hover`, `border-btn-primary-border` |
| Secondary | `bg-btn-secondary`, `hover:bg-btn-secondary-hover`, `border-btn-secondary-border` |
| Ghost | `border-btn-ghost-border` |

### Progress & Stars

| Token | Utility | Purpose |
|---|---|---|
| `--color-progress-high` | `bg-progress-high` | ≥ 80% fill (`#fbbf24`) |
| `--color-progress-low` | `bg-progress-low` | < 80% fill (`#fb923c`) |
| `--color-progress-track` | `bg-progress-track` | Empty track (`#e2e8f0`) |
| `--color-star-filled` | `bg-star-filled` | Earned star (`#fbbf24`) |
| `--color-star-empty` | `bg-star-empty` | Unearned star (`#cbd5e1`) |

### Spacing & Shape

| Token | Utility | Value |
|---|---|---|
| `--radius-card` | `rounded-card` | `1.5rem` |
| `--radius-pill` | `rounded-pill` | `9999px` |
| `--spacing-tap` | `min-h-tap` | `3rem` (48 px minimum touch target) |
| `--spacing-tap-lg` | `min-h-tap-lg` | `4rem` (64 px for primary actions) |

### Mobile-First Rules

1. **Touch targets:** All interactive elements must be at least `min-h-tap` (48 px).
2. **Tap delay:** `touch-action: manipulation` applied globally via `* {}` — eliminates 300 ms tap delay.
3. **Tap highlight:** `-webkit-tap-highlight-color: transparent` removes grey flash on tap.
4. **Scroll lock:** `overscroll-behavior: none` kills pull-to-refresh and rubber-band scroll.
5. **Safe areas:** Use `.safe-pad` utility class on bottom-docked elements (handles iPhone notch).
6. **No `sleep()` in tests:** Use `page.clock` (Playwright built-in) for time-dependent assertions.
7. **Animation accessibility:** `prefers-reduced-motion` rule disables all animations at OS level.

### Font

The display font is set via CSS variable `--font-display` (loaded in `app/layout.tsx`) and aliased to
`--font-sans` in `@theme {}`, making it available as the default sans-serif stack.

---

## Key Shared Utilities

| Need | Import path | Exported symbol |
|---|---|---|
| Auth guard (actions) | `server/lib/auth-guard.ts` | `requireParentSession()` |
| Badge calculation | `lib/grading.ts` | `calculateBadge()` |
| Schedule time parser | `lib/schedule-utils.ts` | `parseTimeToMinutes()` |
| Academic year constant | `lib/constants.ts` | `CURRENT_ACADEMIC_YEAR` |
| Session duration | `server/services/auth.service.ts` | `SESSION_DURATION_SECONDS` |
| Prisma client | `lib/db.ts` | `db` |

---

## Security Model

| Mechanism | Detail |
|---|---|
| Parent auth | 4-digit PIN hashed with bcrypt (cost 10), never stored plain |
| Session | HS256 JWT in `HttpOnly SameSite=lax` cookie named `parent_session` |
| Secret strength | `SESSION_SECRET` must be ≥ 32 chars — enforced at startup with `throw` |
| Rate limiting | Upstash sliding window: 10 PIN attempts per IP per 60 s |
| Edge middleware | `middleware.ts` verifies JWT before any `/parent/*` route reaches a handler |

---

## Deployment

`next.config.ts` uses `output: 'standalone'` — suitable for Docker. A `docker-compose.yml` runs
PostgreSQL 16 and the Next.js dev server with hot-reload. Production deployments should use
`npm run build && npm run start` inside the standalone container.
