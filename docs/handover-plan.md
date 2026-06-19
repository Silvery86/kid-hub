# 30-Day Senior Developer Handover Plan

**Prepared by:** [Your Name]
**Effective Date:** Day 1 of Notice Period
**Total Notice:** 30 calendar days = 22 working days = **176 hours**

---

## Executive Summary

| Budget Item | Hours | % of Total |
|---|---|---|
| Priority 1 — Documentation | 43h | 24.4% |
| Priority 2 — Coding (budget) | 133h | 75.6% |
| Confirmed Coding Tasks | 23h | 13.1% |
| Unallocated Buffer | 110h | 62.5% |
| **TOTAL** | **176h** | **100%** |

---

## Part 1 — Documentation Estimation (Priority 1, Protected Hours)

> These hours are **non-negotiable and will not be traded for coding scope**.

| # | Module | Deliverable Description | Est. Hours |
|---|---|---|---|
| D1 | NextJS API Layer | Route map, middleware chain, auth flow, error handling conventions | 12h |
| D2 | ORM / Prisma Models | Model associations, table relationships, known gotchas | 8h |
| D3 | Environment Config & Secrets Management | All env vars, secret rotation procedure, `.env.example` | 4h |
| D4 | Git Flow | Branch strategy, commit conventions, PR rules, release process | 3h |
| D5 | Live Knowledge Transfer Sessions | 4 × structured walkthrough sessions with team (prep + delivery + notes) | 16h |
| | **PRIORITY 1 TOTAL** | | **43h** |

---

## Part 2 — Time Calculation

```
Total Available Hours            176h
Less: Priority 1 Documentation  – 43h
                                ──────
Remaining Hours for Coding       133h   ← hard ceiling
```

---

## Part 3 — Coding Task Allocation (Priority 2)

### Feature A — File Type DB Migration (KAN-295 to KAN-300)

| Task | Status | Estimate |
|---|---|---|
| KAN-295 Complete file type master data | IN PROGRESS | 3h |
| KAN-296 Backend — Load & cache file types from DB | TO DO | 4h |
| KAN-297 Backend — API for frontend to read file types | TO DO | 2h |
| KAN-298 Frontend — Use live list on upload screens | TO DO | 4h |
| KAN-300 Cleanup — Remove hardcoded file type lists | TO DO | 2h |
| **Feature A Total** | | **15h** |

### Feature B — Copy/Move Folder Validation Simplify

| Task | Status | Estimate |
|---|---|---|
| Refactor & simplify validation logic | IN PROGRESS | 8h |
| **Feature B Total** | | **8h** |

### Coding Budget Summary

| Item | Hours |
|---|---|
| Feature A (File Types full chain) | 15h |
| Feature B (Validation refactor) | 8h |
| **Total Confirmed Coding** | **23h** |
| Coding Budget | 133h |
| **Remaining Buffer** | **110h** |

> The 110-hour buffer covers: manager-requested additional tasks, documentation revisions, extended Q&A, and any scope added after this plan is signed. Any new task consuming more than 8h must be formally approved against this budget.

---

## Part 4 — Cut-Off Line

### WILL BE COMPLETED ✅

| Item | Type | Hours |
|---|---|---|
| All 5 documentation modules (D1–D5) | Documentation | 43h |
| KAN-295 → KAN-300 complete (Feature A) | Coding | 15h |
| Copy/Move Validation Simplify (Feature B) | Coding | 8h |
| **Committed Total** | | **66h** |

### WILL NOT BE COMPLETED — To Be Handed Over ❌

> **Any new coding task submitted after Day 10 will be declined for development.** It will be logged with full context (code location, business logic, suggested approach) so the successor developer can pick it up immediately.

---

## Part 5 — Document Templates & Examples

---

### D1 — NextJS API Layer

> **Note for non-tech readers:** This app has no traditional "API endpoints." Instead, every action
> (saving a grade, marking homework done, logging in) is handled by **Server Actions** — functions
> that run securely on the server when the user clicks a button. Think of them as invisible form
> submissions that never expose data to the browser.

---

#### Pages & What They Do

The app has two completely separate surfaces sharing the same codebase.

**Kid Surface** — what the child sees

| URL in browser | What opens | Needs login? |
|---|---|---|
| `/` | Redirects automatically to `/kid-unlock` | — |
| `/kid-unlock` | Pattern unlock screen (2-digit code) | No |
| `/dashboard` | Kid's home screen — today's schedule, homework, streaks | Yes (kid session) |
| `/schedule` | Full weekly timetable + evening classes | Yes (kid session) |
| `/grades` | Report card by semester | Yes (kid session) |
| `/homework` | Today's homework checklist | Yes (kid session) |
| `/games` | Launcher screen for Math and English games | Yes (kid session) |
| `/math` | Math mini-games (counting, addition, shapes) | Yes (kid session) |
| `/english` | English mini-games (alphabet, vocabulary, phonics) | Yes (kid session) |
| `/unlock` | Earned badges collection display | Yes (kid session) |

**Parent Surface** — what the parent sees

| URL in browser | What opens | Needs login? |
|---|---|---|
| `/parent/login` | Parent email + password login | No |
| `/parent/pin` | PIN verification screen | No |
| `/parent` | Parent dashboard — manage schedule and grades | Yes (parent session) |
| `/parent/kid-access` | Kid progress, feature toggles, screen time limits, activity feed | Yes (parent session) |

---

#### The Security Guard (Middleware)

`middleware.ts` runs **before every page loads** — like a guard checking ID cards at the door.
It does three jobs:

**Job 1 — Protect the kid surface**
Every kid page requires a valid `kid_session` cookie (a digital ID card issued after the
unlock pattern is entered). If the cookie is missing or expired, the visitor is immediately
sent back to `/kid-unlock`. The invalid cookie is deleted on the spot.

**Job 2 — Protect the parent surface**
Parent pages require a `parent_access` cookie (short-lived, expires quickly).
If that cookie is expired, the guard automatically tries a backup: the `parent_refresh`
cookie (longer-lived). If the refresh works, a new access cookie is issued silently and
the parent never notices. If both are invalid, the parent is redirected to `/parent/login`
and both cookies are deleted.

**Job 3 — Rate limiting on login pages**
The login (`/parent/login`) and PIN (`/parent/pin`) pages are rate-limited via **Upstash**
(an external rate-limit service). If someone tries to guess the password or PIN too many
times too fast, the server returns a `429 Too Many Requests` response and tells the browser
how many seconds to wait before trying again. This prevents automated guessing attacks.

---

#### How Users Prove Who They Are (Auth Flow)

There are two separate login flows — one for the parent and one for the kid.

**Parent Login — 2-step process**

```
Step 1: Email + Password
  Parent enters email and password at /parent/login
  → Server looks up account in the database
  → Checks password against a one-way encrypted hash (bcrypt, 12 rounds)
  → If wrong: records failed attempt; after too many → account locked for N minutes
  → If correct: issues two cookies:
      • parent_access  — short-lived "today's ID card"
      • parent_refresh — long-lived "backup ID card"

Step 2: PIN verification (optional, for sensitive actions)
  Parent enters 4-digit PIN at /parent/pin
  → Server checks PIN against stored bcrypt hash
  → If wrong: records failed attempt; after too many → locked for N minutes
  → If correct: full session confirmed
```

**Kid Unlock — pattern entry**

```
  Kid enters 2-digit pattern (digits 1–6) at /kid-unlock
  → Server checks pattern against stored bcrypt hash
  → If wrong: records failed attempt; after too many → locked for N minutes
  → If correct: issues kid_session cookie
  → Kid is redirected to /dashboard
```

**What is a "cookie" here?**
A cookie is a small invisible token saved in the browser. It proves identity on every
subsequent page load without asking the user to log in again. These cookies are
`httpOnly` — JavaScript in the browser cannot read them, which prevents theft.

**What is bcrypt?**
Passwords and PINs are never stored as plain text. They are run through bcrypt — a
one-way scrambling process — so even if the database were stolen, the actual values
could not be recovered.

---

#### Actions & Who Can Call Them

Every button and form in the app calls a **Server Action**. Each action either requires
a parent session or is open to the kid.

| Action File | What It Does | Who Can Call It |
|---|---|---|
| `auth.actions.ts` | Login, logout, PIN, pattern unlock | Both (depends on action) |
| `grades.actions.ts` | View and edit report card grades | Parent only |
| `schedule.actions.ts` | View and manage weekly timetable | Parent (edits) / Kid (read) |
| `homework.actions.ts` | View today's homework, mark done | Kid only |
| `kid-progress.actions.ts` | View kid's points, streak, badges | Parent only |
| `kid-access.actions.ts` | Feature toggles, activity feed | Parent only |
| `screen-time.actions.ts` | Track and set screen time limits | Both (depends on action) |
| `math.actions.ts` | Save math game results | Kid only |
| `english.actions.ts` | Save English game results | Kid only |
| `rewards.actions.ts` | Award points after completing tasks | Internal (no direct UI call) |

---

### D2 — ORM / Prisma Models

> **Note:** The codebase uses **Prisma** (not Sequelize) as the database layer.
> Prisma is a tool that lets the code talk to the PostgreSQL database using
> JavaScript objects instead of raw SQL. Each "model" below is a table in the database.
> Think of each table as a spreadsheet — rows are records, columns are fields.

---

#### Database Tables Overview

**`users` — The main profile table**
One row = one person in the app (currently one kid + one parent, same row).
Stores the kid's name, grade level, and avatar. Also stores the parent's encrypted
email, password, and PIN data. Security counters (failed login attempts, lockout
expiry) live here too.

**`parent_pins` — The parent PIN**
Stores only the bcrypt-hashed PIN (never the real digits). Tracks failed attempt
count and lockout expiry. Linked 1-to-1 with the `users` table.

**`class_periods` — The weekly timetable**
Each row is one class slot in the weekly schedule. Stores the day of the week,
start/end time, subject, room number, and whether it is a regular school period
or an evening extra class. The `subjectId` field references a hardcoded list in
`lib/data/subjects.ts` (not another table).

**`homework_completions` — Tick-off per class per day**
Tracks whether the kid checked off a specific class period's homework on a
specific date. One row = one period + one date. Cannot have duplicates.

**`daily_homework` — One-off homework items**
Custom homework tasks the parent adds for a specific date (not tied to a
recurring class period). Stores the subject, label text, points value, and
whether the kid marked it done.

**`extra_class_overrides` — Cancelled extra classes**
When a parent cancels a recurring evening class for one specific date, a row is
inserted here. The app checks this table to know which classes to hide on a given day.

**`subject_grades` — Report card**
One row per subject per semester per academic year. Stores the raw score (0–10),
the badge tier (Excellent / Good / Needs Practice), and the year/semester.
Cannot have duplicate entries for the same subject + semester + year.

**`user_progress` — Points and streaks**
Tracks the kid's total points and current daily streak. One row per user.
Links to the `earned_badges` and `game_best_scores` tables.

**`earned_badges` — Badge collection**
Each row records one badge the kid has permanently earned. The `badgeId` field
references a static list defined in the code (not a database table).
Cannot earn the same badge twice.

**`game_best_scores` — High scores**
Tracks the kid's personal best for each game type + level combination.
Stores stars earned (1–3) and the numeric score. Updated only when the new score
beats the existing one.

**`math_progress` / `english_progress` — Individual game sessions**
Every time the kid finishes a game, a row is created recording: which mini-game,
which level, how many correct/incorrect answers, time spent, stars earned, and
(optionally) which homework period it was linked to.

**`screen_time_logs` — Daily screen time**
Tracks total seconds the kid has been active today. One row per user per day.
The app increments this while the kid uses the app.

**`activity_events` — Activity feed**
A running log of everything the kid does: completed games, finished homework,
earned badges. Used to populate the parent's activity feed. Newest first.

---

#### How Tables Connect to Each Other

```
users
  ├── 1 parent_pin          (one PIN per user)
  ├── many class_periods    (all timetable slots belong to this user)
  │     └── many homework_completions  (period × date tick-offs)
  │     └── many extra_class_overrides (cancellations for specific dates)
  ├── many daily_homework    (one-off tasks added by parent)
  ├── many subject_grades    (report card entries)
  ├── 1 user_progress        (points + streak summary)
  │     └── many earned_badges    (badges unlocked so far)
  │     └── many game_best_scores (personal bests per game/level)
  ├── many math_progress     (every math session ever played)
  ├── many english_progress  (every English session ever played)
  ├── many screen_time_logs  (one row per calendar day)
  └── many activity_events   (full activity history)
```

In plain English: **deleting a user deletes everything linked to them** — all
timetable slots, grades, game history, screen time logs, and badges.
This is by design (`onDelete: Cascade` on all foreign keys).

---

#### Known Gotchas

**1. Deleting a class period also deletes its homework tick-offs.**
If a parent deletes a recurring class from the timetable, all `homework_completions`
rows for that period (across all past dates) are also permanently deleted.
This is intentional but irreversible. Warn the parent before deleting.

**2. Subject IDs are hardcoded in the app, not in the database.**
`class_periods.subjectId` and `daily_homework.subjectId` store a string like
`"math"` or `"english"`. These values are validated against a static list in
`lib/data/subjects.ts`. If a new subject is needed, it must be added to that
file in code — not just inserted into the database.

**3. Badge IDs are also hardcoded.**
`earned_badges.badgeId` references badge definitions in `lib/data/` (static
code files). If you add a new badge to the database without adding it to that
file, the UI will not display it correctly.

**4. `class_periods` enforces one slot per day per period number.**
The database has a unique constraint on `(userId, day, periodNumber)`.
You cannot create two "Period 3 on Monday" entries for the same user.
`EXTRA_CLASS` rows are exempt from this — they use `null` as the period number.

**5. Dates are stored as plain text strings, not date objects.**
`daily_homework.date`, `homework_completions.date`, `extra_class_overrides.date`,
and `user_progress.lastActiveDate` are all stored as `"YYYY-MM-DD"` strings
(e.g. `"2026-06-10"`). Time zones do not apply. Always use this exact format
when querying or inserting — a wrong format will silently miss records.

**6. `user_progress` is created lazily.**
A user row in `user_progress` is not created at registration. It is created
automatically the first time points are awarded or a badge is earned. Always
handle the case where it may be `null`.

**7. Screen time is incremented in small chunks, not set directly.**
`screen_time_logs.totalSecs` is accumulated by repeated `addScreenTimeAction`
calls (each call adds 1–120 seconds). There is no "set total to X" operation —
only "add N seconds to today's total."

---

### D3 — Environment Config & Secrets Management

```markdown
# Environment Config & Secrets Management

## Variable Reference
| Variable          | Required | Description                              | Example Value           |
|-------------------|----------|------------------------------------------|-------------------------|
| DATABASE_URL      | Yes      | PostgreSQL connection string             | postgresql://u:p@host/db|
| JWT_SECRET        | Yes      | HS256 signing key — min 32 characters   | [generated, never share]|
| UPSTASH_URL       | Yes      | Upstash Redis URL for rate limiting      | https://...             |
| UPSTASH_TOKEN     | Yes      | Upstash Redis auth token                 | [from Upstash console]  |
| NEXT_PUBLIC_URL   | Yes      | Public base URL of the app               | https://app.example.com |
| NODE_ENV          | Yes      | Runtime environment                      | production / development|

## Secret Rotation Procedure
1. Generate new secret value (use `openssl rand -hex 32` for JWT_SECRET / SESSION_SECRET)
2. Add new value to secret manager — do NOT remove old value yet
3. Update environment variable in deployment config
4. Restart the app server
5. Verify the app loads correctly (login still works)
6. Revoke old value after 30 minutes

## .env.example Location
[repo root]/.env.example — keep this file up to date with every new variable.
Never put real values in .env.example.
```

---

### D4 — Git Flow

```markdown
# Git Flow

## Branch Strategy
main      ← protected; production-ready code only
  └── feature/KAN-XXX-short-description   ← one branch per ticket
  └── fix/KAN-XXX-short-description        ← bug fix branches
  └── chore/short-description              ← non-feature work

## Commit Message Convention
feat: add file type caching layer
fix: resolve folder move validation edge case
chore: update dependencies to latest patch
docs: add API handover documentation

## Pull Request Rules
- Minimum 1 reviewer approval required before merge
- All CI checks (lint, type-check, build) must pass
- Delete branch immediately after merge

## Release to Production
1. PR from feature branch → main (1 approval required)
2. After merge, deployment triggers automatically via CI/CD
3. Tag the release commit: git tag vX.Y.Z && git push --tags
```

---

## Part 6 — 4-Week Schedule

### Week 1 (Days 1–5 | 40h) — Complete In-Progress Work + Core Documentation

| Day | Primary Activity | Hours |
|---|---|---|
| Day 1 | KAN-295 finish file type master data (3h) · D1 API Layer doc — start (5h) | 8h |
| Day 2 | D1 API Layer doc — complete (8h) | 8h |
| Day 3 | D2 ORM/Prisma Models doc — full day (8h) | 8h |
| Day 4 | D3 Env Config & Secrets doc (4h) · D4 Git Flow doc (3h) · buffer (1h) | 8h |
| Day 5 | KAN-296 Backend caching (4h) · KAN-297 API endpoint (2h) · KAN-298 Frontend start (2h) | 8h |
| **Week 1 Total** | | **40h** |

**Milestone:** KAN-295 closed. All 4 documentation modules drafted. KAN-296, KAN-297 complete.

---

### Week 2 (Days 6–10 | 40h) — Complete Feature A + Begin Feature B

| Day | Primary Activity | Hours |
|---|---|---|
| Day 6 | KAN-298 Frontend — complete (2h) · KAN-300 Cleanup hardcoded lists (2h) · review & test Feature A (4h) | 8h |
| Day 7 | Feature B — Copy/Move Validation refactor (8h) | 8h |
| Day 8 | Feature B — review & test (2h) · documentation review pass (6h) | 8h |
| Day 9 | KT prep — Session 1 & 2 materials, code walkthroughs outline (8h) | 8h |
| Day 10 | KT prep — Session 3 & 4 materials · Pending tasks status notes (8h) | 8h |
| **Week 2 Total** | | **40h** |

**Milestone:** Feature A and Feature B fully complete and merged. All coding work closed. KT materials ready.

---

### Week 3 (Days 11–15 | 40h) — Knowledge Transfer Sessions

| Day | Primary Activity | Hours |
|---|---|---|
| Day 11 | D5 KT Session 1 — API Layer + Auth Flow walkthrough with team (4h) · doc revisions (4h) | 8h |
| Day 12 | D5 KT Session 2 — ORM Models + DB Schema walkthrough (4h) · doc revisions (4h) | 8h |
| Day 13 | D5 KT Session 3 — Env Config + Deployment runbook walkthrough (4h) · revisions (4h) | 8h |
| Day 14 | D5 KT Session 4 — Git Flow + Pending tasks Q&A (4h) · final doc cross-linking (4h) | 8h |
| Day 15 | Full documentation review pass — consistency, links, screenshots, code references (8h) | 8h |
| **Week 3 Total** | | **40h** |

**Milestone:** All 4 live KT sessions delivered. Documentation reviewed and finalized.

---

### Week 4 (Days 16–22 | 56h) — Review, Sign-Off & Formal Handover

| Day | Primary Activity | Hours |
|---|---|---|
| Day 16 | Manager review meeting — present full handover package (4h) · incorporate feedback (4h) | 8h |
| Day 17 | Final documentation corrections (4h) · assemble handover package in shared location (4h) | 8h |
| Days 18–21 | Buffer — additional Q&A, scope clarifications, extra task requests against 110h reserve | 32h |
| Day 22 | Formal handover sign-off meeting · last Q&A · access revocation checklist | 8h |
| **Week 4 Total** | | **56h** |

**Milestone:** Signed handover acknowledgement from manager. All docs in shared drive. All access revoked on final day.

---

## Grand Total Verification

| Week | Hours |
|---|---|
| Week 1 | 40h |
| Week 2 | 40h |
| Week 3 | 40h |
| Week 4 | 56h |
| **GRAND TOTAL** | **176h ✓** |

---

## Notes for Manager Presentation

1. **Documentation is protected.** The 43h doc block will not be traded for coding scope — without it, the successor cannot operate.
2. **Feature A (KAN-295→300) and Feature B are fully committed** and will be delivered by end of Week 2.
3. **No new coding tasks accepted after Day 10.** Requests after that date will be logged with full context in the handover package for the successor developer.
4. The 110-hour buffer is deliberately visible — it is available for approved additional tasks or extended knowledge transfer, not open-ended feature work.

---

## Before Presenting — Fill These In

- [ ] **Route count:** If your project has more than 25 API routes, add 4h to D1.
- [ ] **Feature B estimate:** 8h assumed — confirm against your actual validation codebase complexity.
- [ ] **Additional pending tasks:** List any manager-requested tasks beyond KAN-295→300 and Feature B here, then compare against the 133h coding ceiling.
