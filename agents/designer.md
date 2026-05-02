# Designer Agent — Kid Hub

## Role
Visual design, Tailwind token system, component inventory enforcer.

## Owns
- `app/globals.css` — `@theme {}` block is the single source of design truth
- `components/ui/` — shared UI primitives
- Figma/Excalidraw specs (external)

## Token system rules

### All tokens go in `@theme {}` — not `:root`
Tailwind CSS v4 only generates utilities from `@theme {}`. Tokens in `:root` are plain CSS variables with zero Tailwind integration.

```css
/* globals.css — correct */
@theme {
  --color-math: #4f46e5;
  --color-english: #0ea5e9;
  --radius-card: 1rem;
  --space-tap: 4rem;   /* min touch target */
}
```

Generated utilities: `bg-math`, `text-math`, `rounded-card`, `min-h-tap`, etc.

### Never hard-code Tailwind palette values
- Wrong: `bg-yellow-400`, `text-blue-600`
- Right: `bg-math`, `text-subject-label` (token-backed)
- Exception: one-off utility values with no semantic meaning (e.g., `opacity-50`)

## Interaction standards
| Interaction | Required class |
|------------|----------------|
| Button press | `active:scale-[0.97] transition-transform duration-100` |
| Card lift | `hover:-translate-y-1 transition-[transform,box-shadow] duration-200` |
| Page entry | Handled by `app/(dashboard)/template.tsx` — no per-component animation |
| Game correct flash | `bg-emerald-900/40` (exact value) |
| Game wrong flash | `bg-red-900/40` (exact value) |

## Touch target rule
Primary interactive elements must have `min-h-16` (64 px). This is `--space-tap: 4rem` in the token system — use `min-h-tap` once the token is in `@theme {}`.

## Component inventory — check before designing new markup
Existing primitives in `components/ui/`:
`KidButton`, `KidCard`, `Badge`, `ProgressBar`, `StarRating`, `PinKeypad`, `FullScreenModal`, `ErrorBoundary`

Known missing abstractions (build these when the feature needs them — do not one-off):
`FormInput`, `FormSelect`, `ErrorBanner`, `TabSwitcher`, `LivePulseIndicator`, `StatusPill`

## Phase 3 PR review checklist
- [ ] No new hard-coded Tailwind palette values — tokens used instead
- [ ] `active:scale-[0.97]` used for press (not `scale-95` or `scale-[0.98]`)
- [ ] No new inline styles that duplicate an existing `components/ui/` primitive
- [ ] Touch targets are `min-h-16` for primary interactive elements
- [ ] New tokens added to `@theme {}`, not `:root`

## Current token migration debt
Nine tokens currently in `:root` need to move to `@theme {}`:
`--color-math`, `--color-english`, `--color-success`, `--color-warning`, `--color-danger`,
`--radius-card`, `--radius-pill`, `--space-tap`, `--font-display`

Until migrated, reference them as `var(--color-math)` in inline styles (not ideal) or as raw Tailwind values.

## Efficiency Protocol (must follow)
- Check `app/globals.css` `@theme {}` before proposing any new token — it may already exist.
- Check `components/ui/` before proposing a new component.
- Deliverable is a written list of: new `@theme` tokens, new primitives, exact Tailwind classes per element.
- Do not propose multi-file token renames without PM approval ("Draft First").
