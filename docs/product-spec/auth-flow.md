# Kid Hub — Auth Flow & Session Management

> **Reference type:** Auth & Session Reference

---

## Overview

Kid Hub has two independent auth boundaries: a **parent account session** (email + password → JWT access + refresh tokens) and a **kid unlock session** (2-icon visual pattern → short-lived JWT). A separate **parent PIN** gates re-entry into parent mode without requiring a full re-login.

---

## Three Credential Types

- **Parent password** — bcrypt-hashed account password, verified at `/parent/login`. Issues access + refresh cookies.
- **Parent PIN** — 4-digit bcrypt-hashed PIN, verified at `/parent/pin`. Re-issues access cookie without full re-login.
- **Kid pattern** — 2-symbol (1–6) bcrypt-hashed visual tap sequence, verified at `/unlock`. Issues kid session cookie.

---

## Token & Cookie Reference

| Cookie Name | JWT `typ` | TTL | Stored in DB? | Guards | Issued By |
|---|---|---|---|---|---|
| `parent_access` | `parent-access` | 15 min | No | `/parent/*` (all protected parent routes) | `parentLoginAction`, `verifyPinAction`, refresh rotation |
| `parent_refresh` | `parent-refresh` | 30 days | Yes — bcrypt hash in `users.refreshTokenHash` | Used only by middleware + `ensureParentSession` to rotate access token | `parentLoginAction`, `verifyPinAction` |
| `kid_session` | `kid-session` | 12 hours | No | `/`, `/dashboard`, `/games/*`, `/schedule`, `/grades`, `/homework` | `verifyKidPatternAction` |

---

## Parent Login Flow

```
Browser                  Middleware                 Server                    DB
   │                          │                         │                      │
   │── POST /parent/login ──► │                         │                      │
   │                          │── (no auth required) ──►│                      │
   │                          │                         │── bcrypt.compare() ──►│
   │                          │                         │◄── match/fail ────── │
   │                          │                         │                      │
   │                          │                         │── sign access JWT    │
   │                          │                         │── sign refresh JWT   │
   │                          │                         │── store refreshTokenHash ──►│
   │◄── Set-Cookie: parent_access, parent_refresh ──── │                      │
   │                          │                         │                      │
```

---

## Parent PIN Re-entry Flow

The PIN flow is used when a parent wants to re-access the parent area after the 15-min access token has expired, **without** re-entering their full password.

```
1. Browser hits /parent/* — middleware reads parent_access cookie
2. parent_access JWT is expired (> 15 min)
3. Middleware reads parent_refresh cookie
4. parent_refresh is valid and not expired
5. Middleware redirects to /parent/pin (not /parent/login)
6. Parent enters 4-digit PIN
7. verifyPinAction: bcrypt.compare(pin, ParentPin.hash)
8. On match: issue new parent_access JWT → redirect back to intended route
9. On fail (max 5 attempts): lockedUntil set in ParentPin table → lock screen shown
```

> **Rate limiting:** `verifyPinAction` POST endpoint is protected by Upstash Redis sliding window (10 requests per IP per 60 seconds) at the middleware layer, running **before** the action handler or DB read.

---

## Kid Unlock Flow

```
1. Browser hits /dashboard (or any kid route)
2. Middleware reads kid_session cookie
3. Cookie is absent or expired → redirect to /unlock
4. /unlock renders the visual pattern keypad
5. Child taps their 2-symbol pattern
6. verifyKidPatternAction: bcrypt.compare(pattern, User.kidPatternHash)
7. On match: sign kid_session JWT (12h TTL) → set HttpOnly cookie → redirect to /dashboard
8. On fail (max 5 attempts): kidPatternLockedUntil set on User
```

---

## Middleware Protection Map

| Route | Guards Applied | Cookie Required |
|---|---|---|
| `/parent/*` (all) | `parent_access` JWT verification + Upstash rate limit on POST | `parent_access` |
| `/dashboard`, `/grades`, `/schedule`, `/homework` | `kid_session` JWT verification | `kid_session` |
| `/math`, `/english`, `/games` | `kid_session` JWT verification | `kid_session` |
| `/parent/login` | None (public) | — |
| `/parent/pin` | None (public, but requires `parent_refresh` to be valid) | `parent_refresh` checked in middleware to decide /pin vs /login |
| `/unlock` | None (public) | — |
| `/` | None — redirects to `/dashboard` | — |

---

## Token Rotation

When a request to `/parent/*` arrives and `parent_access` is **expired**:

1. Middleware reads `parent_refresh`.
2. If `parent_refresh` is valid: call `ensureParentSession()` — this verifies the refresh token hash against `users.refreshTokenHash` in the DB.
3. If hash matches: issue a new `parent_access` JWT, set it as a cookie, continue the request.
4. If hash does not match (token was revoked or rotated from another device): redirect to `/parent/pin`.
5. If `parent_refresh` is absent or expired: redirect to `/parent/login`.

---

## Security Properties

| Property | Detail |
|---|---|
| Secrets | `SESSION_SECRET` must be ≥ 32 chars. Enforced at startup with `throw` (not a default fallback). |
| PIN storage | bcrypt hash (cost 10) in `parent_pins` table. Raw PIN never stored or logged. |
| Pattern storage | bcrypt hash (cost 10) in `users.kidPatternHash`. Raw sequence never stored or logged. |
| Refresh token storage | bcrypt hash in `users.refreshTokenHash`. Raw token never stored. Revoked by overwriting the hash. |
| Cookie flags | `HttpOnly`, `SameSite=Lax`, `Secure` in production (set in auth service). |
| Rate limiting | Edge-layer Upstash sliding window — fires before any DB access. 10 req/IP/60s on parent auth routes. |
| TOCTOU lockout fix | PIN attempt counter + `lockedUntil` must be updated within a DB transaction to prevent concurrent bypass. (Tracked as a P1 fix in `stability-plan.md`.) |

---

## Auth-Related Files

| File | Purpose |
|---|---|
| `middleware.ts` | Edge guard — reads and verifies both `parent_access` and `kid_session` cookies |
| `lib/rate-limit.ts` | Upstash Redis sliding window — called from middleware for parent auth routes |
| `server/lib/auth-guard.ts` | `requireParentSession()` — called at the top of every parent-only Server Action |
| `server/services/auth.service.ts` | JWT signing/verification, bcrypt operations, session duration constants |
| `server/actions/auth.actions.ts` | `parentLoginAction`, `verifyPinAction`, `logoutAction` |
| `server/actions/kid-auth.actions.ts` | `verifyKidPatternAction`, `setKidPatternAction` |
| `server/repositories/auth.repository.ts` | DB reads/writes for `ParentPin`, `User.refreshTokenHash`, `User.kidPatternHash` |

---

## Kid Feature Access Control

The parent can restrict which kid-facing features are enabled via `users.kidAccessSettings` (a JSON column storing `Record<string, boolean>`). This is checked in the kid session middleware and in individual page Server Components before rendering content.

Feature toggle keys: `games`, `homework`, `schedule`, `grades`, `dashboard` (and more as features are added). Parent manages this in `/parent/kid-access`.
