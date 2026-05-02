# Team Workflow — Kid Hub

**Version:** 1.0
**Date:** 2026-05-02
**Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · Prisma 7 · PostgreSQL · Server Actions · Playwright

This document defines how a feature moves from a PM's specification through Design, Development, and QA on this specific codebase. Every step references the actual directories and patterns that exist in the repo.

---

## The Four Roles

| Role | Owns | Primary files touched |
|------|------|-----------------------|
| **PM** | Spec, acceptance criteria, risk review | `docs/`, `prisma/schema.prisma` (data model review) |
| **Designer** | Visual design, Tailwind tokens, component inventory | `app/globals.css`, `components/ui/`, Figma/Excalidraw |
| **Lead Dev** | Service + repository implementation, action wiring | `server/`, `hooks/`, `types/index.ts` |
| **QA** | E2E test authoring, acceptance sign-off | `e2e/`, `playwright.config.ts` |

---

## Phase 0 — Kick-off (PM)

**Goal:** Produce a spec that all three other roles can act on independently.

**Steps:**

1. **Write a spec doc** in `docs/specs/<feature-slug>.md`. Minimum required sections:
   - User story ("As a [kid/parent], I want to…")
   - Acceptance criteria (numbered list, each testable)
   - Data model changes (new Prisma fields/tables, or explicit "no schema change")
   - Which route group is affected: `(dashboard)`, `(games)`, or `(parent)`
   - Out-of-scope items

2. **Review the Stability Plan** (`docs/STABILITY_PLAN.md`) — confirm the feature does not touch any P0/P1 risk areas without a paired fix.

3. **Open the GitHub issue** and attach the spec. Assign Designer and Lead Dev in parallel.

**Gate:** Designer and Lead Dev both confirm the spec is unambiguous before either starts work.

---

## Phase 1 — Design (Designer)

**Goal:** Produce implementation-ready Tailwind class decisions, not just a visual mock.

### 1a. Token check

Before writing any new classes, check `app/globals.css`:

- Are there existing `@theme {}` tokens that cover this feature's colors, radii, and spacing?
- If a new visual concept is introduced (new status color, new card shape), add it to `@theme {}` first — do not hard-code a Tailwind palette value.

```css
/* globals.css — add new tokens here, not in component files */
@theme {
  --color-new-concept: #hexvalue;
  --radius-new-shape: Xrem;
}
```

### 1b. Component inventory

Answer these questions before designing new markup:
- Does a `/components/ui/` primitive already exist that covers this pattern? (`KidButton`, `KidCard`, `Badge`, `ProgressBar`, `StarRating`, `PinKeypad`, `FullScreenModal`, `ErrorBoundary`)
- If the pattern appears in more than one place, create a new `components/ui/<Name>.tsx` rather than duplicating inline styles.
- Check the known missing abstractions (from the design audit): `FormInput`, `FormSelect`, `ErrorBanner`, `TabSwitcher`, `LivePulseIndicator`, `StatusPill`. If this feature needs one of these, build the abstraction, not the one-off.

### 1c. Press/animation standards

| Interaction | Standard class |
|------------|----------------|
| Button press | `active:scale-[0.97] transition-transform duration-100` |
| Card lift | `hover:-translate-y-1 transition-[transform,box-shadow] duration-200` |
| Page-level entry | Handled by `app/(dashboard)/template.tsx` — no per-component animation needed |
| Feedback flash (game) | `bg-emerald-900/40` (correct) / `bg-red-900/40` (wrong) — use these exact values |

### 1d. Deliverable

A written design spec (can be inline in the GitHub issue) listing:
- New `@theme` tokens to add (if any)
- New `components/ui/` primitives to create (if any)
- Exact Tailwind classes for each new element — the Dev should be able to copy these directly into JSX

**Gate:** Dev reviews the design spec for implementation feasibility before Phase 2 starts.

---

## Phase 2 — Implementation (Lead Dev)

Development follows the **UI → Hooks → Actions → Service → Repository** layering strictly. Each layer has one job.

### 2a. Start from the data model

If the spec requires a schema change:
1. Update `prisma/schema.prisma`
2. Run `pnpm prisma:migrate` (creates a migration in `prisma/migrations/`)
3. Update `types/index.ts` to add/modify the shared TypeScript type
4. Update the relevant repository in `server/repositories/`

Schema changes must land before any other layer is touched.

### 2b. Repository layer

**File location:** `server/repositories/<domain>.repository.ts`

Rules:
- Only Prisma calls. No business logic, no calculations, no `if` statements on data.
- Return plain typed objects matching `types/index.ts`.
- If a mutation touches a specific user's record, include `userId` in the `WHERE` clause — never rely solely on the record's own `id`.

```ts
// Good — ownership guarded
await db.classPeriod.update({ where: { id, userId }, data: { ... } })

// Bad — no ownership check
await db.classPeriod.update({ where: { id }, data: { ... } })
```

### 2c. Service layer

**File location:** `server/services/<domain>.service.ts`

Rules:
- Pure functions only. No Prisma, no `cookies()`, no `headers()`, no React.
- Add `import 'server-only'` at the top of every service file.
- This layer owns all business logic: calculations, validation rules, derivations, threshold decisions.
- If a function is also needed client-side (e.g., `calculateBadge`), extract it to `lib/<domain>-utils.ts` (no `'use server'` or `'server-only'`) and import from there in both the service and the UI.

**The lockout pattern (do not repeat the existing mistake):**
Business decisions like "should we lock this account?" belong here, not in the action:

```ts
// server/services/auth.service.ts
export const evaluateLoginAttempt = (attempts: number, submitted: string, hash: string) => {
  const valid = bcrypt.compareSync(submitted, hash)
  const shouldLock = !valid && attempts + 1 >= MAX_PIN_ATTEMPTS
  return { valid, shouldLock }
}
```

### 2d. Action layer

**File location:** `server/actions/<domain>.actions.ts`

Rules:
- Add `'use server'` directive.
- Call `requireParentSession()` at the top of every parent-only action (import from `server/lib/auth-guard.ts` — do not copy-paste the implementation).
- Validate all inputs with Zod before calling any service or repository.
- Orchestrate: call service → call repository → return `{ success, data?, error? }`. No business logic lives here.

```ts
export async function createPeriodAction(raw: unknown) {
  await requireParentSession()                          // auth guard
  const input = CreatePeriodSchema.parse(raw)          // validation
  const conflict = await scheduleRepo.findOverlap(...) // repo call
  scheduleService.assertNoOverlap(conflict, input)     // service (business logic)
  const period = await scheduleRepo.createPeriod(...)  // repo call
  return { success: true, data: period }
}
```

### 2e. Hook layer

**File location:** `hooks/use<Domain>.ts`

Rules:
- Client-safe only. No imports from `server/`.
- Hooks call server actions (via `import`) and manage the local optimistic state.
- Derive all computed values inside the hook; expose them as named fields. Components should not compute.

```ts
// Good
const { periods, savePeriods, isSaving, error } = useSchedule(initialSchedule)

// Bad — computation in component
const sorted = periods.sort((a, b) => a.startTime.localeCompare(b.startTime))
```

### 2f. UI layer

**File location:** `components/<domain>/`, `app/<route>/page.tsx`

Rules:
- Server Components (`page.tsx`) fetch data and pass it as props. No `'use client'` in page files.
- Client Components (`components/`) receive data as props and use hooks for mutations.
- Use design tokens from `@theme {}` — no hard-coded palette values.
- Use existing `components/ui/` primitives. Do not inline a `KidButton` manually.

### 2g. Shared utilities (avoid duplication)

| If you need | Use |
|-------------|-----|
| Auth guard in an action | `server/lib/auth-guard.ts` → `requireParentSession()` |
| Badge calculation | `lib/grading.ts` → `calculateBadge()` |
| Schedule time parsing | `lib/schedule-utils.ts` → `parseTimeToMinutes()` |
| Current academic year | `lib/constants.ts` → `CURRENT_ACADEMIC_YEAR` |
| Session duration | Export `SESSION_DURATION_SECONDS` from `server/services/auth.service.ts` |

**Gate:** Lead Dev opens a PR. The PR description must map each changed file to its layer and confirm the layer rules are respected.

---

## Phase 3 — Code Review (PM + Designer + QA)

All three non-Dev roles review before merge. Each has a specific lens:

### PM review checklist
- [ ] All acceptance criteria from the spec are implemented (verify by reading the PR, not just the description)
- [ ] No new P0/P1 stability risks introduced (see `docs/STABILITY_PLAN.md`)
- [ ] `CURRENT_ACADEMIC_YEAR`, `DEFAULT_USER_ID`, and other constants used — no new magic strings

### Designer review checklist
- [ ] No new hard-coded Tailwind palette values (e.g., `bg-yellow-400`) — tokens used instead
- [ ] `active:scale-[0.97]` used for press interactions, not `scale-95` or `scale-[0.98]`
- [ ] No new inline style blocks that duplicate an existing `components/ui/` component
- [ ] Touch targets are `min-h-16` (64px) for primary interactive elements

### QA review checklist
- [ ] New Playwright spec file exists in `e2e/<domain>/`
- [ ] Happy path, sad path (error state), and auth guard scenarios all have test cases
- [ ] Tests use `page.clock` for time-dependent logic — no `sleep` calls
- [ ] DB-touching tests use fixture helpers from `e2e/fixtures/db.ts` — no raw Prisma calls in spec files

**Gate:** All three checklists approved before merge.

---

## Phase 4 — QA Verification (QA)

After the PR merges to `main`:

1. **Run the full E2E suite** against a fresh test database:
   ```bash
   TEST_DATABASE_URL=postgres://... npx playwright test
   ```

2. **Verify the new spec file's scenarios** pass locally and in CI.

3. **Regression check** — run the auth middleware tests (`e2e/auth/middleware.spec.ts`) on every merge, regardless of what changed. The PIN lockout and session cookie are the only security gate in the app.

4. **localStorage assertions** — for any feature touching game progress, points, or streaks: assert via `page.evaluate(() => JSON.parse(localStorage.getItem('kid-hub:user-progress') ?? '{}'))`.

**Gate:** CI passes (lint + typecheck + Playwright). QA gives thumbs-up in the PR thread.

---

## Phase 5 — Deploy

1. Confirm `SESSION_SECRET` is set in the deployment environment (not the fallback string).
2. Run `pnpm prisma migrate deploy` against the production DB before deploying the new image.
3. Verify the `docker-compose.yml` `SESSION_SECRET` env var is populated if using Docker.
4. Check `docs/STABILITY_PLAN.md` for any P0 items that apply to this deploy.

---

## Security Shield — Pre-push Hook

A pre-push Git hook blocks commits containing hardcoded secrets (SESSION_SECRET values, AWS keys, API keys, PEM private keys, DB URLs with credentials, Stripe/GitHub tokens, hardcoded JWTs).

**Activate once per clone:**
```bash
chmod +x scripts/git-hooks/pre-push.sh && ln -sf ../../scripts/git-hooks/pre-push.sh .git/hooks/pre-push
```

**Test the scanner without pushing:**
```bash
echo -e "diff --git a/foo.ts b/foo.ts\n+++ b/foo.ts\n+const SESSION_SECRET = 'real-secret'" | bash scripts/git-hooks/pre-push.sh --test
```

**Bypass for a confirmed false positive (document why in the PR):**
```bash
git push --no-verify
```

Rules:
- The hook scans only *added* lines in the outgoing diff — removals and context lines are ignored.
- `.env.example`, lock files, and the hook script itself are excluded from scanning.
- E2E fixture JWTs must be generated at test runtime (not hardcoded). If unavoidable, add the fixture file to `EXCLUDED_PATHS` in the script and note it in the PR.
- All 9 patterns were reviewed by Lead Dev for false positives (see `scripts/git-hooks/pre-push.sh` header comments).

---

## Feature Flag Protocol

This codebase does not currently have a feature flag system. Until one is added:
- Incomplete features must be behind a route that is not linked from the UI, **not** behind commented-out code.
- Any "hidden" route must still be protected by middleware if it touches parent data.

---

## Quick Reference — Where Does This Code Go?

| You are implementing... | Layer | Directory |
|------------------------|-------|-----------|
| A new Prisma query | Repository | `server/repositories/` |
| A business rule / calculation | Service | `server/services/` |
| An auth-guarded mutation exposed to the UI | Action | `server/actions/` |
| A shared pure utility (safe for client + server) | Lib | `lib/` |
| Client state management + action calling | Hook | `hooks/` |
| A reusable UI element | UI Primitive | `components/ui/` |
| A domain-specific presentational component | Domain Component | `components/<domain>/` |
| A page that fetches data from the DB | Server Component | `app/<route-group>/<route>/page.tsx` |
| A Tailwind design token | Theme | `app/globals.css` → `@theme {}` |
| An E2E test | Test | `e2e/<domain>/<feature>.spec.ts` |

---

## Anti-Patterns (Do Not Do)

| Anti-pattern | Why | Where it currently exists |
|-------------|-----|--------------------------|
| Copy-paste `requireParentSession` into a new action | Auth logic silently diverges | `grades.actions.ts:27`, `schedule.actions.ts:37` |
| Hard-code `'2025-2026'` or `'khoi'` in a component | Breaks when data changes | `GradesManager.tsx:38`, `useGrades.ts:35` |
| Define `calculateBadge` in both `lib/utils.ts` and a service | Thresholds drift | `lib/utils.ts:44`, `grades.service.ts:8` |
| Write `semester: number` when the domain type is `1 \| 2` | Accepts invalid data at the repo boundary | `grades.repository.ts:14` |
| Use `bg-yellow-400` instead of a design token | Design drifts from the token system | `GameResultScreen.tsx:69` |
| Put business logic in an action (`shouldLock = attempts >= 5`) | Actions can't be unit-tested in isolation | `auth.actions.ts:82` |
| Import from `server/` inside a hook or component | Crashes at runtime (client bundle) | Not present yet — keep it that way |

---

## Appendix — Test Scenario Taxonomy

Every new feature must cover at minimum:

| Scenario type | Example |
|--------------|---------|
| Happy path | Parent saves a new schedule period; it appears on the kid's schedule page |
| Auth guard | Unauthenticated request to a parent action returns "Unauthorized" |
| Validation error | Submitting a score > 10 is clamped to 10 |
| Empty state | Schedule page with no periods in DB renders without crashing |
| Concurrent/race | (Where applicable) Two simultaneous saves do not corrupt state |

See `e2e/` for the full test catalogue and `e2e/fixtures/` for shared helpers.
