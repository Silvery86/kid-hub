import { describe, expect, it } from 'vitest'

import { loginScreenNext, pinScreenDestination } from './parent-routing'

describe('pinScreenDestination', () => {
  it('shows the pad for a session with a PIN configured', () => {
    // The regression: this used to redirect to /parent because a session was
    // treated as "already inside". /parent has no PIN proof either, so
    // middleware sent the browser back, and the pad never rendered.
    expect(pinScreenDestination({ hasSession: true, hasPin: true })).toBeNull()
  })

  it('never sends the visitor to /parent', () => {
    for (const hasPin of [true, false]) {
      for (const hasSession of [true, false]) {
        expect(pinScreenDestination({ hasSession, hasPin })).not.toBe('/parent')
      }
    }
  })

  it('sends an unauthenticated visitor to login', () => {
    expect(pinScreenDestination({ hasSession: false, hasPin: true })).toBe('/parent/login')
  })

  it('sends a session with no PIN configured back to login to set one', () => {
    expect(pinScreenDestination({ hasSession: true, hasPin: false })).toBe('/parent/login')
  })
})

describe('loginScreenNext', () => {
  it('sends a signed-in parent with a PIN to the pad, not to /parent', () => {
    expect(loginScreenNext({ hasSession: true, hasPin: true, hasAccount: true })).toEqual({
      kind: 'redirect',
      to: '/parent/pin',
    })
  })

  it('offers the setup step when signed in with no PIN yet', () => {
    expect(loginScreenNext({ hasSession: true, hasPin: false, hasAccount: true })).toEqual({
      kind: 'welcome',
    })
  })

  it('offers signup only when we know there is no account', () => {
    expect(loginScreenNext({ hasSession: false, hasPin: false, hasAccount: false })).toEqual({
      kind: 'form',
      signup: true,
    })
  })

  it('does NOT offer signup when the account check failed', () => {
    // null means "could not tell". Guessing "no account" is what invited a
    // returning parent into a registration that could never succeed.
    expect(loginScreenNext({ hasSession: false, hasPin: false, hasAccount: null })).toEqual({
      kind: 'form',
      signup: false,
    })
  })

  it('shows the login form when an account exists', () => {
    expect(loginScreenNext({ hasSession: false, hasPin: true, hasAccount: true })).toEqual({
      kind: 'form',
      signup: false,
    })
  })
})
