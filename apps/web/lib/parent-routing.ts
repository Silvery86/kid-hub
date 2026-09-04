/**
 * Where the parent-entry screens send the browser.
 *
 * Pure on purpose. These decisions live in `useEffect`s that redirect, so a wrong
 * answer is not a wrong value — it is a redirect loop with a blank screen, which
 * no type checker catches and which is tedious to reproduce by hand. Deciding
 * here means the decision can be tested; the components only carry it out.
 *
 * The three inputs are genuinely independent and must not be conflated:
 *   hasSession  — signed in (who you are)
 *   hasPin      — a PIN has been configured for the account
 *   hasAccount  — an account exists at all; null means the check itself failed
 */

export interface ParentGateState {
  hasSession: boolean
  hasPin: boolean
}

/**
 * The PIN screen. Reached with a session but no PIN proof — that is its whole
 * reason to exist, so a session must NOT send the visitor onward to /parent.
 * Doing that is what produced the loop: /parent has no PIN proof either, so
 * middleware sends them straight back here.
 */
export const pinScreenDestination = ({ hasSession, hasPin }: ParentGateState): string | null => {
  if (!hasSession) return '/parent/login'
  if (!hasPin) return '/parent/login'
  return null // show the pad
}

export type LoginScreenNext =
  | { kind: 'redirect'; to: string }
  /** Signed in, no PIN configured yet — the setup step. */
  | { kind: 'welcome' }
  /** Show the form; `signup` only when we affirmatively know no account exists. */
  | { kind: 'form'; signup: boolean }

export const loginScreenNext = (
  state: ParentGateState & { hasAccount: boolean | null }
): LoginScreenNext => {
  if (state.hasSession) {
    // Straight to the pad rather than to /parent, which would only bounce here.
    return state.hasPin ? { kind: 'redirect', to: '/parent/pin' } : { kind: 'welcome' }
  }
  return { kind: 'form', signup: state.hasAccount === false }
}
