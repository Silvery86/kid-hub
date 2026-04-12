'use server'

/** Server Actions for parent PIN authentication — set, verify, and clear session. */

// TODO Sprint 3: uncomment when bcryptjs + Prisma + session are set up
// import { hashPin, comparePin } from '@/server/services/auth.service';
// import * as userRepo from '@/server/repositories/user.repository';
// import { cookies } from 'next/headers';
// import { MAX_PIN_ATTEMPTS } from '@/lib/constants';

/** Hashes and saves the parent PIN. Returns a standard success/error response. */
export const setPinAction = async (_pin: string): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 3:
  // const hash = await hashPin(_pin);
  // await userRepo.savePin(hash);
  return { success: true }
}

/** Verifies a submitted PIN against the stored hash. Enforces lockout on repeated failures. */
export const verifyPinAction = async (
  _pin: string
): Promise<{ success: boolean; error?: string; isLocked?: boolean }> => {
  // TODO Sprint 3:
  // const storedHash = await userRepo.getPin();
  // const isValid = await comparePin(_pin, storedHash);
  // if (!isValid) { ... track attempts, apply lockout ... }
  // if (isValid) { set signed HttpOnly session cookie via cookies() }
  return { success: true }
}

/** Clears the parent session cookie to terminate the authenticated session. */
export const signOutParentAction = async (): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 3: cookies().delete('parent_session')
  return { success: true }
}
