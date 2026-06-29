// ============================================================
// @kid-hub/shared — cross-platform contract for Web + Mobile
// Pure, transport-agnostic types only. NO `server-only`, NO Prisma,
// NO React imports here — this package is bundled into the mobile app.
//
// Phase 3 (monorepo standup) seeds this with the core API result
// envelope and the DayOfWeek enum. Phase 5 (mobile-app-migrate.md §16)
// migrates the rest of apps/web/types/index.ts's contract types here so
// Web and Mobile share a single source of truth.
// ============================================================

export * from './types'
