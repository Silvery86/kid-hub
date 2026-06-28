# Kid Hub — Design Taste Document

> Cross-reference this file before starting any UI task. Last updated: 2026-06-24.

---

## Design Read

**"Reading this as: a kid-facing family dashboard for a primary school child (6 years old) and one parent, with a playful-but-clean language, leaning toward a custom Tailwind v4 semantic token system with high-contrast colour, large touch targets, and emoji-driven iconography on a tablet-first viewport."**

This is NOT a landing page or a marketing site. The SKILL.md's landing-page rules (hero discipline, eyebrow caps, marquees, etc.) apply to the parent-facing surfaces where appropriate. The kid-facing surfaces follow a separate, child-appropriate design contract documented here.

---

## Dial Settings

| Dial               | Value        | Rationale                                                                                                        |
| ------------------ | ------------ | ---------------------------------------------------------------------------------------------------------------- |
| `DESIGN_VARIANCE`  | 7            | Asymmetric game grid, active-period card grows, tinted top-grade cards, dominant points chip.                    |
| `MOTION_INTENSITY` | 5            | CSS keyframe entrances (staggered), hover lifts, progress-bar animate-in, ping ring, pop-in celebration.        |
| `VISUAL_DENSITY`   | 6 kid / 7 parent | Kid surfaces stay breathable; parent overview is information-dense.                                          |

---

## Design System Foundation

**Stack:** Next.js 16 App Router, Tailwind CSS v4, custom `@theme {}` tokens in `app/globals.css`. No external component library installed.

**One system, no mixing.** Do not import shadcn/ui, Radix Themes, Material, or any third-party component library. All components are bespoke.

---

## Token Reference (`app/globals.css`)

### Colours

#### Subject Colours (used as card backgrounds and hero fills)

| Token                   | Hex       | Usage                         |
| ----------------------- | --------- | ----------------------------- |
| `--color-math`          | `#3b82f6` | Math subject (blue-500)       |
| `--color-math-deep`     | `#1d4ed8` | Math deep accent              |
| `--color-math-light`    | `#60a5fa` | Math light accent             |
| `--color-english`       | `#10b981` | English subject (emerald-500) |
| `--color-english-deep`  | `#047857` | English deep                  |
| `--color-english-light` | `#34d399` | English light                 |
| `--color-science`       | `#8b5cf6` | Science (violet-500)          |
| `--color-pe`            | `#f59e0b` | PE (amber-500)                |
| `--color-art`           | `#ec4899` | Art (pink-500)                |
| `--color-vietnamese`    | `#ef4444` | Vietnamese (red-500)          |
| `--color-music`         | `#f97316` | Music (orange-500)            |

#### Shell Colours

| Token                 | Hex       | Tailwind class   | Usage                       |
| --------------------- | --------- | ---------------- | --------------------------- |
| `--color-shell-dark`  | `#0f172a` | `bg-shell-dark`  | Not used yet                |
| `--color-shell-light` | `#f8fafc` | `bg-shell-light` | Hover backgrounds           |
| `--color-shell-kid`   | `#f0f9ff` | `bg-shell-kid`   | Page background (kid views) |

#### Text Hierarchy

| Token                    | Hex       | Tailwind class        | When to use            |
| ------------------------ | --------- | --------------------- | ---------------------- |
| `--color-text-primary`   | `#1e293b` | `text-text-primary`   | Headings, body text    |
| `--color-text-secondary` | `#64748b` | `text-text-secondary` | Subheadings, metadata  |
| `--color-text-muted`     | `#94a3b8` | `text-text-muted`     | Captions, empty states |
| `--color-text-subtle`    | `#cbd5e1` | `text-text-subtle`    | Disabled, placeholder  |

**Rule:** Always use semantic text tokens. Never reach for `text-slate-800`, `text-slate-500`, etc. raw. If a semantic token is missing, add it to `@theme {}`.

#### Buttons

| Token                       | Class                                      | Usage                          |
| --------------------------- | ------------------------------------------ | ------------------------------ |
| `--color-btn-primary`       | `bg-btn-primary` / `text-btn-primary`      | Primary CTA, active nav states |
| `--color-btn-primary-hover` | use `hover:bg-[--color-btn-primary-hover]` | Primary hover                  |
| `--color-btn-secondary`     | `bg-btn-secondary`                         | Secondary CTA (emerald)        |

#### Progress & Stars

| Token                    | Usage                                |
| ------------------------ | ------------------------------------ |
| `--color-progress-high`  | High-score progress fill (amber-400) |
| `--color-progress-low`   | Low-score progress fill (orange-400) |
| `--color-progress-track` | Progress bar track background        |
| `--color-star-filled`    | Filled star (amber-400)              |
| `--color-star-empty`     | Empty star (slate-300)               |

### Border Radius

| Token           | Value           | Class          | Usage                       |
| --------------- | --------------- | -------------- | --------------------------- |
| `--radius-card` | `1.5rem` (24px) | `rounded-card` | All content cards           |
| `--radius-pill` | `9999px`        | `rounded-pill` | Badges, chips, status pills |

**Rule (Shape Consistency Lock):** Use `rounded-card` for cards and panels. Use `rounded-pill` for inline badges and chips. Use `rounded-2xl` (16px) for sub-elements inside cards (e.g. icon containers, inner chips). Do NOT mix arbitrary values like `rounded-[20px]` or `rounded-[18px]`.

### Spacing (Tap Targets)

| Token              | Value  | Class          | Usage                      |
| ------------------ | ------ | -------------- | -------------------------- |
| `--spacing-tap`    | `3rem` | `min-h-tap`    | Minimum tap target         |
| `--spacing-tap-lg` | `4rem` | `min-h-tap-lg` | Nav links, primary buttons |
| `--spacing-tap-xl` | `5rem` | `min-h-tap-xl` | Hero actions               |

---

## Typography System

**Font:** `var(--font-display)` (mapped via `next/font` in `app/layout.tsx`) → `--font-sans`. Self-hosted; never link Google Fonts via `<link>`.

### Scale Mapping (use Tailwind type scale, not raw pixel values)

| Role                  | Tailwind class                                         | Usage                            |
| --------------------- | ------------------------------------------------------ | -------------------------------- |
| Page title (kid)      | `text-3xl font-extrabold tracking-tight`               | e.g. "Chào Khôi!"                |
| Page title (parent)   | `text-3xl font-black tracking-tight`                   | e.g. "Parent Mode"               |
| Hero subject name     | `text-5xl font-black leading-none tracking-tight`      | Current period hero card         |
| Section heading       | `text-lg font-black`                                   | Card section titles              |
| Sub-heading           | `text-base font-bold`                                  | Secondary section titles         |
| Body / metadata       | `text-sm font-semibold`                                | Descriptive text                 |
| Caption / muted       | `text-xs font-bold`                                    | Metadata, timestamps             |
| Micro-label (eyebrow) | `text-[10px] font-extrabold tracking-widest uppercase` | Section eyebrows - use sparingly |

**Rules:**

- Use `font-black` for primary headings (h1, h2), `font-extrabold` for sub-headings, `font-bold` for supporting text.
- Use `tracking-tight` on headings `text-2xl+`.
- Never use raw pixel sizes like `text-[22px]`, `text-[30px]`, `text-[34px]`. Map to the nearest Tailwind step.
- No gradient text on large headings.
- No serif fonts anywhere in this product.

---

## Layout System

### Page Container

All kid-facing pages use [TabletPageContainer](components/layout/TabletPageContainer.tsx), which provides:

- Offset for the sidebar (`pl-24 lg:pl-60`) in landscape
- Bottom tab-bar padding in portrait
- `h-dvh` full-height scroll container

**Rule:** Never use `h-screen` - always `h-dvh` or `min-h-dvh`.

### Responsive Strategy: Orientation-first

This app uses **orientation** as the primary responsive axis, not screen-width breakpoints.

| Variant           | When                              | Navigation pattern           |
| ----------------- | --------------------------------- | ---------------------------- |
| `portrait:`       | `@media (orientation: portrait)`  | Bottom tab bar               |
| `landscape:`      | `@media (orientation: landscape)` | Left sidebar (w-24 compact)  |
| `lg:` + landscape | Desktop wide                      | Left sidebar (w-60 expanded) |

Standard breakpoints apply secondarily (`sm`, `md`, `lg`).

### Grid Rules

- Use CSS Grid for multi-column layouts. Never flex + percentage math.
- Default dashboard grid: `grid-cols-1 gap-3 lg:grid-cols-[1.45fr_1fr] lg:grid-rows-[auto_auto_1fr]`
- Stats grids (parent overview): `grid-cols-2 md:grid-cols-4`
- Game entry cards: `grid-cols-2 gap-3`

### Whitespace Rhythm

- Page padding: `p-3 sm:p-4 lg:p-5`
- Section gap: `gap-3 sm:gap-4 lg:gap-5`
- Card internal padding: `p-3` (compact), `p-4` (standard), `p-5` (hero / roomy)
- Always use 4px-multiple spacing. No odd values like `p-3.5` except where safe-area demands it.

---

## Component Inventory

### Cards

Cards use `rounded-card bg-white shadow-sm` as the base. Inner elements use `rounded-2xl` or `rounded-xl`. Never put `rounded-card` inside `rounded-card`.

```
rounded-card bg-white p-3 shadow-sm        ← standard section card
rounded-card bg-white p-4 shadow-sm        ← roomy card
rounded-card bg-white p-5 shadow-sm        ← hero-weight card
```

For coloured hero cards (current-period indicator), use `rounded-4xl p-5 text-white shadow-xl` with dynamic inline background from CSS variable: `style={{ background: 'var(--color-math)' }}`.

### Badges / Chips (inline)

```
rounded-pill bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800   ← points
rounded-pill bg-orange-100 px-3 py-1.5 text-sm font-extrabold text-orange-800  ← streak
rounded-pill bg-white px-3 py-1.5 text-sm font-extrabold text-text-secondary shadow-sm  ← neutral
rounded-pill bg-amber-100 px-2.5 py-1 text-xs font-extrabold text-amber-700    ← small badge
```

### Buttons

**Primary action (large):** `rounded-card` or `rounded-2xl` + `bg-btn-primary text-white` + `touch-manipulation active:scale-[0.97] transition-colors duration-150`

**Ghost / navigation:** `rounded-2xl bg-slate-50 text-text-secondary hover:bg-shell-light hover:text-text-primary`

**Pill button:** `rounded-pill` + appropriate colour

**Rule:** Every interactive element must have `touch-manipulation` and `select-none`. Primary tap targets must meet `min-h-tap-lg`. Button text must fit on one line - never wrap.

### Navigation (AppSidebar)

- Landscape sidebar: `w-24` (compact) / `w-60 lg:` (expanded), `bg-white shadow-[4px_0_20px_rgba(15,23,42,0.04)]`
- Portrait bottom tab bar: `h-16`, `shadow-[0_-1px_4px_rgba(0,0,0,0.08)]`
- Active nav item: `bg-btn-primary text-white shadow-[0_4px_10px_-3px_rgba(59,130,246,0.55)]`
- Inactive nav item: `text-text-secondary hover:bg-shell-kid hover:text-btn-primary`
- Logo/brand icon: `bg-btn-primary text-white rounded-2xl`

### Form Inputs (parent views)

- Inputs: `rounded-xl border border-slate-200` + clear focus ring
- Labels: above the input, `text-sm font-bold text-text-secondary`
- No placeholder-as-label ever

---

## Colour Usage Rules

1. **One accent:** `--color-btn-primary` (#3b82f6, blue-500) is the single interactive accent for the whole app. Do not introduce additional accent families.
2. **Subject colours** are the only exception - each subject gets its own colour from the token map. They are used only on subject-specific cards, hero fills, and icon backgrounds.
3. **Semantic over raw:** Always use a semantic token. Never use raw Tailwind palette values for semantic purposes (e.g. do not use `bg-blue-500` where `bg-btn-primary` exists).
4. **Parent view background:** `bg-[#f3f2ec]` is an undocumented hex - this should be migrated to a new token `--color-shell-parent: #f3f2ec` added to `@theme {}`.

---

## Motion Rules

`MOTION_INTENSITY: 3` - CSS-only. No GSAP. No Motion library (not installed).

| Interaction                   | Implementation                                                               |
| ----------------------------- | ---------------------------------------------------------------------------- |
| Tap feedback                  | `active:scale-[0.97] transition-transform duration-150`                      |
| Colour hover                  | `transition-colors duration-150`                                             |
| Live pulse (period indicator) | `animate-pulse` (Tailwind)                                                   |
| Progress bar fill             | `transition-all` (no explicit duration - default 150ms)                      |
| Game entry tap                | `active:scale-[0.97] transition-transform duration-150` (NOT `duration-100`) |

**Rules:**

- Minimum transition duration: `150ms`. `duration-100` is too fast for tactile feedback.
- Animate only `transform` and `opacity`. Never animate `width`, `height`, `top`, `left`.
- Always add `prefers-reduced-motion` fallback for any animation above `duration-0`. For CSS-only transitions, rely on the global `*` reset to handle it, or add `motion-reduce:transition-none` where needed.
- No infinite loops except `animate-pulse` on live indicators (single, purposeful use).

---

## Emoji Policy

Emojis are **explicitly part of the kid-facing design language**. This overrides the SKILL.md default policy.

- Subject icons, nav icons, status indicators, and celebratory moments all use emoji.
- Use `aria-hidden="true"` on all decorative emojis.
- Do not replace emojis with icon-library SVGs on the kid-facing surfaces.
- Parent-facing surfaces may use icon libraries (`@phosphor-icons/react`, `@tabler/icons-react`) for a more professional feel, but emoji is also acceptable.

---

## Sections & Eyebrow Restraint

Even though this is a dashboard (not a landing page), the eyebrow discipline from the SKILL.md applies to the parent-facing overview panel:

- Max 1 eyebrow per 3 content sections.
- Pattern: `text-[10px] font-extrabold tracking-widest text-text-muted uppercase`
- On the kid-facing dashboard, section labels are plain `text-lg font-black text-text-primary` headings - no eyebrows needed.

---

## Dark Mode

Dark mode is **not implemented**. The app is light-mode only with `bg-shell-kid` (#f0f9ff) as the base.

Do not add dark mode variants until it is explicitly scoped as a feature. If it is added, use CSS variable strategy (already in place via `@theme {}`), not `dark:` class variants.

---

## Enhancement Proposal — Dial Upgrade Review

> **STATUS: IMPLEMENTED** (2026-06-24). VD-3 (parent mini week grid) and VD-4 (stat trend lines) deferred — VD-3 needs type research, VD-4 blocked on real data.

### Proposed Dial Targets

| Dial | Current | Proposed | Scope |
|---|---|---|---|
| `DESIGN_VARIANCE` | 5 | **7** | All surfaces |
| `MOTION_INTENSITY` | 3 | **5** | Kid surfaces primary, parent secondary |
| `VISUAL_DENSITY` | 6 | **6 kid / 7 parent** | Surface-split strategy |

Rationale: The audience (6-year-old) benefits from higher visual interest and motion for engagement. Density should only increase on the parent surface where the user is a power admin. The kid surface gains variance and motion but stays breathable.

---

### DESIGN_VARIANCE: 5 → 7

#### DV-1: Active period card grows in DayRail
**File:** [DayRail.tsx](components/dashboard/DayRail.tsx)
**Current:** All period cards identical `min-w-[140px]`. Only border colour signals the active period.
**Proposed:** Active period card uses `min-w-[200px]` — it physically dominates the rail. Past periods keep `opacity-55`. This creates unambiguous visual hierarchy with no layout breaking.

#### DV-2: Dashboard hero card — depth layer
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx) L85-151
**Current:** Flat solid colour block. Background emoji watermark at `text-8xl opacity-20`.
**Proposed:** Add a `pointer-events-none absolute inset-0` overlay with a radial gradient `rgba(255,255,255,0.12)` fading from top-left to transparent. This gives the card material depth. Also increase the watermark emoji to `text-9xl opacity-15` for a more distinct compositional anchor.

#### DV-3: Game entry cards — asymmetric columns
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx) L197-216
**Current:** `grid-cols-2 gap-3` — two equal columns, both cards identical weight.
**Proposed:** `grid-cols-[3fr_2fr] gap-3`. Math (first card) takes the larger column as the hero game. English is the supporting card. Collapses to `grid-cols-1` on portrait-narrow. Cleanest variance win with one class change.

#### DV-4: Top-scoring grade card gets a tinted background
**File:** [GradeCard.tsx](components/grades/GradeCard.tsx)
**Current:** All grade cards are identical white backgrounds regardless of score.
**Proposed:** When `score >= 9`, apply `color-mix(in oklab, ${subject.color} 8%, white)` as the card background. Same API already used for the icon container — consistent. Gold-tier cards visually separate from the pack.

#### DV-5: Points chip leads the stat row
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx) L63-79
**Current:** Three uniform `rounded-pill text-sm` chips — points, streak, badges.
**Proposed:** Points chip uses `text-base` (from `text-sm`) and `px-4` (from `px-3`). It is the primary achievement metric and should have visual weight. Streak and badges remain unchanged.

#### DV-6: GradeCard arbitrary radii — token cleanup (also a violation)
**File:** [GradeCard.tsx](components/grades/GradeCard.tsx) L29, L36
**Current:** `rounded-[20px]` (card outer), `rounded-[13px]` (icon container).
**Proposed:** `rounded-[20px]` → `rounded-card`, `rounded-[13px]` → `rounded-xl`. Variance benefit: consistent Shape Consistency Lock improves the visual rhythm across the grades page.

---

### MOTION_INTENSITY: 3 → 5

Target: "Fluid CSS" band per SKILL.md. No GSAP, no Motion library install needed. All proposals use CSS `@keyframes` + `animation-delay` cascades + `cubic-bezier` easing. A `prefers-reduced-motion` block in `globals.css` disables all keyframe animations globally.

**Shared CSS to add to `globals.css`:**
```css
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes growWidth {
  from { width: 0%; }
  to   { width: var(--bar-pct); }
}
@keyframes pingRing {
  75%, 100% { transform: scale(2.5); opacity: 0; }
}
@keyframes popIn {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}
@media (prefers-reduced-motion: reduce) {
  .animate-fade-slide-up,
  .animate-grow-width,
  .animate-ping-ring,
  .animate-pop-in { animation: none !important; }
}
```

#### MI-1: Dashboard section card entrance stagger
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx)
**Current:** All sections appear instantly on page load.
**Proposed:** Each `<section>` in the dashboard grid gets class `animate-fade-slide-up` and a staggered inline `style={{ animationDelay: '0.05s' }}` (hero: 0s, DayRail: 0.08s, games: 0.14s, homework: 0.18s). Duration: `0.4s cubic-bezier(0.16, 1, 0.3, 1)`. Only section containers animate — not their children.

#### MI-2: Game cards — hover lift
**Files:** [GameSectionCard.tsx](components/games/GameSectionCard.tsx), [GameEntryCard.tsx](components/games/GameEntryCard.tsx)
**Current:** `active:scale-[0.97/0.98]` only. No hover state.
**Proposed:** Add `hover:scale-[1.02]` and `hover:shadow-2xl` on both cards. Transition upgrades from `duration-150` to `duration-200`. Keeps `active:scale-[0.97]` for the press-down feel. Two-stage feedback: lift on hover, push on press.

#### MI-3: Progress bars animate in from zero
**Files:** [DayRail.tsx](components/dashboard/DayRail.tsx), [GradeCard.tsx](components/grades/GradeCard.tsx), [GameSectionCard.tsx](components/games/GameSectionCard.tsx)
**Current:** Progress bars render at final width immediately.
**Proposed:** Each bar sets `--bar-pct` as an inline CSS custom property and uses `animation: growWidth 0.6s cubic-bezier(0.16, 1, 0.3, 1) both`. The `style` prop becomes `style={{ '--bar-pct': `${pct}%`, width: `${pct}%` } as React.CSSProperties}` — the static `width` acts as the fallback for reduced-motion.

#### MI-4: DayRail active period — ripple ring
**File:** [DayRail.tsx](components/dashboard/DayRail.tsx)
**Current:** Static `size-2 rounded-full` dot indicator on the active period.
**Proposed:** Add a sibling `<span>` behind the dot — same `size-2 rounded-full` but with `animate-ping-ring` and matching background colour. The pulsing outer ring communicates "live now" without crowding the layout. Only appears when `isNow === true`.

#### MI-5: Homework celebration overlay — pop-in
**File:** [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L125-135
**Current:** The all-done overlay appears instantly via conditional render.
**Proposed:** The inner content `<div>` (emoji + heading + subtext) gets `animate-pop-in` (`0.35s cubic-bezier(0.16, 1, 0.3, 1)`). The backdrop `bg-white/90` fades in via `transition-opacity duration-300` using `opacity-0 → opacity-100` after a `useEffect` tick. Combined: backdrop fades, content pops in slightly delayed.

#### MI-6: Nav active item — smoother transition
**File:** [AppSidebar.tsx](components/layout/AppSidebar.tsx)
**Current:** `transition-[transform,background-color,color] duration-150`.
**Proposed:** Upgrade to `duration-200` and add `ease-out`. Add `hover:scale-[1.01]` micro-lift before click. Low visual cost, higher tactile quality.

---

### VISUAL_DENSITY: 6 kid / 7 parent

#### VD-1 (Kid): DayRail header — split chips
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx) L155-161
**Current:** Period count and time range as a single muted string `"5 tiết · 07:00–11:30"`.
**Proposed:** Two distinct inline elements: `<span class="rounded-pill bg-shell-light px-2 py-0.5 text-xs font-extrabold text-text-muted">5 tiết</span>` + `<span class="text-xs font-bold text-text-muted">07:00–11:30</span>`. More scannable, same space.

#### VD-2 (Kid): Homework section — progress ring replaces text badge
**File:** [DashboardView.tsx](components/dashboard/DashboardView.tsx) L222-228
**Current:** `"X chưa làm"` text badge next to the "Bài tập" heading.
**Proposed:** Replace the amber chip with a compact SVG circle-stroke progress ring (24×24px) showing `doneCount/total`. The ring fills clockwise — green when complete, amber when pending. More info, less space. Requires a new `<ProgressRing size={24} value={doneCount} max={total} />` UI primitive.

#### VD-3 (Parent): Mini week grid in the schedule card
**File:** [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L323-347
**Current:** Schedule preview card shows today's subjects as flat chips.
**Proposed:** Replace chips with a 5-column (Mon–Fri) dot-grid. Each cell shows 4–5 coloured `size-2` dots representing the subjects for that day. Today's column has a light background. This is a dramatic density improvement for the parent — they see the whole week at a glance without opening the schedule manager. Requires computing subjects-per-day from `initialSchedule`.

#### VD-4 (Parent): Stat card trend lines
**File:** [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L268-288
**Current:** 4 stat cards with raw numbers. Screen time and badge count are hardcoded.
**Proposed:** Block on wiring real screen-time and badge data first. Once real, add a third row to each card: `↑ 0.5 vs tuần trước` (trend delta). This requires week-over-week grade history from `initialGrades`. Lower priority — depends on backend data.

---

### Additional Violations Found During Review

These files were not in the original violations table but have the same categories of issues:

| File | Violation | Fix |
|---|---|---|
| [GradeCard.tsx](components/grades/GradeCard.tsx) L29 | `rounded-[20px]` | `rounded-card` |
| [GradeCard.tsx](components/grades/GradeCard.tsx) L36 | `rounded-[13px]` | `rounded-xl` |
| [GradeCard.tsx](components/grades/GradeCard.tsx) L46, L54 | `text-slate-800` | `text-text-primary` |
| [GradeCard.tsx](components/grades/GradeCard.tsx) L55 | `text-[22px]` (score) | `text-2xl` |
| [GameSectionCard.tsx](components/games/GameSectionCard.tsx) L51 | `rounded-[22px]`, `rounded-[28px]` | `rounded-card` |
| [GameSectionCard.tsx](components/games/GameSectionCard.tsx) L50 | `duration-100` | `duration-150` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L56, L131 | `text-slate-800` | `text-text-primary` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L57 | `text-slate-500` | `text-text-secondary` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L78 | `text-[22px]` | `text-2xl` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L93 | `text-[30px]`, `lg:text-[34px]` | `text-3xl`, `lg:text-4xl` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L94 | `text-slate-500`, `lg:text-[15px]` | `text-text-secondary`, `lg:text-base` |
| [HomeworkListView.tsx](components/homework/HomeworkListView.tsx) L107, L115 | `text-slate-400` | `text-text-muted` |
| [GamesHubView.tsx](components/games/GamesHubView.tsx) L144 | `text-[32px]` | `text-3xl` |

---

## Known Violations (fix before declaring any UI task complete)

| File                                                                            | Violation                                                | Fix                                                                        |
| ------------------------------------------------------------------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------- |
| [GradesView.tsx](components/grades/GradesView.tsx) L50, L61-62                  | `text-[22px]`, `text-[30px]`, `text-[34px]` raw px sizes | Replace with `text-2xl`, `text-3xl`, `text-[2rem]`                         |
| [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L158-213   | `rounded-[24px]`, `rounded-[20px]`, `rounded-[18px]`     | Replace with `rounded-card` / `rounded-3xl` / `rounded-2xl`                |
| [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L447, L464 | `bg-[#f3f2ec]` hardcoded hex                             | Add `--color-shell-parent: #f3f2ec` to `@theme {}`, use `bg-shell-parent`  |
| [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L243       | `#4338ca` hardcoded in gradient                          | Add `--color-gradient-indigo: #4338ca` to `@theme {}` or use `oklch(...)`  |
| [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) L73-74     | `const streakDays = 6`, `const totalPoints = 1280`       | Wire to real data from user progress context                               |
| [ParentDashboardView.tsx](components/parent/ParentDashboardView.tsx) throughout | `text-slate-800`, `text-slate-500`, `text-slate-400` raw | Replace with `text-text-primary`, `text-text-secondary`, `text-text-muted` |
| [GameEntryCard.tsx](components/games/GameEntryCard.tsx) L32                     | `duration-100`                                           | Change to `duration-150`                                                   |

---

## Pre-Task Checklist (run before writing any UI code)

- [ ] Have I read this file from top to bottom?
- [ ] Am I using tokens from `@theme {}` for every colour, radius, and spacing value?
- [ ] Have I avoided `text-slate-*` / `text-gray-*` raw palette values for semantic text?
- [ ] Are all `rounded-*` values from the token system (`rounded-card`, `rounded-pill`, `rounded-2xl`, `rounded-xl`) - no `rounded-[Npx]`?
- [ ] Are all type sizes from the Tailwind scale - no `text-[Npx]`?
- [ ] Do all interactive elements have `touch-manipulation`, `select-none`, and `active:scale-[0.97]`?
- [ ] Is minimum transition duration `150ms`?
- [ ] Do all decorative emojis have `aria-hidden="true"`?
- [ ] Does every tap target meet `min-h-tap-lg`?
- [ ] Is the layout `h-dvh` (not `h-screen`)?
- [ ] Have I checked the Known Violations list - did I avoid repeating them?

---

## Surfaces Summary

| Surface           | Route group                | Audience      | Visual density | Background                        |
| ----------------- | -------------------------- | ------------- | -------------- | --------------------------------- |
| Kid dashboard     | `(dashboard)`              | Child (6 yrs) | Medium         | `bg-shell-kid`                    |
| Kid games         | `(games)`                  | Child         | Medium-low     | `bg-shell-kid`                    |
| Parent management | `(parent)`                 | Parent        | Medium-high    | `bg-shell-parent` (pending token) |
| Unlock / PIN      | `kid-unlock`, `parent/pin` | Both          | Low            | `bg-white`                        |
