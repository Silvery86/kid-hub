# English Route — Design Specification

> **Source design:** `design/pages/Kid Hub English - Responsive.html` · `design/components/english.jsx`
> **Current implementation:** `components/games/EnglishHub.tsx`
> **Responsive rules:** `docs/guides/responsive-spec.md`

> **Responsive convention:** Base styles target **P1 landscape** (short height, usable width).
> Portrait overrides use `portrait:`. Sidebar/desktop density uses `lg:` (≥ 1024px).
> Kid interactive targets ≥ `min-h-tap` (48px); primary actions ≥ `min-h-tap-lg`.

---

## 1. Scope

This document covers the **`/english` hub** screen only — the three game-type cards (Alphabet Explorer, Word Safari, Sound Hunt) and the homework banner.

The design file renders **five viewports × four sections** (Hub + 3 mini-games). This document focuses on the Hub section only.

---

## 2. Viewport Layout Summary

| Viewport | Size | Layout |
|---|---|---|
| Phone Portrait · P2 | 390 × 844 | Vertical stack of **horizontal row cards** (`EnglishGameCardRow`). Bottom nav bar. Back button top-left. Title centred. |
| Phone Landscape · P1 | 844 × 390 | **Narrow icon-only sidebar** (`NarrowRail`) left. Main area: **3-column grid of compact big cards** (`EnglishGameCardBig compact`). Homework shown as small amber pill. |
| Tablet Portrait · P2 | 820 × 1180 | **Standard sidebar** left (icon + label). Main area: vertical stack of **large row cards** (`EnglishGameCardRow size="lg"`). |
| Tablet Landscape · P1 | 1280 × 800 | Sidebar left. Main area: **3-column grid of full-size big cards** (`EnglishGameCardBig`), max-width 1000px centred. |
| Desktop | 1440 × 900 | **Wide sidebar** (label + avatar/parent link at bottom). Main area: 3-column grid of full-size big cards, max-width 1100px. Subtitle shows total star progress. |

> **Tailwind class order to follow:** unprefixed = landscape base → `portrait:` override → `sm:`/`md:` width refinements → `lg:` desktop density. Never use `lg:` to switch kid nav to desktop nav.

---

## 3. New Game Card Components

The current implementation uses a single flat `GameCard` that is always square-ish with `flex-col` layout and a plain `bg-english` background. The new design introduces **two card shapes** depending on viewport.

### 3.1 `EnglishGameCardBig` — Landscape / Tablet L / Desktop

Used in landscape and wide viewports where cards are laid out in a 3-column grid. Has a `4/3` aspect ratio (normal) or `3/2` (compact for phone landscape).

| Element | Design Value | Tailwind / Token Equivalent |
|---|---|---|
| Background | `linear-gradient(160deg, #34d399 0%, #10b981 55%, #047857 100%)` | Inline `style={{ background: GRADIENT_BIG }}` |
| Box shadow | `0 18px 36px -16px rgba(16,185,129,.45)` | Inline `style={{ boxShadow: SHADOW_BIG }}` |
| Border radius | `24px` (normal) / `16px` (compact) | `rounded-3xl` / `rounded-2xl` |
| Watermark emoji | Game emoji, absolute bottom-right, large and faded | `absolute -bottom-4 -right-4 opacity-20 text-[80px]` |
| Icon box | 48px circle with white background + game emoji | `w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center` |
| Game title | Bold, white, `text-xl` | `text-white font-extrabold text-xl` |
| Game description | White, `text-sm`, opacity | `text-white/80 text-sm` |
| Star row | Stars earned at best level | `StarRating` component |
| CTA button | "Chơi →" green pill | `bg-white text-green-700 font-extrabold rounded-full text-sm px-4 py-2` |

**Compact variant differences** (phone landscape, `compact` prop):

- Aspect ratio: `3/2` instead of `4/3`
- Border radius: `rounded-2xl`
- No description text (truncated to title + stars + CTA only)
- CTA button: smaller padding

### 3.2 `EnglishGameCardRow` — Portrait / Row Variant

Used in phone portrait and tablet portrait where cards are stacked vertically. This is a **full-width horizontal row card**, not a square.

| Element | Design Value | Tailwind / Token Equivalent |
|---|---|---|
| Background | `linear-gradient(to right, #34d399 0%, #10b981 40%, #065f46 100%)` | Inline gradient (right-facing) |
| Layout | Horizontal flex row | `flex items-center gap-4` |
| Left section | Icon box (same as Big card) + title + desc | `flex-shrink-0` |
| Right section | Star rating + CTA pill | `ml-auto flex items-center gap-3` |
| Height | `size="md"`: `min-h-[80px]` · `size="lg"`: `min-h-[100px]` | `min-h-[80px]` or `min-h-[100px]` |
| Border radius | `rounded-2xl` | `rounded-2xl` |

---

## 4. Homework Banner

When today has an active English homework period (`isDone: false`):

| Element | Value |
|---|---|
| Background | `bg-amber-50 border border-amber-200` |
| Icon | 🏠 |
| Text | "Đây là bài tập về nhà hôm nay!" |
| `data-testid` | `"homework-banner"` |
| Position | Full width, above game card grid |

---

## 5. NarrowRail (Phone Landscape Sidebar)

In phone landscape, the app sidebar shrinks to a narrow icon-only rail (not the standard `AppSidebar`):

| Element | Value |
|---|---|
| Width | `w-14` (56px) |
| Background | `bg-shell-dark` (existing token) |
| Nav items | Icon only, no text |
| Active state | `bg-white/10 rounded-xl` |

This rail is the `landscape:` variant of the navigation. On portrait, the standard bottom tab bar takes over.

---

## 6. Responsive Implementation — Class Order

Following `docs/guides/responsive-spec.md` §5.1:

```tsx
{/* Hub container — landscape base, portrait override */}
<main className="
  flex-1 flex flex-col gap-6 p-6
  portrait:p-4 portrait:gap-4
  lg:max-w-5xl lg:mx-auto lg:p-8
">

{/* Card grid — 3-col in landscape, single-col in portrait */}
<div className="
  grid grid-cols-3 gap-5
  portrait:grid-cols-1 portrait:gap-4
  lg:gap-6
">
```

---

## 7. Constants to Extract

Extract gradient and shadow values as named constants to avoid inline repetition:

```typescript
// constants in EnglishHub.tsx or a shared lib/design/english.ts
const GRADIENT_BIG = 'linear-gradient(160deg, #34d399 0%, #10b981 55%, #047857 100%)'
const GRADIENT_ROW = 'linear-gradient(to right, #34d399 0%, #10b981 40%, #065f46 100%)'
const SHADOW_BIG = '0 18px 36px -16px rgba(16,185,129,.45)'
const SHADOW_COMPACT = '0 12px 24px -12px rgba(16,185,129,.35)'
```

---

## 8. Migration from Existing `GameCard`

The current `EnglishHub.tsx` uses a generic `GameCard` (or `GameEntryCard`) component with `bg-english` as a plain colour. The new design requires two distinct card shapes. Migration plan:

1. Keep `GameEntryCard` in `components/ui/` as-is (used elsewhere).
2. Create `EnglishGameCardBig` and `EnglishGameCardRow` in `components/games/`.
3. Update `EnglishHub.tsx` to render the correct card variant based on orientation:

```tsx
// Landscape (base)
<EnglishGameCardBig game={game} />

// Portrait (override)
<EnglishGameCardRow size="md" game={game} className="portrait:flex landscape:hidden" />
```

Or use a single component that branches internally via `portrait:` variants.
