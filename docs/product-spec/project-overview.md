# Kid Hub — Project Overview

> **Scope:** Whole repository · **App style:** Single-household family dashboard
> **Framework:** Next.js App Router · **Audit date:** 2026-05-31

---

## Contents

1. [Technology Stack](#1-technology-stack)
2. [Project Rules and Technical Structure](#2-project-rules-and-technical-structure)
3. [Routes Overview](#3-routes-overview)
4. [Design-to-Code Process](#4-design-to-code-process)
5. [Recommended Features to Add Next](#5-recommended-features-to-add-next)

---

## 1. Technology Stack

### 1.1 Runtime and Core Framework

| Area | Technology | Notes |
|---|---|---|
| Frontend app | `next@16.1.6` (App Router), `react@19.2.3`, `react-dom@19.2.3` | — |
| Language and types | `typescript@5` strict mode | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride` enabled |
| Server mutation model | Next.js Server Actions | In `server/actions/` with Zod validation and auth checks |

### 1.2 Styling, UI, and Responsive System

| Area | Technology | Current Usage |
|---|---|---|
| CSS framework | `tailwindcss@4` | Token-based classes from `app/globals.css @theme {}` |
| Class merge helper | `tailwind-merge` + `clsx` | `lib/utils.ts` style composition |
| Icons | `lucide-react` + emoji domain icons | UI actions + subject/event icon system |
| Responsive strategy | Custom variants `portrait:` and `landscape:` | Route-level orientation-specific render paths |

### 1.3 Data and Persistence

| Layer | Technology | Notes |
|---|---|---|
| Database | PostgreSQL + `pg` | Configured via Prisma driver adapter |
| ORM | `prisma@7` + `@prisma/client@7` | Schema includes users, schedule, grades, game progress, activity logs |
| Validation | `zod` | Input schema validation in server actions |
| State management | `zustand` | Client-side progress/game state |

### 1.4 Security and Auth

| Concern | Implementation | Location |
|---|---|---|
| JWT | `jose` (kid session, parent access/refresh) | `middleware.ts`, auth service/actions |
| Password/PIN hashing | `bcryptjs` | Parent login/PIN service layer |
| Rate limiting | Upstash sliding window (`@upstash/ratelimit`, `@upstash/redis`) | Middleware POST protection on parent auth routes |
| Session transport | HttpOnly cookies | Kid and parent protected surfaces |

### 1.5 Quality Tooling and Ops

| Tool | Purpose |
|---|---|
| `eslint` | Linting with Next.js config |
| `prettier` | Code formatting |
| `playwright` | End-to-end test suite |
| `docker` + `docker-compose` | Local development environment |
| `prisma` CLI | Schema management and migrations |
| GitHub Actions | CI/CD pipeline (planned) |

---

## 2. Project Rules and Technical Structure

### 2.1 Layer Hierarchy (Strict)

```
Page (Server Component)
  └─► Server Action ('use server' + Zod + auth guard)
        └─► Service (server-only, pure functions, business logic)
              └─► Repository (Prisma only, no logic)
```

Every mutation must pass through this full stack. No bypassing layers.

### 2.2 Anti-Patterns (Enforced in Code Review)

| Anti-pattern | Why It's Banned |
|---|---|
| Copy-paste `requireParentSession` | Auth logic silently diverges — always import from `server/lib/auth-guard.ts` |
| Hard-code `'2025-2026'` or `'khoi'` | Breaks when data changes — use `lib/constants.ts` |
| Tokens in `:root {}` | Only `@theme {}` generates Tailwind utility classes |
| Business logic in an action | Actions can't be unit-tested in isolation |
| Import from `server/` inside a hook | Crashes the client bundle at runtime |
| Raw palette values (`bg-yellow-400`) for semantic purposes | Design drifts from the token system |

### 2.3 Key Shared Utilities

| Need | Import Path | Exported Symbol |
|---|---|---|
| Auth guard (actions) | `server/lib/auth-guard.ts` | `requireParentSession()` |
| Badge calculation | `lib/grading.ts` | `calculateBadge()` |
| Schedule time parsing | `lib/schedule-utils.ts` | `parseTimeToMinutes()` |
| Academic year | `lib/constants.ts` | `CURRENT_ACADEMIC_YEAR` |
| Default user | `lib/constants.ts` | `DEFAULT_USER_ID` |
| Icon map | `lib/icons.ts` | `ICON_MAP` |

---

## 3. Routes Overview

### Route Groups

| Group | Prefix | Purpose | Auth Required |
|---|---|---|---|
| `(dashboard)` | `/dashboard`, `/grades`, `/schedule`, `/homework` | Kid-facing views | Kid session |
| `(games)` | `/math`, `/english`, `/games` | Interactive learning games | Kid session |
| `(parent)` | `/parent`, `/parent/kid-access`, `/parent/pin`, `/parent/login` | Parent management | Parent session (PIN) |
| Public | `/unlock`, `/kid-unlock` | Kid pattern unlock screen | None |

### Detailed Route Catalog

| Route | Type | Primary Data | Component |
|---|---|---|---|
| `/` | Server | None — redirects | `app/page.tsx` |
| `/dashboard` | Server + Client | `getTodayViewAction`, `getProgressAction` | `DashboardView` |
| `/schedule` | Server + Client | `getScheduleAction`, today's events | `ScheduleView`, `WeekGrid` |
| `/grades` | Server | `getReportCardAction` | Inline render |
| `/homework` | Server + Client | `getTodayHomeworkAction` | `HomeworkListView` |
| `/math` | Server + Client | `getTodayMathHomework` | `MathHub` |
| `/english` | Server + Client | `getTodayEnglishHomework` | `EnglishHub` |
| `/games` | Server + Client | `getProgressAction` | `GamesHubView` |
| `/parent` | Server + Client | `getScheduleAction`, `getReportCardAction` | `ParentDashboardView` |
| `/parent/kid-access` | Server + Client | `getKidAccessSettings`, `getKidProgress` | `KidAccessView` |
| `/parent/pin` | Client | None | `PinKeypad` |
| `/parent/login` | Client | None | Login form |
| `/unlock` | Client | None | Pattern unlock |

---

## 4. Design-to-Code Process

### 4.1 How DESIGN_TO_CODE Works

`docs/design-system/design-to-code-sync.md` is a snapshot mapping routes to their design files. It tracks:

- Which `design/components/*.jsx` file covers each route
- Which viewport sizes are covered
- Whether automation checks are passing

### 4.2 Automation Checks

The design system is enforced by automated checks (`npm run design:check`):

| Check | What It Catches |
|---|---|
| Route → Design Coverage | Every app route has a corresponding design file or is explicitly skipped |
| Design File Inventory | All non-utility files in `design/components` are tracked |
| Viewport Export Coverage | Every design file exports `*TabletL` and `*PhoneP` components |
| Semantic Token Compliance | No raw Tailwind palette values in scanned `.tsx` files |

See `docs/design-system/auto-check-design.md` for full implementation details.

---

## 5. Recommended Features to Add Next

These are recommendations from the project audit. Full implementation plans are in `docs/product-spec/feature-backlog.md`.

### P0 — Critical

1. **Homework Reward Loop Unification** — Two separate completion triggers exist (`toggleHomeworkDoneAction` and `markHomeworkDoneAction`). The `/homework` page path does not award points. This is an active bug.

2. **CI Pipeline** — No automated lint, typecheck, or build verification. Broken code can merge to `main` undetected.

### P1 — High Priority

3. **Parent Notification Center** — `ActivityEvent` data is logged correctly but the only parent surface is a small panel in `/parent/kid-access`. No dedicated notification view, no type filtering, no date grouping.

4. **Adaptive Practice Recommendations** — Grade data (`SubjectGrade`) and game session data (`MathProgress`, `EnglishProgress`) are recorded but never consumed to suggest next practice steps for the child.

### P2 — Medium Priority

5. **Parent Weekly Planning Wizard** — Every schedule period must be created manually. No copy-week feature, no schedule templates, no week-to-week bulk creation. See `docs/product-spec/feature-backlog.md §wizard-alternatives` for approach comparison.

6. **Offline-First Homework Sync Queue** — If the device goes offline while a child is marking homework done, the action silently fails with no retry or feedback.

### Engineering & Reliability

7. **Route-Level `error.tsx` and `not-found.tsx`** — Zero error boundary files exist in Next.js route-level form. DB timeouts produce blank white screens.

8. **Security Headers in `next.config.ts`** — No CSP, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` headers set.

9. **Ownership Guard Audit in Repositories** — `updatePeriod` and `deletePeriod` in `schedule.repository.ts` issue `WHERE id = ?` with no `userId` filter.
