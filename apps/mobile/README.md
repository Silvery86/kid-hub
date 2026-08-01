# Kid Hub — Mobile (`@kid-hub/mobile`)

Expo (SDK 56) app for Kid Hub. Expo Router · NativeWind · TanStack Query · Axios ·
expo-secure-store. It talks to the Next.js REST API in `apps/web` at `/api/v1`.

> **Why not Expo Go?** This app targets Expo **SDK 56** with bleeding-edge native
> deps (React Native 0.85, Reanimated 4), which the public Expo Go app does not
> support. We use a **development build** (a custom dev client) instead — the same
> infrastructure a production release needs. See "Development build (EAS)" below.

---

## Prerequisites

- Node + pnpm (run everything from the repo root or with `pnpm -C apps/mobile <script>`).
- A free [Expo account](https://expo.dev/signup) (for EAS builds).
- The Next.js API running: `pnpm -C apps/web dev`.

## Environment

`EXPO_PUBLIC_API_URL` points the app at the API. A physical device **cannot** reach
your laptop's `localhost`, so use your machine's LAN IP. Override per-machine in
`apps/mobile/.env.local` (gitignored); never put this in Vercel.

```bash
# apps/mobile/.env.local
EXPO_PUBLIC_API_URL=http://<YOUR_LAN_IP>:<API_PORT>/api/v1   # e.g. http://192.168.1.29:3001/api/v1

# Optional. Origin serving the game flashcard images from web /public.
# Defaults to EXPO_PUBLIC_API_URL with the /api/v1 suffix stripped, so you only
# set this to point at a CDN later.
# EXPO_PUBLIC_WEB_ORIGIN=http://<YOUR_LAN_IP>:<API_PORT>
```

`EXPO_PUBLIC_*` vars are inlined **at bundle time** — after editing `.env.local`,
restart Metro with `--clear`.

> **Which env a build actually sees.** For the `development` profile the JS bundle
> comes from *your local Metro* at runtime, so `.env.local` applies at `expo start`
> time and the cloud build does not need it. For `preview`/`production` the bundle is
> built **in the cloud**, where `.env.local` does not exist (gitignored) — EAS only
> sees the committed `.env`, which currently pins a LAN IP. Before shipping a
> standalone build, set the real API origin via `env` in `eas.json` or
> `eas env:create`, or it will bake in `192.168.1.29`.

---

## Development build (EAS)

Get a dev client onto your device. Once installed, day-to-day work is just `start` —
**rebuild only when native config or native deps change** (see below).

### When you must rebuild the dev client

Anything that changes the *native* project invalidates an installed dev client. JS-only
changes do not. Current triggers already in `app.json`:

| Change | Landed |
|---|---|
| `expo-screen-orientation` plugin + `ios.requireFullScreen` | Orientation engine |
| `expo-audio` plugin (game SFX) | Native games |
| any new `expo-*` module with native code | — |

> If your installed dev client predates these, orientation locking and game audio will
> fail at runtime — the native modules simply are not in the binary. Rebuild first.

### Pre-flight (this is what makes the build "clean")

```bash
# 1. Commit or stash everything — EAS uploads a GIT ARCHIVE, so uncommitted
#    files are NOT included and a package.json/lockfile mismatch fails install.
git status --short          # must be clean
pnpm install                # lockfile consistent with package.json

# 2. Sanity-gate locally before burning cloud build minutes
pnpm type-check             # all workspace packages
pnpm -C packages/shared test
```

### Build

> **Run EAS from `apps/mobile`, never the repo root.** EAS resolves the project from
> the current directory. At the root it finds the turbo workspace `package.json` — which
> has no `expo` — and fails with *"The `expo` package was not found"* / *"you don't have
> expo-dev-client installed"* (both are installed, just one level down). Worse, it writes
> a stray generic `eas.json` at the root; delete it if that happens, the real config is
> `apps/mobile/eas.json`.

```bash
cd apps/mobile          # ← required; everything below assumes this

# Log in (first time only)
npx eas-cli login

# Build an installable dev client (Android APK, ~10–20 min in the cloud)
npx eas-cli build --profile development --platform android
#   → download the APK from the link/QR and install it on the phone
#     (enable "install from unknown sources"). iOS: use --platform ios
#     (requires an Apple account for device provisioning).

# Start Metro and open the dev client (NOT Expo Go) — from anywhere
pnpm -C apps/mobile start --dev-client
```

> `eas init` is **not** needed — this app is already linked
> (`expo.extra.eas.projectId` in `app.json`). Re-running it can relink the project.

Build profiles live in [`eas.json`](./eas.json): `development` (dev client, internal
APK), `preview` (standalone internal APK), `production` (store build).
`appVersionSource: "remote"` means EAS owns the version counter.

**Monorepo notes.** `eas build` run from `apps/mobile` detects the pnpm workspace and
installs from the repo root using the pinned `packageManager` (`pnpm@10.33.0`). The
workspace packages (`@kid-hub/shared`, `@kid-hub/api-client`, `@kid-hub/assets`) are
in-repo, so they ship with the archive automatically — no `.easignore` needed.

### After installing: what to verify

The build is the only way to exercise these — none are checkable in CI:

- **Orientation** — open Math/English: rotates to landscape with no white flash;
  back/gesture-exit restores portrait; background → foreground inside a game stays
  landscape; other tabs stay portrait.
- **Games** — all six minigames play end-to-end; timer counts down; correct/wrong SFX
  play; the result screen persists (a second run shows the updated best stars).
- **Flashcards** — counting / Word Safari / Sound Hunt show real images (not emoji
  fallback), which means the device reached the web origin; they should render instantly
  on a second run (disk cache).
- **Auth** — token refresh: temporarily lower `PARENT_ACCESS_TTL_SECONDS` in
  `apps/web/lib/constants.ts` and confirm a 401 silently refreshes and replays.

## Day-to-day scripts

```bash
pnpm -C apps/mobile start        # Metro (open in the installed dev client)
pnpm -C apps/mobile start --dev-client --clear   # after changing env or native deps
pnpm -C apps/mobile type-check   # tsc --noEmit
pnpm -C apps/mobile lint         # expo lint
```

---

## Connecting a physical phone over WSL2

The dev servers (API on `apps/web`, Metro on `:8081`/`:8082`) run inside WSL, but a
phone can only reach your **Windows** LAN IP. Bridge them once:

1. **Mirrored networking** — create `C:\Users\<you>\.wslconfig`:
   ```ini
   [wsl2]
   networkingMode=mirrored
   ```
   Then in Windows PowerShell: `wsl --shutdown`, reopen WSL. `hostname -I` should now
   report your LAN IP (e.g. `192.168.1.x`), not `172.x`.
2. **Firewall** — allow the API + Metro ports inbound (admin PowerShell), matching the
   ports actually in use (Next falls back to `3001` if `3000` is taken; Metro to `8082`
   if `8081` is taken):
   ```powershell
   New-NetFirewallRule -DisplayName "WSL API"   -Direction Inbound -LocalPort 3001 -Protocol TCP -Action Allow
   New-NetFirewallRule -DisplayName "WSL Metro" -Direction Inbound -LocalPort 8082 -Protocol TCP -Action Allow
   ```
3. **Point Metro at the LAN IP** so the bundle URL is reachable from the phone:
   ```bash
   REACT_NATIVE_PACKAGER_HOSTNAME=<YOUR_LAN_IP> pnpm -C apps/mobile start --dev-client
   ```

Sanity check from the phone browser: `http://<LAN_IP>:<API_PORT>` loads the site and
`http://<LAN_IP>:<METRO_PORT>/status` returns `packager-status:running`.

---

## Layout

```
src/
├── api/          # axios transport behind @kid-hub/api-client + typed api modules
├── app/          # Expo Router
│   ├── (tabs)/   #   dashboard, homework, schedule, grades (portrait)
│   └── (games)/  #   math, english — landscape via <OrientationLock>
├── components/
│   ├── games/    #   hud, result, hub, scaffold, 6 minigame views, flashcard
│   ├── orientation-lock.tsx
│   └── query-boundary.tsx
├── hooks/        # use-auth, TanStack Query hooks, game session/audio/orientation
└── lib/          # secure-store tokens, web-origin (media base URL)
```

Contract types, Zod schemas, pure domain logic, the game core and the design tokens all
live in `@kid-hub/shared`; asset maps in `@kid-hub/assets`. Styling uses the shared
token preset — semantic classes (`bg-shell-kid`, `text-text-primary`, `bg-math`,
`rounded-card`), not raw Tailwind palette.
