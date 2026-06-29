# React Native (Expo) Integration Roadmap for Kid-hub (Lộ trình tích hợp React Native vào Kid-hub)

> **Important notes on current state (read first) — Ghi chú quan trọng về hiện trạng:**
> - The project **does not use Sequelize** (Dự án không dùng Sequelize). The data layer is **Prisma 7** (`@prisma/client` + `@prisma/adapter-pg` against PostgreSQL) — see `lib/db.ts`.
> - The repo **already has a shared service layer** (Dự án đã có sẵn tầng service dùng chung) at `server/services/`, plus a repository layer at `server/repositories/`. The `server/actions/` layer is already a thin orchestrator (chỉ Zod + cookie + gọi service). In other words, the goal "extract business logic into a Shared Service Layer" is **largely already done** (về cơ bản đã hoàn thành).
> - Therefore most of the work is *not* refactoring services, but: (1) making **authentication transport-agnostic** (xác thực độc lập với transport) — cookie for Web, Bearer token for Mobile, and (2) adding **Route Handlers** at `app/api/...` that reuse the existing services.
>
> Actual stack (Stack thực tế): Next.js `16.1.6` · React `19.2.3` · Prisma `7` · PostgreSQL · Tailwind v4 · `jose` (JWT) · `bcryptjs` · `zod` · `zustand` · Upstash Ratelimit · Sentry.

---

## 1. Current State Assessment & Folder Structure Proposal (Đánh giá hiện trạng & đề xuất cấu trúc thư mục)

### 1.1. Areas to optimize (Những điểm cần tối ưu)

| # | Current state (Hiện trạng) | Problem when adding Mobile (Vấn đề khi thêm Mobile) | Resolution (Hướng xử lý) |
|---|---|---|---|
| 1 | Auth is tightly coupled to **httpOnly cookies** (`server/lib/auth-guard.ts`, `auth.actions.ts`, `middleware.ts`) | React Native cannot use httpOnly cookies naturally; needs a Bearer token | Separate token verification (already in `auth.service.ts`) from cookie reading; add a guard that reads the `Authorization` header |
| 2 | Session issuance (`issueParentSessionCookies`) lives in `auth.actions.ts` and **sets cookies directly** | Mobile needs the token in the **JSON body** to store in SecureStore | The `createParentSession()` service (already exists) returns `{ accessToken, refreshToken }` — a Route Handler just returns JSON instead of setting cookies |
| 3 | Shared types (`ActionResult`, `HomeworkItem`, `DayOfWeek`...) live in the web app's `types/index.ts` | Mobile needs to reuse the API contract types | Extract into a shared package (`packages/shared`) when moving to a monorepo |
| 4 | No domain `app/api/` yet (only `app/api/health` and `sentry-example-api`) | Mobile has no REST endpoint to call | Add Route Handlers per domain that reuse services |
| 5 | `middleware.ts` only protects page routes (HTML redirect) | The Mobile API must return `401 JSON`, not redirect | Keep `/api/*` out of the redirect logic; use a dedicated API guard |

> **Conclusion (Kết luận):** the Repository/Service layers are already clean and correctly layered (see `CLAUDE.md`). No need to touch `server/repositories/*` or most of `server/services/*`. The focus is **transport-agnostic auth** + the **API layer**.

### 1.2. Proposed Next.js folder tree — after refactor (Cây thư mục Next.js sau refactor)

The structure stays almost identical; **bold** items are added/changed (phần in đậm là thêm/đổi):

```
kid-hub/  (apps/web when on a monorepo)
├── app/
│   ├── (dashboard)/            # kid view (unchanged / giữ nguyên)
│   ├── (games)/                # math + english (unchanged)
│   ├── (parent)/               # parent management (unchanged)
│   ├── api/
│   │   ├── health/route.ts             # existing / đã có
│   │   ├── sentry-example-api/route.ts # existing
│   │   └── v1/                          # ★ REST API for Mobile (versioned)
│   │       ├── auth/
│   │       │   ├── login/route.ts       # ★ POST → returns {accessToken, refreshToken} JSON
│   │       │   ├── refresh/route.ts     # ★ POST → rotate tokens
│   │       │   └── logout/route.ts      # ★ POST → revoke refresh token
│   │       ├── homework/
│   │       │   ├── today/route.ts       # ★ GET today's homework
│   │       │   └── [id]/done/route.ts   # ★ POST mark done
│   │       ├── schedule/route.ts        # ★
│   │       ├── grades/route.ts          # ★
│   │       └── progress/route.ts        # ★
│   └── layout.tsx
├── server/
│   ├── repositories/           # UNCHANGED (Prisma only / giữ nguyên)
│   ├── services/               # UNCHANGED — this IS the Shared Service Layer
│   ├── actions/                # UNCHANGED (used by Web Server Actions)
│   └── lib/
│       ├── auth-guard.ts       # requireParentSession() — cookie-based (Web)
│       └── api-auth.ts         # ★ requireParentApi(req) — Bearer-based (Mobile)
├── lib/                        # UNCHANGED (db.ts, constants.ts, utils...)
├── components/ hooks/          # UNCHANGED (Web FE)
├── types/index.ts             # (move API contract types to packages/shared on monorepo)
├── prisma/                     # UNCHANGED
└── middleware.ts               # ★ tweak: skip /api/*, let the API guard return 401
```

### 1.3. Mobile React Native (Expo) folder tree (Cây thư mục Mobile)

```
apps/mobile/
├── app/                          # Expo Router (file-based routing)
│   ├── _layout.tsx               # Root layout: QueryClientProvider + AuthProvider
│   ├── index.tsx                 # Redirect to (auth) or (tabs) by session
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   └── login.tsx             # Login screen (calls /api/v1/auth/login)
│   └── (tabs)/
│       ├── _layout.tsx           # Bottom tabs
│       ├── dashboard.tsx
│       ├── homework.tsx
│       ├── schedule.tsx
│       └── grades.tsx
├── components/                   # RN UI primitives (KidCard, KidButton... RN versions)
├── hooks/
│   ├── useAuth.ts                # login/logout, read token from SecureStore
│   ├── useHomework.ts            # TanStack Query: useQuery/useMutation
│   └── useSchedule.ts
├── api/
│   ├── client.ts                 # Axios instance + interceptors (attach Bearer token)
│   ├── auth.api.ts               # login/refresh/logout
│   ├── homework.api.ts
│   └── schedule.api.ts
├── lib/
│   └── secure-store.ts           # wrapper around expo-secure-store
├── global.css                    # NativeWind (shares the Tailwind standard with Web)
├── tailwind.config.js            # ★ imports the token preset from packages/shared on monorepo
├── metro.config.js               # NativeWind config + (monorepo) watchFolders
├── babel.config.js
└── app.json                      # Expo config
```

### 1.4. Storage model — Recommendation (Mô hình lưu trữ — đề xuất)

**Recommended: Monorepo with Turborepo + pnpm workspaces (Khuyến nghị monorepo).**

```
kid-hub/                  (root repo — migrate gradually)
├── apps/
│   ├── web/              # the entire current Next.js project
│   └── mobile/           # the new Expo app
├── packages/
│   └── shared/           # API contract types + zod schemas + design tokens
│       ├── src/
│       │   ├── types.ts          # extracted from types/index.ts (HomeworkItem, DayOfWeek, ApiResult...)
│       │   ├── schemas.ts        # shared zod schemas (login, pattern...)
│       │   └── tailwind-preset.js
│       └── package.json
├── package.json
├── turbo.json
└── pnpm-workspace.yaml
```

Reasons (Lý do):
- **Reuse types & zod schemas** (Tái dùng type & schema) between Web and Mobile → identical API contract, no field drift.
- **Share the Tailwind preset** (Dùng chung Tailwind preset) → Web (Tailwind v4) and Mobile (NativeWind) use one token palette.
- Turborepo caches build/lint/type-check independently per app.

> **Practical note (Lưu ý thực tế):** most of the heavy backend code (`server/`, Prisma, Route Handlers) **stays in `apps/web`** because it is bound to the Next.js runtime — do *not* force it into `packages/shared`. `packages/shared` only holds **pure & cross-platform** things (types, schemas, tokens). This boundary matters to avoid pulling `server-only` / Prisma into the mobile bundle.
>
> **Minimal alternative (Phương án tối giản):** if you are not ready for a monorepo, place `mobile/` as a sibling of `kid-hub/` and **duplicate** the contract types into mobile. Acceptable for a prototype, but it creates tech debt when the API changes. The monorepo is the target to aim for.

---

## 2. Next.js Refactor Plan — Backend & API (Kế hoạch refactor Next.js)

### 2.1. Files to touch — by name (Các file cần đụng tới — đích danh)

| File | Level (Mức độ) | What to do (Việc cần làm) |
|---|---|---|
| `server/services/auth.service.ts` | **No logic change** (Không đổi logic) | Already has `createParentSession()`, `validateRefreshToken()`, `verifyParentAccessToken()`, `loginWithParentPassword()` — enough for the API to reuse. |
| `server/lib/auth-guard.ts` | Unchanged (Giữ nguyên) | Still used by Web Server Actions (cookie-based). |
| `server/lib/api-auth.ts` | **Create new** (Tạo mới) | Guard that reads `Authorization: Bearer <token>` → calls `verifyParentAccessToken`. |
| `app/api/v1/auth/login/route.ts` | **Create new** | Calls `loginWithParentPassword` + `createParentSession`, returns token JSON. |
| `app/api/v1/auth/refresh/route.ts` | **Create new** | Calls `validateRefreshToken` + `createParentSession`. |
| `app/api/v1/homework/today/route.ts` | **Create new** | Calls `homeworkService.getTodayHomework`. |
| `app/api/v1/homework/[id]/done/route.ts` | **Create new** | Calls `homeworkService.markDone` + `progress`/`activity` services. |
| `middleware.ts` | **Light tweak** (Chỉnh nhẹ) | Keep `/api/*` out of the HTML redirect logic. |

Existing Server Actions **need not be removed** (không cần xóa) — they keep serving the Web FE. Mobile uses a parallel Route Handler branch that calls into the same services.

> The example action is already very thin (see `server/actions/homework.actions.ts`): it just calls `homeworkService.getTodayHomework(...)` then wraps it in `ActionResult`. This proves the service layer is ready to reuse.

### 2.2. Sample code — the "today's homework" feature (Code ví dụ — chức năng "bài tập hôm nay")

Picking `getTodayHomework` / `markDone`. **Service & Repository stay unchanged** — that is the reuse point.

**(a) Service — already exists, unchanged** (`server/services/homework.service.ts`):

```ts
// server/services/homework.service.ts  (EXCERPT — already in repo)
import 'server-only'
import * as homeworkRepo from '@/server/repositories/homework.repository'
import type { DayOfWeek, HomeworkItem } from '@/types'

export const todayDateKey = (): string => new Date().toISOString().split('T')[0]!

export const getTodayHomework = (userId: string, day: DayOfWeek, date: string): Promise<HomeworkItem[]> =>
  homeworkRepo.getTodayHomework(userId, day, date)

export const markDone = (periodId: string, userId: string, date: string): Promise<void> =>
  homeworkRepo.markDone(periodId, userId, date)
```

**(b) Web — Server Action (already exists, unchanged)** (`server/actions/homework.actions.ts`):

```ts
'use server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import * as homeworkService from '@/server/services/homework.service'
import { todayDateKey } from '@/server/services/homework.service'

export const getTodayHomeworkAction = async (): Promise<ActionResult<HomeworkItem[]>> => {
  try {
    const data = await homeworkService.getTodayHomework(DEFAULT_USER_ID, 'monday', todayDateKey())
    return { success: true, data }
  } catch {
    return { success: false, error: 'Failed to fetch homework' }
  }
}
```

**(c) Mobile — Route Handler (NEW), calling the same service** (`app/api/v1/homework/today/route.ts`):

```ts
import { NextResponse } from 'next/server'
import { DEFAULT_USER_ID } from '@/lib/constants'
import * as homeworkService from '@/server/services/homework.service'
import { todayDateKey } from '@/server/services/homework.service'

export const dynamic = 'force-dynamic'

// Homework is kid-facing → keep the same "no auth" semantics as its Server Action.
export async function GET() {
  try {
    const data = await homeworkService.getTodayHomework(DEFAULT_USER_ID, 'monday', todayDateKey())
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch homework' }, { status: 500 })
  }
}
```

**(d) Bearer guard for parent-protected routes (NEW)** (`server/lib/api-auth.ts`):

```ts
import 'server-only'
import type { NextRequest } from 'next/server'
import { verifyParentAccessToken } from '@/server/services/auth.service'

/**
 * API counterpart of requireParentSession: reads a Bearer token instead of a cookie.
 * Returns userId, or throws 'Unauthorized' so the route can return 401.
 */
export const requireParentApi = async (req: NextRequest): Promise<{ userId: string }> => {
  const header = req.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) throw new Error('Unauthorized')

  const session = await verifyParentAccessToken(token) // ← the same function the Web uses
  if (!session) throw new Error('Unauthorized')
  return { userId: session.userId }
}
```

**(e) Login route returning token JSON (NEW)** (`app/api/v1/auth/login/route.ts`):

```ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { loginWithParentPassword, createParentSession } from '@/server/services/auth.service'

const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8).max(128),
})

export async function POST(req: Request) {
  const parsed = LoginSchema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
  }

  const result = await loginWithParentPassword(parsed.data.email, parsed.data.password)
  if (result.status === 'locked') {
    return NextResponse.json(
      { success: false, error: 'locked', lockoutSeconds: result.lockoutSeconds },
      { status: 429 }
    )
  }
  if (result.status !== 'ok') {
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
  }

  // Web sets a cookie; Mobile receives tokens in the body to store in SecureStore.
  const { accessToken, refreshToken } = await createParentSession(result.userId)
  return NextResponse.json({ success: true, accessToken, refreshToken })
}
```

> Key point (Điểm mấu chốt): both Web (Server Action) and Mobile (Route Handler) **call into the same service functions** (`loginWithParentPassword`, `createParentSession`, `getTodayHomework`). No business logic is duplicated — only the **transport** differs (cookie vs JSON Bearer).

### 2.3. Tweak `middleware.ts`

Today `middleware.ts` redirects to HTML when a session is missing. Ensure `/api/*` is not swept into that logic (the current matcher does not list `/api`, so it is already safe — just **do not** add `/api/*` to `config.matcher`, and let `requireParentApi` handle API auth).

---

## 3. Mobile App Setup & Configuration (Khởi tạo & cấu hình Mobile App)

### 3.1. CLI commands (Lệnh CLI khởi tạo)

```bash
# (once on a monorepo) from the apps/ folder
npx create-expo-app@latest mobile --template default
cd mobile

# Expo Router (bundled in the default template; if missing)
npx expo install expo-router react-native-safe-area-context react-native-screens \
  expo-linking expo-constants expo-status-bar

# NativeWind (shares the Tailwind standard with Web)
npm install nativewind
npm install -D tailwindcss@3.4.0 prettier-plugin-tailwindcss
npx tailwindcss init

# Data fetching
npm install @tanstack/react-query axios

# Secure token storage
npx expo install expo-secure-store
```

> Note (Lưu ý): NativeWind is currently most stable on **Tailwind v3** on the mobile side, while Web uses Tailwind v4. So `packages/shared/tailwind-preset.js` should only share the **token table (colors/spacing/radius)** in a neutral form, letting each side load it under its own config.

### 3.2. NativeWind — minimal config (Cấu hình tối thiểu)

```js
// apps/mobile/tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: { extend: { /* import tokens from packages/shared */ } },
}
```

```js
// apps/mobile/babel.config.js
module.exports = function (api) {
  api.cache(true)
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
  }
}
```

### 3.3. Axios Interceptors — passing the token to the Next.js API (Truyền token lên API)

```ts
// apps/mobile/api/client.ts
import axios from 'axios'
import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'kidhub.access'
const REFRESH_KEY = 'kidhub.refresh'

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL, // e.g. http://192.168.1.x:3000/api/v1
  timeout: 10_000,
})

// Request: attach the Bearer access token
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync(ACCESS_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response: on 401 → try refresh once, then replay the request
let refreshing: Promise<string | null> | null = null

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      refreshing ??= (async () => {
        const refresh = await SecureStore.getItemAsync(REFRESH_KEY)
        if (!refresh) return null
        try {
          const { data } = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refreshToken: refresh })
          await SecureStore.setItemAsync(ACCESS_KEY, data.accessToken)
          await SecureStore.setItemAsync(REFRESH_KEY, data.refreshToken)
          return data.accessToken as string
        } catch {
          await SecureStore.deleteItemAsync(ACCESS_KEY)
          await SecureStore.deleteItemAsync(REFRESH_KEY)
          return null
        } finally {
          refreshing = null
        }
      })()
      const newToken = await refreshing
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  }
)
```

```ts
// apps/mobile/hooks/useHomework.ts  (TanStack Query)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/api/client'

export const useTodayHomework = () =>
  useQuery({
    queryKey: ['homework', 'today'],
    queryFn: async () => (await api.get('/homework/today')).data.data,
  })

export const useMarkHomeworkDone = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.post(`/homework/${id}/done`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['homework', 'today'] }),
  })
}
```

---

## 4. Safe Phased Rollout (Lộ trình triển khai an toàn)

Each step is independent and **does not break the running Web** (Web keeps using Server Actions + cookies throughout).

### Phase 0 — Preparation, no risk (Chuẩn bị, không rủi ro)
1. Settle `SESSION_SECRET` (currently a **P0 blocker** in `docker-compose.yml`) — must be set for real before any API exists, since Bearer JWTs are exposed outside the cookie.
2. Decide API versioning: use the `/api/v1` prefix.

### Phase 1 — Transport-agnostic auth, Web behavior unchanged (Auth độc lập transport)
3. Create `server/lib/api-auth.ts` (`requireParentApi`).
4. Create `app/api/v1/auth/{login,refresh,logout}/route.ts` — new files only, no changes to `auth.actions.ts`.
5. Test with `curl`/Postman: login → get tokens → call a guarded endpoint. Web runs as before.

### Phase 2 — REST for kid-facing domains, read first then write (REST cho domain kid-facing)
6. Add **read** routes first: `app/api/v1/homework/today`, `schedule`, `grades`, `progress` — reuse services, no auth (matching the current kid-facing semantics).
7. Add **write** routes: `homework/[id]/done` (calls `markDone` + `updateStreak` + `addUserPoints` + `recordActivity` like the action).
8. Write one Playwright/`curl` smoke test per route. (Follow `e2e/<domain>/` per CLAUDE.md.)

### Phase 3 — Bootstrap Mobile, no backend changes (Khởi tạo Mobile)
9. (Optional but recommended) stand up the Turborepo monorepo: `apps/web` (move the current repo), `apps/mobile`, `packages/shared`.
10. `create-expo-app` + NativeWind + TanStack Query + Axios (section 3).
11. Set `EXPO_PUBLIC_API_URL` to the Next.js dev server (LAN IP, not `localhost`, so a real device can reach it).

### Phase 4 — Wire Mobile to the API (Nối Mobile vào API)
12. Login screen → `/api/v1/auth/login` → store tokens in SecureStore.
13. Homework/Schedule/Grades tabs → TanStack Query calls REST.
14. Test the refresh-token flow (the interceptor) by temporarily shortening `PARENT_ACCESS_TTL_SECONDS`.

### Phase 5 — Hardening, after Mobile is stable (Củng cố)
15. Add rate limiting to `/api/v1/auth/login` (reuse Upstash `lib/rate-limit.ts`) — fixes the P0 blocker "no rate limiting on verifyPin/login".
16. Gradually move `types/index.ts` (the API contract part) into `packages/shared/src/types.ts`; Web and Mobile import the same.
17. Consolidate design tokens into `packages/shared/tailwind-preset.js`.

### Cross-cutting safety rules (Quy tắc an toàn xuyên suốt)
- **Add new files only** in Phases 1–2; do not edit Web Server Actions/UI → Web cannot regress.
- The API and Web **share no cookie state** — Bearer tokens are fully separate, so a Mobile bug cannot affect the Web session.
- Every API mutation still goes through service → repository (userId in every WHERE), matching the layering in `CLAUDE.md`.
- Do not commit without PM approval (per Efficiency Protocol §8).

---

## 5. Vercel Auto-Deploy Impact (Ảnh hưởng tới auto-deploy Vercel)

The website auto-deploys to Vercel on push to GitHub. Restructuring affects deploy **only at the monorepo step** — adding the API does not.

### 5.1. Adding the API only (Phases 1–2) — zero impact (Không ảnh hưởng)
The `app/api/v1/...` Route Handlers and `server/lib/api-auth.ts` are just new files in the same Next.js app. Vercel builds and deploys as before; each route handler becomes its own serverless/edge function. Prisma + `@prisma/adapter-pg` keep working (the `postinstall: prisma generate` script already handles client generation). No Vercel settings change needed.

> This is exactly why the monorepo is **Phase 3 (optional)** — the entire API can ship without touching any deploy config.

### 5.2. Moving to a monorepo (Phase 3) — requires Vercel settings changes (Cần chỉnh settings)
Once the root is no longer a Next.js app, the build **will break unless** Vercel is reconfigured:

| Issue (Vấn đề) | Fix on Vercel (Xử lý trên Vercel) |
|---|---|
| Root no longer has the Next.js `package.json` | Project Settings → **Root Directory** = `apps/web` |
| `packages/shared` lives outside the root | Enable **"Include files outside of the Root Directory in the Build Step"** so the workspace package is linked at build time |
| Switching package manager (pnpm workspaces) | Commit `pnpm-lock.yaml` + `pnpm-workspace.yaml` → Vercel auto-detects pnpm |
| `apps/mobile` (Expo/RN) | With Root Directory = `apps/web`, Vercel **ignores mobile** — do not let Vercel build React Native |
| Avoid rebuilding web when only mobile changed | Use **Ignored Build Step** with `npx turbo-ignore` |
| Faster builds (optional) | Vercel has native Turborepo support + remote cache; build command can be `turbo run build --filter=web` |

Environment variables (`DATABASE_URL`, `SESSION_SECRET`...) stay unchanged. `EXPO_PUBLIC_API_URL` belongs to mobile and is **not** added to Vercel.

### 5.3. Recommended sequencing (Khuyến nghị thứ tự thực hiện)
**Do not** combine "add API" and "move to monorepo" in the same push. Split into two separate deploys:

1. **Deploy 1 — API:** merge the API (Phases 1–2) → deploy → confirm Web + API run fine on Vercel.
2. **Deploy 2 — Monorepo:** move to the monorepo (Phase 3) and **update Root Directory before/at the same time** as the file-move commit. This is the single moment the deploy can go red if forgotten.

> Net risk: **0** for the API portion; only a **one-time Root Directory change** when adopting the monorepo — the Vercel auto-deploy mechanism itself does not change.
```
