/**
 * A deterministic JWT secret for the suite. The real one comes from the
 * environment and is absent here; without it every token-minting path throws
 * before the assertion it was meant to exercise.
 */
process.env.SESSION_SECRET ??= 'test-session-secret-at-least-32-chars-long'
