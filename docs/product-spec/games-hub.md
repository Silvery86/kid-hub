# Games Hub — `/games` Route Implementation Plan

> Source references: `design/pages/Kid Hub Games - Responsive.html` · `design/components/games.jsx`

---

## Goal

Implement a new `/games` route as a responsive hub that contains both game suites:

- Math games (`/math`)
- English/language games (`/english`)

The page is a launcher and progress overview, not a gameplay screen. It should match the design system and responsive behavior used in the provided design files.

---

## 1. Product Scope

### In Scope

- New route: `/games`
- Two interactive section cards:
  - `Toán Học` (links to `/math`)
  - `Tiếng Anh` (links to `/english`)
- Three non-interactive "Sắp ra mắt" cards:
  - `Khoa học vui`
  - `Vẽ Sáng Tạo`
  - `Âm Nhạc`
- Stats chips row showing points/streak/stars/badges
- Full responsive behavior for 5 target viewports

### Out of Scope

- New gameplay modules for coming-soon cards
- Data model migration for new game types
- Parent management features on this screen

---

## 2. Route & Navigation Contract

### Primary Route

- Add `app/(dashboard)/games/page.tsx` (server page)
- Render a client component `GamesHubView`

### Link Targets

- Math section CTA and card click → `/math`
- English section CTA and card click → `/english`

### Sidebar Behavior

- Sidebar "Trò chơi" entry should treat these as active:
  - `/games` (hub)
  - `/math`
  - `/english`

### Optional Alias Decision

Current codebase uses `/english`. Add redirect `/language` → `/english` only if product explicitly wants that URL.

---

## 3. Five-Viewport Layout Matrix

| Viewport | Layout | Key Behavior |
|---|---|---|
| Phone Portrait (390×844) | Single-column scroll | Title/subtitle, compact stats chips, stacked section cards, coming-soon 3-col mini cards, bottom nav |
| Phone Landscape (844×390) | Narrow rail + content | Compact header + chips, two section cards in 2 columns, no large coming-soon area |
| Tablet Portrait (820×1180) | Sidebar + main column | Full-width stacked section cards, coming-soon row, compact stats on header right |
| Tablet Landscape (1280×800) | Sidebar + main | Two primary section cards in 2 columns, coming-soon row below, full stats |
| Desktop (1440×900) | Wide sidebar + centered content | Same structure as tablet-L with wider spacing, max width container, richer subtitle |

---

## 4. Component Inventory

Create these under `components/games/`:

### `GamesHubView.tsx`

- Responsive orchestrator
- Owns computed summary values and click handlers

### `GameSectionCard.tsx`

Large gradient card with:

- Icon block
- Title + description
- CTA pill (`Vào chơi →`)
- 3 mini-game tiles with stars
- Progress bar (`x/y ⭐`, `%`)

### `ComingSoonCard.tsx`

- Dashed bordered placeholder card
- `Sắp ra mắt` badge

### `GameStatsBar.tsx`

- Chips for points/streak/stars/badges
- Compact and default variants

Keep this hub in `components/games/` (same domain as existing `MathHub`/`EnglishHub`), and keep primitives in `components/ui/`.

---

## 5. Data Contract

Add a local view-model in `GamesHubView`:

```typescript
type GameSection = {
  id: 'math' | 'english'
  label: string
  emoji: string
  color: string
  colorDark: string
  gradient: string
  desc: string
  totalStars: number
  maxStars: number
  href: '/math' | '/english'
  games: Array<{ id: string; emoji: string; name: string; best: number }>
}
```

`totalStars` should be derived from user progress when available (preferred), not hardcoded.

---

## 6. Styling and Tokens

Use existing semantic tokens from `app/globals.css`:

- Shell: `bg-shell-kid`
- Text: `text-text-primary`, `text-text-secondary`
- Subject colors: math/english tokens where possible

Card gradients can remain inline style values (matching design) if tokenized gradients are not yet present. Keep tap targets at least `min-h-tap`/`min-h-tap-lg`.

---

## 7. Integration with Existing Architecture

- Route group: `(dashboard)` already provides sidebar and shell offsets; do not mount an extra sidebar inside the hub component.
- Keep `/math` and `/english` as separate hubs/flows.
- `/games` acts as parent launcher route only.

Server page:

- `app/(dashboard)/games/page.tsx` fetches progress data (if needed) and passes props to client view.

Client view:

- `components/games/GamesHubView.tsx` handles responsive render branches.

---

## 8. Delta Plan — Implementation Steps

1. **D-01** Create `app/(dashboard)/games/page.tsx`
2. **D-02** Create `components/games/GamesHubView.tsx`
3. **D-03** Create `components/games/GameSectionCard.tsx`
4. **D-04** Create `components/games/ComingSoonCard.tsx`
5. **D-05** Create `components/games/GameStatsBar.tsx`
6. **D-06** Update `components/layout/AppSidebar.tsx` active route logic to include `/games`
7. **D-07** Update dashboard links to point "Trò chơi" entry to `/games` while preserving direct `/math` and `/english` access
8. **D-08** Add responsive e2e coverage for `/games`

---

## 9. Testing Plan

**Functional:**

- `/games` renders and both section cards navigate correctly:
  - Toán → `/math`
  - Tiếng Anh → `/english`
- Coming-soon cards are visibly disabled/non-interactive

**Responsive:**

- Verify layout parity for: 390×844, 844×390, 820×1180, 1280×800, 1440×900

**Regression:**

- Sidebar active state remains correct on `/games`, `/math`, `/english`
- No hydration mismatch from time-based strings
- No duplicate sidebars from mixing `(dashboard)` and in-component sidebar usage

---

## 10. Risks and Decisions

1. **Route naming conflict**: user language mentions `/language`, codebase uses `/english`.
   - Decision needed: keep only `/english` or add redirect alias.

2. **Progress source for stars/chips**:
   - If data is from local storage only, server render and client hydrate may differ.
   - Prefer deterministic server-safe defaults, then enhance client-side after mount.

3. **Navigation semantics**:
   - If sidebar item "Trò chơi" currently targets `/math`, decide whether to switch to `/games` as the new hub canonical entry.

---

## 11. Acceptance Criteria

- New `/games` route exists and visually matches design across 5 viewports.
- `/games` clearly contains Math + English suites and coming-soon modules.
- CTA and card clicks route to existing game hubs correctly.
- Sidebar and responsive behavior remain consistent with the dashboard shell.
- No hydration errors or layout regressions introduced.
