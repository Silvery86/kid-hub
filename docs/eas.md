# EAS Development Builds — How It Works & How to Install (Kid Hub Mobile)

How the mobile app (`apps/mobile`, Expo SDK 56) runs on a real device during local
development, why it uses an **EAS development build** instead of Expo Go, and the exact
steps to build + install it.

---

## 1. Why not Expo Go?

**Expo Go** is a single pre-built app on the Play/App Store. It can only run projects
whose Expo **SDK** it was compiled with. Kid Hub Mobile targets **SDK 56** (React Native
0.85, Reanimated 4), which is ahead of the public Expo Go build — hence the
_"Project is incompatible with this version of Expo Go"_ error.

A **development build** is *your own* version of the app: the same native runtime Expo
Go provides, but compiled for **your** SDK and native dependencies, plus a launcher
(`expo-dev-client`) that connects to your local Metro server. It is also the exact
infrastructure a production release uses — so it is not throwaway effort.

| | Expo Go | Development build (what we use) |
|---|---|---|
| Who builds it | Expo (generic) | You, via EAS (specific to this app) |
| SDK support | Only what's bundled | Exactly SDK 56 |
| Custom native deps | ❌ | ✅ |
| Path to production | none | same pipeline (`preview` / `production` profiles) |

---

## 2. The mental model: native shell (cloud) + JS bundle (local)

A React Native app is two layers:

- **Native shell** — the compiled Android/iOS binary (Java/Kotlin/Swift + native
  modules like Reanimated, SecureStore). Changes rarely — only when native deps or
  native config change.
- **JS bundle** — all your TypeScript/React screens, hooks, styles. Changes constantly.

EAS builds the **native shell once, in the cloud**, and hands you an installable file
(an `.apk` for Android). At dev time, **Metro runs locally** and serves the **JS bundle**
to that installed shell over your LAN. So:

```
   ┌─────────────────────── your PC (WSL2) ───────────────────────┐
   │                                                              │
   │   Next.js API (apps/web)          Metro bundler (apps/mobile) │
   │   http://192.168.1.29:3001        exp://192.168.1.29:8082     │
   │        ▲                                   ▲                  │
   └────────┼───────────────────────────────────┼─────────────────┘
            │  REST /api/v1 (Bearer token)       │  JS bundle + HMR
            │                                     │
   ┌────────┼─────────────────────────────────────┼──────────┐
   │        │        your phone (same Wi-Fi)       │          │
   │   ┌────┴─────────────────────────────────────┴─────┐    │
   │   │   Kid Hub dev build (the installed .apk)         │    │
   │   │   = native shell + expo-dev-client launcher      │    │
   │   └──────────────────────────────────────────────────┘    │
   └───────────────────────────────────────────────────────────┘
```

Key consequence of this split:

- **JS/UI edits** → just save; Metro hot-reloads. **No rebuild.**
- **Native change** (add/remove a native module, change `app.json` plugins, bump SDK)
  → **rebuild** the shell in EAS and reinstall the `.apk`.

The cloud build (step 5 below) is therefore a **one-time** cost per native change, not
per code change.

---

## 3. One-time setup (already done in the repo)

These are committed, no action needed — listed so you know what's in place:

- `expo-dev-client` dependency (the in-app launcher that connects to Metro).
- `apps/mobile/eas.json` — build profiles:
  - `development` — dev client, internal distribution, Android `.apk`. **Use this for local testing.**
  - `preview` — standalone internal `.apk` (no Metro; JS embedded) for sharing a test build.
  - `production` — store build.
- `apps/mobile/.env.local` (gitignored) — `EXPO_PUBLIC_API_URL=http://192.168.1.29:3001/api/v1`.

---

## 4. Account + project link (run once)

> ⚠️ **Always run `eas` commands from `apps/mobile`**, never the repo root — only there does
> the `expo` module exist (for SDK detection) and the real `app.json` live. Running from the
> root creates a stray root `app.json` and a misnamed project.

```bash
cd ~/projects/kid-hub/apps/mobile

npx eas-cli login          # first time — free account at https://expo.dev/signup
npx eas-cli init           # links the app → writes extra.eas.projectId into apps/mobile/app.json
```

After `eas init`, `apps/mobile/app.json` should contain:

```jsonc
"extra": { "eas": { "projectId": "……" } }
```

Commit that `app.json` change so the link persists for the team.

---

## 5. Build the dev client (cloud) & install it (one-time per native change)

```bash
# from apps/mobile
npx eas-cli build --profile development --platform android
```

- Runs in Expo's cloud (~10–20 min) — **no local Android SDK needed**, which is why this
  works fine on WSL2.
- When it finishes you get a **QR code / URL**. Open it on the phone, download the `.apk`,
  and install it (Android will ask to allow *"install from unknown sources"* — allow it).
- The installed app is **"Kid Hub"** (a dev build) — a separate icon from Expo Go.

> iOS note: `--platform ios` needs an Apple account for device provisioning; Android `.apk`
> is the simplest for a personal test device.

---

## 6. Daily dev loop (after the client is installed)

You do **not** rebuild for normal work. Two terminals:

```bash
# Terminal 1 — the API
pnpm -C apps/web dev

# Terminal 2 — Metro, pointed at your LAN IP, in dev-client mode
REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.29 pnpm -C apps/mobile start --dev-client
```

Open the installed **Kid Hub** dev app on the phone → it auto-connects to Metro
(`192.168.1.29:8082`) and hits the API (`:3001`). Edit code → save → it hot-reloads.

Rebuild (step 5) **only** when you change native deps or `app.json` native config.

---

## 7. WSL2 networking (why the IP/ports matter)

The API and Metro run **inside WSL**, but the phone can only reach your **Windows LAN IP**.
This is bridged via WSL **mirrored networking** (`C:\Users\<you>\.wslconfig` →
`networkingMode=mirrored`) + Windows Firewall inbound rules.

- LAN IP: `192.168.1.29` (what `hostname -I` reports in WSL once mirrored mode is on).
- **API port is `3001`**, not 3000 — Next fell back because 3000 was in use. **Metro port
  is `8082`**, not 8081, for the same reason. Firewall rules and `.env.local` must match the
  *actual* ports.
- Sanity check from the **phone browser**:
  - `http://192.168.1.29:3001` → loads the Kid Hub site (API reachable)
  - `http://192.168.1.29:8082/status` → `packager-status:running` (Metro reachable)

Full networking walkthrough: `apps/mobile/README.md`.

---

## 8. Quick reference

| Task | Command (from `apps/mobile`) |
|---|---|
| Log in to EAS | `npx eas-cli login` |
| Link project | `npx eas-cli init` |
| Build dev client (Android) | `npx eas-cli build --profile development --platform android` |
| Start Metro (dev client) | `REACT_NATIVE_PACKAGER_HOSTNAME=192.168.1.29 pnpm -C apps/mobile start --dev-client` |
| List builds | `npx eas-cli build:list` |
| Rebuild after native change | re-run the build command, reinstall the `.apk` |

## 9. Common gotchas

- **"module `expo` is not installed"** → you ran `eas` from the repo root. `cd apps/mobile` first.
- **Phone stuck "loading"** → Metro port (`8082`) not allowed through Windows Firewall, or
  `REACT_NATIVE_PACKAGER_HOSTNAME` not set to the LAN IP.
- **`ERR_CONNECTION_RESET` to the API** → wrong port (`3001` vs `3000`) or the API isn't running.
- **Changed `.env.local`** → restart Metro with `--clear` (`EXPO_PUBLIC_*` is inlined at bundle time).
- **Login fails after 5 quick tries** → the login route is rate-limited (5 / 60 s); wait a minute.
