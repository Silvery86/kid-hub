# Kid Hub — Feature Implementation Backlog

> **Audit date:** 2026-05-31 · **Framework:** Next.js 16 App Router · **ORM:** Prisma 7
> **Status:** Review — no code changed

---

## Contents

### Product Features

1. [P0 — Homework Reward Loop Unification](#p0--homework-reward-loop-unification)
2. [P1 — Parent Notification Center](#p1--parent-notification-center)
3. [P1 — Adaptive Practice Recommendations](#p1--adaptive-practice-recommendations)
4. [P2 — Parent Weekly Planning Wizard](#p2--parent-weekly-planning-wizard)
5. [P2 — Offline-First Homework Sync Queue](#p2--offline-first-homework-sync-queue)

### Engineering & Reliability

6. [P0 — CI Pipeline](#p0--ci-pipeline)
7. [P1 — Route-Level error.tsx and not-found.tsx](#p1--route-level-errortsx-and-not-foundtsx)
8. [P1 — Security Headers in next.config.ts](#p1--security-headers-in-nextconfigts)
9. [P1 — Ownership Guard Audit in Repositories](#p1--ownership-guard-audit-in-repositories)

---

## P0 — Homework Reward Loop Unification

> **Subtitle:** One canonical completion action + reusable checkbox UI across `/dashboard` and `/homework`

### Current State (Bug)

There are **two separate completion triggers** for homework today:

- `toggleHomeworkDoneAction` in `server/actions/schedule.actions.ts` — called by `HomeworkCheckbox.tsx`. Awards points via `awardPointsAction` and logs activity.
- `markHomeworkDoneAction` in `server/actions/homework.actions.ts` — called from `HomeworkListView.tsx` via `HomeworkItemRow`. Does **not** award points or log activity.

> **Bug today:** A child completing homework from the `/homework` page earns zero points and generates no activity log. Only the Dashboard's `HomeworkCheckbox` correctly rewards completion.

### What Changes

- **Canonical Action (single source of truth):** Delete `markHomeworkDoneAction`. Promote `toggleHomeworkDoneAction` as the single completion action. Rename it to `completeHomeworkAction` for clarity.
- **Reusable HomeworkCheckbox:** Move `HomeworkCheckbox.tsx` from `components/dashboard/` to `components/homework/` and use it in *both* `HomeworkListView` and `DashboardView`.

### Files to Create / Modify

| Change | File | Notes |
|---|---|---|
| MODIFY | `server/actions/schedule.actions.ts` | Rename `toggleHomeworkDoneAction` → `completeHomeworkAction`. Make points + activity logging non-optional. |
| DELETE | `markHomeworkDoneAction` in `server/actions/homework.actions.ts` | Keep `getTodayHomeworkAction` (read-only, still used by both pages). |
| MOVE | `components/dashboard/HomeworkCheckbox.tsx` → `components/homework/HomeworkCheckbox.tsx` | Update import path everywhere. |
| MODIFY | `components/homework/HomeworkListView.tsx` | Replace direct action call with shared `HomeworkCheckbox` + call `completeHomeworkAction`. |
| MODIFY | `components/dashboard/DashboardView.tsx` | Update import path for `HomeworkCheckbox` (now in `components/homework/`). |

### Implementation Steps

1. In `schedule.actions.ts`, rename `toggleHomeworkDoneAction` to `completeHomeworkAction` and ensure the points + activity log branch runs whenever `isDone === true`.
2. Move `components/dashboard/HomeworkCheckbox.tsx` to `components/homework/HomeworkCheckbox.tsx`. Update all imports.
3. In `HomeworkListView.tsx`, replace the `onRowDone` callback chain with `HomeworkCheckbox` (which calls `completeHomeworkAction` directly).
4. Delete `markHomeworkDoneAction` from `homework.actions.ts`. Run `pnpm lint` to catch dead imports.
5. Verify in browser: complete homework from `/homework` page → confirm points increment and activity entry appear on `/parent/kid-access`.

> **No schema change required.** The `DailyHomework` model is correct.

---

## P1 — Parent Notification Center

> **Subtitle:** Activity digest cards with filter by date/action type — surfaced in parent dashboard

### Current State

The `ActivityEvent` table is fully implemented and logged correctly from game completions and homework done events. However the only parent-facing surface is a small recent activity panel in `/parent/kid-access`. There is no dedicated notification view, no type filtering, and no date grouping.

### What Changes

- **New Route: `/parent/notifications`** — Dedicated page in `(parent)` route group. Fetches full activity history with optional filter params.
- **Enhanced Action** — Extend `getRecentActivityAction` to accept `type?` and `date?` filters.
- **Dashboard Badge** — Add unread activity count badge to parent sidebar nav item.

### Files to Create / Modify

| Change | File | Notes |
|---|---|---|
| NEW | `app/(parent)/parent/notifications/page.tsx` | Server Component. Fetches activity with optional `type` and `date` from searchParams. Renders `NotificationCenterView`. |
| NEW | `components/parent/NotificationCenterView.tsx` | Client component. Renders grouped activity cards. Filter bar: "All", "Homework", "Games". Date grouping (Today / Yesterday / Earlier). |
| MODIFY | `server/actions/kid-access.actions.ts` | Extend `getRecentActivityAction` to accept optional `{ type?: string; date?: string; limit?: number }`. |
| MODIFY | `server/repositories/activity.repository.ts` | Add `getActivityFeed(userId, opts)` that accepts `type?`, `date?`, `limit` and builds a dynamic Prisma `where`. |
| MODIFY | `components/parent/ParentDashboardView.tsx` | Add "Notifications" link in parent sidebar. Show unread count badge if any events in last 24h. |

### Implementation Steps

1. Update `activity.repository.ts`: add `getActivityFeed(userId, { type?, date?, limit })` using `prisma.activityEvent.findMany` with conditional `where` clauses.
2. Update `kid-access.actions.ts`: accept filter params, call new repository method.
3. Create `app/(parent)/parent/notifications/page.tsx` — read `searchParams`, call action, pass to view.
4. Create `components/parent/NotificationCenterView.tsx` — group activities by date using a helper. Render type-filter chips. Each card shows icon, label, timestamp.
5. Add nav link to `/parent/notifications` in parent layout sidebar.
6. Optional: add a `getUnreadActivityCountAction` (count events since last parent login) for badge display.

> **No schema change required.** The existing `ActivityEvent` model covers all needed data. Activity types to support: `GAME_COMPLETE` and `HOMEWORK_DONE`.

---

## P1 — Adaptive Practice Recommendations

> **Subtitle:** Rules-based engine tying grades + game scores to next-step suggestions

### Current State

The schema tracks `SubjectGrade` (0–10 score + badge tier) and `MathProgress` / `EnglishProgress` (level, correctCount, incorrectCount, starsEarned). However, no service or component consumes this data to suggest next steps.

### Rules Engine Design (No ML)

```typescript
// lib/recommendations.ts  — pure function, no DB calls

type Recommendation = {
  subjectId: string;
  action: 'practice' | 'advance' | 'review';
  reason: string;
  targetLevel?: number;
};

// Rules:
// 1. Grade badge === 'needs_practice' → recommend REVIEW game at current level
// 2. Grade badge === 'good' + game accuracy < 70% → recommend PRACTICE at same level
// 3. Grade badge === 'excellent' + game accuracy >= 80% → recommend ADVANCE to next level
// 4. No grade recorded → recommend PRACTICE at level 1
```

### Files to Create / Modify

| Change | File | Notes |
|---|---|---|
| NEW | `lib/recommendations.ts` | Pure function `buildRecommendations(grades, mathProgress, englishProgress): Recommendation[]`. No Prisma imports. |
| NEW | `server/actions/recommendations.actions.ts` | `getRecommendationsAction()` — fetches grades + game best scores, passes to `buildRecommendations`, returns result. |
| NEW | `components/dashboard/RecommendationPanel.tsx` | Read-only panel for kid. Shows 1–3 cards like "Practice Math counting!" with a link to the relevant game. |
| MODIFY | `app/(dashboard)/dashboard/page.tsx` | Parallel-fetch `getRecommendationsAction()` alongside existing fetches. Pass to `DashboardView`. |
| MODIFY | `components/dashboard/DashboardView.tsx` | Accept `recommendations` prop. Render `RecommendationPanel`. |

### Implementation Steps

1. Write `lib/recommendations.ts` with the rules function. Unit-testable — no DB.
2. Create `server/actions/recommendations.actions.ts`. Parallel-fetch grades + game best scores.
3. Create `RecommendationPanel` component — shows 1–3 cards with subject emoji, label, and a button linking to `/math?level=1&minigame=counting`.
4. Wire into `dashboard/page.tsx` and `DashboardView`.
5. Later: make Math/English hub read a `?level` query param to pre-select the recommended level.

> **Game hub deeplink:** The `/math` and `/english` pages currently don't read query params to set the starting level. A small addition to the game hub components will be needed.

---

## P2 — Parent Weekly Planning Wizard

> **Subtitle:** Template-based schedule generation + copy-week action

### Current State

The `ScheduleManager` handles full CRUD for school periods, extra classes, and daily homework. Every period must be created manually. There is no copy-week feature, no schedule template, and no week-to-week bulk creation.

### Original Plan — Wizard Tab inside ScheduleManager

Add a fourth "Wizard" tab alongside School · Evening · Homework tabs in the existing component.

Two sub-tabs:

- **Copy Week** — date pickers for source/target week, confirm button.
- **Templates** — list of template cards with "Apply" button.

**Files:**

| Change | File | Notes |
|---|---|---|
| NEW | `server/actions/schedule-wizard.actions.ts` | `copyHomeworkWeekAction(sourceWeekStart, targetWeekStart)`, `applyScheduleTemplateAction(templateId)` |
| NEW | `server/services/schedule-wizard.service.ts` | Pure logic: date offset calculation, template expansion, conflict detection |
| MODIFY | `server/repositories/schedule.repository.ts` | Add `bulkCreateDailyHomework(items[])` using `prisma.dailyHomework.createMany()`. Add `bulkCreatePeriods(items[])`. |
| NEW | `lib/schedule-templates.ts` | Static array of `ScheduleTemplate` objects (name, periods definition). No DB. |
| NEW | `components/parent/ScheduleWizardPanel.tsx` | UI panel inside ScheduleManager. |
| MODIFY | `components/parent/ScheduleManager.tsx` | Add a "Wizard" tab. Renders `ScheduleWizardPanel`. |

### Alternative Approaches — Comparison

See the full alternatives review at the bottom of this document.

| Option | Scope | Schema Change? | Conflict Preview? | Template Support? | Best For |
|---|---|---|---|---|---|
| A — Wizard Tab *(original)* | Medium | No | No | Yes (static) | Teams already committed to the original plan |
| B — Dedicated Route | Medium+ | No | **Yes** | Yes (static) | Best long-term UX; clear step-by-step with conflict safety |
| C — Inline Per-Day Repeat | Small | No | No | No | Fast MVP; covers 80% of need with minimal code |
| D — Auto-Detect Banner | Small | No | No | No | Zero-friction complement; pair with C for full coverage |
| E — Recurring Rules Engine | Large | **Yes** | N/A | N/A | Future multi-child/multi-tenant expansion only |

> **Suggested path:** Implement **Option C + D together** as the fastest path to a working planning feature (1–2 days). If a template-based workflow is still needed after user feedback, upgrade to **Option B** (dedicated wizard route) rather than crowding ScheduleManager further.

> **Conflict handling:** `DailyHomework` has no unique constraint on `(userId, date, subjectId)`. The copy action must decide: skip duplicates (safe) or replace (destructive). Default to `skipDuplicates`.

---

## P2 — Offline-First Homework Sync Queue

> **Subtitle:** Queue server actions and replay when connectivity returns

### Current State

The service worker in `public/sw.js` uses cache-first for static assets and network-first for navigation. It does not queue failed mutations. If a tablet goes offline while a child is marking homework done, the action silently fails with no retry or feedback.

> **Complexity note:** Full offline sync requires IndexedDB + Background Sync API. The Background Sync API is not supported on all browsers (notably iOS Safari). A pragmatic approach: queue in IndexedDB, drain on next online event.

### What Changes

- **IndexedDB Queue** — A lightweight client store that holds pending action calls (actionName + serialized args) when the network is unavailable.
- **Online Event Drain** — On `window.addEventListener('online')`, drain the queue sequentially, calling each queued server action.

### Files to Create / Modify

| Change | File | Notes |
|---|---|---|
| NEW | `lib/offline-queue.ts` | Client-only. Wraps IndexedDB: `enqueue(actionName, args)`, `drain(handlers)`, `getQueueLength()`. |
| NEW | `hooks/useOfflineQueue.ts` | Client hook. Listens to `online` event. On reconnect, calls `drain()` with registered action handlers. Exposes `pendingCount`. |
| MODIFY | `components/homework/HomeworkCheckbox.tsx` | Wrap the action call with an online check: if offline, `enqueue('completeHomework', { id, isDone })` and apply optimistic UI. |
| MODIFY | `app/(dashboard)/layout.tsx` | Mount `useOfflineQueue` here so it runs for all dashboard pages. Show a small "X pending changes" indicator. |

---

## P0 — CI Pipeline

> **Subtitle:** GitHub Actions workflow protecting every PR and push to main

### Current State

Only one GitHub Actions workflow exists: `.github/workflows/design-check.yml` (runs `pnpm design:check`). There is no lint, no TypeScript type check, no build verification, and no Playwright smoke test in CI.

### CI Workflow

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm format:check
      - run: pnpm exec tsc --noEmit

  build:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build

  playwright:
    runs-on: ubuntu-latest
    needs: build
    env:
      DATABASE_URL: ${{ secrets.CI_DATABASE_URL }}
      SESSION_SECRET: ${{ secrets.CI_SESSION_SECRET }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test --project=chromium
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

> **Required secrets:** `CI_DATABASE_URL` and `CI_SESSION_SECRET` must be added to GitHub repo settings before the playwright job can run.

### Files to Create / Modify

| Change | File |
|---|---|
| NEW | `.github/workflows/ci.yml` |

---

## P1 — Route-Level error.tsx and not-found.tsx

### Current State

Zero `error.tsx` files exist. A DB timeout in `dashboard/page.tsx` will crash the segment with no fallback UI. No `not-found.tsx` — missing pages get raw Next.js defaults.

### Files to Create

```
app/(dashboard)/error.tsx
app/(dashboard)/not-found.tsx
app/(games)/error.tsx
app/(parent)/error.tsx
app/not-found.tsx
```

Each `error.tsx` should render a friendly Vietnamese error message with a "Try again" button that calls `reset()`.

---

## P1 — Security Headers in next.config.ts

### Current State

`next.config.ts` sets only `Service-Worker-Allowed`. No CSP, `X-Frame-Options`, `X-Content-Type-Options`, or `Referrer-Policy` headers are set.

### Headers to Add

```typescript
// next.config.ts
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
]
```

CSP must be added carefully after auditing all inline scripts and external resource origins.

---

## P1 — Ownership Guard Audit in Repositories

### Current State

`schedule.repository.ts` `updatePeriod` and `deletePeriod` issue `WHERE id = ?` with no `userId` filter. The action layer verifies the session, but the DB layer has no ownership guard — a bug that matters if multi-user support is ever added.

### Fix

For every mutation in every repository that touches a user-owned record, add `userId` to the `WHERE` clause:

```typescript
// Good — ownership guarded
await db.classPeriod.update({ where: { id, userId }, data: { ... } })

// Bad — no ownership check
await db.classPeriod.update({ where: { id }, data: { ... } })
```

**Repositories to audit:**

- `server/repositories/schedule.repository.ts` — `updatePeriod`, `deletePeriod`
- `server/repositories/grades.repository.ts` — `upsertGrade`
- `server/repositories/homework.repository.ts` — all mutations

---

## Appendix — Weekly Planning Wizard Alternatives (Full Detail)

### Option A — Wizard Tab inside ScheduleManager (Original Plan)

**Pros:**

- No new route or navigation changes
- Shares existing ScheduleManager state (selected day, week) without prop drilling
- Consistent with current tab pattern users already know

**Cons:**

- `ScheduleManager.tsx` is already 33KB — adding more state + UI pushes it past maintainability threshold
- Wizard flow (multi-step preview → confirm) doesn't fit naturally in a side tab
- Hard to surface to a first-time parent

**Flow:**

1. Parent opens `/schedule` → taps "Wizard" tab (4th tab in ScheduleManager).
2. Two sub-tabs appear: **Copy Week** and **Templates**.
3. *Copy Week:* pick source week → pick target week → press "Copy" → toast confirmation.
4. *Templates:* list of static template cards → press "Apply" → bulk-creates ClassPeriods (skipDuplicates).

---

### Option B — Dedicated Full-Page Wizard Route (Recommended Long-Term)

New route `/parent/schedule/wizard` with a proper multi-step flow: Choose → Configure → Preview → Confirm.

**Pros:**

- Full screen space for a clear step-by-step UX
- Step 3 (Preview) can show a diff table: "will create X items, skip Y duplicates, replace Z conflicts"
- Keeps `ScheduleManager.tsx` at its current size
- Easy to deep-link: parent can bookmark `/parent/schedule/wizard`

**Cons:**

- Larger scope: new route, new page component, new nav entry
- Parent must navigate away from ScheduleManager to use it
- Requires a `previewCopyWeekAction` (dry-run) in addition to the actual `copyHomeworkWeekAction`

**Flow:**

1. Parent taps "Planning Wizard" link in parent sidebar.
2. **Step 1 — Choose:** two large cards: "Copy a Past Week" or "Apply a Template".
3. **Step 2 — Configure:** pick source week + target week, or select a template.
4. **Step 3 — Preview:** server calls `previewCopyWeekAction` (dry-run, no writes). Shows table: green rows = will create, yellow = duplicate skip, red = conflict.
5. **Step 4 — Confirm:** single "Apply" button. Redirect to `/parent/schedule` on success.

---

### Option C — Inline Per-Day Quick-Repeat (Fast MVP)

Each day column in ScheduleManager gets a "↻ Copy from last week" icon button.

**Pros:**

- Smallest possible scope — one new action + one button per day column
- Surgical: parent repeats only the days they want
- Zero discovery problem — the button is always visible

**Cons:**

- No template support
- Copying one day at a time is tedious for a full 5-day school week
- No conflict preview

**Flow:**

1. Parent opens `/schedule`, navigates to a future week.
2. Each day card that has no homework shows a "↻ from last week" ghost button in the header.
3. Parent taps the button for Monday → `copyDayHomeworkAction('monday', sourceDate, targetDate)` fires immediately.
4. Homework items appear with an optimistic update. Toast confirms "3 items copied".

---

### Option D — Smart Auto-Detect Banner (Zero-UI)

Detect when a new week starts (no homework exists for the current week) and automatically prompt "Copy from last week?" with a one-click confirm.

**Pros:**

- No UI to discover — the prompt appears exactly when and where it's needed
- Lowest cognitive load: one decision (Yes / No / Dismiss), no wizard steps
- No new routes or navigation entries required

**Cons:**

- Only triggers when the current week is empty
- Copies the entire week blindly — no per-day control
- "Dismiss" state needs to be persisted in `localStorage`
- Confusing if last week was a holiday or unusual

**Flow:**

1. Parent opens `/schedule` on Monday of a week with zero `DailyHomework` entries.
2. Banner appears: "No homework set for this week. Copy from last week? [Copy Now] [Dismiss]"
3. Parent taps "Copy Now" → `copyHomeworkWeekAction` fires with last week as source.
4. If dismissed, store a flag in `localStorage` keyed by ISO week number.

---

### Option E — Recurring Homework Rules Engine (Future)

Define rules ("Math every Monday, 10 pts") that auto-generate `DailyHomework` entries.

**Pros:**

- Solves the root problem permanently — parent sets rules once, system generates homework forever
- No manual copy or wizard interaction needed after initial setup

**Cons:**

- **Requires a schema change:** new `RecurringHomeworkRule` model
- Requires a generation trigger: either a server action called on page load or a daily cron job
- Highest implementation complexity of all five options
- Risk: generated entries conflict with manually-entered homework

> **Not recommended for current scope.** Revisit if the app expands to multiple children or a multi-tenant setup.
