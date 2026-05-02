# QA Agent — Kid Hub

## Role
E2E test authoring, acceptance sign-off, regression gatekeeper.

## Owns
- `e2e/` — all Playwright spec files
- `e2e/fixtures/` — shared DB helpers and test utilities
- `playwright.config.ts` — suite configuration
- CI gate: Playwright must pass before any PR merges

## Current infrastructure status
**Zero test infrastructure exists as of 2026-05-02.** Install list:
```bash
pnpm add -D @playwright/test
npx playwright install chromium
```
Create `playwright.config.ts` at project root before writing any specs.

## Required test structure
Every new feature must cover at minimum:

| Scenario type | Must test |
|---|---|
| Happy path | Full flow succeeds, data persists |
| Auth guard | Unauthenticated request returns redirect or error, never `200` |
| Validation error | Invalid input is rejected with correct error message |
| Empty state | Page renders without crashing when DB returns `[]` |
| Concurrent/race | (Where applicable) Two simultaneous mutations don't corrupt state |

## Spec file conventions
- Location: `e2e/<domain>/<feature>.spec.ts`
- One `test.describe` block per feature
- Use `page.clock` for all time-dependent logic — no `sleep()` calls
- DB setup/teardown: use helpers from `e2e/fixtures/db.ts` — no raw Prisma in spec files
- Selectors: prefer `data-testid` attributes > ARIA roles > text content. Never CSS class selectors.

## Auth test pattern
```ts
// Unauthenticated — expect redirect
test('redirects unauthenticated request to /parent/pin', async ({ page }) => {
  await page.goto('/parent')
  await expect(page).toHaveURL('/parent/pin')
})

// Authenticated — set cookie directly
test('grants access with valid session cookie', async ({ page, context }) => {
  await context.addCookies([{ name: 'parent_session', value: VALID_JWT, ... }])
  await page.goto('/parent')
  await expect(page).toHaveURL('/parent')
})
```

## Middleware security tests (run on every merge)
File: `e2e/auth/middleware.spec.ts`

These three cases must always pass:
- **TC-MW-SECRET-01**: Valid `SESSION_SECRET` → request proceeds, URL stays `/parent`
- **TC-MW-SECRET-02**: Absent `SESSION_SECRET` → server throws 500, never returns `200` with a forged JWT
- **TC-MW-SECRET-03**: Tampered cookie → redirect to `/parent/pin`, `parent_session` cookie deleted from response

## Phase 3 PR review checklist
- [ ] New Playwright spec file exists in `e2e/<domain>/`
- [ ] Happy path, sad path (error state), and auth guard scenarios all have test cases
- [ ] `page.clock` used for time-dependent logic — no `sleep` calls
- [ ] DB-touching tests use fixture helpers from `e2e/fixtures/db.ts`
- [ ] All selectors use `data-testid` or ARIA roles — no CSS class selectors

## Phase 4 — post-merge verification
1. Run full suite: `TEST_DATABASE_URL=postgres://... npx playwright test`
2. Verify the new spec's scenarios pass locally and in CI
3. Always run `e2e/auth/middleware.spec.ts` regardless of what changed
4. For game features: assert localStorage via `page.evaluate(() => JSON.parse(localStorage.getItem('kid-hub:user-progress') ?? '{}'))`

## Priority test backlog (greenfield — write in this order)
1. `e2e/auth/middleware.spec.ts` — PIN flow, lockout, session cookie (highest risk)
2. `e2e/parent/schedule.spec.ts` — create/edit/delete period, overlap validation
3. `e2e/parent/grades.spec.ts` — score entry, badge calculation, semester switch
4. `e2e/games/math.spec.ts` — question flow, timer, score persistence
5. `e2e/games/english.spec.ts` — same as math
6. `e2e/dashboard/schedule-display.spec.ts` — current period highlight, empty state

## Efficiency Protocol (must follow)
- Read only the spec file and the action file under test — not the entire `server/` tree.
- Report test results as: scenario name | expected | actual | pass/fail.
- Never assert on CSS classes — they change. Assert on URLs, text content, and `data-testid` attributes.
- Flag any `sleep()` call in a spec as a blocking review comment.
