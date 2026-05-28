# DESIGN_TO_CODE — Kid Hub

This document defines the workflow for translating clause.design exports into
production Next.js code. Read it before running any design-to-code prompt.

---

## 1. Design File Inventory

All design artefacts live in `design/`. Each `.jsx` file is a self-contained
Babel/React prototype that renders 5 viewport variants and exposes components
on `window`. The `styles/styles.css` mirrors `app/globals.css @theme {}` tokens.

| Design File | Covers | Viewport Variants |
|---|---|---|
| `design/components/shared.jsx` | Shared data, `Subj`, `Pill`, `Stars`, `Sidebar`, `DayRail` | — (utilities only) |
| `design/components/dashboard-v2-responsive.jsx` | `/dashboard` — Today Hero | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/dashboard-v2.jsx` | `/dashboard` — Tablet-L reference (original) | Tablet-L only |
| `design/components/schedule.jsx` | `/schedule` — full week timetable | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/math.jsx` | `/math` — hub + 3 mini-games (hub/playing/result) | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/english.jsx` | `/english` — hub + 3 mini-games (hub/playing/result) | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/games.jsx` | `/games` — game selection hub | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/components/parent.jsx` | `/parent/pin`, `/parent` dashboard | Phone-P, Phone-L, Tablet-P, Tablet-L, Desktop |
| `design/styles/styles.css` | Token reference (mirrors `app/globals.css`) | — |

**HTML preview files** in `design/pages/` are viewer-only artefacts rendered
from the JSX above. Do not use them as the source of truth — use the `.jsx`.

---

## 2. Viewport → Tailwind Breakpoint Mapping

Every design file exports five component variants. Map them to Tailwind classes:

| Design Variant | Dimensions | Tailwind Breakpoint |
|---|---|---|
| Phone Portrait (`*PhoneP`) | 390×844 | default (no prefix) |
| Phone Landscape (`*PhoneL`) | 844×390 | `landscape:` + `max-sm:` |
| Tablet Portrait (`*TabletP`) | 820×1180 | `md:` (≥768 px) |
| Tablet Landscape (`*TabletL`) | 1280×800 | `lg:` (≥1024 px) |
| Desktop (`*Desktop`) | 1440×900 | `xl:` (≥1280 px) |

The app is **tablet-first** (primary use on iPad landscape). The Tablet-L variant
is the golden reference; phone variants are progressive-simplifications.

---

## 3. Design Token Rules

Design JSX uses CSS custom properties that map 1-to-1 to `@theme` tokens in
`app/globals.css`. When converting inline styles to Tailwind:

| Design token | Tailwind class |
|---|---|
| `var(--color-shell-kid)` | `bg-shell-kid` |
| `var(--color-shell-dark)` | `bg-shell-dark` |
| `var(--color-text-primary)` | `text-text-primary` |
| `var(--color-text-secondary)` | `text-text-secondary` |
| `var(--color-text-muted)` | `text-text-muted` |
| `var(--color-math)` | `bg-math` / `text-math` |
| `var(--color-english)` | `bg-english` / `text-english` |
| `var(--radius-card)` | `rounded-card` |
| `var(--radius-pill)` | `rounded-pill` |
| `var(--kh-accent)` | `bg-btn-primary` / `text-btn-primary` |

Never use raw Tailwind palette values like `bg-blue-600` for semantic colours —
always use the token class instead.

---

## 4. Architecture Rules (Non-Negotiable)

When generating or editing component code always respect this layering:

```
page.tsx (Server Component)
  └─ fetches via Server Actions
  └─ passes data as props to ─→ components/<domain>/*.tsx (presentational)
                                   └─ uses hooks/  (client state only)
                                   └─ uses components/ui/ (primitives)
```

- **Never** add Prisma/DB calls inside a component.
- **Never** import from `server/` inside a hook or component.
- **Never** hard-code `'2025-2026'` or `'khoi'` — use `lib/constants.ts`.
- **Always** wrap new pages in `<TabletPageContainer>` from
  `components/layout/TabletPageContainer.tsx`.
- **Always** use `Edit` (string replacement) not `Write` (full overwrite) when
  modifying existing files.

---

## 5. Route & Design Status

| Route | Page File | Design Source | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | — | N/A — redirect only |
| `/kid-unlock` | `app/kid-unlock/page.tsx` | — | **Code-only** — kid pattern gate (not in extras design) |
| `/unlock` | `app/(dashboard)/unlock/page.tsx` | `extras.jsx` (Huy hiệu section) | Designed + Implemented |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx` | `dashboard-v2-responsive.jsx` | Designed + Implemented |
| `/schedule` | `app/(dashboard)/schedule/page.tsx` | `schedule.jsx` | Designed + Implemented |
| `/grades` | `app/(dashboard)/grades/page.tsx` | `extras.jsx` | Designed + Implemented |
| `/homework` | `app/(dashboard)/homework/page.tsx` | `extras.jsx` | Designed + Implemented |
| `/math` | `app/(games)/math/page.tsx` | `math.jsx` | Designed + Implemented |
| `/english` | `app/(games)/english/page.tsx` | `english.jsx` | Designed + Implemented |
| `/games` | `app/(dashboard)/games/page.tsx` | `games.jsx`, `GAME_DESIGN.md` | Designed + Implemented |
| `/parent` | `app/(parent)/parent/page.tsx` | `parent.jsx`, `Kid Hub Parent - Responsive.html` | Designed + Implemented |
| `/parent/pin` | `app/(parent)/parent/pin/page.tsx` | `parent.jsx` (PIN section) | Designed + Implemented |
| `/parent/login` | `app/(parent)/parent/login/page.tsx` | `parent.jsx` (login section) | Designed + Implemented |
| `/parent/kid-access` | `app/(parent)/parent/kid-access/page.tsx` | `extras.jsx` | Designed + Implemented |

**Status key:**
- **Designed + Implemented** — design file exists; code tracks it. Check for visual drift before each task.
- **Design-only** — design file exists but the route/components have not been built yet.
- **Code-only** — code exists with no design file. Do not redesign these without an explicit task.

---

## 6. Standard Prompts

Copy the relevant template, fill the `[PLACEHOLDERS]`, and paste as your task.
Do not add extra instructions outside the template — the template is complete.

---

### 6A. Update Existing Page (Design Changed)

Use this when you downloaded a revised design from clause.design and want to
reconcile it with the current implementation.

```
## Design-to-Code: Update — [ROUTE]

**Design file changed:** `design/components/[FILENAME].jsx`
**Target route:** `[ROUTE]`  (e.g. `/schedule`)
**Key components to check:**
- `components/[domain]/[ComponentName].tsx`
- (list others if known, or write "auto-detect")

**What changed in the design (describe visually):**
[2-4 sentences describing what is different from what is currently on screen.
 Be specific: colours, layout, new element, removed element, text copy, etc.]

**Viewports affected:**
- [ ] Phone Portrait
- [ ] Phone Landscape
- [ ] Tablet Portrait
- [ ] Tablet Landscape  ← primary
- [ ] Desktop
- [ ] All

**Pre-flight the AI must complete before touching code:**
1. Read the design file `design/components/[FILENAME].jsx` in full.
2. Read the current implementation: page.tsx + all component files listed above.
3. List the specific JSX/CSS differences (≤ 10 bullet points). Submit this list
   for PM review before writing any code.
4. Identify any new design token needed. If none, say so.

**Constraints:**
- Do NOT change server actions, services, or repositories.
- Do NOT add features not visible in the design file.
- Do NOT create new files unless the change requires a new component.
- Follow the CLAUDE.md layering rules.
- Wait for PM approval of the diff list before writing code.
```

---

### 6B. Implement New Page from Design

Use this when the design file exists (`Design-only` status) but the route and
components have not been built yet.

```
## Design-to-Code: New Page — [ROUTE]

**Design file:** `design/components/[FILENAME].jsx`
**Target route:** `[ROUTE]`  (e.g. `/games`)
**Route group:** `[(dashboard|games|parent)]`
**Page type:** [kid-facing | parent-facing]

**Data requirements (what does the page show?):**
[Describe the real data this page needs. If it's all static/mock, say so.
 If it needs a server action, name the action or describe what query it needs.]

**Viewport priority:** Tablet-L first, then phone portrait.

**Pre-flight the AI must complete before touching code:**
1. Read `design/components/[FILENAME].jsx` in full.
2. Read `design/components/shared.jsx` to understand shared primitives.
3. Identify which existing `components/ui/` primitives cover the design elements.
   List anything that needs to be created vs reused.
4. Draft a file plan (new files + edits to existing) and submit for PM approval.
5. If a new Server Action is needed, describe the Prisma query needed — do not
   write it until PM approves.

**Constraints:**
- New page must be wrapped in `<TabletPageContainer>`.
- Add the route to the sidebar in `components/layout/AppSidebar.tsx` if it is
  a primary nav destination.
- No raw palette values (e.g. `bg-blue-600`) for semantic colours — use tokens.
- Follow CLAUDE.md layering rules end-to-end.
- Wait for PM approval of the file plan before writing code.
```

---

### 6C. Add Design File for Undesigned Route

Use this when a route is **Code-only** and you want to create a design from
scratch in clause.design, then download it to bring the route under design
control.

```
## Design-to-Code: New Design File — [ROUTE]

**Situation:** `[ROUTE]` has working code but no design file.
**Objective:** Review the existing implementation, document it in a new design
file at `design/components/[FILENAME].jsx`, then optionally refine the UI.

**AI pre-flight:**
1. Read the page file and all component files for `[ROUTE]`.
2. Summarise what the UI looks like in ≤ 5 bullet points (PM reviews this).
3. Confirm whether any improvements are requested (default: document only,
   do NOT change the code).
```

---

## 7. AI Agent Pre-Flight Checklist (Applies to All Tasks)

Before writing any code, the AI agent must confirm all of the following:

- [ ] Read the relevant design `.jsx` file in full (not just the target viewport).
- [ ] Read every component file the change will touch.
- [ ] Verified that no new `@theme` token is needed — or listed the new token.
- [ ] Confirmed that inline `style={{...}}` from design maps to a Tailwind token class.
- [ ] Checked that no `server/` import will enter a client component.
- [ ] Listed the exact files that will be edited (not "etc.").
- [ ] Submitted the change summary for PM approval before writing code.

---

## 8. Design File Anatomy Reference

Every design `.jsx` follows this pattern — read it to understand before diffing:

```
/* file.jsx — description, 5 viewport variants */

// 1. MOCK DATA — mirrors lib/data/*.ts shapes
const DATA = { ... }

// 2. SHARED HELPERS — small render functions used by all viewports
function Helper(...) { ... }

// 3. VIEWPORT COMPONENTS — one function per variant
function PagePhoneP({ tweaks, onAction, insets }) { ... }
function PagePhoneL({ tweaks, onAction }) { ... }
function PageTabletP({ tweaks, onAction }) { ... }
function PageTabletL({ tweaks, onAction }) { ... }   // ← primary reference
function PageDesktop({ tweaks, onAction }) { ... }

// 4. WINDOW EXPORT — exposes all variants to the HTML preview
Object.assign(window, { PagePhoneP, PagePhoneL, ... });
```

When converting, use `PageTabletL` as the primary layout reference and
`PagePhoneP` for mobile-specific simplifications.

---

## 9. Update This Document When…

- A new design file is added to `design/components/` → add a row to §1 and §5.
- A Design-only route is implemented → change status in §5 to "Designed + Implemented".
- A Code-only route gets a new design file → change status in §5 accordingly.
- A new `@theme` token is added → add it to the token table in §3.
- The sidebar nav changes → note it here so future prompts include the right
  `AppSidebar.tsx` edit.
