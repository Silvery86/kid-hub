'use server'

// TODO Sprint 3: uncomment when bcryptjs + Prisma + session are set up
// import { hashPin, comparePin } from '@/server/services/auth.service';
// import * as userRepo from '@/server/repositories/user.repository';
// import { cookies } from 'next/headers';
// import { MAX_PIN_ATTEMPTS } from '@/lib/constants';

export const setPinAction = async (_pin: string): Promise<{ success: boolean; error?: string }> => {
  // TODO Sprint 3:
  // const hash = await hashPin(_pin);
  // await userRepo.savePin(hash);
  return { success: true }
}

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

export const signOutParentAction = async (): Promise<void> => {
  // TODO Sprint 3: clear session cookie via cookies().delete('parent_session')
}
