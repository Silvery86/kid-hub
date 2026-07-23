# Mobile Implementation Plan — Orientation Engine & Cross-Platform Single Source of Truth

> **Status:** In implementation (PM-approved, Part II) · **Owner:** Principal Mobile Architect
> **Scope:** `apps/mobile` (Expo) + `apps/web` (Next.js 16) + `packages/*` (Turborepo)
>
> **Progress (updated 2026-07-22):**
> - ✅ **Phase 0–8 DONE — all implementation phases complete.** SSOT foundation
>   (types/schemas/domain/game core in `@kid-hub/shared`), `@kid-hub/api-client` + game-progress
>   REST, the orientation engine (Phase 5), full 6-minigame native games (Phase 6), the
>   `@kid-hub/assets` package with cached flashcards + shared icon map (Phase 7), and the shared
>   design-token SSOT + mobile re-skin (Phase 8). Web `next build` + workspace `type-check` + shared
>   tests all green.
> - 🔧 **Remaining: on-device verification only (no code left).** One fresh EAS/dev build confirms,
>   on hardware: Phase 5 landscape orientation + no-flicker, Phase 6 games end-to-end + audio, Phase 7
>   flashcards fetching from the web origin + caching, the Phase 5/6 native config, and the
>   refresh-token flow (`mobile-app-migrate.md` §14). Optional follow-ups noted in Phase 8: bundle the
>   Spline Sans `.ttf`, and tokenize the games' dark chrome jointly with web.
> - 🔧 **Cross-cutting, unblocked-by-hardware:** on-device EAS build to verify Phase 5
>   orientation + Phase 6 games + the refresh-token flow (`mobile-app-migrate.md` §14) —
>   the native config (`app.json` plugins) cannot hot-reload, so one fresh dev/EAS build
>   clears all three at once.

---

## 0. Executive Summary

This document specifies two mobile initiatives and their supporting architecture:

1. **Dynamic Orientation Engine** — a declarative, per-route orientation controller
   that keeps the app in **portrait** for standard workflows (onboarding, parental
   settings, `/schedule`) and force-rotates to **landscape** for game routes
   (`/math`, `/english`), then flips back cleanly on exit — with no flicker or
   layout tearing during the transition.

2. **Cross-Platform Single Source of Truth (SSOT)** — an architecture that guarantees
   business-logic changes made in the Next.js web app (e.g. how recurring periods or
   evening homework are validated/saved in `/schedule`) automatically propagate to the
   React Native app without a manual rewrite.

**Definitive recommendation:** adopt **Path A (Shared Packages)** as the structural
backbone, use **Path B (WebView Bridge)** as a *surgical, opt-in* escape hatch for the
two high-interactivity game routes only, and **reject Path C (Shared UI Components /
Solito)** as a primary strategy. Rationale and trade-offs are in §3.

---

## 1. Current-State Audit (verified against the repo)

Grounding facts this plan builds on:

| Area | Current reality | Location |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo; `apps/*`, `packages/*` | `pnpm-workspace.yaml`, `turbo.json` |
| Web app | Next.js 16 App Router, layered `repository → service → action`, Zod in actions | `apps/web/server/**` |
| Web REST surface | `/api/v1/*` already serves mobile (schedule, homework, grades, progress, auth) | `apps/web/app/api/v1/**` |
| Mobile app | Expo `~56`, RN `0.85`, expo-router, NativeWind 4, TanStack Query + axios | `apps/mobile/package.json` |
| Mobile auth transport | axios client with Bearer + single-flight refresh on 401 | `apps/mobile/src/api/client.ts` |
| Shared package | `@kid-hub/shared` exists but holds **only** `DayOfWeek` + result envelopes | `packages/shared/src/*` |
| **Duplication problem** | Mobile keeps a **local mirror** of contract types | `apps/mobile/src/api/types.ts` |
| Zod schemas | Live inside server actions (server-coupled, not shareable today) | `apps/web/server/actions/schedule.actions.ts` |
| Pure domain logic | `buildTodayView`, `deriveTimeBand`, `validatePeriodOverlap` (schedule), `calculateBadge` (grading), `parseTimeToMinutes` (schedule-utils) | `apps/web/server/services/*`, `apps/web/lib/*` |
| Orientation | App is **globally locked portrait**; `expo-screen-orientation` **not installed** | `apps/mobile/app.json` → `"orientation": "portrait"` |
| Mobile routes today | expo-router with `(tabs)`: dashboard, schedule, homework, grades. **No game screens yet** | `apps/mobile/src/app/(tabs)/*` |
| Web game routes | `/math`, `/english` under route group `(games)` | `apps/web/app/(games)/*` |

**Key takeaways that shape the plan**

- The comment in `apps/mobile/src/api/types.ts` already states the intent:
  *"Phase 5 migrates these into `@kid-hub/shared` so Web and Mobile share one source of
  truth."* This plan operationalizes that intent — it is not a new direction, it is the
  completion of an already-anticipated migration.
- The REST contract (`/api/v1`) is the transport SSOT; the **type + validation + pure
  logic** contract is what still needs to be lifted into a shared package.
- Games do not yet exist on mobile, which makes the WebView escape hatch (Path B) a
  low-risk, greenfield decision rather than a rewrite.

---

## 2. Initiative 1 — Dynamic Orientation Engine

### 2.1 Requirements

| ID | Requirement |
|---|---|
| OR-1 | Global baseline is **portrait** for all standard screens (onboarding, parental settings, `(tabs)/*`, `/schedule`). |
| OR-2 | Entering a game route (`/math`, `/english`) auto-rotates and **locks landscape**. |
| OR-3 | Exiting a game route **restores portrait** seamlessly. |
| OR-4 | No white flash, no double-rotate, no layout tearing during the transition. |
| OR-5 | Correct behavior on cold deep-link directly into a game route. |
| OR-6 | Correct behavior on app background/foreground while inside a game. |
| OR-7 | Tablets/iPad may allow both landscape variants (`LANDSCAPE`) rather than a single locked side. |

### 2.2 Package & configuration choice

- **Library:** `expo-screen-orientation` (first-party Expo module; config-plugin aware,
  works in dev-client + EAS builds this repo already uses per `apps/mobile/eas.json`).
- **`app.json` baseline stays `"orientation": "portrait"`.** This makes portrait the OS
  default and the app's resting state; the engine only *overrides* it inside games.
- **iOS caveat (must-do):** iOS requires the app to *declare* that it supports the
  orientations you intend to programmatically lock to. `expo-screen-orientation`'s config
  plugin injects the needed `UISupportedInterfaceOrientations`. Blueprint config:

```jsonc
// app.json (blueprint — DO NOT APPLY YET)
{
  "expo": {
    "orientation": "portrait",
    "plugins": [
      // ...existing plugins...
      [
        "expo-screen-orientation",
        {
          // iOS: the superset of orientations any screen may lock to.
          "initialOrientation": "PORTRAIT"
        }
      ]
    ],
    "ios": {
      "requireFullScreen": true // avoids iPad Split-View orientation ambiguity
    }
  }
}
```

> Because this changes native config, it requires a **new dev/EAS build** — it cannot be
> hot-reloaded into the existing dev client. Flag this in the rollout plan (§5).

### 2.3 Approach comparison (how the lock is driven)

| Approach | Mechanism | Verdict |
|---|---|---|
| **A. Imperative in each screen** — call `lockAsync` in `useEffect` per game screen | Simple, local | ❌ Fragile: easy to forget the unlock, races on fast nav, no single owner |
| **B. Navigation listeners (`focus`/`blur`)** — a hook subscribes to React Navigation events and locks/unlocks | Centralized per screen, deterministic pairing of lock↔unlock | ✅ **Recommended** — the `blur` handler guarantees restoration even on gesture-back or deep exits |
| **C. Global route observer** — one root listener maps `pathname → orientation` | Fully declarative, one owner | ✅ Good as a **fallback/guardrail** layered under B; can drift from route intent if the map isn't maintained |

**Chosen design: B as the primary contract, C as a safety net.**
Each game screen *declares* its intent via a tiny `<OrientationLock mode="landscape" />`
gate (readable, co-located with the screen). Under the hood that gate uses the
`focus`/`blur` navigation lifecycle so the unlock is structurally paired with the lock.
A root-level "reset to portrait on any non-game focus" guardrail catches edge cases where
a screen forgets to declare intent.

### 2.4 Blueprint code (illustrative — not to be applied)

**Hook — `apps/mobile/src/hooks/use-orientation-lock.ts`**

```tsx
import { useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import * as ScreenOrientation from 'expo-screen-orientation'
import { Platform } from 'react-native'
import * as Device from 'expo-device'

type LockMode = 'portrait' | 'landscape'

const toLock = async (mode: LockMode) => {
  if (mode === 'portrait') {
    return ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
  }
  // Tablets: allow both landscape variants; phones: pick one stable side.
  const isTablet = Device.deviceType === Device.DeviceType.TABLET
  return ScreenOrientation.lockAsync(
    isTablet
      ? ScreenOrientation.OrientationLock.LANDSCAPE
      : ScreenOrientation.OrientationLock.LANDSCAPE_LEFT,
  )
}

/**
 * Locks orientation while the screen is focused and RESTORES portrait on blur.
 * The focus/blur pairing guarantees restoration on gesture-back, tab switch,
 * deep-link exit, and hardware back.
 */
export function useOrientationLock(mode: LockMode) {
  useFocusEffect(
    useCallback(() => {
      let active = true
      // Await the rotation before revealing content (see OrientationLock gate).
      toLock(mode).catch(() => {})
      return () => {
        active = false
        // Always return to the app baseline on leave.
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP,
        ).catch(() => {})
        void active
      }
    }, [mode]),
  )
}
```

**Gate component — `apps/mobile/src/components/orientation-lock.tsx`**

```tsx
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import * as ScreenOrientation from 'expo-screen-orientation'
import { useOrientationLock } from '@/hooks/use-orientation-lock'

/**
 * Wrap a screen's content. It (1) locks orientation via the hook and (2) holds
 * a splash-colored curtain over the content until the device reports the target
 * orientation, eliminating the flash/tear during rotation.
 */
export function OrientationLock({
  mode,
  children,
}: {
  mode: 'portrait' | 'landscape'
  children: React.ReactNode
}) {
  useOrientationLock(mode)
  const [settled, setSettled] = useState(mode === 'portrait')

  useEffect(() => {
    if (mode === 'portrait') return
    const sub = ScreenOrientation.addOrientationChangeListener((e) => {
      const o = e.orientationInfo.orientation
      if (
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      ) {
        setSettled(true)
      }
    })
    return () => ScreenOrientation.removeOrientationChangeListener(sub)
  }, [mode])

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!settled && (
        // Curtain matches the game's brand background (#208AEF splash color)
        // so the rotate reads as an intentional transition, not a glitch.
        <View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, backgroundColor: '#208AEF' }}
        />
      )}
    </View>
  )
}
```

**Usage — game screen (e.g. `apps/mobile/src/app/(games)/math.tsx`)**

```tsx
import { OrientationLock } from '@/components/orientation-lock'

export default function MathGameScreen() {
  return (
    <OrientationLock mode="landscape">
      {/* game content — safe to assume landscape once children render */}
    </OrientationLock>
  )
}
```

**Root guardrail (Path C safety net) — in `apps/mobile/src/app/_layout.tsx`**

```tsx
// Pseudocode: subscribe to router state; if the focused route is NOT a game
// route and orientation is not portrait, force portrait. Prevents "stuck
// landscape" if a screen ever forgets its <OrientationLock/>.
```

### 2.5 Flicker / layout-break prevention (OR-4)

| Risk | Mitigation |
|---|---|
| White flash mid-rotation | The `OrientationLock` **curtain** paints the splash brand color (`#208AEF`) until the device confirms the target orientation via `addOrientationChangeListener`. |
| Content laid out in the wrong orientation for one frame | Content is rendered but visually covered by the curtain; we reveal only after the orientation-change event fires — no wrong-orientation frame is shown. |
| Double-rotate on fast in→out navigation | `focus`/`blur` pairing is idempotent; each transition awaits `lockAsync` (a promise) so overlapping calls resolve to the last requested state. |
| Layout using stale dimensions | Game layouts must use `useWindowDimensions()` / safe-area insets (`react-native-safe-area-context`, already a dep) **not** captured constants, so they reflow on the reported size. |
| Reanimated worklet reading old frame size | Recompute derived layout from `useWindowDimensions()` inside the component body, not from a one-time measure. |

### 2.6 Edge cases

- **Cold deep-link into a game (OR-5):** the `focus` effect still fires on first mount, so
  the lock applies; the curtain covers the initial landscape settle.
- **Background/foreground inside a game (OR-6):** iOS/Android may reset orientation on
  resume; re-assert the lock on `AppState` `active` while a game screen is focused (add an
  `AppState` listener inside `useOrientationLock`, gated to `mode === 'landscape'`).
- **Tablets/iPad (OR-7):** use `OrientationLock.LANDSCAPE` (both sides) on tablets,
  `LANDSCAPE_LEFT` on phones, as shown in the hook. `requireFullScreen: true` avoids
  iPad multitasking orientation ambiguity.
- **Android hardware back / gesture back:** covered by `blur` restoration.

### 2.7 Testing strategy

- **Manual matrix:** phone + tablet × iOS + Android × {enter game, exit via back, exit via
  gesture, background→foreground in game, cold deep-link}.
- **Detox/Maestro (if/when e2e is added to mobile):** assert reported orientation after
  navigation transitions; assert no wrong-orientation frame by snapshotting after the
  settle event.
- **Unit:** the pure `toLock` mapping (tablet vs phone) is unit-testable in isolation.

---

## 3. Initiative 2 — Cross-Platform Single Source of Truth

### 3.1 The problem, stated precisely

When `/schedule` business logic changes on web — e.g. how **recurring school periods**
(`CreatePeriodSchema`, overlap validation via `validatePeriodOverlap`) or **evening
homework blocks** (`EXTRA_CLASS` / `getEveningBlocks` / `deriveTimeBand` /
`buildTodayView`) are validated and shaped — the mobile app must reflect the new rules
**without** a parallel rewrite. Today mobile risks drift because it holds a **hand-copied
type mirror** (`apps/mobile/src/api/types.ts`) and cannot see web's Zod schemas or pure
domain functions at all.

The contract has three layers, each needing an SSOT decision:

1. **Shape** — TypeScript types (`TodayView`, `ClassPeriod`, `DailyHomework`, …).
2. **Validation** — Zod schemas (`CreatePeriodSchema`, `AddDailyHomeworkSchema`, …).
3. **Pure logic** — transport-agnostic functions (`deriveTimeBand`, `validatePeriodOverlap`,
   `buildTodayView`, `calculateBadge`, `parseTimeToMinutes`).

### 3.2 Path A — Shared Packages Monorepo (Shared Core Logic)

Extract shape + validation + pure logic + typed API fetchers into workspace packages that
**both** Next.js and Expo import.

**Structure (blueprint):**

```
packages/
  shared/                 # @kid-hub/shared  (EXISTS — expand it)
    src/
      types/              # ← lift apps/web/types + delete mobile's mirror
        schedule.ts        #   ClassPeriod, TodayView, DailyHomework, EventType…
        grades.ts          #   SubjectGrade, ReportCard, BadgeTier…
        result.ts          #   ActionResult / AuthActionResult (already here)
      schemas/            # ← lift Zod OUT of server actions
        schedule.schema.ts #   CreatePeriodSchema, AddDailyHomeworkSchema…
        auth.schema.ts
      domain/             # ← pure, framework-free business rules
        schedule.ts        #   validatePeriodOverlap, deriveTimeBand, buildTodayView
        grading.ts         #   calculateBadge
        time.ts            #   parseTimeToMinutes
      index.ts
  api-client/             # @kid-hub/api-client (NEW — optional split)
    src/
      endpoints/          # typed fetchers over /api/v1, return shared types
        schedule.ts        #   getSchedule(): Promise<TodayView>
        homework.ts
        grades.ts
      http.ts             # transport-injected: web passes fetch, mobile passes axios
      index.ts
```

**How each app consumes it:**

- **Web** — server actions keep `requireParentSession` + orchestration, but *import* Zod
  schemas and pure domain functions from `@kid-hub/shared` instead of defining them
  inline. Services import `@kid-hub/shared/domain/*`. Web thus becomes a *consumer* of the
  same contract it used to own.
- **Mobile** — `apps/mobile/src/api/types.ts` is **deleted**; screens/hooks import types
  from `@kid-hub/shared`. The axios layer (`apps/mobile/src/api/client.ts`) either stays
  and imports return types from shared, or is refactored to sit behind
  `@kid-hub/api-client` with axios injected as the transport.

**Hard constraint (already documented in `packages/shared/src/index.ts`):**
`@kid-hub/shared` must remain **pure** — *no* `server-only`, *no* Prisma, *no* React, *no*
Node built-ins — because it is bundled into the Expo/Metro build. Zod is safe (isomorphic).
This means only **pure** domain functions move; anything touching Prisma/`server-only`
stays in `apps/web/server/*`.

| Pros | Cons |
|---|---|
| One definition of types/validation/logic; web change → mobile sees it at compile time | Requires disciplined layering (pure vs server-only split) |
| Type-safety across the boundary; drift becomes a **compile error**, not a runtime surprise | Metro must be configured to transpile the workspace package (symlink + `watchFolders`) |
| Incremental — extends the package that already exists; matches the repo's stated Phase 5 plan | Refactor touches many files (mitigated by phasing, §3.7) |
| Zod schemas shared → identical validation messages/field errors on both platforms | Zod version must be pinned identically across web + shared |

### 3.3 Path B — WebView / Hybrid Bridge

Render specific high-interactivity web routes (the games, or a complex scheduler editor)
inside `react-native-webview`, passing auth + state over a `postMessage` bridge.

**Structure (blueprint):**

```
apps/mobile/src/
  components/
    web-bridge.tsx        # <WebBridge route="/math" /> wrapper around WebView
  lib/
    web-bridge-protocol.ts # typed postMessage message union (shared with web)
apps/web/
  app/(embedded)/         # thin, chrome-less variants of routes meant for embedding
    math/page.tsx          # reads token from injected bridge, hides web nav
```

**Bridge sketch (blueprint):**

```tsx
// Native side injects the access token; web posts progress/score/exit back.
<WebView
  source={{ uri: `${WEB_ORIGIN}/embedded/math` }}
  injectedJavaScriptBeforeContentLoaded={`
    window.__KIDHUB_BRIDGE__ = { token: ${JSON.stringify(accessToken)} };
    true;
  `}
  onMessage={(e) => handleBridgeMessage(JSON.parse(e.nativeEvent.data))}
/>
```

| Pros | Cons |
|---|---|
| **Zero logic duplication** for embedded routes — the web *is* the implementation | Feels less native (scroll, gestures, haptics, offline) |
| Ideal for the games: complex, canvas/DOM-heavy, change often, already built on web | Auth token crosses the JS bridge → must be handled carefully (short-lived access token only, never the refresh token; enforce `originWhitelist`) |
| Ship game changes by deploying web — no app-store round-trip | Orientation/native chrome must still be driven natively (works fine with Initiative 1's `OrientationLock` wrapping the `WebView`) |
| Great as a **stopgap** to ship games on mobile before a native rewrite | WebView performance/memory on low-end Android; offline unavailable unless cached |

### 3.4 Path C — Shared UI Components (Solito / NativeWind)

Share the *same* React components across Next.js and RN via `react-native-web` + Solito
(shared navigation) and/or NativeWind for shared className styling.

| Pros | Cons |
|---|---|
| Maximal UI reuse in theory | **Web already has a mature Tailwind v4 `@theme` design system + Server Components**; forcing it through `react-native-web` primitives is a large regression/rewrite |
| NativeWind is *already* in the mobile app | Solito imposes a shared navigation model that conflicts with Next App Router route groups **and** expo-router; high coupling, low payoff |
| — | Server Components / Server Actions do not cross to RN; the web's rendering model can't be shared, only its leaf presentational components |
| — | Highest long-term maintenance tax; couples two very different runtimes at the view layer |

**Verdict: reject Path C as a strategy.** Keep NativeWind purely for *mobile* styling
(as it's used today). Do **not** attempt cross-platform component sharing via Solito/
react-native-web for this codebase. UI stays platform-native; only *logic* is shared.

### 3.5 Decision matrix

| Criterion (weight) | Path A Shared Pkg | Path B WebView | Path C Shared UI |
|---|---|---|---|
| Kills logic drift (★★★) | ✅ Excellent | ✅ For embedded routes only | ⚠️ UI only, not logic |
| Native feel (★★) | ✅ Fully native | ⚠️ Web-in-a-box | ✅ Native-ish |
| Fits existing web (Tailwind v4 + RSC) (★★★) | ✅ No web rewrite | ✅ Reuses web as-is | ❌ Fights RSC/Tailwind |
| Effort to adopt (★★) | ⚠️ Medium (phased) | ✅ Low (greenfield games) | ❌ High |
| Offline capable (★) | ✅ | ❌ (unless cached) | ✅ |
| Ship-speed for games (★) | ⚠️ Native rebuild | ✅ Deploy web | ⚠️ |
| **Overall** | **Primary** | **Targeted supplement** | **Rejected** |

### 3.6 Definitive recommendation — Hybrid A + (surgical) B

1. **Path A is the backbone.** All types, Zod schemas, and pure domain logic live in
   `@kid-hub/shared`; typed fetchers in `@kid-hub/api-client`. Both apps import them.
   A `/schedule` rule change on web is a change in *one* shared module that mobile
   compiles against — drift becomes a type error.
2. **Path B for the two games only, as a deliberate v1 shortcut.** Games are DOM/canvas-
   heavy, already exist on web (`/math`, `/english`), and change often. Embed them via
   `react-native-webview` behind the `OrientationLock` from Initiative 1. This ships games
   on mobile fast and defers a native game rewrite until product-proven. Revisit later if
   native feel is required.
3. **Path C is not used.** Mobile UI stays native (expo-router + NativeWind); web UI stays
   RSC + Tailwind v4. Only logic is shared.

This is also the lowest-risk path because it *continues* the migration the codebase already
declares in `apps/mobile/src/api/types.ts` and `packages/shared/src/index.ts` (Phase 5).

### 3.7 Migration plan (phased, blueprint-only)

| Phase | Change | Risk |
|---|---|---|
| S1 | Move contract **types** (`apps/web/types` intersection + mobile mirror) into `@kid-hub/shared/types`; web + mobile re-export/import from it; **delete** `apps/mobile/src/api/types.ts` | Low — pure types, caught by `type-check` |
| S2 | Lift **Zod schemas** out of `server/actions/schedule.actions.ts` (and auth) into `@kid-hub/shared/schemas`; actions import them | Low — schemas are isomorphic |
| S3 | Lift **pure domain fns** (`validatePeriodOverlap`, `deriveTimeBand`, `buildTodayView`, `calculateBadge`, `parseTimeToMinutes`) into `@kid-hub/shared/domain`; services import them; **assert no `server-only`/Prisma leaks** | Medium — must verify purity |
| S4 | Introduce `@kid-hub/api-client` with transport injection; mobile axios + web `fetch` both plug in | Medium — refactors call sites |
| S5 | Add `react-native-webview` + `(embedded)` web routes + typed bridge protocol for games | Medium — new surface |

**Metro / tooling notes for Path A**

- Metro must resolve the workspace package via symlinks; add `packages/shared` to
  `watchFolders` and ensure `metro.config.js` (already present) enables monorepo
  resolution (`nodeModulesPaths`, `disableHierarchicalLookup` as needed).
- Pin **one** Zod version across `apps/web` and `packages/shared` to avoid dual-instance
  type incompatibility.
- Turborepo `type-check` already fans out per package — a shared-contract break fails CI
  for *both* apps, which is exactly the guardrail we want.

---

## 4. Asset Mapping — Kid-Friendly Media (audio, graphics)

Games and the kid dashboard rely on audio cues and playful graphics. Assets fall into two
classes with different sharing/caching strategies. (Cross-reference existing
`docs/games-asset.md` and `docs/assets-manage.md` for the current web inventory.)

### 4.1 Asset classes & ownership

| Class | Examples | Source of truth | Delivery |
|---|---|---|---|
| **App-shell / branding** | icons, splash, tab glyphs | `apps/mobile/assets/images/*` (already present) | Bundled in the binary |
| **Shared kid media (static)** | subject icons, badge art, small SFX | Promote to `packages/assets` (NEW) or serve from web `/public` | Bundled (small) **or** remote+cached (large) |
| **Game media (heavy)** | sprite sheets, music, voiceover | Web `/public` (games own them) | Remote, cached on device |

### 4.2 Sharing strategy

- **Static, small, cross-platform icon/badge art** → create a `packages/assets` workspace
  package that exports typed asset references. Web imports via its bundler; mobile imports
  via Metro (`require(...)`). One source, no copy-paste. Ideal for the ~10–20 subject/badge
  icons referenced by `iconKey` in the shared types.
- **Heavy game media** → **do not bundle** into the mobile binary (bloats download,
  slows OTA). Keep them under web `/public` (or a CDN/Vercel Blob) and reference by URL.
  This pairs naturally with **Path B** (WebView games load their own assets directly) and
  keeps app-store binary size small.

### 4.3 Caching on device

| Asset | Mechanism |
|---|---|
| Remote images (icons/badges) | `expo-image` (already a dependency) — built-in memory + disk cache; set `cachePolicy="memory-disk"` |
| Remote audio (SFX/music) | Download-once to `expo-file-system` document/cache dir keyed by asset hash; play from local URI; evict via cache-dir on OS pressure |
| WebView game assets (Path B) | Rely on the WebView's HTTP cache + web `Cache-Control`/service worker; optionally pre-warm by loading the embedded route hidden on first launch |
| Bundled shell assets | No caching needed — shipped in binary |

### 4.4 Governance

- `iconKey`/asset identifiers are part of the **shared contract** (they already appear on
  `ClassPeriod.iconKey`, `DailyHomework.iconKey`) — the mapping from `iconKey → asset`
  should live in `@kid-hub/shared` (or `packages/assets`) so web and mobile resolve the
  same key to the same art. This closes the last drift gap: a new subject icon added on
  web is instantly resolvable on mobile.

---

## 5. Rollout, Risks & Open Questions

### 5.1 Suggested sequencing

1. **Native rebuild gate:** Initiative 1's `app.json`/`expo-screen-orientation` config
   requires a fresh dev-client + EAS build (`apps/mobile/eas.json`). Schedule that build
   before orientation work lands, since it can't hot-reload.
2. **SSOT phases S1→S3** (types, schemas, pure logic) — high value, low risk, unblocks
   everything and can proceed in parallel with orientation.
3. **Games via Path B (S5) + Orientation Engine** — land together so the first game screen
   ships already landscape-locked and drift-free.
4. **`@kid-hub/api-client` (S4)** and **`packages/assets`** — follow-on hardening.

### 5.2 Risks

| Risk | Mitigation |
|---|---|
| Purity leak: a `server-only`/Prisma import sneaks into `@kid-hub/shared` and breaks the Metro build | CI lint rule + the existing header contract in `packages/shared/src/index.ts`; keep domain fns pure by construction |
| iOS orientation lock ignored (missing `UISupportedInterfaceOrientations`) | Handled by `expo-screen-orientation` config plugin; verify on a real device build |
| WebView token exposure | Pass only short-lived **access** token over the bridge, never the refresh token; enforce `originWhitelist`; the refresh flow stays native (`apps/mobile/src/api/client.ts`) |
| Zod dual-instance mismatch | Single pinned Zod version across workspace |
| Binary bloat from game media | Remote + cache, never bundle heavy media |

### 5.3 Open questions for PM

1. For games on mobile v1: confirm **WebView embed (Path B)** is acceptable vs. a native
   rewrite. This decision gates the `(embedded)` web routes work.
2. Tablet support scope — is iPad/Android tablet a first-class target (affects OR-7 and
   `LANDSCAPE` vs `LANDSCAPE_LEFT`)?
3. Asset hosting — keep heavy game media on web `/public`, or move to a CDN / Vercel Blob?
4. Should completing the type migration (S1) also make **web** re-export from
   `@kid-hub/shared` (making shared the true owner), or keep web as the owner and shared as
   a subset? (Recommendation: shared becomes the owner, per the Phase 5 comment.)

---

## 6. Appendix — Directory Structure After Full Adoption (target)

```
kid-hub/
├─ apps/
│  ├─ web/                         # Next.js 16 — imports contract from @kid-hub/shared
│  │  ├─ app/(games)/…             # existing web games
│  │  ├─ app/(embedded)/…          # NEW: chrome-less game variants for WebView (Path B)
│  │  └─ server/{repositories,services,actions}/  # server-only; imports shared domain/schemas
│  └─ mobile/                      # Expo — imports contract from @kid-hub/shared
│     └─ src/
│        ├─ app/(tabs)/…           # portrait screens
│        ├─ app/(games)/{math,english}.tsx   # NEW: <OrientationLock> + <WebBridge>
│        ├─ components/orientation-lock.tsx  # NEW
│        ├─ components/web-bridge.tsx         # NEW (Path B)
│        ├─ hooks/use-orientation-lock.ts     # NEW
│        └─ api/                   # axios client; types.ts DELETED (moved to shared)
├─ packages/
│  ├─ shared/                      # @kid-hub/shared — types + schemas + PURE domain logic
│  ├─ api-client/                  # @kid-hub/api-client — typed fetchers (NEW, S4)
│  └─ assets/                      # @kid-hub/assets — shared kid media + iconKey map (NEW)
├─ turbo.json · pnpm-workspace.yaml
```

---

# PART II — Finalized Implementation Plan (PM-approved 2026-07-11)

> This part records the PM's answers to §5.3 and turns the blueprint into an
> actionable, phased plan. **Where it conflicts with Part I, this part wins.**
> Still blueprint-only: no code is written until this plan is approved.

## 7. Locked Decisions

| # | Question | Decision | Consequence |
|---|---|---|---|
| 1 | Games: WebView embed (Path B) vs native rewrite | **Native rewrite for ALL screens** | **Path B is dropped entirely.** Games become native RN screens. Game *logic* must therefore also flow through `@kid-hub/shared`. No `react-native-webview`, no `(embedded)` web routes, no `web-bridge`. |
| 2 | Tablet orientation | **`LANDSCAPE`** (both variants) | Orientation engine uses `OrientationLock.LANDSCAPE` for **all** game screens on **all** devices. The phone-vs-tablet branch in §2.4 is removed; no `expo-device` dependency needed. |
| 3 | Heavy game media hosting | **Keep in web `/public` first**, move to CDN later | Mobile references media by absolute URL against the web origin; caching via `expo-image`/`expo-file-system`. A later "CDN swap" is a config-only change (base URL). |
| 4 | Type migration ownership | **`@kid-hub/shared` becomes the owner** | `apps/web` **re-exports** contract types/schemas from shared. Mobile's local mirror is deleted. One owner, both apps consume. |

**Net effect on Part I:** §3.3 (Path A) is now the *sole* strategy. §3.4 (Path C) stays
rejected. §3.6/§3.7 Path B items and §5's WebView work are **cancelled** and replaced by
native-game phases below.

---

## 8. Game-Logic Audit — what is shareable vs. what stays

Verified against `apps/web`. This determines what the native rewrite imports vs. re-implements.

| Web artifact | Nature | Disposition |
|---|---|---|
| `lib/data/mathLevels.ts`, `lib/data/englishLevels.ts` | **Pure** seeded (mulberry32) question generators | **→ `@kid-hub/shared/game`** — imported unchanged by web + mobile |
| `calculateStars`, `calculatePointsEarned` (in `hooks/useGameSession.ts`) | **Pure** scoring fns (already reused by services!) | **→ `@kid-hub/shared/domain/scoring.ts`**; `useGameSession` + `math.service`/`english.service` re-import from shared |
| `useGameSession.ts` state machine (timer, correct/wrong, progression) | Framework logic (React `useReducer`/state) — **no** DOM/server deps | Extract the **pure reducer + types** to `@kid-hub/shared/game/session.ts`; both web hook and a new mobile hook wrap it |
| `lib/constants.ts` → `GAME_QUESTIONS_PER_SESSION`, `STORAGE_KEYS`, difficulty enums | Pure constants/enums | **→ `@kid-hub/shared`** (the game-relevant subset) |
| `lib/data/mathLevels`/`englishLevels` question **types** (`MathQuestion`, `DifficultyLevel`, `MathGameType`, `EnglishGameType`, `GameBestScore`) | Pure types | **→ `@kid-hub/shared/types`** |
| `server/services/math.service.ts`, `english.service.ts` | `server-only` (Prisma persistence, best-score compare, points award, homework linkage) | **STAYS on web.** Exposed to mobile via new REST endpoints (§10 Phase 4) |
| `server/actions/math.actions.ts`, `english.actions.ts` | Server actions (`requireParentSession` + Zod) | **STAYS on web** |
| `components/games/*` (MathGame, EnglishGame, GameHud, GameResultScreen, ShapeGame, WordSafariGame, …) | Web presentation (DOM + Tailwind) | **Re-implemented natively** in `apps/mobile` (RN + NativeWind + Reanimated). Not shared (Path C rejected). |
| `hooks/useMathSession.ts`, `useEnglishSession.ts` | Client hooks: localStorage, `useAudio`, server-action calls | **Re-implemented on mobile** as thin hooks over the shared session core + REST + SecureStore/`expo-audio` |
| `lib/data/gameImages.ts`, audio assets | Media manifest | Manifest → `@kid-hub/shared` (or `@kid-hub/assets`); binaries stay in web `/public` (decision #3) |

**Principle:** *logic and question generation are shared and identical on both platforms;
only the view layer is re-authored natively.* A change to a math generator or the scoring
rule on web changes one shared module and both platforms move together.

---

## 9. Target Package Layout (finalized)

```
packages/
  shared/                         # @kid-hub/shared — the OWNER of the contract
    src/
      types/
        schedule.ts               # ClassPeriod, TodayView, DailyHomework, EventType…
        grades.ts                 # SubjectGrade, ReportCard, BadgeTier
        game.ts                   # MathQuestion, DifficultyLevel, MathGameType,
                                  #   EnglishGameType, GameBestScore, GameSessionState
        result.ts                 # ActionResult / AuthActionResult (already here)
      schemas/                    # Zod, isomorphic
        schedule.schema.ts        # CreatePeriodSchema, AddDailyHomeworkSchema…
        game.schema.ts            # SaveMathProgress / SaveEnglishProgress input
        auth.schema.ts
      domain/                     # pure business rules
        schedule.ts               # validatePeriodOverlap, deriveTimeBand, buildTodayView
        grading.ts                # calculateBadge
        scoring.ts                # calculateStars, calculatePointsEarned
        time.ts                   # parseTimeToMinutes
      game/                       # pure game core
        math-levels.ts            # generators (from web lib/data/mathLevels.ts)
        english-levels.ts
        session.ts                # pure session reducer + initial state + types
        rng.ts                    # mulberry32 seed helper
      constants.ts                # GAME_QUESTIONS_PER_SESSION, difficulty enums…
      index.ts
  api-client/                     # @kid-hub/api-client (NEW) — typed fetchers over /api/v1
    src/
      http.ts                     # transport-injected (web: fetch, mobile: axios)
      endpoints/{schedule,homework,grades,progress,math,english,auth}.ts
      index.ts
  assets/                         # @kid-hub/assets (NEW) — iconKey→art map + media manifest
    src/index.ts
```

`apps/web` keeps `server/{repositories,services,actions}` (server-only) but its
`types/index.ts`, inline Zod, and the pure fns above **re-export from `@kid-hub/shared`**.
`apps/mobile` deletes `src/api/types.ts` and imports everything from shared.

---

## 10. Phased Implementation Plan

Each phase lists **goal · files · tasks · acceptance · risk**. Phases 1–3 are pure and
low-risk and can land before native UI work. Phase 5 (orientation) and Phase 6 (native
games) are the user-visible payoff. **Do not start any phase before PM approval of this
document.**

### Phase 0 — Prerequisites — ✅ **DONE (2026-07-12)**

> Implemented: added a `catalog:` block to `pnpm-workspace.yaml` pinning `zod: ^4.3.6`
> and switched `apps/web` to `"zod": "catalog:"`; added `"@kid-hub/shared": "workspace:*"`
> to `apps/web/package.json` (was absent — required for the Phase 1 re-export); `pnpm install`
> clean. Metro was already monorepo-aware — no change. Native deps (`expo-screen-orientation`
> etc.) intentionally deferred to their own phases (§11), so no EAS/dev-client rebuild is
> needed yet. Workspace `pnpm type-check` green (3/3 packages).

- **Goal:** unblock native + shared-package builds.
- **Tasks:**
  - Pin a single `zod` version across `apps/web` + `packages/shared` (root catalog).
  - Confirm `apps/mobile/metro.config.js` resolves workspace packages (monorepo
    `watchFolders` + `nodeModulesPaths`); adjust if a shared import fails to resolve.
  - Add mobile deps (§12) and schedule a **fresh EAS/dev-client build** (native config
    changes in Phase 5 can't hot-reload).
- **Acceptance:** `pnpm -C apps/mobile start --dev-client` runs; `pnpm type-check` green
  across the workspace; mobile can `import { DayOfWeek } from '@kid-hub/shared'` (already true).
- **Risk:** Low. Metro monorepo resolution is the only likely snag.

### Phase 1 — Contract types into shared (ownership flip) — *decision #4* — ✅ **DONE (2026-07-12)**

> Implemented: split the flat `packages/shared/src/types.ts` into
> `types/{schedule,grades,game,result}.ts` + a barrel `types/index.ts`; `apps/web/types/index.ts`
> now `export * from '@kid-hub/shared'` and keeps only web-only shapes local (`UserProfile`,
> `Badge`, `UserProgress`, `Parent*/KidSession`, and the React-coupled `UseGameSessionHookResult`);
> repointed all 5 mobile type imports to `@kid-hub/shared` and **deleted** `apps/mobile/src/api/types.ts`.
> `GameSessionState`/`UseGameSessionHookResult` stay in web (React-coupled — the reducer moves in
> Phase 3). Workspace `pnpm type-check` green.

- **Goal:** `@kid-hub/shared` owns all contract types; both apps consume.
- **Files:** create `packages/shared/src/types/{schedule,grades,game}.ts`; update
  `packages/shared/src/index.ts`; edit `apps/web/types/index.ts` to **re-export** from
  shared; **delete** `apps/mobile/src/api/types.ts` and repoint mobile imports
  (`src/api/*.ts`, `src/hooks/*.ts`) to `@kid-hub/shared`.
- **Tasks:** move types, resolve import cycles, run type-check on both apps.
- **Acceptance:** `apps/mobile/src/api/types.ts` no longer exists; workspace `type-check`
  green; a deliberate type change in shared breaks *both* apps' type-check (drift = compile error).
- **Risk:** Low — types only.

### Phase 2 — Zod schemas + pure domain into shared — ✅ **DONE (2026-07-12)**

> Implemented. **Shared now owns:** `constants.ts` (`GRADE_SCALE`, `PIN_LENGTH`,
> `KID_PATTERN_LENGTH`); `domain/{time,grading,schedule}.ts` (`parseTimeToMinutes`,
> `calculateBadge`, `validatePeriodOverlap`, `deriveTimeBand`, `filterCancelledSlots`,
> `buildTodayView`); `schemas/{schedule,game,auth}.schema.ts` (`CreatePeriodSchema`,
> `CreateExtraClassSchema`, `UpdatePeriodSchema`, `AddDailyHomeworkSchema`,
> `SaveMathProgressSchema`, `SaveEnglishProgressSchema`, `Parent*`/`KidPatternSchema`).
> `zod` added to `packages/shared` (via the Phase 0 catalog). **Web repointed:**
> `lib/constants.ts`, `lib/utils.ts`, `lib/schedule-display.ts`, `grades.service.ts`,
> `schedule.service.ts` re-export/import from shared; the 4 actions (schedule, auth,
> math, english) import their schemas from shared (unused `z` imports removed).
> **Purity guard:** `packages/shared/scripts/check-purity.mjs` wired as the package
> `lint` script — fails on any `server-only`/Prisma/Next/React/Node import; runs under
> `turbo run lint`. Workspace `pnpm type-check` green; shared purity + web eslint (0 errors).
> **Scope note:** `calculateStars`/`calculatePointsEarned` (inside the React hook
> `useGameSession.ts`) are deferred to Phase 3, where the reducer is extracted — avoids
> editing that file twice.

- **Goal:** validation + pure business rules shared; web actions/services import them.
- **Files:** create `packages/shared/src/schemas/*` and `src/domain/*`; edit
  `apps/web/server/actions/schedule.actions.ts` (and auth/math/english actions) to import
  `CreatePeriodSchema` etc. from shared; edit `apps/web/server/services/schedule.service.ts`,
  `grading` usage, `math.service.ts`/`english.service.ts` to import `calculateStars`,
  `calculatePointsEarned`, `validatePeriodOverlap`, `deriveTimeBand`, `buildTodayView`,
  `calculateBadge`, `parseTimeToMinutes` from shared.
- **Tasks:** verify **purity** — no `server-only`/Prisma/React/Node leaks into shared;
  keep persistence in the service.
- **Acceptance:** web behaviour unchanged (existing web tests pass); shared package still
  imports cleanly into Metro (no `server-only`); one lint guard added to forbid
  `server-only`/`@prisma` imports under `packages/shared`.
- **Risk:** Medium — purity discipline; caught by mobile bundling + lint guard.

### Phase 3 — Shared game core (generators + scoring + session reducer) — ✅ **DONE (2026-07-12)**

> Implemented. **Shared `game/`:** a single `rng.ts` (mulberry32 — was triplicated
> across math/counting/shape), `math-levels.ts`, `counting-levels.ts`, `shape-levels.ts`,
> `english-levels.ts` (5 generators), and `session.ts` (pure `gameReducer` +
> `initialGameSessionState` + `GameSessionState`/`GameAction`, no React). **Shared
> `domain/scoring.ts`:** `calculateStars`/`calculatePointsEarned`. Game constants
> (`GAME_QUESTIONS_PER_SESSION`, `GAME_SECONDS_PER_QUESTION`) moved to shared `constants.ts`.
> **Web repointed:** the 4 `lib/data/*Levels.ts` files and `lib/constants.ts` re-export
> from shared (7 game components unchanged); `hooks/useGameSession.ts` is now a thin
> `useReducer` wrapper over the shared reducer + timer, re-exporting the session type and
> scoring; `useMathSession`/`useEnglishSession` and `math.service`/`english.service` import
> scoring from shared. **Bonus fix:** the two `server-only` services previously imported
> `calculateStars`/`calculatePointsEarned` from the `'use client'` hook — now from shared.
> **Tests:** Vitest added to `packages/shared` (golden-seed snapshots + determinism for all
> generators, reducer transitions, scoring) — 21 tests pass. Workspace `pnpm type-check`
> green; shared purity + web eslint (0 errors).

- **Goal:** identical question generation + scoring + session state machine on both platforms.
- **Files:** create `packages/shared/src/game/{math-levels,english-levels,session,rng}.ts`
  and `src/domain/scoring.ts`; move logic out of `apps/web/lib/data/mathLevels.ts`,
  `englishLevels.ts`, and the pure parts of `apps/web/hooks/useGameSession.ts`; repoint
  web `hooks/useGameSession.ts`, `useMathSession.ts`, `useEnglishSession.ts`, and the
  services to the shared core.
- **Tasks:** extract the `useGameSession` reducer to a pure `session.ts` (no React); the
  web hook becomes a thin `useReducer` wrapper over it.
- **Acceptance:** web games play identically (same seeds → same questions, same stars);
  the shared generators are unit-tested; mobile can import a generator and produce a question.
- **Risk:** Medium — the session-reducer extraction is the trickiest refactor; guard with
  golden-seed unit tests (same seed must yield the same question sequence pre/post).

### Phase 4 — Shared API client + new game-progress REST endpoints — ✅ **DONE (2026-07-12)**

> Implemented. **New `@kid-hub/api-client` package:** an `HttpTransport` interface +
> `createFetchTransport` (isomorphic), thin endpoint modules (schedule, homework, grades,
> math, english), and `createApiClient(transport)`. Contract types come from `@kid-hub/shared`
> (added `GameSaveResult`). **New web routes** `app/api/v1/math/route.ts` and `english/route.ts`:
> `POST` validates with the shared `Save{Math,English}ProgressSchema` and delegates to the
> existing `save{Math,English}Session` services; `GET` returns `GameBestScore[]` filtered from
> `getUserProgress().bestScores`. Kid-facing (`DEFAULT_USER_ID`, no Bearer — matching the other
> v1 reads) but IP rate-limited by a new `getGameSaveRateLimiter` (30/60 s, parity with the
> login route). **Mobile** injects its existing axios client as the transport
> (`src/api/http.ts` → `apiClient`); `schedule/grades/homework.api.ts` now delegate to the
> client, and new `math.api.ts`/`english.api.ts` expose the game fetchers (consumed in Phase 6).
> **Scope:** `auth` (SecureStore-coupled) and `progress` (bespoke non-shared shape) stay
> app-specific for now; web keeps using server actions/services (the fetch transport is
> available but unwired). Workspace `pnpm type-check` green (4 packages); shared purity + 21
> tests; web eslint 0 errors.

- **Goal:** mobile persists game results and reads progress through typed fetchers; add the
  REST endpoints mobile needs (web currently exposes schedule/homework/grades/progress but
  **not** math/english session-save).
- **Files:** create `packages/api-client/*`; add web routes
  `apps/web/app/api/v1/math/route.ts` and `apps/web/app/api/v1/english/route.ts`
  (POST save-session, GET best-scores) delegating to the existing services with
  `SaveMathProgress`/`SaveEnglishProgress` Zod from shared; refactor
  `apps/mobile/src/api/*` to sit behind `@kid-hub/api-client` (axios injected), web to
  inject `fetch`.
- **Tasks:** rate-limit parity with existing v1 auth route; reuse the Bearer/refresh axios
  client already in `apps/mobile/src/api/client.ts`.
- **Acceptance:** a mobile game session POST persists via the same `math.service` path web
  uses; best-scores GET returns typed `GameBestScore[]`; contract types come from shared.
- **Risk:** Medium — new server surface; covered by service reuse (no new business logic).

### Phase 5 — Orientation Engine (finalized to `LANDSCAPE`) — ✅ **DONE (2026-07-12)** *(needs on-device build verification)*

> Implemented (verified against the Expo **v56** `expo-screen-orientation` docs per
> `apps/mobile/AGENTS.md`). Installed `expo-screen-orientation@~56.0.5` via `expo install`
> (SDK-56 compatible). **`src/hooks/use-orientation-lock.ts`:** `useFocusEffect` locks on
> focus and restores `PORTRAIT_UP` on blur (pairing survives gesture-back/tab-switch/deep-exit);
> landscape uses `OrientationLock.LANDSCAPE` (both variants, all devices — no `expo-device`),
> and re-asserts the lock on `AppState` `active`. **`src/components/orientation-lock.tsx`:**
> the `<OrientationLock mode>` gate holds a `#208AEF` curtain over already-laid-out content
> until `addOrientationChangeListener` reports landscape — no wrong-orientation frame.
> **`app.json`:** added the `expo-screen-orientation` plugin (`initialOrientation: "PORTRAIT"`)
> and `ios.requireFullScreen: true`, keeping `"orientation": "portrait"` as the baseline.
> **`src/app/_layout.tsx`:** a root `OrientationGuardrail` (Path C safety net) forces portrait
> whenever the focused path isn't a game route (`/math`, `/english`). Mobile `type-check` green;
> app.json valid. **Note:** the native config change needs a fresh dev/EAS build, and the
> flicker-free rotation + background/foreground behavior must be verified on a real device —
> the game screens that mount `<OrientationLock mode="landscape">` arrive in Phase 6.

- **Goal:** portrait baseline; all native game screens lock `LANDSCAPE`; clean transitions.
- **Files:** create `apps/mobile/src/hooks/use-orientation-lock.ts`,
  `apps/mobile/src/components/orientation-lock.tsx`; edit `apps/mobile/app.json`
  (add `expo-screen-orientation` plugin, keep `"orientation": "portrait"`,
  `ios.requireFullScreen: true`); add root portrait guardrail in
  `apps/mobile/src/app/_layout.tsx`.
- **Change vs §2.4:** the tablet/phone branch and `expo-device` are **removed** — always
  `OrientationLock.LANDSCAPE` for games (decision #2). Finalized hook:

```tsx
const toLock = async (mode: 'portrait' | 'landscape') =>
  ScreenOrientation.lockAsync(
    mode === 'portrait'
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE, // both landscape variants, all devices
  )
```

- **Tasks:** curtain-over-content anti-flicker (Part I §2.5); re-assert lock on `AppState`
  `active` while a game is focused; portrait restore on `blur`.
- **Acceptance:** enter `/math` → rotates to landscape with no white flash; back/gesture/
  background→foreground all restore or hold correctly; standard screens stay portrait.
  Requires the fresh native build from Phase 0.
- **Risk:** Medium — iOS orientation declaration (config plugin) + real-device verification.

### Phase 6 — Native game screens — ✅ **DONE (2026-07-21)** *(needs on-device build verification)*

> Implemented full **6-minigame parity** (PM decision, 2026-07-21): math
> `counting`/`addition`/`shapes` + english `alphabet`/`vocabulary`/`phonics`, each with
> 3 levels, all consuming the shared generators + reducer + scoring (identical
> questions/stars to web for the same seed). **Shared native chrome** (`src/components/games/`):
> `game-hud`, `game-result`, `star-rating`, `shape-glyph`, and reusable `game-scaffold`
> (`LevelSelect`/`GameStage`/`OptionButton`) + `game-hub`. **Six views**: `addition-game`,
> `counting-game`, `shape-game`, `alphabet-game`, `word-safari-game`, `sound-hunt-game`.
> **Hooks**: `use-game-session` (RN reducer + `setInterval` timer + transition lock,
> mirroring web `useGameSession`), `use-minigame-session` (best-scores + completion save via
> `@kid-hub/api-client`), thin `use-math-session`/`use-english-session`, `use-answer-flow`
> (tap→feedback→advance), and `use-game-audio` (`expo-audio`, installed `~56.0.12`; 4 SFX
> copied to `assets/sounds/`). **Routes**: `src/app/(games)/{math,english}.tsx`, each wrapped
> in `<OrientationLock mode="landscape">` (Phase 5 engine) — hub → active game → back. Games
> entry added to the dashboard. **SSOT:** per-game timing constants
> (`COUNTING/SHAPE/ENGLISH_*_SECONDS_PER_QUESTION`, `INPUT_THROTTLE_MS`) lifted to
> `@kid-hub/shared` and re-exported by web. Workspace `pnpm type-check` green (4 pkgs); shared
> purity + 21 tests pass.
>
> **Deliberate divergences from the web (all noted for Phase 8 polish):**
> - **Best-scores come from the server** (`/api/v1/{math,english}` GET via Phase 4), not
>   SecureStore — mobile has no localStorage, the POST returns `isNewBest`, and the GET is the
>   canonical store. Cleaner than the plan's SecureStore note; nothing sensitive is cached.
> - **Shapes render as emoji glyphs**, not SVG (no `react-native-svg` dependency added). Visual
>   fidelity is a Phase 8 concern.
> - **No homework auto-detect on mobile** yet — the `homeworkPeriodId` plumbing exists through
>   the hooks/result screen, but the hub doesn't fetch today's homework, so the "submit
>   homework" button stays hidden. Can be wired later without touching the game core.
> - Screens are **immersive full-bleed** (no safe-area insets) — notch handling is Phase 8.
>
> **Not verified on device:** requires the same fresh dev/EAS build Phase 5 needs. Type-check +
> shared tests are the static gates; the landscape transitions, audio playback, and end-to-end
> persistence must be confirmed on hardware.

- **Goal:** playable native Math + English games reusing the shared core.
- **Files:** create `apps/mobile/src/app/(games)/{math,english}.tsx` (each wrapped in
  `<OrientationLock mode="landscape">`), native components under
  `apps/mobile/src/components/games/*` (GameHud, ResultScreen, question views —
  RN + NativeWind + Reanimated), and mobile hooks
  `apps/mobile/src/hooks/use-math-session.ts`, `use-english-session.ts` (thin wrappers over
  shared `session.ts` + `@kid-hub/api-client` + SecureStore for best-scores + `expo-audio`).
- **Tasks:** map the web game UX to native gestures/animations; wire game entry from a
  mobile games hub screen; audio via `expo-audio`.
- **Acceptance:** both games play end-to-end on device in landscape; scoring/stars match
  web for identical seeds; sessions persist via Phase 4 endpoints; best-scores survive relaunch.
- **Risk:** Medium-High — most net-new UI work; de-risked because all logic is shared/tested.

### Phase 7 — Assets package + caching (decision #3) — ✅ **DONE (2026-07-21)**

> Implemented. **New `@kid-hub/assets` package** (pure/isomorphic, zero imports — Metro-safe):
> `icons.ts` (`ICON_MAP`/`DEFAULT_ICON`/`getIcon` — the `iconKey→{emoji,label}` contract),
> `game-media.ts` (the `WORD_IMAGE`/`COUNTING_IMAGE`/`EMOJI_IMAGE` flashcard manifest +
> `emojiImagePath`/`countingImagePath` resolvers), and `media-url.ts` (`assetUrl(base, path)`).
> **Web re-exports** from it: `apps/web/lib/icons.ts` and `apps/web/lib/data/gameImages.ts` are
> now thin re-exports (behavior identical, drift = compile error); `@kid-hub/assets` added to
> `apps/web` + `apps/mobile` deps. **Mobile caching:** `src/lib/web-origin.ts` derives `WEB_ORIGIN`
> from `EXPO_PUBLIC_API_URL` (strip `/api/v1`) with an `EXPO_PUBLIC_WEB_ORIGIN` override (the
> single CDN-swap point); `src/components/games/remote-flashcard.tsx` renders the manifest image
> via `expo-image` (`cachePolicy="memory-disk"`, the built-in memory+disk cache) with an emoji
> fallback. **Wired** into `counting-game` (counting art), `word-safari-game` (emoji prompts +
> word-to-image choices), and `sound-hunt-game` (emoji choices). **Icons on mobile:** the schedule
> screen now shows each period's subject icon from the shared `getIcon(iconKey)`. Heavy webp media
> (65 english + 8 counting) stays in web `/public`, fetched on demand and cached — **nothing bundled
> into the binary**. Workspace `pnpm type-check` green (5 pkgs).
>
> **Scope note — `expo-file-system` audio caching NOT added:** all current audio is the 4 bundled
> SFX (Phase 6); there is no *remote* voiceover/music to cache, so a hash-keyed download cache would
> be unused speculative infra. Deferred until remote audio assets exist; the acceptance's "media
> cached on device" is met for the real heavy media (images) via `expo-image`.

- **Goal:** shared `iconKey→art` resolution; heavy media served from web `/public` and cached.
- **Files:** create `packages/assets/src/index.ts` (icon/badge map + game media manifest
  keyed by `iconKey` and game asset id); mobile uses `expo-image` (`cachePolicy="memory-disk"`)
  for remote icons and `expo-file-system` (hash-keyed) for audio.
- **Tasks:** point mobile media URLs at the web origin base (single constant, so the future
  CDN move is a one-line base-URL swap); no binaries bundled into the app.
- **Acceptance:** subject/badge icons render on mobile from the shared map; game audio caches
  after first play; app binary size not inflated by game media.
- **Risk:** Low.

### Phase 8 — Visual parity: re-skin all mobile screens to match the web (mobile mode) — ✅ **DONE (2026-07-22)** *(needs on-device build verification)*

> Implemented with the **Full-SSOT** approach (PM decision, 2026-07-22): one token source
> drives both apps. **`packages/shared/src/tokens/`**: `tokens.json` (the SSOT — colors, radii,
> spacing, display font, values lifted verbatim from web's old `@theme`) + a typed `index.ts`
> (`tokens`, exported from the shared barrel). **`scripts/generate-tokens.mjs`** (`pnpm -C
> packages/shared tokens`) regenerates two committed artifacts from it:
> `apps/web/app/tokens.generated.css` (the web `@theme` block) and
> `packages/shared/tailwind-preset.cjs` (the mobile NativeWind `theme.extend`, exposed via the
> `@kid-hub/shared/tailwind-preset` export). **Web**: `globals.css` now `@import`s the generated
> CSS (inline `@theme` removed); `next build` passes and the tokens compile into the output CSS —
> so a token change shifts **both** apps. **Mobile**: `tailwind.config.js` consumes the preset
> (semantic classes `bg-shell-kid`, `text-text-primary`, `bg-math`, `rounded-card`, `min-h-tap`,
> etc. now resolve). **Re-skinned to tokens**: `login`, `index`, `(tabs)/_layout` (tab tint from
> `tokens.colors`), `dashboard`, `schedule`, `homework`, `grades`, `query-boundary`, and
> `star-rating` (star tokens) — the app-shell screens that have web portrait counterparts. A grep
> for raw numbered palette (`bg|text|border-{neutral,slate,blue,…}-N`) over these screens is
> **clean**. **Removed** the dead Expo-template cluster (themed-text/view, hint-row, external-link,
> web-badge, animated-icon, ui/collapsible, use-theme, use-color-scheme, constants/theme + orphan
> css) — unreferenced by any screen, consistent with the earlier demo-screen cleanup. Workspace
> `pnpm type-check` green (5 pkgs).
>
> **Deliberate boundaries (documented, not overclaimed):**
> - **Game components keep the immersive dark slate/emerald/red chrome** (`game-hud`,
>   `game-result`, `game-scaffold`, `game-hub`, the 6 views). This is *parity* — web's own games
>   (`GameHud`, `GameResultScreen`) render that dark UI with raw Tailwind palette too. Inventing
>   mobile-only "game" tokens would diverge from web and break the "shared owns web's token set"
>   symmetry, so the raw dark chrome stays until web's games are tokenized as well (a joint step).
>   Semantic tokens that *do* apply in-game are used (`star-filled`/`star-empty`, `bg-math`/`bg-english`).
> - **Dark mode:** web's `@theme` is single-light (no dark token set), so the mobile re-skin renders
>   the same light theme for parity; per-token dark values are deferred until web defines them.
> - **Display font (Spline Sans):** the `font-display` token + fallback stack are wired into the
>   preset, but the actual Spline Sans `.ttf` is not bundled (asset not in-repo), so text falls back
>   to the system font until the font file is added under `assets/fonts/` + loaded via `expo-font`.



- **Goal:** every mobile screen looks and feels like the web app viewed at mobile width —
  same colors, typography, radii, spacing, and component shapes — driven by **one shared
  design-token source**, not hand-picked raw palette values.
- **Current gap (verified):**
  - Web owns a rich semantic token set in `apps/web/app/globals.css` `@theme {}`
    (`--color-math`, `--color-english`, `--color-schedule*`, `--color-shell-*`,
    `--color-text-*`, `--color-btn-*`, `--radius-card: 1.5rem`, `--radius-pill`,
    `--spacing-tap: 3rem`, star/progress colors, `--font-display` = Spline Sans, …).
  - Mobile's `apps/mobile/tailwind.config.js` has an empty `theme.extend: {}` with the
    standing TODO *"Phase 5 (§17): replace with the shared token preset from
    packages/shared."*
  - Mobile screens (e.g. `src/app/(tabs)/schedule.tsx`) use **raw Tailwind palette**
    (`bg-white`, `text-blue-600`, `bg-neutral-100`) — the exact anti-pattern CLAUDE.md
    forbids on web for semantic colors. This is the parity gap.
- **Files:**
  - **Create** `packages/shared/src/tokens/` — a framework-neutral token object
    (colors, radii, spacing, font families) as the SSOT, plus two thin adapters:
    - a **NativeWind/Tailwind preset** consumed by `apps/mobile/tailwind.config.js`
      (`presets: [require('nativewind/preset'), require('@kid-hub/shared/tailwind-preset')]`);
    - a generator (or documented mapping) so `apps/web/app/globals.css` `@theme {}` derives
      from the **same** token object — web stays the visual reference, shared becomes the owner
      (consistent with decision #4).
  - **Edit** `apps/mobile/tailwind.config.js` (wire the shared preset into `theme.extend`).
  - **Edit** `apps/mobile/src/global.css` (align `--font-*` with the shared token set) and
    load the display font (Spline Sans) via `expo-font` (already a mobile dependency) — bundle
    the font file under `apps/mobile/assets/fonts/`.
  - **Re-skin every screen** to semantic tokens: `src/app/login.tsx`, `src/app/index.tsx`,
    `src/app/(tabs)/_layout.tsx` (tab bar styling/icons), `dashboard.tsx`, `schedule.tsx`,
    `homework.tsx`, `grades.tsx`, and the new `(games)/{math,english}.tsx` from Phase 6.
  - **Align shared UI:** `src/components/{themed-text,themed-view,query-boundary,hint-row}.tsx`
    and `src/components/ui/collapsible.tsx` to token-based styles matching their web analogues
    (card radius, shell backgrounds, text hierarchy, tap targets ≥ `--spacing-tap`).
- **Tasks:**
  - Walk each web route at mobile viewport width (`(dashboard)/schedule`, dashboard, homework,
    grades, login/unlock) and capture the target look (spacing, card shape, subject colors,
    badge/star colors, empty states).
  - Replace raw palette classes on mobile with semantic token classes
    (`bg-shell-kid`, `text-text-primary`, `rounded-card`, `text-math`, `bg-schedule-soft`, …).
  - Reproduce web component shapes natively (period card, homework row, grade/badge card,
    game HUD/result) — presentational only; data/logic already come from Phases 1–6.
  - Preserve dark-mode parity (web `userInterfaceStyle: automatic` ↔ mobile
    `useColorScheme`); ensure every token has a dark value.
- **Acceptance:**
  - No raw Tailwind palette value remains for a **semantic** color in `apps/mobile/src/**`
    (a lint/grep guard passes); all semantic colors resolve through the shared preset.
  - Side-by-side, each mobile screen matches its web mobile-width counterpart on color,
    radius, typography, and spacing within agreed tolerance (design QA sign-off).
  - Changing a token in `packages/shared/src/tokens/` visibly shifts **both** web and mobile.
  - Light and dark modes both match web.
- **Risk:** Medium — largest UI surface, but purely presentational and de-risked by the
  single-token source; the main effort is faithful screen-by-screen reproduction.

> **Note vs. Path C (Part I §3.4):** this is *token* sharing, **not** component sharing.
> Mobile keeps native components; it just consumes the same design tokens as web. Path C
> (sharing the actual React components via Solito/react-native-web) remains rejected.

---

## 11. New Dependencies (mobile)

| Package | Phase | Purpose |
|---|---|---|
| `expo-screen-orientation` | 5 | Programmatic orientation lock (config-plugin) |
| `expo-audio` | 6 | Native game SFX/voiceover (replaces web `useAudio`) |
| `expo-font` | 8 | Load the shared display font (Spline Sans) for web parity — **already a mobile dependency** |
| `react-native-webview` | — | **NOT added** — Path B dropped |
| `expo-device` | — | **NOT added** — tablet branch removed (decision #2) |

Root/workspace: pin one `zod`; `@kid-hub/api-client`, `@kid-hub/assets` as new workspace
packages (Phases 4 & 7).

---

## 12. Definition of Done

1. `apps/mobile/src/api/types.ts` deleted; `@kid-hub/shared` is the sole owner of contract
   types, Zod schemas, pure domain logic, and the game core; `apps/web` re-exports from it.
2. A change to a shared type/schema/generator/scoring rule breaks **both** apps' type-check
   or changes both apps' runtime behaviour — drift is structurally impossible.
3. Math + English run **natively** on mobile, landscape-locked, with no WebView, producing
   identical questions/scores to web for the same seed, persisting via `/api/v1`.
4. Standard mobile screens remain portrait; game↔standard transitions have no flicker.
5. Heavy media served from web `/public`, cached on device; CDN migration is a base-URL swap.
6. Workspace `pnpm type-check`, `lint`, and web tests are green; a lint guard forbids
   `server-only`/Prisma imports inside `packages/shared`.
7. Every mobile screen visually matches its web mobile-width counterpart (light + dark),
   driven by the shared design tokens; no raw Tailwind palette remains for semantic colors
   in `apps/mobile/src/**`; changing a shared token shifts both apps.

---

## 13. Suggested Sequencing

```
Phase 0  ─┐
Phase 1  ─┤ (pure, parallelizable, low risk — land first)
Phase 2  ─┤
Phase 3  ─┘
Phase 4  ─── needs 1–3
Phase 5  ─── needs Phase 0 native build (parallel with 1–4)
Phase 6  ─── needs 3, 4, 5
Phase 7  ─── needs 1; can trail 6
Phase 8  ─── token source needs 1; re-skins every screen incl. games, so lands after 6
```

Critical path to a playable native game: **0 → 1 → 3 → 4 → 5 → 6**. Phases 1–3 are the
SSOT foundation and should merge before any native game UI to avoid re-authoring logic.
Phase 8 (visual parity) is the finishing pass — its shared token source can be built early
(after Phase 1), but the screen re-skins land after Phase 6 so game screens are styled once.

---

*End of plan. Awaiting PM review before any implementation.*
