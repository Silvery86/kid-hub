# Monorepo Deployment Setup — Vercel + GitHub Actions

> Reference for how the Turborepo monorepo (Phase 3 of `mobile-app-migrate.md`) is wired
> for CI and deployment. After the move, the Next.js app lives in **`apps/web/`**; the repo
> root holds only workspace orchestration (`package.json`, `turbo.json`, `pnpm-workspace.yaml`)
> and shared meta (`docs/`, `agents/`, `CLAUDE.md`). Cross-platform contract code lives in
> `packages/shared/` (`@kid-hub/shared`).

---

## 1. Repository layout the config depends on

```
kid-hub/                     # monorepo root
├── apps/web/                # the Next.js app (Vercel Root Directory points here)
│   ├── package.json         # name: "kid-hub"  — has dev/build/lint/type-check/test/design:* scripts
│   ├── prisma/              # postinstall runs `prisma generate`
│   └── design/, app/, server/, ...
├── packages/shared/         # @kid-hub/shared (pure types; bundled into mobile later)
├── docs/                    # monorepo-level docs (stays at root)
├── package.json             # root: "packageManager": "pnpm@10.33.0", turbo scripts
├── turbo.json
└── pnpm-workspace.yaml      # packages: apps/* + packages/*
```

Key facts that the rest of this doc relies on:
- **Package manager:** pnpm **10** (pinned via root `package.json` → `"packageManager": "pnpm@10.33.0"`).
- **Web package name:** `kid-hub` (used by turbo filters / skip logic).
- **`docs/` stays at the root** — `apps/web/scripts/design/build-manifest.ts` reads
  `../../docs/design-system/design-to-code-sync.md`.

---

## 2. Vercel configuration

All settings are in **Vercel → Project → Settings**. Environment variables are unchanged by
the monorepo move.

### 2.1 Build & Deployment → Root Directory  ⚠️ required
| Setting | Value |
|---|---|
| **Root Directory** | `apps/web` |
| **Include files outside the root directory in the Build Step** | **Enabled** |
| **Skip deployments when there are no changes to the root directory or its dependencies** | **Enabled** |

- *Root Directory* makes Vercel treat `apps/web` as the Next.js app.
- *Include files outside root* lets the build see `pnpm-workspace.yaml` + `packages/shared`
  at the repo root (required for pnpm workspace install).
- *Skip deployments* is the **built-in replacement for `turbo-ignore`** (which Vercel now
  marks deprecated). It is Turborepo-graph-aware, so a change in `packages/shared` still
  rebuilds web, while an unrelated future `apps/mobile` change does not.
  → In **Ignored Build Step**, leave Behavior = **Automatic** (no custom command).

### 2.2 Framework & commands — leave on auto-detect
| Setting | Value | Note |
|---|---|---|
| Framework Preset | Next.js | auto-detected once Root = `apps/web` |
| Install Command | auto (`pnpm install`) | pnpm detected from committed `pnpm-lock.yaml`; installs the whole workspace |
| Build Command | auto (`next build`) | runs in `apps/web` |
| Output Directory | auto (`.next`) | |

`prisma generate` runs automatically — it is the `postinstall` script in `apps/web/package.json`.

### 2.3 Environment Variables — unchanged
Set on the Vercel project (Production + Preview as needed):
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
- `SESSION_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_MEDIA_BASE_URL`
- Sentry: `SENTRY_AUTH_TOKEN` (build-time, for source maps) + any `NEXT_PUBLIC_SENTRY_*`

> **Do NOT** add `EXPO_PUBLIC_API_URL` to Vercel — that belongs to the mobile app only.

### 2.4 Optional `apps/web/vercel.json`
Root Directory + the toggles above are Dashboard-only. Anything else can be committed:
```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs"
}
```

---

## 3. GitHub configuration

### 3.1 Actions secrets (Settings → Secrets and variables → Actions)
The CI **Build** step (`.github/workflows/ci.yml`) needs these repository secrets:
- `DATABASE_URL`, `DATABASE_URL_UNPOOLED`
- `SESSION_SECRET`
- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_MEDIA_BASE_URL`

### 3.2 Workflow requirements (already committed)
Both workflows must match the monorepo layout:

**`.github/workflows/ci.yml`** (push: `main`,`dev`; PR: `main`):
- `pnpm/action-setup@v4` **without** a `version:` input — the version comes from the root
  `package.json` `packageManager` field (pnpm 10). Passing `version:` here **conflicts** and
  fails setup. *(This was the original CI failure.)*
- `pnpm install --frozen-lockfile`, then `pnpm lint` / `pnpm type-check` / `pnpm build`
  (these run via turbo from the root).

**`.github/workflows/design-check.yml`** (push: `main`; PR: `main`):
- `pnpm/action-setup@v4` (no `version:`).
- Design scripts run inside the app: `pnpm -C apps/web design:check` / `design:report`.
- Artifact path: `apps/web/design/drift-report.html`.

### 3.3 Branch protection (recommended)
On `main`, require these status checks to pass before merge:
- `CI / Lint · Type-check · Build`
- `Design Check / Design System Compliance`
- `Vercel` (deployment)

---

## 4. Deploy sequencing & gotchas

- **One change at a time:** ship the monorepo restructure as its **own** deploy. The single
  moment it can go red is the Root Directory not being set to `apps/web` (see §2.1).
- **Vercel auto-deploy is unchanged** — it still builds on push to GitHub; only the Root
  Directory + workspace toggles differ.
- **Docker dev (`apps/web/docker-compose.yml`)** was moved with the app but is **not yet
  workspace-aware** (the `.:/app` mount won't see root-hoisted `node_modules`). It needs a
  follow-up before container-based dev works under the monorepo. Vercel deploy is unaffected.
- **Local commands:** from the repo root use turbo (`pnpm dev|build|lint|type-check|test`),
  or target the app directly with `pnpm -C apps/web <script>`.

---

## 5. Verification checklist

- [ ] Vercel: Root Directory = `apps/web`, Include-outside-root = on, Skip-deployments = on
- [ ] Vercel: env vars present (Production + Preview)
- [ ] GitHub: Actions secrets present
- [ ] `pnpm install --frozen-lockfile` succeeds at root
- [ ] `pnpm build` succeeds (all `/api/v1/*` routes + middleware compile)
- [ ] CI green: `CI` + `Design Check`
- [ ] Vercel deployment green
