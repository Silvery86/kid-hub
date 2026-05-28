import { SignJWT } from 'jose'

export const SESSION_COOKIE = 'parent_access'

/**
 * Creates a valid HS256 JWT signed with the SESSION_SECRET from the environment.
 * The server must be running with the same SESSION_SECRET for the cookie to be accepted.
 * Requires SESSION_SECRET to be set in .env.local (loaded by playwright.config.ts).
 */
export async function createSessionToken(userId = 'khoi-default-user'): Promise<string> {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) {
    throw new Error(
      'SESSION_SECRET must be set and at least 32 chars. Check .env.local.'
    )
  }
  const key = new TextEncoder().encode(secret)
  return new SignJWT({ userId, typ: 'parent-access' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(key)
}
