// Server-only module — do NOT import from client components or hooks.
// Auth business logic — PIN hashing, comparison, lockout state.
// Actual bcrypt calls are stubbed until bcryptjs is installed in Sprint 3.

import type { ParentSession } from '@/types';
import { MAX_PIN_ATTEMPTS, PIN_LOCKOUT_SECONDS, PIN_LENGTH } from '@/lib/constants';

/** Validate that a raw PIN is exactly PIN_LENGTH digits. */
export const validatePinFormat = (pin: string): boolean =>
  /^\d+$/.test(pin) && pin.length === PIN_LENGTH;

/**
 * Hash a PIN for storage.
 * TODO Sprint 3: replace with:
 *   import bcrypt from 'bcryptjs';
 *   return bcrypt.hash(pin, 12);
 */
export const hashPin = async (pin: string): Promise<string> => {
  // Placeholder — real bcrypt hash in Sprint 3
  return `hashed_${pin}`;
};

/**
 * Compare a raw PIN against a stored hash.
 * TODO Sprint 3: replace with bcrypt.compare(pin, hash)
 */
export const comparePin = async (pin: string, hash: string): Promise<boolean> => {
  // Placeholder — real bcrypt comparison in Sprint 3
  return hash === `hashed_${pin}`;
};

/** Determine if an account is locked out based on failed attempt count. */
export const isLockedOut = (failedAttempts: number, lastFailedAt: number): boolean => {
  if (failedAttempts < MAX_PIN_ATTEMPTS) return false;
  const elapsedSeconds = (Date.now() - lastFailedAt) / 1000;
  return elapsedSeconds < PIN_LOCKOUT_SECONDS;
};

/** Return seconds remaining in a lockout window (0 if not locked). */
export const getLockoutSecondsRemaining = (lastFailedAt: number): number => {
  const elapsed = (Date.now() - lastFailedAt) / 1000;
  return Math.max(0, Math.ceil(PIN_LOCKOUT_SECONDS - elapsed));
};

/**
 * Validate a parent session token.
 * TODO Sprint 3: read signed HttpOnly cookie via next/headers, verify expiry & signature.
 */
export const validateParentSession = async (): Promise<ParentSession> => {
  // Placeholder — real cookie validation in Sprint 3
  return { userId: 'parent', expiresAt: Date.now() + 3_600_000 };
};
