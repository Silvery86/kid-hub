# RESPONSIVE.md — Kid Hub Responsive Design System

> **Status:** Approved guideline · Version 1.0 · 2026-05-09
> **Authors:** Senior PM + Lead Designer
> **Scope:** All routes — `(dashboard)`, `(games)`, `(parent)`
> **Rule:** No component may ship without satisfying all constraints in its applicable tier.

---

## 0. Why This Document Exists

Kid Hub is **not** a standard web app. Its primary user is a 5-year-old playing learning games on a phone or tablet held sideways. Every default in the web ecosystem — including Tailwind's own "mobile-first" (portrait) philosophy — runs counter to our actual usage pattern. This document overrides those defaults with rules tuned to our audience.

---

## 1. Priority Tiers

| Priority | Orientation | Devices | Primary Use Case |
|---|---|---|---|
| **P1 — Primary** | Landscape (mobile + tablet) | Phones 360–480px tall · Tablets 600–768px tall | Gaming, learning, all kid interactions |
| **P2 — Secondary** | Portrait (mobile + tablet) | Same devices, rotated | Schedule viewing, quick checks, passive content |
| **P3 — Parental** | Any (laptop / desktop) | `≥ 1024px` wide screens | Parent admin panel, settings, reporting |

### 1.1 Practical viewport reference

| Tier | Example device | Typical viewport (CSS px) |
|---|---|---|
| P1 | iPhone 14 landscape | 844 × 390 |
| P1 | iPad Air landscape | 1180 × 820 |
| P2 | iPhone 14 portrait | 390 × 844 |
| P2 | iPad Air portrait | 820 × 1180 |
| P3 | MacBook 13 | 1280 × 800 |
| P3 | Desktop | 1440 × 900 + |

> **Rule P1-A:** A layout that is broken in P1 landscape is a **ship-blocker**. A layout that is broken only in P2 portrait is a high-severity bug. A layout that is degraded in P3 is a normal bug.

---

## 2. Tailwind v4 — Landscape-First Implementation

### 2.1 The Core Problem with Tailwind Defaults

Tailwind's utility classes are applied **without a media query** (i.e., at all sizes). Tailwind's prefixed breakpoints (`sm:`, `md:`, `lg:`) are all **width-based, min-width, portrait-assumed**. There is no built-in orientation prefix.

Our devices can be the **same width** in portrait or landscape (e.g., a 768px-wide iPad is in landscape; a 768px-tall iPad is in portrait). Width alone cannot distinguish them.

### 2.2 The Landscape-First Convention

We adopt a **Landscape-First coding convention**:

> **Write all base styles as if the device is in landscape orientation.**
> Use the `portrait:` variant to override values that must change when the device rotates.
> Use `lg:` (≥ 1024px width) to layer in the parent/admin desktop experience.

This is a **convention**, not a Tailwind mode switch. It requires no breaking change to the existing codebase, and it works with Tailwind v4's `@custom-variant` API.

### 2.3 Required `@custom-variant` Additions to `globals.css`

Add the following blocks to `app/globals.css` (inside the existing CSS file, after `@theme {}`). These create the `landscape:` and `portrait:` utility prefixes:

```css
/* Orientation variants */
@custom-variant landscape {
  @media (orientation: landscape) {
    @slot;
  }
}

@custom-variant portrait {
  @media (orientation: portrait) {
    @slot;
  }
}
```

> Until these variants are added, engineers MUST use the raw CSS utility `.landscape-only` / `.portrait-only` classes (defined in §2.6) as a temporary fallback. **Do not** inline raw `@media` queries inside components.

### 2.4 Breakpoint Reference Table

These are the breakpoints active in this project. Tailwind v4 defaults are shown; no custom overrides are needed unless specified.

| Prefix | Min-width | Usage in Kid Hub |
|---|---|---|
| *(none)* | 0px | **Landscape-first base styles. P1 default.** |
| `sm:` | 640px | Landscape tablet fine-tuning |
| `md:` | 768px | Landscape tablet optimisations |
| `lg:` | 1024px | **Parent/Admin view (P3) — desktop layout switches** |
| `xl:` | 1280px | Parent view: wider panels, side-by-side data |
| `portrait:` | orientation | **Portrait overrides (P2) — always explicit** |
| `landscape:` | orientation | Explicit landscape re-assertion (rare; use when a child component inherits an unwanted portrait override) |

### 2.5 Writing a Component — Decision Flow

```
1. Write the component for P1 landscape (no prefix).
2. Ask: "Does this component look broken in portrait?"
   → Yes → Add portrait: overrides.
   → No  → Do nothing.
3. Ask: "Is this component used in (parent) routes?"
   → Yes → Add lg: overrides for desktop layout.
   → No  → Do nothing.
```

### 2.6 Temporary Fallback CSS Classes

Until `@custom-variant` is wired up, use these classes to show/hide orientation-specific blocks:

```css
/* Add to globals.css — to be removed once @custom-variant is live */
@media (orientation: landscape) {
  .portrait-only { display: none; }
}
@media (orientation: portrait) {
  .landscape-only { display: none; }
}
```

### 2.7 Examples

```tsx
{/* Navigation: sidebar in landscape, bottom bar in portrait */}
<nav className="
  flex flex-col w-20 h-full          /* landscape: vertical sidebar */
  portrait:flex-row portrait:w-full portrait:h-16 portrait:fixed portrait:bottom-0
  lg:w-56                             /* parent desktop: wider sidebar with labels */
">

{/* Game card: bigger in landscape because vertical space is the constraint */}
<div className="
  h-32 w-full                        /* landscape base */
  portrait:h-48                      /* portrait: taller cards, more vertical room */
  lg:h-40                            /* desktop: moderate size */
">

{/* Button: always at least tap-sized */}
<button className="
  min-h-tap min-w-tap                 /* 3rem / 48px — absolute minimum */
  portrait:min-h-tap-lg              /* portrait: slightly larger (slower interactions) */
">
```

---

## 3. Tap Target Rules

### 3.1 Minimum Sizes

Based on Apple HIG (44pt), Android Material (48dp), and adjusted upward for a 5-year-old's motor precision:

| Context | Minimum size | Tailwind class | Token |
|---|---|---|---|
| Any interactive element (P1, P2) | 48 × 48px | `min-h-tap min-w-tap` | `--spacing-tap: 3rem` |
| Primary game buttons | 64 × 64px | `min-h-tap-lg min-w-tap-lg` | `--spacing-tap-lg: 4rem` |
| Large game targets (drag, tap) | 80 × 80px | `min-h-tap-xl min-w-tap-xl` | `--spacing-tap-xl: 5rem` *(to be added)* |
| Parent admin (P3) | 36 × 36px | `min-h-9 min-w-9` | Standard Tailwind |

> **Rule TAP-A:** No interactive element in `(dashboard)` or `(games)` routes may have a tap target smaller than `min-h-tap` (48px). This is a ship-blocker.

> **Rule TAP-B:** The visual size of a button may be smaller than its tap target. Use `relative` + `::after` pseudo-element padding or `p-2` with `min-h-tap` to achieve this without distorting the visual design.

> **Rule TAP-C:** Buttons must have a minimum **8px gap** between them to prevent mis-taps (`gap-2` or `space-x-2` minimum).

### 3.2 Token Addition Required

The `--spacing-tap-xl: 5rem` token must be added to `@theme {}` in `globals.css`. This is tracked as a follow-up task; file the addition before implementing any large game-target component.

---

## 4. Navigation Rules

### 4.1 P1 — Landscape (Primary)

- **Pattern:** Fixed vertical **sidebar** on the left edge.
- **Width:** `w-16` (64px) for icon-only; `lg:w-56` for labelled parent sidebar.
- **Position:** `fixed left-0 top-0 h-full` + `safe-pad` for left safe area.
- **Why:** Landscape devices have ample horizontal width but limited vertical height. A horizontal top/bottom bar consumes the scarcest resource (vertical pixels) in gaming mode.
- **Icons only** in kid routes — no text labels. A 5-year-old navigates by icon + colour.
- **Active indicator:** Coloured left border or filled background, not text underline.

### 4.2 P2 — Portrait (Secondary)

- **Pattern:** Fixed **bottom tab bar**.
- **Height:** `h-16` (64px) minimum — equates to `min-h-tap-lg`.
- **Position:** `fixed bottom-0 left-0 right-0` + `pb-[env(safe-area-inset-bottom)]`.
- **Why:** Portrait phones have limited horizontal width; bottom tabs keep navigation thumb-reachable.
- **Maximum 4 tabs** in kid views to prevent icon crowding.
- **Landscape sidebar must be hidden** via `portrait:hidden` on the sidebar; tab bar must be hidden via `landscape:hidden` on the tab bar.

### 4.3 P3 — Desktop / Parental (Tertiary)

- **Pattern:** Fixed sidebar with **icon + label**.
- **Width:** `lg:w-56` (224px).
- **Includes:** Section headings, collapsible groups, logout button.
- **Parent routes only.** Kid route navigation does not change at `lg:` — a desktop-width browser showing the kid dashboard still uses the icon-only sidebar.

### 4.4 Navigation Component Contract

Every navigation component MUST:
1. Accept an `orientation` prop or use CSS-only orientation switching (preferred).
2. Never render both the sidebar and the tab bar visible simultaneously.
3. Respect all safe area insets on the axis it occupies.

---

## 5. Safe Area Rules

Safe areas protect content from being obscured by device notches, home indicators, and rounded corners.

### 5.1 Current Utility

`globals.css` already defines:

```css
.safe-pad {
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
}
```

### 5.2 Per-Axis Classes Required

Add the following granular classes to `globals.css` (tracked as a follow-up task):

```css
.safe-top    { padding-top: env(safe-area-inset-top); }
.safe-bottom { padding-bottom: env(safe-area-inset-bottom); }
.safe-left   { padding-left: env(safe-area-inset-left); }
.safe-right  { padding-right: env(safe-area-inset-right); }
```

### 5.3 Mandatory Application Rules

| Element | Required class | Reason |
|---|---|---|
| Landscape sidebar | `.safe-left` | Notch is on the left in landscape |
| Portrait bottom tab bar | `.safe-bottom` | Home indicator overlap |
| Full-screen game canvas | `.safe-pad` | All four edges must be clear |
| Parent sidebar | `.safe-left` | Consistent with kid sidebar |
| Any `fixed` element touching the screen edge | Relevant `safe-*` | Without this, content clips on notched devices |

### 5.4 Viewport Meta Tag

The root `app/layout.tsx` must include:

```html
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
```

`viewport-fit=cover` is the prerequisite for `env(safe-area-inset-*)` to work. Without it, all safe-area padding is silently ignored.

---

## 6. Route-Group Specific Rules

### 6.1 `(games)` — Highest Constraint

- **Game canvas:** Must fill 100% of the usable viewport minus the sidebar width and all safe areas. Use `h-dvh` (dynamic viewport height) not `h-screen`.
- **No scroll:** Game containers must not overflow. Scrolling inside a game is a design failure.
- **No browser chrome interference:** The `overscroll-behavior: none` on `html, body` in `globals.css` already handles this.
- **Touch events:** Every interactive game element must have `touch-action: manipulation` or be wrapped in `.game-container`.

### 6.2 `(dashboard)` — Kid Home View

- **Cards:** Must be tappable, minimum `min-h-tap-lg` (64px).
- **Scroll allowed** in portrait, but discouraged in landscape. In landscape, the dashboard should aim to fit all content above the fold.
- **No horizontal scroll** at any viewport.

### 6.3 `(parent)` — Admin View

- **Primarily P3.** May use standard web conventions: smaller click targets (min 36px), horizontal tables, dense text.
- **Must still be usable** in P2 portrait (tablet); test on iPad Safari in portrait.
- **PIN entry screen** is the only P1-required screen in the parent route group (it is also the entry point for a child using the device).

---

## 7. Accessibility & Performance

### 7.1 Font Scale

All font sizes in kid routes must be at least `text-lg` (18px). Prefer `text-xl` (20px) for body text. Labels inside game buttons must be `text-2xl` (24px) minimum.

### 7.2 Animation

- Animations must respect `prefers-reduced-motion`. Wrap all `animate-*` classes with a `motion-safe:` prefix or use the `prefers-reduced-motion` media query.
- Game animations that are essential to gameplay are exempt but must be kept under 300ms to avoid disorienting young children.

### 7.3 Colour Contrast

All text in kid routes must meet WCAG AA (4.5:1 contrast ratio). Use only tokens defined in `globals.css @theme {}`. Never use raw Tailwind palette values like `text-blue-500`.

---

## 8. Testing Checklist

Before any component PR is marked "ready for review":

- [ ] Tested in Chrome DevTools with a landscape phone profile (e.g., iPhone 14 rotated)
- [ ] Tested in Chrome DevTools with a portrait phone profile
- [ ] Tested in Chrome DevTools with an iPad landscape profile
- [ ] No interactive element below `min-h-tap` (48px) in kid routes
- [ ] Navigation switches correctly between sidebar (landscape) and bottom tab (portrait)
- [ ] No content clipped behind a notch (use a notched device profile in DevTools)
- [ ] `safe-area-inset-*` padding applied to all fixed elements touching screen edges
- [ ] `h-dvh` used instead of `h-screen` in full-height containers

---

## 9. Glossary

| Term | Definition |
|---|---|
| **Landscape-First** | Base Tailwind classes target landscape orientation; portrait is an explicit override via `portrait:` |
| **`portrait:` variant** | Tailwind v4 `@custom-variant` that applies styles only in portrait orientation |
| **`landscape:` variant** | Tailwind v4 `@custom-variant` that applies styles only in landscape orientation |
| **Tap target** | The touchable hit area of an interactive element, which may be larger than the visual element |
| **Safe area** | The portion of the screen not obscured by hardware (notch, home indicator, rounded corners) |
| **`h-dvh`** | Dynamic viewport height — adjusts when the browser toolbar shows/hides on mobile |
| **P1 / P2 / P3** | Priority tiers defined in §1 |

---

## 10. Open Tasks (Engineering follow-up)

| ID | Task | Owner |
|---|---|---|
| RESP-001 | Add `@custom-variant landscape/portrait` to `globals.css` | Lead Dev |
| RESP-002 | Add `--spacing-tap-xl: 5rem` token to `globals.css @theme {}` | Lead Dev |
| RESP-003 | Add `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right` to `globals.css` | Lead Dev |
| RESP-004 | Audit `app/layout.tsx` for `viewport-fit=cover` meta tag | Lead Dev |
| RESP-005 | Add `portrait-only` / `landscape-only` CSS fallback classes to `globals.css` | Lead Dev |
| RESP-006 | Audit all existing `(games)` components for tap-target compliance | QA |
| RESP-007 | Create Playwright viewport matrix test (landscape phone, portrait phone, iPad landscape) | QA |
