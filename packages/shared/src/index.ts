// ============================================================
// @kid-hub/shared — cross-platform contract for Web + Mobile
// Pure, transport-agnostic types only. NO `server-only`, NO Prisma,
// NO React imports here — this package is bundled into the mobile app.
//
// As of Phase 1 (mobile_imp.md §10) this package OWNS the full contract
// type surface (schedule, grades, game, result). apps/web re-exports from
// here via apps/web/types/index.ts; apps/mobile imports directly. A change
// here is a compile-time change in both apps — drift is impossible.
// ============================================================

export * from './types'
export * from './constants'
export * from './domain'
export * from './schemas'
export * from './game'
