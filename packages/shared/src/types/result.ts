// Result envelopes returned by Server Actions and /api/v1 routes.
// Owner: @kid-hub/shared — shared by Web and Mobile.

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
