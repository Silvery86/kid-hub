# Front-End Component Guide — Kid Hub

**Role:** FE — Sofia Patel
**Last updated:** 2026-06-01
**Status:** Active development · v0.1.0

---

## 1. Component Architecture

Components follow a strict two-tier model:

| Tier | Directory | Rule |
|---|---|---|
| UI Primitives | `components/ui/` | Reusable, no domain knowledge, no direct DB coupling |
| Domain Components | `components/<domain>/` | Presentational, uses hooks + primitives |

Domain directories: `dashboard/`, `games/`, `homework/`, `grades/`, `parent/`, `badges/`, `kid/`, `layout/`

---

## 2. UI Primitives Inventory

| Component | File | Props Summary |
|---|---|---|
| `Badge` | `components/ui/Badge.tsx` | `tier: BadgeTier` — renders excellent / good / needs-practice chip |
| `KidButton` | `components/ui/KidButton.tsx` | `variant: 'primary' \| 'secondary' \| 'ghost'`, `size`, `onClick` |
| `KidCard` | `components/ui/KidCard.tsx` | `className?`, `children` — styled card wrapper |
| `ProgressBar` | `components/ui/ProgressBar.tsx` | `value: number` (0–100), `variant?` |
| `StarRating` | `components/ui/StarRating.tsx` | `stars: 1 \| 2 \| 3`, `maxStars?: 3` |
| `FullScreenModal` | `components/ui/FullScreenModal.tsx` | `isOpen`, `onClose`, `children` |
| `PinKeypad` | `components/ui/PinKeypad.tsx` | `onInput(digit)`, `onDelete`, `onSubmit` |
| `ErrorBoundary` | `components/ui/ErrorBoundary.tsx` | `fallback?`, `children` |

### Usage Rules for Primitives

- Never add domain-specific logic (game scores, subject colors) inside `components/ui/`
- `KidButton` must be used for all interactive buttons — do not build ad-hoc `<button>` elements
- `FullScreenModal` must be used for all modal overlays — prevents z-index and scroll-lock conflicts
- `ErrorBoundary` wraps each route group layout — not individual components

---

## 3. Domain Component Inventory

### Dashboard (`components/dashboard/`)

| Component | Responsibility |
|---|---|
| `DashboardView` | Main hub orchestrator — receives all data as props from page |
| `ScheduleView` | Full weekly schedule grid |
| `WeekGrid` | 7-day period grid with subject color cells |
| `DayTabs` | Day selector tabs (Mon–Sun) |
| `DayRail` | Horizontal scrollable day rail (current ± 3 days) |
| `DayList` | Vertical scrollable day list |
| `TodayTimetable` | Today's periods sorted by time |
| `CurrentClassHighlight` | Current and next period hero card |
| `SubjectCard` | Subject color box + icon (used inside period cells) |
| `SubjectIcon` | Icon resolver — returns Lucide icon or emoji fallback |
| `SubjectLegend` | Color legend for subject codes |
| `PeriodCell` | Single period cell in `WeekGrid` |
| `EveningBlockChip` | Compact chip for extra evening classes |
| `StreakWidget` | Streak counter display |
| `TodayPlanCard` | Today summary card (school + evening) |
| `BadgeModal` | Lightbox for earned badge display |
| `HomeworkCheckbox` | Checkbox + subject label for dashboard homework item |

### Games (`components/games/`)

| Component | Responsibility |
|---|---|
| `GamesHubView` | `/games` page — Math + English sections + coming-soon cards |
| `GameSectionCard` | Section card (Math or English) with game entries |
| `GameEntryCard` | Single mini-game launcher |
| `GameStatsBar` | Points + streak + stars progress bar |
| `GameResultScreen` | Post-game result (stars, points, next action) |
| `GameHud` | In-game HUD (timer, question counter, score) |
| `ComingSoonCard` | Disabled game placeholder card |
| `MathHub` | Math mini-game router (Counting / Addition / Shapes) |
| `MathGame` | Game wrapper — routes to specific minigame component |
| `CountingGame` | Count-the-objects game |
| `ShapeGame` | Identify-the-shape game |
| `EnglishHub` | English mini-game router |
| `EnglishGame` | Game wrapper — routes to specific English game |
| `AlphabetGame` | Alphabet drill game |
| `WordSafariGame` | Vocabulary matching game |
| `SoundHuntGame` | Phonics matching game |
| `ShapeDisplay` | SVG shape renderer |

### Parent (`components/parent/`)

| Component | Responsibility |
|---|---|
| `ParentDashboardView` | Two-panel schedule + grades management |
| `ScheduleManager` | Schedule CRUD form + list |
| `GradesManager` | Grade upsert form |
| `ParentManagerPanel` | Panel layout wrapper (list + form) |
| `ParentHeader` | Title + breadcrumb bar |
| `ParentSaveButton` | Save button (triggers server action) |
| `ParentSidebarNav` | Left sidebar with nav links |
| `SignOutButton` | Sign out link |
| `TodayOverviewPanel` | Today's schedule summary in parent view |
| `ParentLoginView` | Login form (email + password) |
| `ParentPinHero` | PIN entry hero section |
| `ParentPinKeypad` | PIN entry grid (wraps `PinKeypad`) |
| `ParentPinScreen` | Full-page PIN screen |
| `KidAccessView` | Feature toggles + activity feed |
| `AccessToggleRow` | Single feature toggle row |
| `KidPatternSetup` | Kid unlock pattern setter |
| `KidProgressPanel` | Kid progress summary panel |
| `RecentActivityPanel` | Activity event feed |

---

## 4. Tailwind CSS v4 Token Usage

### Design Token Reference

All tokens are defined in `app/globals.css` inside `@theme {}`. Use semantic token names — never raw palette values for semantic purposes.

#### Subject Colors

```html
<div class="bg-math">     <!-- Math — blue #3b82f6 -->
<div class="bg-english">  <!-- English — emerald #10b981 -->
<div class="bg-science">  <!-- Science — violet #8b5cf6 -->
<div class="bg-pe">       <!-- PE — amber #f59e0b -->
<div class="bg-art">      <!-- Art — pink #ec4899 -->
<div class="bg-vietnamese"> <!-- Vietnamese — red #ef4444 -->
<div class="bg-music">    <!-- Music — orange #f97316 -->
```

#### Shell Backgrounds

```html
<div class="bg-shell-kid">   <!-- Kid-facing pages — light blue #f0f9ff -->
<div class="bg-shell-light"> <!-- Parent light mode — #f8fafc -->
<div class="bg-shell-dark">  <!-- Admin/dark mode — #0f172a -->
```

#### Text Hierarchy

```html
<p class="text-text-primary">   <!-- Body text #1e293b -->
<p class="text-text-secondary"> <!-- Supporting labels #64748b -->
<p class="text-text-muted">     <!-- Placeholder/disabled #94a3b8 -->
<p class="text-text-subtle">    <!-- Decorative #cbd5e1 -->
```

#### Button Variants

```html
<button class="bg-btn-primary hover:bg-btn-primary-hover border-btn-primary-border">
<button class="bg-btn-secondary hover:bg-btn-secondary-hover">
<button class="border-btn-ghost-border">
```

#### Progress & Stars

```html
<div class="bg-progress-high">  <!-- ≥ 80 % fill — amber #fbbf24 -->
<div class="bg-progress-low">   <!-- < 80 % fill — orange #fb923c -->
<div class="bg-progress-track"> <!-- Empty track — gray #e2e8f0 -->
<span class="text-star-filled"> <!-- Earned star — yellow #fbbf24 -->
<span class="text-star-empty">  <!-- Unearned star — gray #cbd5e1 -->
```

#### Spacing & Touch Targets

```html
<button class="min-h-tap">    <!-- Minimum 48px tap target -->
<button class="min-h-tap-lg"> <!-- Primary button — 64px tap target -->
```

---

## 5. Responsive Strategy

Kid Hub uses orientation variants, not breakpoint variants.

```css
/* In app/globals.css */
@custom-variant portrait  { @media (orientation: portrait)  { @slot } }
@custom-variant landscape { @media (orientation: landscape) { @slot } }
```

### Usage Pattern

```html
<!-- Stack in portrait, row in landscape -->
<div class="portrait:flex-col landscape:flex-row flex">

<!-- Larger font in portrait mode -->
<h1 class="portrait:text-2xl landscape:text-xl">
```

### Touch & Scroll Rules

Apply these globally (already in `globals.css`):

| Rule | CSS | Reason |
|---|---|---|
| No tap delay | `touch-action: manipulation` | Removes 300 ms click delay |
| No tap highlight | `-webkit-tap-highlight-color: transparent` | No gray flash on tap |
| No rubber-band scroll | `overscroll-behavior: none` | Prevents pull-to-refresh |
| Safe area padding | `.safe-pad { padding-bottom: env(safe-area-inset-bottom) }` | iPhone notch |

---

## 6. Component Patterns

### Server Component → Client Component Props Pattern

Pages are Server Components. They fetch data and pass it as props to Client Components.

```tsx
// app/(dashboard)/dashboard/page.tsx — Server Component
export default async function DashboardPage() {
  const schedule = await getScheduleAction()
  const homework = await getTodayHomeworkAction()
  return <DashboardView schedule={schedule.data} homework={homework.data} />
}

// components/dashboard/DashboardView.tsx — Client Component
'use client'
export function DashboardView({ schedule, homework }) { ... }
```

### Optimistic UI Pattern (Homework Toggle)

```tsx
// In Client Component
const [isDone, setIsDone] = useState(item.isDone)

async function handleToggle() {
  setIsDone(prev => !prev)  // optimistic update
  const result = await toggleHomeworkDoneAction(item.id, !isDone)
  if (!result.success) setIsDone(item.isDone)  // revert on error
}
```

### Loading State Rule

Every route that fetches server data must have a `loading.tsx` sibling:

```
app/(dashboard)/schedule/
  ├── page.tsx
  └── loading.tsx  ✅ exists
app/(dashboard)/grades/
  ├── page.tsx
  └── loading.tsx  ❌ missing — must add
app/(dashboard)/homework/
  ├── page.tsx
  └── loading.tsx  ❌ missing — must add
app/(dashboard)/dashboard/
  ├── page.tsx
  └── loading.tsx  ❌ missing — must add
```

### Error Boundary Rule

Each route group layout must wrap content in `ErrorBoundary`:

```tsx
// app/(dashboard)/layout.tsx
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'

export default function DashboardLayout({ children }) {
  return (
    <AppSidebar>
      <ErrorBoundary>
        {children}
      </ErrorBoundary>
    </AppSidebar>
  )
}
```

---

## 7. Client-Side Performance Rules

- **No `useEffect` for data fetching** — use Server Components + Server Actions instead
- **No `useState` for server data** — pass as props from page
- **`useLocalStorage` only for UI preferences and progress cache** — not for authoritative data
- **`useSchedule` polling** — pauses when `document.hidden` is true (already implemented); do not add more polling hooks without the same guard
- **Game components** — use `requestAnimationFrame` for countdown timers, not `setInterval`
- **Audio (`useAudio`)** — `AudioContext` initialized on first user interaction, not on mount (avoids autoplay block)

---

## 8. Icon Usage

Icons use a two-layer system:

1. **Lucide React** — UI action icons (navigation, buttons, form controls)
2. **Emoji** — Domain icons (subjects, games, badges)

Subject emoji are resolved via `lib/icons.ts → ICON_MAP`. Never hard-code an emoji string for a subject; always use:

```ts
import { getSubjectIcon } from '@/lib/icons'
const icon = getSubjectIcon('math')  // returns '📐'
```

---

## 9. Missing Components (To Build)

| Component | Priority | Purpose |
|---|---|---|
| `app/(dashboard)/dashboard/loading.tsx` | P1 | Skeleton for dashboard route |
| `app/(dashboard)/grades/loading.tsx` | P1 | Skeleton for grades route |
| `app/(dashboard)/homework/loading.tsx` | P1 | Skeleton for homework route |
| `app/(dashboard)/error.tsx` | P1 | Route-level error boundary for dashboard |
| `app/(games)/error.tsx` | P1 | Route-level error boundary for games |
| `app/(parent)/error.tsx` | P1 | Route-level error boundary for parent |
| `components/parent/ActivityFeedView.tsx` | P1 | Full activity feed (not just recent panel) |
| `components/badges/BadgeShelf.tsx` | P2 | Persistent earned-badge shelf on dashboard |
| `components/parent/ScheduleTemplateSelector.tsx` | P2 | Copy-week / template picker |
