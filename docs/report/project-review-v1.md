# Project Review v1 — Production-Readiness Audit (Đánh Giá Sẵn Sàng Triển Khai Thực Tế v1)

> **Reviewer (Người Kiểm Tra):** Senior System Architect (audit pass) (Kiến Trúc Sư Hệ Thống Cao Cấp — lượt kiểm tra)
> **Date (Ngày):** 2026-06-21
> **Branch reviewed (Nhánh được xem xét):** `main` @ `be0c229`
> **Scope (Phạm Vi):** Full `docs/` set + source tree (`app/`, `server/`, `lib/`, `hooks/`, `prisma/`, `e2e/`, config)
> **Mode (Chế Độ):** Audit + documentation only. No source code was modified. (Chỉ kiểm tra và lập tài liệu. Không có mã nguồn nào bị sửa đổi.)

---

## 0. Executive Summary (Tóm Tắt Điều Hành)

Kid Hub is a single-household family learning dashboard (Next.js 16 App Router, React 19,
Prisma 7, PostgreSQL, Server Actions). (Kid Hub là một bảng điều khiển học tập cho gia đình đơn hộ.)
The codebase is **architecturally mature for its size** (Codebase **trưởng thành về kiến trúc so với quy mô của nó**):
clean Repository → Service → Action → UI layering, Zod validation on mutations, scoped HttpOnly
JWT cookies, and a verifiable design-token system. (phân lớp Repository → Service → Action → UI rõ ràng, xác thực Zod trên các mutation, cookie JWT HttpOnly có phạm vi, và hệ thống design-token có thể kiểm chứng.)
Since the last documentation refresh (`2026-06-01`), the team has **closed most of the P0/P1 items** from the original stability plan — (Kể từ lần cập nhật tài liệu gần nhất (`2026-06-01`), nhóm đã **đóng hầu hết các mục P0/P1** từ kế hoạch ổn định ban đầu —)
the docs themselves are now the most out-of-date artifact in the repository. (bản thân các tài liệu hiện là thành phần lỗi thời nhất trong repository.)

**Verdict (Kết Luận):** The application is **near-staging-ready** but **not production-ready**. (Ứng dụng đã **gần sẵn sàng cho staging** nhưng **chưa sẵn sàng cho môi trường sản xuất**.)
The blockers are no longer in the application layer — they are in the *operational* layer: (Các điểm chặn không còn nằm ở lớp ứng dụng — chúng nằm ở lớp *vận hành*:)
there is no CI pipeline in the tree, no deployed environment, no observability/logging, and a thin automated test net (3 E2E specs, zero unit tests). (không có CI pipeline trong cây nguồn, không có môi trường đã triển khai, không có khả năng quan sát/ghi log, và mạng lưới kiểm thử tự động mỏng (3 spec E2E, không có unit test).)
The single most valuable next step is to stand up CI + a staging deploy on the already-chosen stack (Vercel + Neon + Cloudflare R2) so that the remaining hardening can be validated against a real environment. (Bước tiếp theo có giá trị nhất là dựng CI + một bản triển khai staging trên ngăn xếp đã chọn (Vercel + Neon + Cloudflare R2) để việc gia cố còn lại có thể được xác nhận trong môi trường thực.)

| Dimension (Khía Cạnh) | Grade (Điểm) | One-line rationale (Lý do ngắn gọn) |
|---|---|---|
| Architecture & layering (Kiến trúc & phân lớp) | **A−** | Clean, enforced layering; minor `server-only` and dual-flow debt (Phân lớp rõ ràng, được thực thi; còn ít nợ kỹ thuật `server-only` và dual-flow) |
| Security — app layer (Bảo mật — lớp ứng dụng) | **B+** | Secrets enforced, rate-limited, headers set; CSP/HSTS + TOCTOU race remain (Bí mật được kiểm soát, có giới hạn tốc độ, headers đã cấu hình; còn thiếu CSP/HSTS + race condition TOCTOU) |
| Error handling & resilience (Xử lý lỗi & khả năng phục hồi) | **B** | `error.tsx`/`loading.tsx` now present; no `not-found.tsx`, optimistic reset (`error.tsx`/`loading.tsx` đã có; thiếu `not-found.tsx`, reset lạc quan) |
| Performance & scalability (Hiệu năng & khả năng mở rộng) | **B−** | Single-user scale is fine; unbounded `pg` pool, polling, redundant round-trips (Quy mô người dùng đơn ổn; pool `pg` không giới hạn, polling, round-trip dư thừa) |
| Observability & logging (Quan sát & ghi log) | **D** | No structured logging, no metrics, no error tracking, no health check (Không có log có cấu trúc, không có metrics, không có theo dõi lỗi, không có health check) |
| Testing (Kiểm thử) | **C−** | 3 Playwright specs; zero unit tests on pure service functions (3 spec Playwright; không có unit test cho hàm service thuần túy) |
| Deployment readiness (Sẵn sàng triển khai) | **D+** | Strategy drafted; nothing deployed; no CI workflow committed (Chiến lược đã soạn thảo; chưa triển khai gì; không có workflow CI nào được commit) |
| Documentation accuracy (Độ chính xác tài liệu) | **C** | Excellent depth, but status docs lag the code by ~3 weeks (Nội dung phong phú, nhưng tài liệu trạng thái chậm hơn code ~3 tuần) |

---

## 1. Current State Analysis (Phân Tích Trạng Thái Hiện Tại)

### 1.1 Technology Stack (Ngăn Xếp Công Nghệ) — verified against `package.json`

| Layer (Lớp) | Technology (Công Nghệ) | Version (Phiên Bản) | Note (Ghi Chú) |
|---|---|---|---|
| Framework | Next.js App Router | 16.1.6 | `output: 'standalone'` — Docker-oriented (Hướng Docker) |
| Language (Ngôn Ngữ) | TypeScript strict | 5.x | Clean compile (Biên dịch sạch) |
| UI | React | 19.2.3 | — |
| Styling (Giao Diện) | Tailwind CSS v4 + `@theme {}` | 4.x | Token system enforced by `design:check` scripts (Hệ thống token được thực thi bởi script `design:check`) |
| ORM | Prisma | 7.5.0 | `@prisma/adapter-pg` driver adapter |
| DB (CSDL) | PostgreSQL 16 | — | Local via Docker; Neon Serverless targeted (Cục bộ qua Docker; mục tiêu Neon Serverless) |
| Validation (Xác Thực) | Zod | 4.3.6 | On write actions (Trên các action ghi) |
| Auth (Xác Thực Người Dùng) | jose (JWT HS256) + bcryptjs (12 rounds) | 6.2.2 / 3.0.3 | Custom, coherent (Tùy chỉnh, nhất quán) |
| Rate limiting (Giới Hạn Tốc Độ) | Upstash Redis sliding window | 2.0.8 | Wired into middleware (Tích hợp vào middleware) |
| State — client (Trạng Thái — client) | Zustand + localStorage | 5.0.12 | — |
| Testing (Kiểm Thử) | Playwright | 1.59.1 | 3 spec files (3 file spec) |
| **Dead weight (Gánh Nặng Vô Ích)** | `firebase`, `firebase-admin` | 12.12.0 / 13.8.0 | **Zero imports — still in deps (Không có import nào — vẫn còn trong dependencies)** |

### 1.2 Strengths (Điểm Mạnh) — verified in source

1. **Enforced layering (Phân lớp được thực thi).** Repository (`server/repositories/`) holds Prisma-only queries; (chứa các truy vấn Prisma thuần túy;) services (`server/services/`) hold pure business logic; (chứa logic nghiệp vụ thuần túy;) actions (`server/actions/`) orchestrate with `requireParentSession` + Zod. (điều phối với `requireParentSession` + Zod.) The separation is real, not aspirational. (Sự phân tách là thực tế, không chỉ mang tính nguyện vọng.)

2. **Secret handling is now strict (Xử lý bí mật hiện đã nghiêm ngặt).** `middleware.ts` `getSecret()` (lines 41–47) **throws** when `SESSION_SECRET` is absent or `< 32` chars — (**ném lỗi** khi `SESSION_SECRET` vắng mặt hoặc `< 32` ký tự —) the previously-flagged silent dev fallback is gone. (phương án dự phòng im lặng trước đây đã bị loại bỏ.) `lib/db.ts` defers `DATABASE_URL` validation to first query via a `Proxy`, so build-time imports don't require a live DB. (`lib/db.ts` trì hoãn xác thực `DATABASE_URL` đến truy vấn đầu tiên qua `Proxy`, nên import lúc build không cần DB chạy.)

3. **HTTP-layer rate limiting is live (Giới hạn tốc độ tầng HTTP đã hoạt động).** `middleware.ts` (lines 96–116) rate-limits parent login/PIN `POST`s by IP via Upstash (10 / 60 s sliding window) and returns a proper `429` with `Retry-After`. (giới hạn theo IP cho các `POST` đăng nhập/PIN của phụ huynh qua Upstash và trả về `429` với `Retry-After` đúng chuẩn.) This closes the concurrency-bypass concern raised in the stability plan — *at the HTTP layer* (the in-DB TOCTOU race below is separate). (Điều này đóng lỗ hổng bypass đồng thời được nêu trong kế hoạch ổn định — *tại tầng HTTP* (race condition TOCTOU trong DB bên dưới là vấn đề riêng).)

4. **Security headers are set (Các header bảo mật đã được cấu hình).** `next.config.ts` emits `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Permissions-Policy` locking down camera/mic/geolocation. (phát ra các header bảo mật và `Permissions-Policy` khóa quyền truy cập camera/mic/vị trí.)

5. **Ownership guards reached the DB layer (Bảo vệ quyền sở hữu đã đến tầng DB).** `schedule.repository.ts` `updatePeriod` (line 142) and `deletePeriod` (line 156) now carry `userId` in the `WHERE` clause — (`updatePeriod` và `deletePeriod` hiện mang `userId` trong mệnh đề `WHERE` —) defense in depth beyond the action-layer session check. (phòng thủ theo chiều sâu vượt qua kiểm tra session ở tầng action.)

6. **Resilience primitives exist (Các nguyên tắc phục hồi đã tồn tại).** `error.tsx` is present for all three route groups (`(dashboard)`, `(games)`, `(parent)`); (`error.tsx` có mặt cho cả ba nhóm route;) `loading.tsx` skeletons exist for dashboard, schedule, homework, and grades. (skeleton `loading.tsx` tồn tại cho dashboard, thời khóa biểu, bài tập và điểm số.)

7. **Most services carry the `server-only` contract (Hầu hết service đã có ràng buộc `server-only`)** via `import 'server-only'` (homework, activity, rewards, math, english services + `auth-guard`). (qua `import 'server-only'` cho các service homework, activity, rewards, math, english + `auth-guard`.)

8. **Design-token governance is automated (Quản trị design-token được tự động hóa).** `scripts/design/` provides `check-coverage`, `check-viewports`, `check-tokens` — (cung cấp `check-coverage`, `check-viewports`, `check-tokens` —) a genuinely uncommon discipline at this stage. (một kỷ luật hiếm gặp ở giai đoạn này.)

### 1.3 Weaknesses (Điểm Yếu) — verified in source

| # | Weakness (Điểm Yếu) | Evidence (Bằng Chứng) |
|---|---|---|
| W1 | **No CI pipeline in the tree (Không có CI pipeline trong cây nguồn).** `.github/` contains only `skills/`; no `workflows/`. A prior PR (`#1`, "fix-lint-type-check-build-job") attempted this but no workflow file is present on `main`. (Một PR trước đó đã cố gắng nhưng không có file workflow nào trên `main`.) | `find .github -type f` |
| W2 | **Dead Firebase dependencies (Dependency Firebase không được dùng).** `firebase` + `firebase-admin` (~6 MB transitive) remain in `dependencies` with zero imports — bundle weight + supply-chain surface. (~6 MB transitive vẫn còn trong `dependencies` với không có import nào — nặng bundle + bề mặt tấn công supply-chain.) | `grep "from 'firebase'"` → none |
| W3 | **No CSP / HSTS (Thiếu CSP / HSTS).** Headers cover clickjacking + MIME sniffing but not content injection (CSP) or transport pinning (HSTS / `Strict-Transport-Security`). (Headers bao gồm clickjacking + MIME sniffing nhưng không bao gồm chèn nội dung (CSP) hoặc ghim truyền tải (HSTS).) | `next.config.ts` |
| W4 | **Unbounded DB pool (Pool DB không giới hạn).** `PrismaPg({ connectionString })` passes no `max` / `idleTimeoutMillis`; `pg` defaults to 10 conns/process — risky on serverless fan-out without a pooler. (mặc định 10 kết nối/process — rủi ro khi serverless fan-out mà không có pooler.) | `lib/db.ts` line ~22 |
| W5 | **`server-only` is a comment, not the package, in 3 services (là comment, không phải package, trong 3 service).** `auth.service.ts`, `schedule.service.ts`, `grades.service.ts` document "Server-only module" but do **not** `import 'server-only'` — no build-time guard if imported client-side. (không có bảo vệ lúc build nếu được import phía client.) | `head -3` of each |
| W6 | **TOCTOU race in PIN lockout (Race condition TOCTOU trong khóa PIN).** `getPin → isLockedOut → comparePin → recordFailedAttempt` is not wrapped in a DB transaction; (không được bọc trong DB transaction;) two concurrent failures at `attempts=4` can both read pre-lockout state. (hai lần thất bại đồng thời tại `attempts=4` đều có thể đọc trạng thái trước khi khóa.) Mitigated (not eliminated) by W3's IP rate limit. (Được giảm thiểu (không loại bỏ) bởi giới hạn IP.) | stability-plan §5 |
| W7 | **No structured logging (Không có log có cấu trúc).** No `pino`/`winston`/logger anywhere in `server/` or `lib/`; errors surface only via Next.js defaults. (Không có `pino`/`winston`/logger ở bất kỳ đâu; lỗi chỉ nổi lên qua mặc định Next.js.) No correlation IDs, no log levels. (Không có correlation ID, không có cấp độ log.) | `grep -rln "pino\|winston\|logger"` → none |
| W8 | **No observability (Không có khả năng quan sát).** No error tracking (Sentry/equivalent), no metrics, no `/api/health` endpoint, no uptime signal. (Không có theo dõi lỗi, không có metrics, không có endpoint `/api/health`, không có tín hiệu uptime.) | tree scan |
| W9 | **Thin test net (Mạng lưới kiểm thử mỏng).** 3 Playwright specs (`auth/middleware`, `games/games-hub`, `responsive/viewport-matrix`); zero unit tests on pure service functions (`grading`, `schedule-utils`, lockout math) that are ideal unit-test targets. (3 spec Playwright; không có unit test cho các hàm service thuần túy là mục tiêu unit test lý tưởng.) | `find e2e -name '*.spec.ts'` |
| W10 | **localStorage as a source of truth (localStorage là nguồn dữ liệu chính).** `UserProgress` is split between localStorage and DB (`hooks/useUserProgress.ts`); progress can desync or reset on storage clear. (tiến độ có thể bị mất đồng bộ hoặc reset khi xóa storage.) | summary §6, stability-plan |
| W11 | **Dual homework completion flows (Hai luồng hoàn thành bài tập).** `toggleHomeworkDoneAction` vs `markHomeworkDoneAction` / `DailyHomework` vs `HomeworkCompletion` — inconsistent point awards. (trao điểm không nhất quán.) | summary §3 |
| W12 | **No deployed environment (Không có môi trường đã triển khai).** No staging, no production; deployment strategy is `DRAFT — Awaiting PM Approval`. (Không có staging, không có production; chiến lược triển khai vẫn là `BẢN THẢO — Chờ PM Phê Duyệt`.) | `docs/architecture/deployment-strategy.md` |

---

## 2. Gaps Preventing Production Readiness (Các Khoảng Trống Ngăn Cản Sẵn Sàng Triển Khai)

Grouped by production concern, with the residual (post-fix) state as of this audit. (Được nhóm theo mối quan tâm sản xuất, với trạng thái còn lại (sau khi sửa) tính đến lần kiểm tra này.)

### 2.1 Security (Bảo Mật)

- **CSP & HSTS absent (Thiếu CSP & HSTS)** (W3). For a PWA serving a child, a restrictive CSP (`default-src 'self'`, explicit `connect-src` for the R2 media origin + Upstash) and `Strict-Transport-Security` are table stakes once HTTPS is live. (Đối với PWA phục vụ trẻ em, CSP nghiêm ngặt và `Strict-Transport-Security` là điều kiện tối thiểu khi HTTPS đã hoạt động.)
- **TOCTOU race in lockout (Race condition TOCTOU trong khóa)** (W6) — wrap the read-compare-write in a Prisma `$transaction` or use an atomic conditional update. (bọc đọc-so sánh-ghi trong `$transaction` Prisma hoặc dùng cập nhật có điều kiện nguyên tử.)
- **`server-only` gap (Khoảng trống `server-only`)** (W5) — three of the most sensitive modules (auth!) lack the build-time guard. (ba module nhạy cảm nhất (auth!) thiếu bảo vệ lúc build.)
- **No secret rotation story (Không có kế hoạch xoay vòng bí mật).** `SESSION_SECRET` is single, static, symmetric (HS256). (là một bí mật duy nhất, tĩnh, đối xứng (HS256).) No rotation or `kid` overlap window documented. (Không có xoay vòng hoặc cửa sổ chồng chéo `kid` nào được ghi lại.) Acceptable for a household app; document the decision. (Chấp nhận được cho ứng dụng hộ gia đình; ghi lại quyết định.)

### 2.2 Reliability & Error Handling (Độ Tin Cậy & Xử Lý Lỗi)

- **No `not-found.tsx` (Thiếu `not-found.tsx`)** — missing routes hit raw Next.js defaults (no Vietnamese 404). (các route bị thiếu dùng mặc định Next.js thô (không có trang 404 tiếng Việt).)
- **Optimistic `ErrorBoundary` reset (Reset `ErrorBoundary` lạc quan)** — `setState({ hasError: false })` without verifying the root cause cleared can loop. (không xác minh nguyên nhân gốc rễ đã được giải quyết có thể gây vòng lặp.)
- **No graceful DB-down UX (Không có UX khi DB ngừng hoạt động)** — a Neon cold-start or timeout currently bubbles to `error.tsx` with a generic message; no retry/backoff. (Neon cold-start hoặc timeout hiện hiển thị `error.tsx` với thông báo chung; không có retry/backoff.)

### 2.3 Performance & Scalability (Hiệu Năng & Khả Năng Mở Rộng)

- **Unbounded `pg` pool (Pool `pg` không giới hạn)** (W4) — set `max` and timeouts, and prefer Neon's PgBouncer pooler URL in serverless. (đặt `max` và timeouts, ưu tiên URL pooler PgBouncer của Neon trong serverless.)
- **Redundant round-trips (Round-trip dư thừa)** — `getReportCardAction` historically did a `getUserById` guard before `getReportCard`; confirm during fix sprint whether still present. (trước đây có guard `getUserById` trước `getReportCard`; xác nhận trong sprint sửa lỗi xem còn không.)
- **Polling without visibility gating (Polling không kiểm soát visibility)** — `useSchedule` `setInterval(30s)` should pause on `document.visibilityState === 'hidden'` (partially addressed per summary; verify). (nên dừng khi `document.visibilityState === 'hidden'` (đã giải quyết một phần; cần xác nhận).)
- **No caching strategy (Không có chiến lược cache)** — Next.js 16 Cache Components / `use cache` / ISR are unused; every page is a fresh render+query. (Cache Components / `use cache` / ISR của Next.js 16 chưa được dùng; mỗi trang là render+query mới.) Fine at single-user scale, but leaves easy wins on the table. (Ổn với quy mô người dùng đơn, nhưng bỏ lỡ cải tiến dễ dàng.)

### 2.4 Observability & Operations (Quan Sát & Vận Hành)

- **No structured logging (Không có log có cấu trúc)** (W7), **no error tracking, no metrics, no health check (không theo dõi lỗi, không metrics, không health check)** (W8).
- **No CI (Không có CI)** (W1) — lint, typecheck, build, and test must gate merges before any deploy. (lint, typecheck, build và test phải kiểm soát merge trước bất kỳ triển khai nào.)
- **No deploy automation (Không có tự động hóa triển khai)** (W12) — no preview deployments, no rollback path. (không có bản triển khai xem trước, không có đường dẫn rollback.)

### 2.5 Data & Correctness (Dữ Liệu & Tính Chính Xác)

- **localStorage source-of-truth (localStorage là nguồn dữ liệu chính)** (W10) and **dual homework flows (hai luồng bài tập)** (W11) are correctness risks, not just debt — (là rủi ro về tính chính xác, không chỉ là nợ kỹ thuật —) they can produce user-visible inconsistencies (lost progress, wrong points). (chúng có thể tạo ra sự không nhất quán hiển thị với người dùng (mất tiến độ, điểm sai).)
- **No backup/restore runbook (Không có sổ tay sao lưu/phục hồi)** for the Neon database. (cho cơ sở dữ liệu Neon.)

### 2.6 Testing & QA (Kiểm Thử & Đảm Bảo Chất Lượng)

- **Coverage is E2E-only and shallow (Phạm vi chỉ E2E và nông)** (W9). The pure functions in `lib/` and `server/services/` are the highest-ROI, lowest-cost unit-test targets and are currently untested. (Các hàm thuần túy trong `lib/` và `server/services/` là mục tiêu unit test có ROI cao nhất, chi phí thấp nhất và hiện chưa được kiểm thử.)

---

## 3. Proposed New Features, Improvements & Optimizations (Tính Năng Mới, Cải Tiến & Tối Ưu Hóa Được Đề Xuất)

> These are **proposals only** — no implementation has been started, per the audit constraint. (Đây chỉ là **đề xuất** — chưa có triển khai nào được bắt đầu, theo ràng buộc kiểm tra.)

### 3.1 Operational foundation — new (Nền Tảng Vận Hành — mới)

1. **CI workflow** (`.github/workflows/ci.yml`): `pnpm install` → `lint` → `tsc --noEmit` → `next build` → `playwright test`, on PR + push to `main`. Cache pnpm + Next build. (Trên PR + push lên `main`. Cache pnpm + Next build.)
2. **Staging environment (Môi trường staging)** on Vercel (preview) backed by a Neon `staging` branch DB. (trên Vercel (preview) được hỗ trợ bởi nhánh DB `staging` của Neon.)
3. **Health endpoint (Endpoint health)** (`app/api/health/route.ts`) returning DB connectivity + build SHA, for uptime monitoring. (trả về kết nối DB + build SHA, cho theo dõi uptime.)
4. **Structured logging (Log có cấu trúc)** — a thin `lib/logger.ts` (level-aware, JSON in prod) used by services and actions; attach a per-request correlation ID in middleware. (một `lib/logger.ts` mỏng (nhận biết cấp độ, JSON trong prod) được dùng bởi services và actions; gắn correlation ID theo request trong middleware.)
5. **Error tracking (Theo dõi lỗi)** — Sentry (or Vercel's built-in) wired into `error.tsx` boundaries + server actions, with PII scrubbing (it's a child's data). (Sentry (hoặc tích hợp sẵn của Vercel) được nối vào `error.tsx` + server actions, với scrubbing PII (đây là dữ liệu trẻ em).)

### 3.2 Security hardening — improvement (Gia Cố Bảo Mật — cải tiến)

6. **CSP + HSTS** in `next.config.ts` headers, scoped to `self` + R2 media + Upstash origins. (trong headers `next.config.ts`, giới hạn cho `self` + nguồn media R2 + Upstash.)
7. **Transactional PIN lockout (Khóa PIN giao dịch)** — wrap read-compare-write in `$transaction`. (bọc đọc-so sánh-ghi trong `$transaction`.)
8. **Add `import 'server-only'`** to `auth.service.ts`, `schedule.service.ts`, `grades.service.ts`. (Thêm vào các service nhạy cảm còn thiếu.)
9. **Remove `firebase` + `firebase-admin` (Xóa)** from `package.json`. (khỏi `package.json`.)

### 3.3 Data correctness — improvement (Tính Chính Xác Dữ Liệu — cải tiến)

10. **DB-first `UserProgress` (DB làm nguồn chính cho `UserProgress`)** — make the DB authoritative; treat localStorage as a cache/optimistic layer only, reconciled on load. (làm DB là nguồn quyền lực; coi localStorage chỉ là lớp cache/lạc quan, đồng bộ khi tải.)
11. **Unify homework completion (Thống nhất luồng hoàn thành bài tập)** into a single flow + table semantics, with one point-award path. (thành một luồng + ngữ nghĩa bảng duy nhất, với một đường dẫn trao điểm.)

### 3.4 Performance — optimization (Hiệu Năng — tối ưu hóa)

12. **Bounded pool + Neon pooler (Pool có giới hạn + pooler Neon)** — `PrismaPg({ ..., max: 5 })` and the pooled connection string in serverless. (chuỗi kết nối pooled trong serverless.)
13. **Next.js 16 Cache Components** for read-mostly views (schedule, grades) via `use cache` + `cacheTag`, invalidated on the corresponding mutation. (cho các view chủ yếu đọc (lịch học, điểm số) qua `use cache` + `cacheTag`, bị vô hiệu hóa trên mutation tương ứng.)

### 3.5 Quality — new (Chất Lượng — mới)

14. **Unit tests — Vitest (Unit test — Vitest)** for `lib/grading.ts`, `lib/schedule-utils.ts`, and the auth lockout/badge pure functions. (cho các hàm thuần túy tính điểm, tiện ích lịch, khóa xác thực và huy hiệu.)
15. **Expand E2E (Mở rộng E2E)** to cover parent PIN auth happy/lockout paths and a full game-session save. (bao gồm đường dẫn happy/lockout của PIN auth phụ huynh và lưu trữ phiên game đầy đủ.)

---

## 4. Prioritized Actionable Roadmap (Lộ Trình Hành Động Được Ưu Tiên)

> Effort (Công Sức): S ≤ ½ day (≤ ½ ngày) · M ≈ 1–2 days (1–2 ngày) · L ≈ 3–5 days (3–5 ngày).
> Priorities assume the goal is a safe staging deploy first, then production. (Ưu tiên giả định mục tiêu là triển khai staging an toàn trước, sau đó production.)

### Phase 0 — Make Deployable (Giai Đoạn 0 — Làm Cho Có Thể Triển Khai) · ✅ COMPLETE (2026-06-22) · commit `fac7939`

| # | Item (Mục) | Status |
|---|---|---|
| 0.1 | Add `.github/workflows/ci.yml` (lint, tsc, build, Playwright) | ✅ Done |
| 0.2 | Provision Neon staging branch (`br-steep-rice-ao82x1km`) + Vercel-conditional `output` in `next.config.ts` | ✅ Done |
| 0.3 | Add `/api/health` + DB connectivity check | ✅ Done |
| 0.4 | Remove `firebase`/`firebase-admin`; build verified | ✅ Done |
| 0.5 | Add `import 'server-only'` to auth/schedule/grades services | ✅ Done |

### Phase 1 — Production Security & Resilience (Giai Đoạn 1 — Bảo Mật & Khả Năng Phục Hồi Sản Xuất) · ✅ COMPLETE (2026-06-22)

| # | Item (Mục) | Status |
|---|---|---|
| 1.1 | CSP + HSTS headers | ✅ Done — added to `next.config.ts` |
| 1.2 | Transactional PIN lockout (close TOCTOU) (Khóa PIN giao dịch — đóng TOCTOU) | ✅ Done — `atomicFailedPinAttempt` in `user.repository.ts` |
| 1.3 | Structured logger + correlation IDs (Log có cấu trúc + correlation ID) | ✅ Done — `lib/logger.ts` (pino) + `X-Request-Id` in middleware |
| 1.4 | Error tracking — Sentry with PII scrubbing (Theo dõi lỗi — Sentry với scrubbing PII) | ✅ Done — `sentry.client.config.ts` + `instrumentation.ts`; dormant until `NEXT_PUBLIC_SENTRY_DSN` is set |
| 1.5 | `not-found.tsx` + harden `ErrorBoundary` reset | ✅ Done — `app/not-found.tsx`, `app/error.tsx`, `resetCount` in ErrorBoundary |

**Architecture bonus:** All 10 action files now route through service layer — zero direct repository imports in actions.

### Phase 2 — Correctness & Performance (Giai Đoạn 2 — Tính Chính Xác & Hiệu Năng) · P2

| # | Item (Mục) | Effort (Công Sức) | Why (Tại Sao) |
|---|---|---|---|
| 2.1 | DB-first `UserProgress` reconciliation (Đồng bộ `UserProgress` lấy DB làm chính) | L | Stop progress desync/loss (Ngăn mất đồng bộ/mất tiến độ) |
| 2.2 | Unify homework completion flow (Thống nhất luồng hoàn thành bài tập) | M | Consistent point awards (Trao điểm nhất quán) |
| 2.3 | Bounded pool + Neon pooler URL (Pool có giới hạn + URL pooler Neon) | S | Serverless connection safety (An toàn kết nối serverless) |
| 2.4 | Visibility-gated polling in `useSchedule` (Polling kiểm soát visibility trong `useSchedule`) | S | Battery/CPU on tablets (Tiết kiệm pin/CPU trên máy tính bảng) |
| 2.5 | Cache Components for schedule/grades reads (Cache Components cho đọc lịch/điểm) | M | Latency + cost wins (Cải thiện độ trễ + chi phí) |

### Phase 3 — Quality & Ops Maturity (Giai Đoạn 3 — Chất Lượng & Trưởng Thành Vận Hành) · P3

| # | Item (Mục) | Effort (Công Sức) | Why (Tại Sao) |
|---|---|---|---|
| 3.1 | Vitest unit tests for pure functions (Unit test Vitest cho hàm thuần túy) | M | Highest-ROI coverage (Phạm vi ROI cao nhất) |
| 3.2 | Expand Playwright — PIN auth, game-save (Mở rộng Playwright — PIN auth, lưu game) | M | Protect critical paths (Bảo vệ đường dẫn quan trọng) |
| 3.3 | DB backup/restore runbook (Sổ tay sao lưu/phục hồi DB) | S | Recoverability (Khả năng phục hồi) |
| 3.4 | Production promotion + rollback runbook (Sổ tay lên production + rollback) | S | Safe releases (Phát hành an toàn) |

---

## 5. Documentation Accuracy Note (Ghi Chú Về Độ Chính Xác Tài Liệu)

The three status documents (`project-status.md`, `project-summary.md`, `project-overview.md`) and `stability-plan.md` predate the recent hardening work (Ba tài liệu trạng thái và `stability-plan.md` có trước công việc gia cố gần đây) and list several **already-fixed** items as open P0/P1 blockers (và liệt kê một số mục **đã được sửa** là điểm chặn P0/P1 còn mở): silent secret fallback, missing rate limiting, missing security headers, missing ownership guards, missing `error.tsx`/`loading.tsx`. (phương án dự phòng im lặng, thiếu giới hạn tốc độ, thiếu security headers, thiếu bảo vệ quyền sở hữu, thiếu `error.tsx`/`loading.tsx`.)
The three status docs are being updated alongside this report to reflect verified reality. (Ba tài liệu trạng thái đang được cập nhật cùng với báo cáo này để phản ánh thực tế đã xác minh.)
`stability-plan.md` and `CLAUDE.md`'s "Current P0 Blockers" section are **left unmodified** by this audit but should be reconciled in the implementation phase (`stability-plan.md` và phần "Current P0 Blockers" của `CLAUDE.md` **không được sửa đổi** bởi kiểm tra này nhưng nên được đồng bộ trong giai đoạn triển khai) — both now overstate the open risk. (cả hai hiện đang phóng đại rủi ro còn mở.)

---

## 6. Constraints Honored (Các Ràng Buộc Đã Tuân Thủ)

- No application source code was modified, refactored, or created. (Không có mã nguồn ứng dụng nào bị sửa đổi, cấu trúc lại hoặc tạo mới.)
- No proposed feature or fix was implemented. (Không có tính năng hoặc bản sửa lỗi nào được đề xuất được triển khai.)
- Output is limited to this report plus the three status-document updates. (Đầu ra được giới hạn trong báo cáo này cộng với ba bản cập nhật tài liệu trạng thái.)
- **Stopping here for manual review and approval before any implementation phase. (Dừng ở đây để xem xét thủ công và phê duyệt trước bất kỳ giai đoạn triển khai nào.)**
