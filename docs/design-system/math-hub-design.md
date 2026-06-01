# Math Route — Design Specification

> **Source design:** `design/pages/Kid Hub Math - Responsive.html` · `design/components/math.jsx`
> **Current implementation:** `components/games/MathHub.tsx`
> **Responsive rules:** `docs/guides/responsive-spec.md`
> **Related:** `docs/design-system/english-hub-design.md`

> **Responsive convention:** Base styles target **P1 landscape** (short height, usable width).
> Portrait overrides use `portrait:`. Desktop/sidebar density uses `lg:`.
> Kid targets ≥ `min-h-tap` (48px); primary actions ≥ `min-h-tap-lg`.

---

## 1. Scope & Key Difference vs English Hub

This document covers the **`/math` hub** only — the three game-type cards (Đếm Sao, Number Ninja, Khám Phá Hình) and the homework banner.

**Critical design difference from English:**

The Math design uses **two different card styles** that are *not symmetric*:

- **Landscape cards** (`MathGameCardBig`): gradient blue, watermark emoji, game number pill, star row, white "Chơi →" CTA — identical pattern to English big cards but blue-branded.
- **Portrait cards** (`MathGameCard orient="horizontal"`): **flat solid blue** (`#3b82f6`), no watermark, no CTA button, no icon box — just bare emoji + title + desc + stars. Simpler than the English portrait card.

| | English Portrait Card | Math Portrait Card |
|---|---|---|
| Style | Gradient · watermark emoji · icon box · "Chơi →" pill CTA · full row layout | Flat solid `#3b82f6` · circular bg decoration only · bare emoji · title/desc/stars · *no CTA button* |

---

## 2. Viewport Layout Summary

| Viewport | Size | Layout |
|---|---|---|
| Phone Portrait · P2 | 390 × 844 | Vertical stack of **horizontal flat cards** (`MathGameCard size="md" orient="horizontal"`). Bottom nav. Back button top-left. Title centred. |
| Phone Landscape · P1 | 844 × 390 | Narrow icon-only sidebar. Main: **3-column compact big cards** (`MathGameCardBig compact`). Homework amber pill in header. |
| Tablet Portrait · P2 | 820 × 1180 | Sidebar. Stacked **large horizontal flat cards** (`MathGameCard size="lg" orient="horizontal"`). |
| Tablet Landscape · P1 | 1280 × 800 | Sidebar. **3-col grid of full big cards** (`MathGameCardBig`), max-width 1000px centred. |
| Desktop | 1440 × 900 | Wide sidebar. **3-col grid of full big cards**, max-width 1100px. Subtitle shows total star record "Tổng kỷ lục X/9 ⭐". |

---

## 3. Card Components

### 3.1 `MathGameCardBig` — Landscape / Tablet L / Desktop

Mirrors `EnglishGameCardBig` in every structural way except colours. Uses blue gradient and `text-math-deep` for the CTA text.

| Element | Design Value | Tailwind / Token Equivalent |
|---|---|---|
| Background | `linear-gradient(160deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)` | Inline `style={{ background: GRADIENT_BIG }}` |
| Box shadow | `0 18px 36px -16px rgba(37,99,235,.45)` | Inline `style={{ boxShadow: SHADOW_BIG }}` |
| Aspect ratio | `4/3` (normal), `3/2` (compact) | `aspect-[4/3]` / `aspect-[3/2]` |
| Border radius | `24px` (normal) / `16px` (compact) | `rounded-3xl` / `rounded-2xl` |
| Watermark emoji | Game emoji, absolute bottom-right | `absolute -bottom-4 -right-4 opacity-20 text-[80px]` |
| Game number pill | "Game 1" etc. | `bg-white/20 text-white text-xs font-bold rounded-full px-2 py-0.5` |
| CTA button | "Chơi →" | `bg-white text-blue-600 font-extrabold rounded-full text-sm px-4 py-2` |
| Star row | 1–3 filled/empty stars | `StarRating` component with `bg-star-filled` / `bg-star-empty` |

### 3.2 `MathGameCard` — Portrait / Row Variant

Used in phone portrait and tablet portrait where cards are stacked vertically.

| Element | Design Value | Notes |
|---|---|---|
| Background | Flat `#3b82f6` | No gradient. Differs from English portrait card. |
| Decoration | Circular semi-transparent div, absolute positioned | `bg-white/10 rounded-full` — decorative only |
| Layout | Horizontal flex row | Emoji left (48px), content right (title + desc + stars) |
| CTA | None | No "Chơi →" button in portrait variant |
| Size variants | `size="md"` (phone) / `size="lg"` (tablet) | Different padding and font sizes |

---

## 4. Homework Banner

When today has an active math homework period (`isDone: false`):

| Element | Value |
|---|---|
| Background | `bg-amber-50 border border-amber-200` |
| Icon | 🏠 |
| Text | "Đây là bài tập về nhà!" |
| `data-testid` | `"homework-banner"` |
| Position | Full width, above game cards |

---

## 5. Stats Bar (Landscape Header)

Displayed in the header area in phone landscape:

```
[ 🌟 120 pts ]  [ 🔥 3 day streak ]  [ ⭐ 7/9 stars ]
```

- Each chip: `bg-white/90 border border-slate-200 rounded-full px-3 py-1 text-xs font-bold`
- Compact variant (phone landscape): smaller font, no labels, numbers only

---

## 6. Level Selection Modal

When a game card is tapped, a level selection sheet slides up:

| Element | Value |
|---|---|
| Backdrop | `bg-black/40 fixed inset-0` |
| Sheet | `bg-white rounded-t-3xl` |
| Level buttons | 3 buttons, each showing stars earned and "Locked" if not yet unlocked |
| Tap target | `min-h-tap-lg` (64px) |

---

## 7. Responsive Implementation Notes

**Phone landscape base styles (no prefix):**

```tsx
<div className="flex gap-4 max-w-screen-md mx-auto px-4">
  {/* 3 compact big cards */}
  <MathGameCardBig compact />
  <MathGameCardBig compact />
  <MathGameCardBig compact />
</div>
```

**Portrait overrides:**

```tsx
<div className="
  flex gap-4 max-w-screen-md mx-auto px-4
  portrait:flex-col portrait:max-w-sm portrait:mx-4
">
  {/* Stacked horizontal flat cards */}
  <MathGameCard orient="horizontal" size="md" />
  ...
</div>
```

**Back button — always top-left:**

```tsx
<button className="
  absolute top-4 left-4
  min-h-tap min-w-tap
  flex items-center gap-2
  text-text-secondary
  portrait:fixed portrait:top-safe-top portrait:left-4
">
  ← Về
</button>
```

---

## 8. Constants to Extract

To avoid magic values scattered across the component, extract these as named constants in `components/games/MathHub.tsx`:

```typescript
const GRADIENT_BIG = 'linear-gradient(160deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)'
const GRADIENT_COMPACT = 'linear-gradient(160deg, #93c5fd 0%, #3b82f6 70%, #1d4ed8 100%)'
const SHADOW_BIG = '0 18px 36px -16px rgba(37,99,235,.45)'
const SHADOW_COMPACT = '0 12px 24px -12px rgba(37,99,235,.35)'
```
