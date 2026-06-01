# Kid Hub — Design System Guide

> How to use design tokens, components, and automation checks correctly
> **Stack:** Tailwind CSS v4 · `@theme` tokens · Child-first UI · Mobile → Tablet-L reference

---

## Contents

1. [Design Tokens — The Only Colours Allowed](#1-design-tokens--the-only-colours-allowed)
2. [Border Radius Tokens](#2-border-radius-tokens)
3. [Tap Target Sizes](#3-tap-target-sizes)
4. [Typography & Text Hierarchy](#4-typography--text-hierarchy)
5. [Subject Colour System](#5-subject-colour-system)
6. [Usage Rules — Do & Don't](#6-usage-rules--do--dont)
7. [Viewport System](#7-viewport-system)
8. [Utility Classes](#8-utility-classes)
9. [Design Automation Checks](#9-design-automation-checks)
10. [AI Prompt Library](#10-ai-prompt-library)

---

## 1. Design Tokens — The Only Colours Allowed

All tokens live in `app/globals.css` inside `@theme {}`. Never add tokens to `:root`. Never use raw Tailwind palette values (e.g. `bg-blue-600`) for semantic purposes — always use the token class.

### Button Colours

| Token | Tailwind Class | Hex | When to Use |
|---|---|---|---|
| `--color-btn-primary` | `bg-btn-primary` | #3b82f6 | Primary CTA buttons, active states |
| `--color-btn-primary-hover` | `hover:bg-btn-primary-hover` | #2563eb | Button hover state |
| `--color-btn-primary-border` | `border-btn-primary-border` | #1d4ed8 | Button bottom shadow border |
| `--color-btn-secondary` | `bg-btn-secondary` | #34d399 | Secondary CTA, success actions |
| `--color-btn-secondary-hover` | `hover:bg-btn-secondary-hover` | #10b981 | Secondary button hover |
| `--color-btn-secondary-border` | `border-btn-secondary-border` | #059669 | Secondary button border shadow |
| `--color-btn-ghost-border` | `border-btn-ghost-border` | #cbd5e1 | Ghost / outline button border |

### App Shell Backgrounds

| Token | Tailwind Class | Hex | Use |
|---|---|---|---|
| `--color-shell-dark` | `bg-shell-dark` | #0f172a | Games route background, dark shells |
| `--color-shell-light` | `bg-shell-light` | #f8fafc | General light pages |
| `--color-shell-kid` | `bg-shell-kid` | #f0f9ff | Primary kid-facing background |

### Text Hierarchy

| Token | Tailwind Class | Purpose |
|---|---|---|
| `--color-text-primary` | `text-text-primary` | Body text (`#1e293b`) |
| `--color-text-secondary` | `text-text-secondary` | Supporting labels (`#64748b`) |
| `--color-text-muted` | `text-text-muted` | Placeholder / disabled (`#94a3b8`) |
| `--color-text-subtle` | `text-text-subtle` | Decorative lines (`#cbd5e1`) |

### Progress & Stars

| Token | Tailwind Class | Purpose |
|---|---|---|
| `--color-progress-high` | `bg-progress-high` | ≥ 80% fill (`#fbbf24`) |
| `--color-progress-low` | `bg-progress-low` | < 80% fill (`#fb923c`) |
| `--color-progress-track` | `bg-progress-track` | Empty track (`#e2e8f0`) |
| `--color-star-filled` | `bg-star-filled` | Earned star (`#fbbf24`) |
| `--color-star-empty` | `bg-star-empty` | Unearned star (`#cbd5e1`) |

---

## 2. Border Radius Tokens

| Token | Tailwind Class | Value | Use |
|---|---|---|---|
| `--radius-card` | `rounded-card` | `1.5rem` | Main cards and panels |
| `--radius-pill` | `rounded-pill` | `9999px` | Badges, chips, pill buttons |
| `--radius-btn` | `rounded-btn` | `1rem` | Standard buttons |

---

## 3. Tap Target Sizes

| Token | Tailwind Class | Value | Context |
|---|---|---|---|
| `--spacing-tap` | `min-h-tap min-w-tap` | `3rem` (48px) | Minimum touch target, all kid routes |
| `--spacing-tap-lg` | `min-h-tap-lg min-w-tap-lg` | `4rem` (64px) | Primary game buttons and answer choices |
| `--spacing-tap-xl` | `min-h-tap-xl min-w-tap-xl` | `5rem` (80px) | Large drag/tap game targets |

> Never use a tap target smaller than `min-h-tap` in `(dashboard)` or `(games)` routes. This is a ship-blocker.

---

## 4. Typography & Text Hierarchy

### Scale Rules for Kid Routes

| Context | Minimum Size | Tailwind Class |
|---|---|---|
| Body text | 18px | `text-lg` |
| Subheadings | 20px | `text-xl` |
| Game button labels | 24px | `text-2xl` |
| Primary game stimuli (letter / number) | 64px+ | `text-8xl` |

### Font Loading

The display font is set via CSS variable `--font-display` (loaded in `app/layout.tsx`) and aliased to `--font-sans` in `@theme {}`, making it available as the default sans-serif stack.

---

## 5. Subject Colour System

| Subject | Token | Tailwind Class | Hex |
|---|---|---|---|
| Math | `--color-math` | `bg-math text-math` | #3b82f6 |
| English | `--color-english` | `bg-english text-english` | #10b981 |
| Science | `--color-science` | `bg-science text-science` | #8b5cf6 |
| PE | `--color-pe` | `bg-pe text-pe` | #f59e0b |
| Art | `--color-art` | `bg-art text-art` | #ec4899 |
| Vietnamese | `--color-vietnamese` | `bg-vietnamese text-vietnamese` | #ef4444 |
| Music | `--color-music` | `bg-music text-music` | #f97316 |

Each subject also needs a `hex` value in `lib/data/subjects.ts` for use in `color-mix()` CSS tinting (e.g. in `PeriodCell`).

---

## 6. Usage Rules — Do & Don't

### DO

```tsx
// Use semantic token classes
<div className="bg-shell-kid text-text-primary rounded-card min-h-tap">

// Use subject colour tokens
<div className="bg-math text-white">Toán Học</div>

// Use tap-size tokens for interactive elements
<button className="min-h-tap-lg min-w-tap-lg rounded-pill bg-btn-primary">
```

### DON'T

```tsx
// Never use raw palette values for semantic purposes
<div className="bg-blue-500">        ← use bg-math or bg-btn-primary
<div className="text-slate-700">    ← use text-text-primary
<div className="bg-sky-50">         ← use bg-shell-kid

// Never add tokens to :root
:root {
  --color-foo: #123;   ← this does NOT generate Tailwind utility classes
}

// Always use @theme {} instead
@theme {
  --color-foo: #123;   ← this generates bg-foo, text-foo, etc.
}
```

### Press / Animation Standards

| Interaction | Standard Class |
|---|---|
| Button press | `active:scale-[0.97] transition-transform duration-100` |
| Card lift | `hover:-translate-y-1 transition-[transform,box-shadow] duration-200` |
| Game correct flash | `bg-emerald-900/40` |
| Game wrong flash | `bg-red-900/40` |
| Page-level entry | Handled by `app/(dashboard)/template.tsx` — no per-component animation needed |

---

## 7. Viewport System

See `docs/guides/responsive-spec.md` for full rules. Quick reference:

| Priority | Orientation | Base Tailwind | Override Prefix |
|---|---|---|---|
| P1 | Landscape | Unprefixed classes | — |
| P2 | Portrait | Add `portrait:` overrides | `portrait:` |
| P3 | Desktop | Add parent/desktop density | `lg:` |

---

## 8. Utility Classes

These classes are defined in `app/globals.css` and are available globally:

| Class | Purpose |
|---|---|
| `.safe-pad` | All safe-area inset padding (for game canvas edges) |
| `.safe-top` / `.safe-bottom` / `.safe-left` / `.safe-right` | Individual safe-area edge padding |
| `.portrait-only` | Show only in portrait orientation |
| `.landscape-only` | Show only in landscape orientation |
| `.game-container` | Full-screen game shell with `touch-action: none` and `overflow: hidden` |

---

## 9. Design Automation Checks

The `npm run design:check` command runs four automated checks:

| Check | What It Verifies |
|---|---|
| Route → Design Coverage | Every `app/` route has a corresponding `design/components/*.jsx` file or is explicitly skipped in the manifest |
| Design File Inventory | All non-utility design files are listed in `design/manifest.json` |
| Viewport Export Coverage | Every tracked design file exports `*TabletL` and `*PhoneP` components |
| Semantic Token Compliance | No raw Tailwind palette classes (`bg-blue-*`, `text-slate-*`, etc.) used on semantic surfaces in scanned `.tsx` files |

See `docs/design-system/auto-check-design.md` for the full implementation plan.

---

## 10. AI Prompt Library

When asking an AI agent to generate or review UI components, use these prompts to enforce design system compliance:

### Component Generation

```
Generate a [component name] for Kid Hub.

Constraints:
- Use only tokens from app/globals.css @theme {} — no raw Tailwind palette values
- Tap targets: min-h-tap (48px) minimum, min-h-tap-lg (64px) for primary actions
- Base styles target P1 landscape (no prefix); add portrait: overrides explicitly
- Subject colours use bg-math, bg-english, etc. — never bg-blue-500 or bg-emerald-500
- Border radius: rounded-card for cards, rounded-pill for badges/chips
- Press animation: active:scale-[0.97] transition-transform duration-100
- Font: text-lg minimum in kid routes; text-2xl for game labels
```

### Code Review

```
Review this Kid Hub component for design system compliance:
1. Flag any raw Tailwind palette values that should use tokens
2. Flag tap targets below min-h-tap (48px) in kid routes
3. Flag any h-screen usage that should be h-dvh
4. Flag missing portrait: overrides for landscape-first components
5. Flag any border-radius values that should use rounded-card or rounded-pill
```
