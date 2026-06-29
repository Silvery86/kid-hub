// Core API contract types shared by Web (Server Actions + /api/v1) and Mobile.
// Kept in sync with apps/web/types/index.ts until Phase 5 makes this the
// single source and the web app re-exports from here.

// ── Day of week ──────────────────────────────────────────────
export type DayOfWeek =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

// ── Result envelopes ─────────────────────────────────────────

/** For actions/routes that return no payload on success. */
export type ActionVoidResult =
  | { success: true }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** Discriminated union for actions/routes that return typed data on success. */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> }

/** For auth actions/routes that may be locked out (login, PIN, kid pattern). */
export type AuthActionResult =
  | { success: true }
  | {
      success: false
      error: string
      isLocked?: boolean
      lockoutSeconds?: number
      isWrong?: boolean
    }
