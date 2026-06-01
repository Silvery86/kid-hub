# DESIGN_TO_CODE — Current Sync

> Route-to-design synchronization snapshot. This is the source of truth for design file coverage.
> **Updated:** 2026-05-31 (parent v2 mapping refresh)

---

## Automation Status

All design checks are currently passing.

| Check | Status | Notes |
|---|---|---|
| Route → Design Coverage | Pass | All app routes are documented or explicitly skipped. |
| Design File Inventory | Pass | All non-utility files in `design/components` are tracked. |
| Viewport Export Coverage | Pass | Every required design file exports `*TabletL` and `*PhoneP`. |
| Semantic Token Compliance | Pass | No token violations in scanned TSX files. |

---

## Design File Inventory

| Design File | Covers | Viewports |
|---|---|---|
| `design/components/dashboard-v2-responsive.jsx` | `/dashboard` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/dashboard-v2.jsx` | `/dashboard` (Tablet-L reference) | Tablet-L only |
| `design/components/schedule.jsx` | `/schedule` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/math.jsx` | `/math` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/english.jsx` | `/english` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/games.jsx` | `/games` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/extras.jsx` | `/unlock`, `/grades`, `/homework` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/parent.jsx` | `/parent/pin`, `/parent/login` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/parent-v2.jsx` | `/parent` (overview + schedule/grades sub-pages), `/parent/kid-access` | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |

---

## Route Coverage Map

| Route | Covered By | Status |
|---|---|---|
| `/dashboard` | `dashboard-v2-responsive.jsx` | Covered |
| `/schedule` | `schedule.jsx` | Covered |
| `/grades` | `extras.jsx` | Covered |
| `/homework` | `extras.jsx` | Covered |
| `/math` | `math.jsx` | Covered |
| `/english` | `english.jsx` | Covered |
| `/games` | `games.jsx` | Covered |
| `/unlock` | `extras.jsx` | Covered |
| `/parent` | `parent-v2.jsx` | Covered |
| `/parent/kid-access` | `parent-v2.jsx` | Covered |
| `/parent/pin` | `parent.jsx` | Covered |
| `/parent/login` | `parent.jsx` | Covered |

---

## Viewport Coverage Reference

All tracked design files export the following variants:

- `*PhoneP` — Phone Portrait (390 × 844)
- `*PhoneL` — Phone Landscape (844 × 390)
- `*TabletP` — Tablet Portrait (820 × 1180)
- `*TabletL` — Tablet Landscape (1280 × 800)
- `*Desktop` — Desktop (1440 × 900)

---

## Design Spec Cross-References

| Route | Design Spec Document |
|---|---|
| `/math` | `docs/design-system/math-hub-design.md` |
| `/english` | `docs/design-system/english-hub-design.md` |
| `/schedule` | `docs/architecture/schedule-design.md` |
| All routes | `docs/guides/responsive-spec.md` — viewport priority tiers and rules |

---

## How to Update This Document

When a new route is added:

1. Create or update the relevant `design/components/*.jsx` file to cover the new route.
2. Add the design file to `design/manifest.json`.
3. Add a row to the Design File Inventory table above.
4. Add a row to the Route Coverage Map above.
5. Run `npm run design:check` to verify all checks pass.

When a route is removed:

1. Mark the design file row as `Deprecated` or remove it.
2. Remove from `design/manifest.json`.
3. Update the Route Coverage Map.
