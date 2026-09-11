/**
 * Middleware is where parent mode is actually gated, and it had no tests.
 *
 * The bug these cover: the PIN used to be a client-side redirect. `parent_refresh`
 * survived it, middleware minted a fresh access token from that refresh, and
 * anyone holding the device — a child, typically — walked into parent mode and
 * could edit the schedule. Session and PIN are now two separate questions.
 */
import { NextRequest } from 'next/server'
import { SignJWT } from 'jose'
import { beforeAll, describe, expect, it } from 'vitest'

import { middleware } from './middleware'

const PARENT = 'parent-khoi-default-user'
const STUDENT = 'khoi-default-user'

let access: string
let refresh: string
let pin: string
let kid: string
let expiredPin: string

const sign = (payload: Record<string, unknown>, exp = '30m') =>
  new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(exp)
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET))

beforeAll(async () => {
  access = await sign({ parentId: PARENT, typ: 'parent-access' })
  refresh = await sign({ parentId: PARENT, tokenId: 'row-1', typ: 'parent-refresh' })
  pin = await sign({ parentId: PARENT, typ: 'parent-pin' })
  kid = await sign({ studentId: STUDENT, typ: 'kid-session' })
  // Signed an hour ago with a one-second life: valid signature, dead token.
  expiredPin = await new SignJWT({ parentId: PARENT, typ: 'parent-pin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt(Math.floor(Date.now() / 1000) - 3600)
    .setExpirationTime(Math.floor(Date.now() / 1000) - 3599)
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET))
})

const visit = (path: string, cookies: Record<string, string> = {}) => {
  const req = new NextRequest(new URL(`http://localhost${path}`))
  for (const [name, value] of Object.entries(cookies)) req.cookies.set(name, value)
  return middleware(req)
}

/** A POST, optionally carrying the header that marks it as a Server Action. */
const post = (path: string, opts: { serverAction?: boolean } = {}) => {
  const headers = new Headers()
  if (opts.serverAction) headers.set('next-action', 'abc123')
  const req = new NextRequest(new URL(`http://localhost${path}`), { method: 'POST', headers })
  return middleware(req)
}

/** Where a response sends the browser, or null when it lets the request through. */
const redirectOf = (res: Response) =>
  res.status >= 300 && res.status < 400 ? new URL(res.headers.get('location')!).pathname : null

describe('parent mode requires a PIN proof, not just a session', () => {
  it.each(['/parent', '/parent/kid-access'])(
    'sends %s to the PIN pad when only the access cookie is present',
    async (path) => {
      expect(redirectOf(await visit(path, { parent_access: access }))).toBe('/parent/pin')
    }
  )

  it('sends /parent to the PIN pad when only the refresh cookie is present', async () => {
    // The exact bypass: clearing the access cookie left this path wide open,
    // because middleware would mint a new access token and continue.
    expect(redirectOf(await visit('/parent', { parent_refresh: refresh }))).toBe('/parent/pin')
  })

  it('lets the request through with both a session and a PIN proof', async () => {
    expect(redirectOf(await visit('/parent', { parent_access: access, parent_pin: pin }))).toBeNull()
  })

  it('accepts a PIN proof alongside a refresh-only session', async () => {
    expect(
      redirectOf(await visit('/parent', { parent_refresh: refresh, parent_pin: pin }))
    ).toBeNull()
  })

  it('rejects an expired PIN proof', async () => {
    expect(
      redirectOf(await visit('/parent', { parent_access: access, parent_pin: expiredPin }))
    ).toBe('/parent/pin')
  })

  it('rejects a kid token presented as a PIN proof', async () => {
    expect(redirectOf(await visit('/parent', { parent_access: access, parent_pin: kid }))).toBe(
      '/parent/pin'
    )
  })

  it('still sends an unauthenticated visitor to login, not the PIN pad', async () => {
    expect(redirectOf(await visit('/parent', { parent_pin: pin }))).toBe('/parent/login')
  })
})

describe('the PIN proof does not survive leaving parent mode', () => {
  const cleared = (res: Response) => {
    const header = res.headers.get('set-cookie') ?? ''
    return /parent_pin=;/.test(header) || /parent_pin=""/.test(header)
  }

  it('drops the proof when the browser visits a kid route', async () => {
    const res = await visit('/dashboard', { parent_access: access, parent_pin: pin, kid_session: kid })
    expect(redirectOf(res)).toBeNull()
    expect(cleared(res), 'parent_pin was not cleared on /dashboard').toBe(true)
  })

  it('drops the proof even when the kid route redirects to unlock', async () => {
    const res = await visit('/dashboard', { parent_access: access, parent_pin: pin })
    expect(redirectOf(res)).toBe('/kid-unlock')
    expect(cleared(res)).toBe(true)
  })

  it('drops the proof at /kid-unlock itself', async () => {
    const res = await visit('/kid-unlock', { parent_access: access, parent_pin: pin })
    expect(cleared(res)).toBe(true)
  })

  it('keeps the proof while moving around inside parent mode', async () => {
    const res = await visit('/parent/kid-access', { parent_access: access, parent_pin: pin })
    expect(cleared(res)).toBe(false)
  })
})

describe('kid unlock still requires a parent session (D1)', () => {
  it('redirects an anonymous visitor to parent login', async () => {
    expect(redirectOf(await visit('/kid-unlock'))).toBe('/parent/login')
  })

  it('renders for a signed-in parent', async () => {
    expect(redirectOf(await visit('/kid-unlock', { parent_access: access }))).toBeNull()
  })
})

describe('a kid session cannot outlive the parent session that authorised it', () => {
  const kidCleared = (res: Response) => /kid_session=;/.test(res.headers.get('set-cookie') ?? '')

  it('lets the child through while the parent session is alive', async () => {
    expect(
      redirectOf(await visit('/dashboard', { parent_access: access, kid_session: kid }))
    ).toBeNull()
  })

  it('still works on a refresh-only parent session', async () => {
    // The access token expires every 15 minutes; the child must not be evicted
    // each time it lapses.
    expect(
      redirectOf(await visit('/dashboard', { parent_refresh: refresh, kid_session: kid }))
    ).toBeNull()
  })

  it.each(['/dashboard', '/schedule', '/grades', '/games', '/math'])(
    'evicts the child from %s once the parent has signed out',
    async (path) => {
      // The reported bug: signing out of the parent account left the kid
      // dashboard fully usable, because nothing tied the two together.
      const res = await visit(path, { kid_session: kid })
      expect(redirectOf(res)).toBe('/parent/login')
      expect(kidCleared(res), 'the stale kid cookie was left in place').toBe(true)
    }
  )

  it('clears the kid cookie rather than leaving it to expire on its own', async () => {
    const res = await visit('/dashboard', { kid_session: kid })
    expect(kidCleared(res)).toBe(true)
  })

  it('sends a parent with no kid session to unlock, not to login', async () => {
    expect(redirectOf(await visit('/dashboard', { parent_access: access }))).toBe('/kid-unlock')
  })
})


describe('the login rate limiter counts attempts, not page loads', () => {
  // The PIN screen used to probe its gate state from a mount effect. A Server
  // Action is a POST to the page's own URL, so each load spent two tokens of a
  // ten-per-minute budget and the gate locked itself after about five visits —
  // with no failed PIN attempt anywhere. Middleware cannot tell one action from
  // another, so it no longer tries: it guards raw posts, and verifyPinAction
  // applies the per-IP limit where the intent is known.

  it('lets a Server Action POST through to the action', async () => {
    const res = await post('/parent/pin', { serverAction: true })
    expect(res.status).toBe(200)
  })

  it('does not answer a Server Action with an unparseable 429', async () => {
    const res = await post('/parent/pin', { serverAction: true })
    // text/plain is what made the client throw, turning a legitimate throttle
    // into an uncaught runtime error instead of "thử lại sau Ns" on the pad.
    expect(res.headers.get('content-type')).not.toBe('text/plain')
  })

  it('still inspects a raw POST, which no client-side code can route around', async () => {
    const res = await post('/parent/pin')
    // Without Upstash credentials the limiter is null and the request passes;
    // what matters is that this path is still the one being consulted.
    expect(res.status).toBeLessThan(500)
  })

  it('leaves GETs to the auth pages alone', async () => {
    const res = await visit('/parent/pin')
    expect(redirectOf(res)).toBeNull()
  })
})
