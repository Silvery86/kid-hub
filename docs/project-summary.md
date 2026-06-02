# Project Summary — Kid Hub

**Last updated:** 2026-06-01
**Version:** 0.1.0

This document lists every feature that has been successfully developed and is present in the codebase as of this date.

---

## 1. Authentication System

### Kid Unlock

- Two-symbol pattern entry screen (`/kid-unlock`)
- Pattern hashed with bcrypt (12 rounds) and stored in `User.kidPatternHash`
- Rate-limited: 5 attempts → 30-second lockout
- On success: mints 12-hour `kid_session` JWT in HttpOnly cookie
- Lockout state tracked in `kidPatternAttempts` + `kidPatternLockedUntil`

### Parent Login

- Email + password login (`/parent/login`)
- Password hashed with bcrypt (12 rounds) in `User.parentPasswordHash`
- Rate-limited: 5 attempts → 60-second lockout
- On success: mints 15-min `parent_access` + 30-day `parent_refresh` JWTs
- Auto-refresh: middleware silently renews access token using refresh token

### Parent PIN Gate

- 4-digit PIN entry screen (`/parent/pin`)
- PIN hashed with bcrypt and stored in `ParentPin` table
- Rate-limited: 5 attempts → 60-second lockout
- Shake animation on wrong PIN (`PIN_SHAKE_DURATION_MS = 500 ms`)
- Input throttle: `INPUT_THROTTLE_MS = 600 ms`
- On success: new `parent_access` token issued

### Session Management

- Edge middleware (`middleware.ts`) verifies JWT for all protected routes
- Separate session types: `kid-session`, `parent-access`, `parent-refresh`
- `signOutParentAction` and `signOutKidAction` clear respective cookies

---

## 2. Schedule Module

### Kid View

- Weekly schedule grid (`WeekGrid`) — all 7 days, periods 1–10 per day
- Today's timetable (`TodayTimetable`) — periods in time order
- Current class highlight (`CurrentClassHighlight`) — "Now" card with period progress bar
- Next class preview — shown when between classes
- Day tabs + rail navigation (`DayTabs`, `DayRail`)
- Evening extra class chips (`EveningBlockChip`) — separate from school periods
- Schedule live polling (`useSchedule` hook) — updates every 30 seconds, pauses when tab hidden
- Period progress bar — shows how far through the current class the child is
- `loading.tsx` skeleton for the schedule route

### Parent Schedule Management

- Create recurring `SCHOOL_PERIOD` (period 1–10, any day)
- Create recurring `EXTRA_CLASS` (evening blocks, max 3 per day)
- Edit and delete any period
- Cancel an extra class for a specific date (creates `ExtraClassOverride`)
- Overlap validation — prevents creating conflicting periods on the same day
- Full CRUD via `ScheduleManager` component in parent dashboard

---

## 3. Homework Module

### Kid View

- Today's homework list (`/homework`) — all items for today's date
- Checkbox to mark homework done
- Subject icon and label per item
- Points display per item (default 10 pts)

### Parent Homework Management

- Add one-off homework items for any date (`addDailyHomeworkAction`)
- Delete homework items
- Toggle homework done status from parent dashboard

### Data

- `DailyHomework` table: date-keyed, subject, label, points, isDone
- `HomeworkCompletion` table: links period → date, separate from DailyHomework
- Two completion flows exist (see Known Issues)

---

## 4. Grades & Report Card

### Kid View

- Report card (`/grades`) with semester tabs (Semester 1 / Semester 2)
- Subject grade cards — score (0–10), badge tier, subject icon and color
- Average score progress bar (`GradesSummaryBar`)
- Badge tier chips — excellent (≥9), good (≥7), needs-practice (<7)

### Parent Grades Management

- Upsert subject grades per semester and academic year
- `GradesManager` form in parent dashboard
- Auto-calculates badge tier from score on save

---

## 5. Games Module

### Math Games

All three math mini-games implemented with 3 difficulty levels:

| Game | ID | Mechanic |
|---|---|---|
| Đếm Sao (Counting) | `counting` | Count objects on screen; 15 s per question |
| Number Ninja (Addition) | `addition` | Simple arithmetic; 10 s per question |
| Khám Phá Hình (Shapes) | `shapes` | Identify shapes from SVG display; 12 s per question |

### English Games

All three English mini-games implemented with 3 difficulty levels:

| Game | ID | Mechanic |
|---|---|---|
| Alphabet Explorer | `alphabet` | Alphabet drill; 12 s per question |
| Word Safari | `vocabulary` | Vocabulary matching; 15 s per question |
| Sound Hunt | `phonics` | Phonics/sound matching; 15 s per question |

### Game Infrastructure

- `useGameSession` — state machine (idle → playing → result)
- `useMathSession` / `useEnglishSession` — session wrappers (save to DB, update best score)
- `GameHud` — in-game timer bar, question counter, score display
- `GameResultScreen` — stars, points earned, best score comparison, play-again / home
- `GameStatsBar` — personal best display before session starts
- `GamesHubView` — launcher with Math + English sections + 3 coming-soon placeholders
- Sound effects via `useAudio` (correct / wrong / complete)
- Sessions saved to `MathProgress` / `EnglishProgress` tables
- Best scores tracked per (gameType, level, subType) in `GameBestScore`

---

## 6. Gamification System

- **Points:** Awarded per correct game answer (correctCount × 10 × starsEarned); stored in `UserProgress.totalPoints`
- **Stars:** 1–3 stars per game session based on accuracy and time
- **Streaks:** Daily login streak tracked in `UserProgress.currentStreak` + `lastActiveDate`
- **Streak widget:** Displays current streak on kid dashboard
- **10 badge definitions** in `lib/data/badges.ts` — static metadata (id, name, emoji)
- **EarnedBadge** table — records which badges a user has earned
- **BadgeModal** — lightbox overlay showing earned badge details
- **UserProgress** stored in localStorage (client) + DB `user_progress` table (server)

---

## 7. Parent Access & Kid Monitoring

- Feature toggle rows (`AccessToggleRow`) — enable/disable kid app features
- Toggles stored as JSON in `User.kidAccessSettings`
- Recent activity panel (`RecentActivityPanel`) — last N activity events
- `ActivityEvent` table — logs game completions and homework completions
- Screen time tracker (`ScreenTimeTracker`) — passive accumulator running in kid shell
- `ScreenTimeLog` table — daily total seconds per user
- Kid progress panel (`KidProgressPanel`) — summary of points, streaks, grades
- Kid pattern setup (`KidPatternSetup`) — parent sets/changes the unlock pattern

---

## 8. Infrastructure & PWA

- Progressive Web App with `public/manifest.json` and `public/sw.js`
- Service worker registered via `ServiceWorkerRegistrar` component
- Docker + docker-compose setup for local PostgreSQL dev
- Standalone Next.js build output (Docker-deployable)
- Prisma 7 ORM with migration history (5 migrations from April–May 2026)
- Seed script (`prisma/seed.ts`) creates default user + sample data
- Upstash Redis rate limiting on all auth endpoints
- `AppSidebar` — fixed navigation sidebar for kid shell
- `ParentSidebarNav` — navigation sidebar for parent shell
- `ErrorBoundary` component — client-side error catch
- `useLocalStorage` hook — hydration-safe localStorage with SSR guard
- Design token system: 25+ tokens in `app/globals.css @theme {}`
- Orientation variants: `portrait:` / `landscape:` custom Tailwind variants
- Nunito font via Google Fonts (loaded in root layout)
