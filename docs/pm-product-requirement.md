# Product Requirements — Kid Hub

**Role:** PM — Alex Rivera
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. Product Vision

Kid Hub is a household learning companion for a single child. It gives the child a safe, gamified view of their school life (schedule, grades, homework) and gives the parent full control over that view via a PIN-protected dashboard.

**Core value promise:** The child opens one app, sees exactly what they need to do today, and earns rewards for doing it. The parent spends less than five minutes per week configuring everything.

---

## 2. Target Users

### Primary — The Child (Khoi, Grade 1)

| Attribute | Detail |
|---|---|
| Age | 6–8 years old |
| Device | Tablet (portrait primary) or phone |
| Literacy | Basic reading; relies on icons and color more than text |
| Motivation | Points, badges, streaks, game rewards |
| Pain point | Cannot self-manage school schedule; needs visual guidance |

### Secondary — The Parent

| Attribute | Detail |
|---|---|
| Role | Single household admin |
| Device | Same tablet or phone (switches to parent mode via PIN) |
| Session length | 2–5 min; infrequent configuration |
| Pain point | Needs confidence that the child sees accurate, up-to-date information |

---

## 3. Product Principles

1. **Kid-first UI:** Every interaction must be operable by a 6-year-old without reading instructions.
2. **Parent-in-control:** The parent sets the data; the child consumes it. No child-editable data except homework completion.
3. **One household, one config:** The app is scoped to a single user. No multi-tenant complexity.
4. **Reward every positive action:** Points, streaks, and badges must fire on every meaningful child action.
5. **Offline-tolerant:** Core views (schedule, grades) must render from cached state when the network is slow.

---

## 4. User Stories

### Child — Schedule

| ID | As a child I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-001 | See today's classes in time order | I know what's happening now | `TodayTimetable` shows current period highlighted, next period labelled |
| US-002 | See which class is happening right now | I don't miss it | `CurrentClassHighlight` updates in real time (30 s poll) |
| US-003 | See my full weekly schedule | I can plan ahead | `WeekGrid` renders Mon–Sun with all periods |
| US-004 | See evening extra classes separately | I know about after-school sessions | Evening blocks shown in `EveningBlockChip` |

### Child — Homework

| ID | As a child I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-010 | See today's homework list | I know what to complete | `/homework` shows all items for today's date |
| US-011 | Mark homework done with a single tap | I get credit quickly | Checkbox toggles, points awarded immediately, activity event logged |
| US-012 | Earn points for completing homework | I feel rewarded | `+10 pts` shown on completion; `UserProgress.totalPoints` incremented |

### Child — Games

| ID | As a child I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-020 | Choose a mini-game from the hub | I can practice what I want | `/games` shows Math and English sections with 3 games each |
| US-021 | Play with a timer so sessions are short | I stay focused | 10 questions × 10–15 s timer per game |
| US-022 | See stars and points at the end | I know how well I did | `GameResultScreen` shows 1–3 stars, points earned, best score |
| US-023 | See my best score per game/level | I want to beat it | `GameStatsBar` shows personal best before session starts |

### Child — Grades & Badges

| ID | As a child I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-030 | See my report card | I know how I'm doing at school | `/grades` shows all subjects with score, tier badge, and average |
| US-031 | See badges I've earned | I feel proud of achievements | Badge shelf visible on dashboard; `BadgeModal` on tap |
| US-032 | See my current streak | I'm motivated to log in daily | Streak counter in `StreakWidget` on dashboard |

### Parent — Schedule Management

| ID | As the parent I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-040 | Add a recurring weekly class | The child sees it every week | `ScheduleManager` creates `ClassPeriod` (SCHOOL_PERIOD) |
| US-041 | Add a one-off evening extra class | Special sessions appear correctly | Creates EXTRA_CLASS period; shows in `EveningBlockChip` |
| US-042 | Cancel an extra class for a specific date | The child isn't confused by a cancelled session | Creates `ExtraClassOverride` for that date |
| US-043 | Edit or delete any period | I can correct mistakes | Update/delete via `ScheduleManager` form |

### Parent — Grades Management

| ID | As the parent I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-050 | Enter subject grades per semester | The report card stays current | `GradesManager` upserts `SubjectGrade` |
| US-051 | Switch between Semester 1 and 2 | I can review historical data | `SemesterTabs` filters display |

### Parent — Kid Access & Monitoring

| ID | As the parent I want to… | So that… | Acceptance Criteria |
|---|---|---|---|
| US-060 | Toggle which features the child can access | I control screen-time exposure | `AccessToggleRow` saves to `User.kidAccessSettings` |
| US-061 | See recent child activity | I know what they've been doing | `RecentActivityPanel` lists last N events |
| US-062 | Set the child's unlock pattern | The child can access the app independently | `KidPatternSetup` hashes and stores pattern |

---

## 5. Feature Map (P0 → P2)

### P0 — Must work before any user sees the app

| Feature | Status | Owner |
|---|---|---|
| Kid pattern unlock | ✅ Done | BE |
| Parent login (email + password) | ✅ Done | BE |
| Parent PIN gate | ✅ Done | BE |
| Schedule view (today + week) | ✅ Done | FE |
| Homework list + mark done | ⚠️ Partial — points not always awarded | BE |
| Grade report card | ✅ Done | FE |
| Math mini-games (3) | ✅ Done | FE |
| English mini-games (3) | ✅ Done | FE |
| Points + streak tracking | ⚠️ Partial — localStorage/DB desync risk | BE |
| Badge award on triggers | ⚠️ Partial — triggers not all wired | BE |

### P1 — Required for family daily use

| Feature | Status | Owner |
|---|---|---|
| Unified homework reward loop | ❌ Not done | BE |
| Route-level loading skeletons | ❌ Only schedule has one | FE |
| Route-level error boundaries | ❌ Missing | FE |
| Activity feed (full view) | ❌ Only panel widget | FE |
| Adaptive practice suggestions | ❌ Not started | PM/BE |
| Security headers | ❌ Not set | SA |

### P2 — Quality-of-life improvements

| Feature | Status | Owner |
|---|---|---|
| Schedule copy-week / templates | ❌ Not started | FE/BE |
| Offline homework sync queue | ❌ Not started | FE |
| Notification center | ❌ Not started | FE |
| Parent weekly planning wizard | ❌ Not started | FE |
| Science / Art / Music games | ❌ Planned | FE |

---

## 6. Success Metrics

| Metric | Target |
|---|---|
| Homework completion rate | ≥ 80 % of daily items marked done |
| Daily login streak | Child logs in ≥ 5 days/week |
| Game sessions per day | ≥ 1 completed game session per day |
| Parent config time | < 5 min to set up a full week's schedule |
| Error rate | 0 unhandled route errors in production |

---

## 7. Out of Scope (v1)

- Multiple children or households
- Push notifications
- Teacher-facing features
- Cloud sync of game high scores across devices
- Parental controls at OS level
