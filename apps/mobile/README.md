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
```

`EXPO_PUBLIC_*` vars are inlined at bundle time — after editing `.env.local`,
restart Metro with `--clear`.

---

## Development build (EAS)

One-time setup to get a dev client onto your device. After the client is installed,
day-to-day work is just `start` — no rebuild unless native deps change.

```bash
# 1. Log in to EAS (first time only)
npx eas-cli login

# 2. Link this app to an EAS project (writes extra.eas.projectId into app.json)
npx eas-cli init

# 3. Build an installable dev client (Android APK, ~10–20 min in the cloud)
npx eas-cli build --profile development --platform android
#   → download the APK from the link/QR and install it on the phone
#     (enable "install from unknown sources"). iOS: use --platform ios
#     (requires an Apple account for device provisioning).

# 4. Start Metro and open the dev client (NOT Expo Go)
pnpm -C apps/mobile start --dev-client
```

Build profiles live in [`eas.json`](./eas.json): `development` (dev client, internal
APK), `preview` (standalone internal APK), `production` (store build).

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
├── api/          # axios client + typed api modules (auth/homework/schedule/grades)
├── app/          # Expo Router: login, (tabs)/{dashboard,homework,schedule,grades}
├── components/   # shared RN UI (query-boundary, ...)
├── hooks/        # use-auth (AuthProvider) + TanStack Query hooks
└── lib/          # secure-store token wrapper
```
