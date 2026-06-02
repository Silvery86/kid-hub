# Design & UX/UI System — Kid Hub

**Role:** UX — Lena Mora
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. Design Principles

| Principle | Application |
|---|---|
| **Kid-first clarity** | Larger tap targets (48 px min), icon + color before text, short labels |
| **Single-action screens** | Each page has one primary action; avoid multi-step flows for kids |
| **Reward immediacy** | Points and animations fire within 200 ms of a correct action |
| **Parent-grade control** | Parent mode uses cleaner, denser UI — not the playful kid palette |
| **Safe color semantics** | Subject colors are consistent across all surfaces (card, chip, badge, icon) |

---

## 2. User Flows

### 2.1 Kid Daily Flow

```
App open
  └─► /kid-unlock
        Kid enters 2-symbol pattern
        ├─ Wrong → shake animation + attempt counter
        ├─ Locked → lockout timer screen (30 s)
        └─ Correct → redirect /dashboard

/dashboard
  ├─► View today's schedule (CurrentClassHighlight + TodayTimetable)
  ├─► View streak + badges
  ├─► Tap homework → /homework
  ├─► Tap game → /games → /math or /english
  └─► View weekly schedule → /schedule

/homework
  └─► See today's list → tap checkbox → done animation → +10 pts

/games
  └─► Pick section (Math / English)
        └─► Pick mini-game + level
              └─► Play 10 questions with HUD (timer, counter, score)
                    └─► GameResultScreen (stars, points, best score)
                          ├─ Play again
                          └─ Back to hub
```

### 2.2 Parent Daily Flow

```
App open → /parent/login
  Parent enters email + password
  ├─ Wrong → inline error + attempt counter
  └─ Correct → /parent/pin

/parent/pin
  Parent enters 4-digit PIN
  ├─ Wrong → shake + attempt counter
  └─ Correct → /parent

/parent (Dashboard)
  ├─► Manage schedule (ScheduleManager — add/edit/delete periods)
  ├─► Manage grades (GradesManager — upsert subject scores)
  ├─► View today overview (TodayOverviewPanel)
  └─► /parent/kid-access
        ├─► Toggle features for kid
        ├─► View recent activity feed
        └─► Set/change kid pattern (KidPatternSetup)
```

---

## 3. Screen Inventory & States

### /kid-unlock

| State | UI |
|---|---|
| Idle | Pattern symbols grid, empty input dots |
| Entering | Dots fill as symbols tapped |
| Wrong pattern | Dots shake (CSS animation), error text shown, dots reset after 500 ms |
| Locked out | Timer countdown overlay, symbols disabled |
| Success | Fade out + redirect |

**Gap:** No visual distinction between "wrong pattern" and "account locked" states — both show generic error. Locked state needs a distinct lockout timer UI.

### /dashboard

| State | UI |
|---|---|
| Loading | Skeleton cards (currently missing — blank screen) |
| No school today (weekend) | Empty schedule message + weekend icon |
| Between classes | "Next class" shown in `CurrentClassHighlight` |
| During a class | "Now" label + period progress bar |
| After school hours | Evening blocks shown if any |

### /homework

| State | UI |
|---|---|
| Loading | Skeleton list (currently missing) |
| Empty | "No homework today 🎉" message |
| All done | All checkboxes checked, celebration indicator |
| Partial | Mix of done/undone rows |

### /math, /english

| State | UI |
|---|---|
| Hub (not playing) | Game entry cards with level selector + best score |
| Playing | `GameHud` (timer bar, question counter, score) |
| Correct answer | Green flash + `+1` animation |
| Wrong answer | Red flash + shake |
| Time up | Auto-advance to next question |
| Result screen | Stars display + points + play-again / home buttons |

### /parent/pin

| State | UI |
|---|---|
| Idle | 4 empty dots + number pad |
| Entering | Dots fill |
| Wrong PIN | Dots shake, "Try again" message |
| Locked | Lockout timer + disabled pad |

---

## 4. Component State Behaviors

### `KidButton`

| Variant | Default | Hover | Active | Disabled |
|---|---|---|---|---|
| primary | `bg-btn-primary` | `bg-btn-primary-hover` | `scale-95` | `opacity-50 cursor-not-allowed` |
| secondary | `bg-btn-secondary` | `bg-btn-secondary-hover` | `scale-95` | `opacity-50 cursor-not-allowed` |
| ghost | `border-btn-ghost-border` | `bg-slate-50` | `scale-95` | `opacity-50` |

All variants: `min-h-tap` (48 px), `rounded-pill`, `font-semibold`, `transition-all duration-150`

### `PinKeypad`

| State | UI |
|---|---|
| Digit entered | Dot fills (●) |
| All 4 entered | Auto-submit after 200 ms delay |
| Error | Dots animate shake (`animate-shake`), reset after `PIN_SHAKE_DURATION_MS` (500 ms) |
| Input throttle | Button disabled for `INPUT_THROTTLE_MS` (600 ms) after tap |

### `ProgressBar`

| Value | Fill Color | Track Color |
|---|---|---|
| ≥ 80 % | `bg-progress-high` (amber) | `bg-progress-track` |
| < 80 % | `bg-progress-low` (orange) | `bg-progress-track` |

### `StarRating`

| Stars | Display |
|---|---|
| 1 | ★☆☆ (one filled, two empty) |
| 2 | ★★☆ |
| 3 | ★★★ |

Filled: `text-star-filled` (yellow) · Empty: `text-star-empty` (gray)

---

## 5. Design Token Quick Reference

| Token | Value | Usage |
|---|---|---|
| `--color-math` | `#3b82f6` | Math subject accents |
| `--color-english` | `#10b981` | English subject accents |
| `--color-science` | `#8b5cf6` | Science subject accents |
| `--color-pe` | `#f59e0b` | PE subject accents |
| `--color-art` | `#ec4899` | Art subject accents |
| `--color-vietnamese` | `#ef4444` | Vietnamese subject accents |
| `--color-music` | `#f97316` | Music subject accents |
| `--color-shell-kid` | `#f0f9ff` | Kid-facing page backgrounds |
| `--color-shell-light` | `#f8fafc` | Parent light mode backgrounds |
| `--color-shell-dark` | `#0f172a` | Dark admin / overlay |
| `--color-text-primary` | `#1e293b` | Body text |
| `--color-text-secondary` | `#64748b` | Labels, captions |
| `--color-text-muted` | `#94a3b8` | Placeholder, disabled |
| `--color-text-subtle` | `#cbd5e1` | Decorative lines |
| `--color-btn-primary` | `#3b82f6` | Primary CTA background |
| `--color-btn-secondary` | `#34d399` | Secondary CTA background |
| `--color-progress-high` | `#fbbf24` | Progress fill ≥ 80 % |
| `--color-progress-low` | `#fb923c` | Progress fill < 80 % |
| `--color-star-filled` | `#fbbf24` | Earned star |
| `--color-star-empty` | `#cbd5e1` | Unearned star |
| `--radius-card` | `1.5rem` | Card border radius |
| `--radius-pill` | `9999px` | Pill/button border radius |
| `--spacing-tap` | `3rem` | Min tap target (48 px) |
| `--spacing-tap-lg` | `4rem` | Large tap target (64 px) |

---

## 6. Typography Scale

Font family: **Nunito** (Google Fonts, loaded in `app/layout.tsx`)

| Use | Class | Weight | Size |
|---|---|---|---|
| Page title | `text-2xl font-bold` | 700 | 1.5 rem |
| Section heading | `text-xl font-semibold` | 600 | 1.25 rem |
| Card title | `text-lg font-semibold` | 600 | 1.125 rem |
| Body | `text-base font-normal` | 400 | 1 rem |
| Caption | `text-sm text-text-secondary` | 400 | 0.875 rem |
| Micro | `text-xs text-text-muted` | 400 | 0.75 rem |

Kid-facing text should lean larger (`text-lg`/`text-xl` for body) to aid early readers.

---

## 7. Animation & Interaction Standards

| Trigger | Animation | Duration |
|---|---|---|
| Button tap | `scale-95` active state | 150 ms |
| Wrong PIN / pattern | CSS shake keyframe on dots | 500 ms |
| Correct game answer | Green highlight flash | 200 ms |
| Wrong game answer | Red highlight + shake | 200 ms |
| Game timer bar | Linear CSS transition on width | Per-question duration |
| Homework checkbox | Checkmark fill + `+pts` fade-in | 300 ms |
| Badge earned | `BadgeModal` slide-up + confetti | 500 ms |

Input throttle lock (`INPUT_THROTTLE_MS = 600 ms`) prevents double-taps from registering multiple answers in games.

---

## 8. Navigation Structure

### Kid Navigation (AppSidebar — fixed left)

```
🏠  Dashboard     → /dashboard
📅  Schedule      → /schedule
📚  Homework      → /homework
🎓  Grades        → /grades
🎮  Games         → /games
```

### Parent Navigation (ParentSidebarNav — fixed left)

```
📊  Dashboard     → /parent
👧  Kid Access    → /parent/kid-access
🔓  Sign Out
```

### Back Navigation in Games

**Gap:** There is no persistent "back to hub" button during a game session. The child must finish or abandon the game to navigate away. A floating back button should be added to `GameHud`.

---

## 9. Accessibility Notes

| Rule | Status |
|---|---|
| Minimum 48 px tap targets | ✅ Enforced via `min-h-tap` token |
| Color not the only visual indicator | ⚠️ Subject cards use color + icon — OK; but error states use color only |
| Focus states visible | ⚠️ Not audited — custom buttons may miss `:focus-visible` rings |
| Touch action manipulation | ✅ Global CSS rule |
| No autoplay audio | ✅ `useAudio` initializes on first user interaction |

---

## 10. UX Gaps to Address

| Gap | Priority | Impact |
|---|---|---|
| `/kid-unlock` has no distinct lockout timer screen | P1 | Confusing for child — just says "error" |
| No `loading.tsx` on dashboard, grades, homework | P1 | Blank screen feels broken |
| No "back to hub" button inside game sessions | P1 | Child trapped until game ends |
| No persistent badge shelf on dashboard | P2 | Achievements invisible day-to-day |
| No celebration animation on streak milestone | P2 | Lost motivation opportunity |
| Parent activity feed lacks date grouping + filtering | P2 | Hard to review week of activity |
| Error states use color only (red text) | P2 | Accessibility concern for color-blind users |
