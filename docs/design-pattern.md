# Cross-Platform Design System Architecture

> **Status:** Proposal for PM review (documentation only — no code changes applied)  
> **Scope:** Synchronize visual language between `apps/web` (Next.js mobile-responsive view) and `apps/mobile` (Expo / React Native)  
> **Date:** 2026-07-21  
> **Related:** `docs/design-system/design-system-guide.md`, `docs/mobile_imp.md` §3.4–3.6, `docs/assets-manage.md`, `agents/designer.md`

---

## 1. Executive recommendation

Kid Hub should **share foundations, not trees**.

| Layer | Share? | Mechanism |
|---|---|---|
| Design tokens (color, space, radius, type scale) | **Yes — single source of truth** | New `packages/design-tokens` |
| Tailwind / NativeWind theme wiring | **Yes — generated adapters** | Same package emits CSS `@theme` (web) + JS preset (mobile) |
| Presentational React components | **No (default)** | Platform-native DOM vs `View`/`Text`/`Pressable` |
| Domain / game logic, Zod, API client | **Yes (already)** | `@kid-hub/shared`, `@kid-hub/api-client` |
| Icons, fonts, small static media | **Yes** | New `packages/assets` |
| Navigation / screens | **No** | Next App Router vs expo-router |

This matches industry practice at teams that run a mature web App Router codebase alongside a native app (Airbnb’s token sync era, Shopify Polaris + mobile tokens, Expo’s own monorepo guidance): **tokens and assets are universal; leaf UI stays platform-idiomatic**.

It also aligns with the existing verdict in `docs/mobile_imp.md` §3.4: reject Solito / shared component trees for this repo. This document extends that decision with a concrete **visual sync** path that `mobile_imp.md` left as a Phase 5 (§17) TODO.

---

## 2. Current-state audit

### 2.1 Web (`apps/web`)

| Concern | Today | Risk if unchanged |
|---|---|---|
| Tokens | Tailwind CSS **v4** `@theme {}` in `app/globals.css` — semantic colors (`math`, `shell-kid`, `btn-primary`, `text-primary`), radii (`card`, `pill`), tap spacing (`tap` / `tap-lg` / `tap-xl`) | Source of truth is web-only |
| Primitives | `components/ui/` (`KidButton`, `KidCard`, `PinKeypad`, `ProgressBar`, …) — DOM + `className` | No mobile twin contract |
| Font | `Nunito` via `next/font/google` → `--font-display` → `--font-sans` | Mobile does not load Nunito |
| Icons | Mostly **emoji** (`lib/icons.ts`) + some `lucide-react` SVGs | Lucide is web-only; emoji works cross-platform but art assets do not |
| Governance | `pnpm design:check` (coverage, viewports, semantic token lint) | Mobile is outside the check |

**Notable drift inside web itself:** some primitives still use raw palette utilities (e.g. `KidButton` → `bg-blue-500`) instead of `@theme` tokens (`bg-btn-primary`). Any sync architecture should treat **semantic token usage** as the contract both apps must meet.

### 2.2 Mobile (`apps/mobile`)

| Concern | Today | Risk if unchanged |
|---|---|---|
| Styling engine | **NativeWind v4** already installed; games/screens use `className` heavily | Good foundation — underutilized for brand tokens |
| Tailwind config | `theme.extend: {}` with comment: *“Phase 5 (§17): replace with the shared token preset”* | Empty preset → utilities resolve to default Tailwind palette only |
| Parallel theme | Expo scaffold `src/constants/theme.ts` (`Colors.light/dark`, `Spacing`) — **generic black/white**, not Kid Hub | Dual systems invite accidental StyleSheet colors |
| CSS entry | `src/global.css` — Tailwind v3 directives + font CSS vars naming **Spline Sans / Inter**, not Nunito | Font name mismatch with web |
| Components | Native re-implementations (`game-hud`, `star-rating`, …) mirroring web structure | Visual parity depends on discipline, not shared values |
| Tailwind major | Mobile pins **Tailwind 3.4** (NativeWind requirement); web uses **Tailwind 4** | Adapters must bridge v3 preset vs v4 `@theme` |

### 2.3 Parallel example — `GameHud`

Both implementations share layout intent (exit · progress · timer) and similar class strings (`bg-slate-800`, `bg-blue-400`, `text-emerald-400`). Differences already visible:

- Web: orientation variants (`portrait:`), SVG timer ring, `min-h-tap` token, backdrop blur  
- Mobile: numeric timer badge, fixed landscape bar, no shared tap/radius tokens  

**Conclusion:** structure is already synchronized by hand; **foundational values are not**. That is exactly the failure mode a token package fixes.

### 2.4 Packages today

```
packages/
  shared/      # types, Zod, domain, game generators — no UI tokens
  api-client/  # typed HTTP — no UI
```

There is **no** `design-tokens`, `ui`, or `assets` package yet. `docs/mobile_imp.md` already anticipates `packages/assets` for static kid media.

---

## 3. Target architecture (layers)

```
┌─────────────────────────────────────────────────────────────┐
│  packages/design-tokens   ← single source of truth (JSON/TS) │
│    ├─→ emit theme.css (@theme)     → apps/web                │
│    └─→ emit nativewind-preset.js   → apps/mobile             │
├─────────────────────────────────────────────────────────────┤
│  packages/assets          ← fonts, SVG icons, small SFX/art  │
├─────────────────────────────────────────────────────────────┤
│  packages/ui (optional, later)                               │
│    └─ tokens + composition recipes as pure data / docs       │
│       NOT shared DOM/RN component trees (v1)                 │
├─────────────────────────────────────────────────────────────┤
│  apps/web          apps/mobile                               │
│  RSC + Tailwind4   expo-router + NativeWind4                 │
│  components/ui/*   src/components/*                          │
│  (platform leaf)   (platform leaf)                           │
└─────────────────────────────────────────────────────────────┘
```

**Mental model used by top-tier teams:**

1. **Design tokens** — Style Dictionary / DTCG-style raw → semantic → component aliases  
2. **Platform adapters** — CSS variables / Tailwind theme / RN theme objects  
3. **Component libraries** — either fully unified (Tamagui) or twin libraries (Polaris Web + Polaris React Native) sharing tokens only  
4. **Visual QA** — screenshot / Percy / custom viewport checks against the same Phone-P reference  

Kid Hub already has (3)’s twin-library pattern and (4)’s web design checks. This proposal fills (1) and (2).

---

## 4. Universal design tokens

### 4.1 Package: `packages/design-tokens` (`@kid-hub/design-tokens`)

**Role:** Own every foundational visual constant. No React. No Prisma. Safe for Metro and Next.

#### Recommended directory structure

```
packages/design-tokens/
  package.json
  tsconfig.json
  src/
    index.ts                 # public TS API: colors, space, radii, typography
    tokens/
      color.ts               # raw + semantic
      space.ts
      radius.ts
      typography.ts
      elevation.ts           # optional; web shadow / RN elevation maps
      motion.ts              # durations / easings (web CSS + RN ms)
    build/
      emit-css-theme.ts      # writes dist/theme.css  (@theme { ... })
      emit-nativewind.ts     # writes dist/nativewind-preset.js
      emit-ts.ts             # writes dist/tokens.js + .d.ts
  dist/                      # generated — committed or turbo-built in CI
    theme.css
    nativewind-preset.js
    index.js / index.d.ts
```

#### Token categories (migrate from web `@theme` first)

| Category | Examples (from current web) | Utility shape |
|---|---|---|
| Subject / domain color | `math`, `english`, `science`, `pe`, `art`, … | `bg-math`, `text-english-deep` |
| Shell | `shell-kid`, `shell-parent`, `shell-dark` | `bg-shell-kid` |
| Text | `text-primary`, `text-secondary`, `text-muted` | `text-text-primary` |
| Buttons | `btn-primary`, `btn-primary-hover`, borders | `bg-btn-primary` |
| Progress / stars | `progress-high`, `star-filled` | `bg-progress-high` |
| Radii | `card` (1.5rem), `pill` | `rounded-card` |
| Tap targets | `tap` 3rem, `tap-lg` 4rem, `tap-xl` 5rem | `min-h-tap`, `w-tap-lg` |
| Typography | family name `Nunito`, scale steps | web: CSS var; RN: `expo-font` family |

Store values as **platform-neutral numbers** where possible (e.g. radius `24` px, not only `1.5rem`). Emitters convert:

- Web CSS → `1.5rem` / hex  
- NativeWind preset → `{ borderRadius: { card: 24 } }`  
- TS runtime → `{ radius: { card: 24 } }` for rare StyleSheet escape hatches  

#### Industry pattern: Style Dictionary / DTCG

Top teams (Salesforce Lightning, Adobe Spectrum, Shopify) use a pipeline:

```
tokens.json (or TS)  →  Style Dictionary / custom emitters  →  platform artifacts
```

For Kid Hub’s size, a **small custom emitter in TypeScript** (no Style Dictionary dependency required on day one) is enough. Adopt Style Dictionary later if token count or multi-brand needs grow.

#### Consumption contracts

**Web (`apps/web/app/globals.css`):**

```css
@import 'tailwindcss';
@import '@kid-hub/design-tokens/theme.css'; /* provides @theme { ... } */
/* keep @custom-variant landscape/portrait and global resets local to web */
```

**Mobile (`apps/mobile/tailwind.config.js`):**

```js
presets: [
  require('nativewind/preset'),
  require('@kid-hub/design-tokens/nativewind-preset'),
],
```

**Deprecate** mobile `Colors` / `Spacing` in `src/constants/theme.ts` once the preset lands — or re-export from `@kid-hub/design-tokens` so one import path remains.

#### Governance

Extend `apps/web/scripts/design/check-tokens.ts` (or a root turbo task) to:

1. Assert `globals.css` does not redefine colors already in `packages/design-tokens`  
2. Scan **both** `apps/web` and `apps/mobile` for banned raw semantic colors (existing allowlist rules)  
3. Fail CI if web `@theme` and mobile preset hashes diverge (generated artifacts out of date)

---

## 5. Universal styling: NativeWind vs StyleSheet

### 5.1 Recommendation: **NativeWind as the mobile styling system** (keep and deepen)

Mobile already uses NativeWind for nearly all product UI (`className` on games, tabs, login). StyleSheet appears mainly in Expo scaffold leftovers (`themed-text`, `hint-row`, etc.).

| Approach | Pros | Cons | Verdict for Kid Hub |
|---|---|---|---|
| **NativeWind + shared preset** | Same mental model as web Tailwind; class strings can mirror Phone-P layouts; already in repo | Tailwind 3 (mobile) vs 4 (web); not every CSS feature ports; `hover:` / `backdrop-blur` differ | **Adopt** |
| **StyleSheet + token objects** | Explicit, zero magic, full RN control | Diverges from web authoring; harder for designers who think in utilities | Escape hatch only |
| **Tamagui style props** | Fast compile-time styles, shared props API | Rewrites both apps; conflicts with existing Tailwind investment | Reject for v1 |
| **Unistyles / restyle** | Strong typed themes | Another paradigm; team already on Tailwind/NativeWind | Reject |

### 5.2 What “same className” means in practice

**Realistic sync (recommended):**

```tsx
// Conceptual — values come from the shared preset on both sides
className="flex-1 bg-shell-kid p-4 rounded-card min-h-tap"
```

Both platforms resolve `bg-shell-kid` / `rounded-card` / `min-h-tap` to the **same hex / px**.

**Not guaranteed 1:1:**

| Web | Mobile NativeWind | Guidance |
|---|---|---|
| `hover:`, `backdrop-blur`, complex grids | Limited / no-op | Prefer `active:` press states on mobile |
| `portrait:` / `landscape:` custom variants | Use RN orientation hooks or NativeWind media if supported | Keep orientation logic in platform wrappers |
| Pseudo-elements, sticky, scroll-snap | Different primitives | Composition differs; tokens stay shared |
| `div` vs `View`, `button` vs `Pressable` | Different hosts | Do not share the JSX element |

### 5.3 Dual Tailwind major versions

This is the hard technical constraint:

- Web: Tailwind **v4** CSS-first (`@theme`)  
- NativeWind 4: Tailwind **v3** JS config  

**Solution:** tokens live in TS; **two emitters** produce the two formats. Never hand-edit both. Never try to make web consume the v3 JS config as its source of truth.

### 5.4 When to use StyleSheet

Allowed when:

- Animating with Reanimated shared values that need numeric styles  
- Third-party native components that reject `className`  
- One-off platform chrome (status bar, native tab bar options)

Always pull **numbers/colors from `@kid-hub/design-tokens`**, never hard-code `#3b82f6`.

---

## 6. Cross-platform component libraries

### 6.1 Options evaluated

#### A. Tokens-only + twin components (recommended)

**Pattern:** Shopify Polaris (web + RN cousins), many Expo + Next monorepos.

| Pros | Cons |
|---|---|
| Preserves Next RSC / Server Actions | Some duplicate JSX |
| Preserves expo-router and native gestures | Requires design review discipline |
| Matches `mobile_imp.md` Path A | No single Storybook of identical components |
| Lowest rewrite risk | — |

**How to reduce duplication without sharing trees:**

- Document **composition recipes** (props + required token classes) in `packages/ui` or `docs/design-system/`  
- Keep prop interfaces aligned by name (`variant: 'primary' | 'secondary' | …`)  
- Optionally share **non-React** helpers (e.g. `buttonVariantClass('primary')` → class string) from `packages/design-tokens` or a thin `packages/ui-recipes`

#### B. Tamagui / Gluestack unified components

| Pros | Cons |
|---|---|
| True shared components + optimizing compiler (Tamagui) | Large migration of web away from Tailwind v4 `@theme` |
| Strong theme tokens built-in | Fights RSC model if components become client-heavy |
| Gluestack can sit on NativeWind | Still need platform forks for navigation, forms, modals |

**Verdict:** **Do not migrate the existing web design system to Tamagui/Gluestack.** Revisit only if starting a greenfield surface that must be identical pixel-for-pixel and is 100% client-rendered.

#### C. Solito + react-native-web shared screens

| Pros | Cons |
|---|---|
| Shared navigation abstractions | Conflicts with App Router route groups **and** expo-router |
| — | Web would regress toward RN primitives |
| — | Rejected in `docs/mobile_imp.md` §3.4 |

**Verdict:** **Remain rejected.**

### 6.2 Optional later package: `packages/ui`

For Kid Hub v1, `packages/ui` should **not** export `<Button>` that renders `button` or `Pressable`. Instead:

```
packages/ui/
  src/
    recipes/
      kid-button.ts      # { base, variants } class maps — platform-agnostic strings
      game-hud.ts
    types/
      button.ts          # shared prop unions
  README.md              # “Web implements with <button>; Mobile with <Pressable>”
```

Promote to real shared components **only** for pure, leaf, non-DOM-specific widgets if a clear win appears (e.g. star-rating math + glyph map with `.native.tsx` / `.web.tsx` entry points). Default remains twin implementations.

### 6.3 Component inventory to twin (priority)

| Web | Mobile counterpart | Sync priority |
|---|---|---|
| `components/ui/KidButton` | (missing / ad-hoc Pressables) | P0 — tokenized variants |
| `components/ui/KidCard` | — | P0 |
| `components/ui/StarRating` | `components/games/star-rating` | P0 |
| `components/ui/ProgressBar` | inline bars in GameHud | P1 |
| `components/ui/PinKeypad` | login keypad | P1 |
| `components/games/GameHud` | `components/games/game-hud` | P1 — already close |
| Dashboard / schedule shells | tab screens | P2 — layout tokens + spacing |

---

## 7. Asset management (SVG, fonts, media)

### 7.1 Package: `packages/assets` (`@kid-hub/assets`)

Aligns with `docs/mobile_imp.md` and complements (does not replace) the DB/CDN plan in `docs/assets-manage.md`.

```
packages/assets/
  package.json
  fonts/
    Nunito-Regular.ttf
    Nunito-Bold.ttf
    Nunito-ExtraBold.ttf
  icons/
    *.svg                 # canonical vector source
  icons-react/            # optional generated
    *.web.tsx             # lucide-compatible or SVGR → React DOM
    *.native.tsx          # react-native-svg components
  media/
    badges/…
    subjects/…            # if moving off pure emoji later
  src/
    index.ts              # manifest: { name, webPath, nativeModule }
    fonts.ts              # expo-font map + CSS family name constant
    icons.ts              # icon key → component / emoji fallback
```

### 7.2 Fonts — synchronous brand type

| Step | Web | Mobile |
|---|---|---|
| Source files | Prefer self-hosted from `packages/assets/fonts` **or** keep `next/font` but pin the **same family + weights** | `expo-font` load from package |
| CSS / theme | `--font-display: 'Nunito', …` from tokens | NativeWind `fontFamily: { sans: ['Nunito'] }` |
| Remove | — | Misleading Spline Sans / Inter vars in `global.css` |

**Rule:** One family name string in `@kid-hub/design-tokens` typography tokens; both apps must reference it.

### 7.3 SVG icons

**Industry patterns:**

1. **SVGR dual compile** — one `.svg` → `Icon.web.tsx` + `Icon.native.tsx` (Metro/`react-native-svg`)  
2. **Icon font** — single TTF; weaker for multicolor kid art  
3. **Emoji / PNG atlas** — Kid Hub’s current subject icons are emoji (`lib/icons.ts`); keep for schedule until design needs vectors  

**Recommendation:**

- Keep **emoji map** in `@kid-hub/shared` or `@kid-hub/assets` (shared keys already matter for API `iconKey`)  
- For UI chrome icons currently using `lucide-react` on web: either  
  - add `lucide-react-native` on mobile with the **same icon names**, or  
  - move a **small curated subset** into `packages/assets/icons` and generate both targets  
- Do **not** import `lucide-react` from shared mobile bundles  

### 7.4 Raster / audio game assets

Follow `docs/assets-manage.md` resolution rule (`cloud_url ?? local_path`):

- **Large / many** game WebPs & SFX → CDN + cache (not duplicated in both app bundles)  
- **Small chrome** (tab icons, badge art, splash-adjacent) → `packages/assets` bundled  

Web continues to serve `/public` for PWA; mobile uses `expo-image` with the shared remote URL. A shared **manifest module** in `@kid-hub/assets` prevents path string drift.

---

## 8. Target monorepo directory structure (UI-related)

```
packages/
  shared/                 # EXISTING — domain, schemas, game logic
  api-client/             # EXISTING — HTTP
  design-tokens/          # NEW — foundational values + emitters
    src/tokens/
    src/build/
    dist/theme.css
    dist/nativewind-preset.js
  assets/                 # NEW — fonts, SVGs, small static media, manifests
    fonts/
    icons/
    src/
  ui/                     # OPTIONAL (phase 2) — recipes + shared prop types only
    src/recipes/
    src/types/

apps/
  web/
    app/globals.css       # @import tokens; local variants/resets only
    components/ui/        # DOM implementations consuming token classes
    components/<domain>/
  mobile/
    tailwind.config.js    # presets: nativewind + design-tokens
    src/global.css        # Tailwind directives only; no competing color :root
    src/components/       # RN implementations consuming same token classes
    src/constants/theme.ts  # thin re-export or deleted after migration
```

Root tooling:

```
pnpm-workspace.yaml       # already includes packages/*
turbo.json                # add build pipeline for design-tokens → web/mobile
```

---

## 9. Implementation phases (blueprint only)

| Phase | Deliverable | Exit criteria |
|---|---|---|
| **T0 — Inventory** | Map every `@theme` token + every mobile hard-coded color | Spreadsheet / checklist in design-system docs |
| **T1 — `design-tokens` package** | TS tokens + CSS + NativeWind emitters | Web imports generated `@theme`; mobile preset non-empty |
| **T2 — Kill dual themes** | Remove Expo scaffold Colors from product screens | No `#000`/`#fff` theme path in kid flows |
| **T3 — Font sync** | Nunito in both via `packages/assets` or pinned next/font + expo-font | Same family/weights visually verified Phone-P |
| **T4 — Primitive twinning** | KidButton / KidCard / StarRating parity using token classes | Side-by-side screenshot against web Phone-P |
| **T5 — Asset package** | Icon keys + small art; CDN for large media | No duplicated path constants |
| **T6 — CI** | Token drift check across web + mobile | `turbo run design:check` covers both apps |
| **T7 — Optional `packages/ui` recipes** | Shared class maps / prop unions | Only if duplication pain is measured |

No Solito, no Tamagui migration in this roadmap.

---

## 10. Decision record (ADR-style)

| Decision | Choice | Rationale |
|---|---|---|
| Source of truth for color/space/type | `packages/design-tokens` | Web `@theme` alone cannot feed Metro; mobile empty preset already expected a shared preset |
| Mobile styling API | NativeWind + shared preset | Already adopted; maximizes class-string parity with web Phone-P |
| Shared React component trees | **No** (Solito / Tamagui rejected) | Protects RSC, App Router, expo-router; see `mobile_imp.md` §3.4 |
| Tailwind majors | Dual emit (v4 CSS + v3 preset) | Forced by NativeWind; do not downgrade web or invent unsupported v4 NativeWind |
| Fonts / small icons | `packages/assets` | Avoid binary duplication; align with existing assets plan |
| Large game media | CDN + shared manifest | Bundle size; see `assets-manage.md` |

---

## 11. Anti-patterns (do not do)

1. **Copy-paste hex values** into mobile StyleSheets “just for this screen”  
2. **Re-introduce a second theme** (`theme.ts` Colors) alongside NativeWind tokens  
3. **Put tokens in `@kid-hub/shared`** — that package’s contract is “no React / UI”; keep design out to preserve purity and clear ownership (`agents/designer.md` vs Lead Dev)  
4. **Share screen-level components** across Next and Expo  
5. **Hand-edit generated `theme.css` / preset** — edit `src/tokens/*` only  
6. **Assume `className` identity means CSS identity** — verify NativeWind support matrix for each utility  
7. **Use raw palette for semantic UI** (`bg-blue-500` for primary CTA) — use `bg-btn-primary` (fix web primitives during twinning)

---

## 12. Success metrics

Visual sync is “done” when:

1. Changing `--color-shell-kid` (or its TS equivalent) in `packages/design-tokens` updates **both** web mobile viewport and the Expo app without further edits  
2. Phone-P screenshots of Dashboard / GameHud / Pin entry match within an agreed tolerance (designer-signed)  
3. CI fails if either app introduces a banned raw semantic color  
4. Nunito (or the chosen display face) renders on both platforms at the same weights  
5. No Solito/Tamagui rewrite is required to maintain parity  

---

## 13. References (internal)

| Doc | Relevance |
|---|---|
| `apps/web/app/globals.css` | Current token inventory to migrate |
| `apps/mobile/tailwind.config.js` | Empty preset + Phase 5 (§17) TODO |
| `docs/mobile_imp.md` §3.4–3.6 | Rejects shared UI trees; logic sharing only |
| `docs/design-system/design-system-guide.md` | Semantic token rules for web |
| `docs/guides/responsive-implementation.md` | Phone-first / orientation variants |
| `docs/assets-manage.md` | CDN vs local media resolution |
| `agents/designer.md` | Token ownership rules |

---

## 14. Ask for PM approval

This document proposes **creating** (in a future implementation task, not now):

1. `packages/design-tokens` with dual emitters  
2. `packages/assets` for fonts/icons/manifests  
3. Optional later `packages/ui` **recipes only**  

It explicitly does **not** propose installing Tamagui/Solito or merging component trees.

**Requested PM decision:** Approve this architecture as the north star for visual sync, or request changes before any implementation tickets are cut.
