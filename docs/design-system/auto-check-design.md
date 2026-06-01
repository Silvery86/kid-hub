# AUTO_CHECK_DESIGN — Design Automation Plan

> **Status:** Planning · **Date:** 2026-05-31 · **No DB changes** · **3 phases · 7 new files**
> Detailed implementation plan for automated checks between `design/` and the live codebase.

---

## Contents

1. [Goals — What Will Be Achieved After Implementation](#1-goals)
2. [Current State Audit — What Exists vs What's Missing](#2-current-state-audit)
3. [The Four Checks Defined](#3-the-four-checks-defined)
4. [New Files to Create](#4-new-files-to-create)
5. [Manifest JSON Shape](#5-manifest-json-shape)
6. [Command Outputs (Terminal + HTML Report)](#6-command-outputs)
7. [Implementation Phases](#7-implementation-phases)
8. [Token Allowlist — What Is and Isn't a Violation](#8-token-allowlist)

---

## 1. Goals

After this implementation, running `npm run design:check` will:

- **Goal 1: Catch uncovered routes** — Any route added to `app/` without a corresponding design file immediately fails CI. No more "forgot to design the new route" surprises.
- **Goal 2: Catch viewport gaps** — If a design file exists but is missing the `*TabletL` or `*PhoneP` export, the check catches it before the PR merges.
- **Goal 3: Catch token violations** — If a developer uses `bg-blue-500` instead of `bg-math` or `text-slate-700` instead of `text-text-primary`, the check flags it in CI.

---

## 2. Current State Audit

### What Exists

| Item | Status |
|---|---|
| `design/components/*.jsx` — design files | Present for all major routes |
| `design/manifest.json` | Present (basic shape, needs enhancement) |
| `.github/workflows/design-check.yml` | Present — runs `pnpm design:check` on push |
| `scripts/check-design.js` | Present — basic route coverage check |

### What's Missing

| Item | Gap |
|---|---|
| Viewport export coverage check | No check validates that each design file exports `*TabletL` and `*PhoneP` |
| Semantic token compliance check | No automated check for raw palette values in `.tsx` files |
| Token allowlist (what's OK to use raw) | No formal list defining which raw values are permitted vs. forbidden |
| HTML report output | Check only outputs to terminal; no shareable report for PR reviews |

---

## 3. The Four Checks Defined

### Check 1 — Route → Design Coverage

**What it does:** Reads all `app/` routes (from the file system) and compares against `design/manifest.json`. Every route must either be listed in the manifest with a `designFile` pointer, or explicitly marked as `"skip": true`.

**Failure example:**

```
✗ Route /games is not in design/manifest.json
  → Add design/components/games.jsx or mark as skip in manifest
```

### Check 2 — Design File Inventory

**What it does:** Reads `design/manifest.json` and verifies every listed `designFile` actually exists on disk.

**Failure example:**

```
✗ design/manifest.json references design/components/old-dashboard.jsx which does not exist
  → Remove the stale entry or recreate the file
```

### Check 3 — Viewport Export Coverage

**What it does:** For each design file listed in `design/manifest.json`, parses the JSX source to check that it exports `*TabletL` and `*PhoneP` named components (or has `"viewportCheck": false` in the manifest to opt out).

**Failure example:**

```
✗ design/components/games.jsx is missing export GamesTabletL
  → Add the TabletL viewport variant to the design file
```

### Check 4 — Semantic Token Compliance

**What it does:** Scans all `.tsx` files in `components/` and `app/` for raw Tailwind palette classes on semantic surfaces (backgrounds, text colors, borders). Reports violations against the token allowlist.

**Failure example:**

```
✗ components/dashboard/DashboardView.tsx:47
  Found: bg-sky-50
  Expected: bg-shell-kid (or another @theme token)

✗ components/layout/AppSidebar.tsx:23
  Found: bg-blue-500
  Expected: bg-btn-primary (or subject token like bg-math)
```

---

## 4. New Files to Create

```
scripts/
  check-design.js         ← MODIFY (extend with Check 3 + 4)
  lib/
    parse-design-file.js  ← NEW (viewport export parser)
    token-scanner.js      ← NEW (semantic token compliance scanner)
    token-allowlist.js    ← NEW (the allowlist itself)

design/
  manifest.json           ← MODIFY (add viewportCheck flag, routeGroup field)
  report-template.html    ← NEW (HTML report template)

.github/workflows/
  design-check.yml        ← MODIFY (add HTML report artifact upload on failure)
```

---

## 5. Manifest JSON Shape

```json
{
  "routes": [
    {
      "route": "/dashboard",
      "designFile": "design/components/dashboard-v2-responsive.jsx",
      "viewportCheck": true,
      "routeGroup": "dashboard"
    },
    {
      "route": "/parent/login",
      "designFile": "design/components/parent.jsx",
      "viewportCheck": true,
      "routeGroup": "parent"
    },
    {
      "route": "/",
      "skip": true,
      "skipReason": "Redirect only — no UI to design"
    }
  ],
  "tokenScanPaths": [
    "components/**/*.tsx",
    "app/**/*.tsx"
  ],
  "tokenScanExclusions": [
    "components/ui/ErrorBoundary.tsx",
    "**/*.test.tsx"
  ]
}
```

---

## 6. Command Outputs

### Terminal Output (Always)

```
Kid Hub — Design Automation Check
──────────────────────────────────
✓ Route Coverage          12/12 routes covered
✓ Design File Inventory   9/9 design files on disk
✓ Viewport Exports        9/9 files export TabletL + PhoneP
✗ Token Compliance        3 violations found

  components/dashboard/DashboardView.tsx:47  bg-sky-50 → use bg-shell-kid
  components/layout/AppSidebar.tsx:23        bg-blue-500 → use bg-btn-primary or subject token
  components/dashboard/GameEntryCard.tsx:18  bg-emerald-500 → use bg-english

All checks: 3 passed, 1 failed
```

### HTML Report (On Failure — Uploaded as CI Artifact)

The HTML report is generated from `design/report-template.html` and includes:

- Summary counts (passed / failed / total)
- Full list of token violations with file:line, found value, and suggested replacement
- Timestamp and branch name

---

## 7. Implementation Phases

### Phase 1 — Viewport Export Coverage (1–2 days)

1. Write `scripts/lib/parse-design-file.js` — reads a `.jsx` file and extracts named exports.
2. Add Check 3 to `scripts/check-design.js`.
3. Add `viewportCheck` field to `design/manifest.json` for all entries.
4. Verify no false positives on current design files.

### Phase 2 — Token Compliance Scanner (2–3 days)

1. Write `scripts/lib/token-allowlist.js` — define which raw values are violations vs. permitted.
2. Write `scripts/lib/token-scanner.js` — scan `.tsx` files with a regex-based approach.
3. Integrate into `scripts/check-design.js` as Check 4.
4. Run against the full codebase; fix all violations before enabling as a blocking check.

### Phase 3 — HTML Report + CI Integration (1 day)

1. Generate `design/report-template.html`.
2. Modify `scripts/check-design.js` to output the HTML report on failure.
3. Update `.github/workflows/design-check.yml` to upload the report as a CI artifact on failure.

---

## 8. Token Allowlist

### Violations (Raw Values That Must Use Tokens)

These raw classes are **never permitted** on semantic surfaces in `components/` or `app/`:

- `bg-blue-*` → use `bg-math`, `bg-btn-primary`, or `bg-shell-kid` depending on context
- `bg-emerald-*` → use `bg-english` or `bg-btn-secondary`
- `bg-sky-*` → use `bg-shell-kid`
- `bg-slate-*` on text backgrounds → use `bg-shell-dark` or a text token
- `text-blue-*` → use `text-math` or `text-text-primary`
- `text-slate-*` → use `text-text-primary`, `text-text-secondary`, or `text-text-muted`
- `bg-yellow-*` on feedback → use `bg-progress-high` or `bg-star-filled`
- `text-yellow-*` on feedback → use `text-star-filled`
- `rounded-[0-9]*` (arbitrary values) → use `rounded-card` or `rounded-pill`

### Permitted Raw Values

These raw values are acceptable:

- `bg-white`, `text-white` — standard white, no semantic token needed
- `bg-transparent` — transparency, no semantic token needed
- `border-*` on dividers — `border-slate-200` is acceptable as a divider (no semantic divider token yet)
- `gap-*`, `p-*`, `m-*` spacing utilities — spacing tokens are not required
- `text-xs`, `text-sm`, etc. font size utilities — no size token system
- `opacity-*` — no token needed for opacity
- `animate-*` — no token system for animations
- `/game-shell/`, `/games/` specific visual values — game surfaces may use arbitrary styles with comment justification
