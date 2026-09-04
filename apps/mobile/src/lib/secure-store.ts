// secure-store.ts
//
// Thin wrapper around expo-secure-store for everything the device must remember
// between launches. The web app keeps these in httpOnly cookies; mobile stores
// them in the device keychain/keystore.
//
// Values are short JWTs and ids — well under the ~2KB some iOS releases have
// historically refused for a single SecureStore entry.
import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'kidhub.access'
const REFRESH_KEY = 'kidhub.refresh'
/** Scoped to one student and carrying no parent identity — see the kid gate. */
const KID_TOKEN_KEY = 'kidhub.kid'
/** Which child the app is showing. A preference; the server re-checks the link. */
const ACTIVE_STUDENT_KEY = 'kidhub.activeStudent'

export const getAccessToken = (): Promise<string | null> => SecureStore.getItemAsync(ACCESS_KEY)
export const getRefreshToken = (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_KEY)

export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

// ── Kid session ──────────────────────────────────────────────────────────────

export const getKidToken = (): Promise<string | null> => SecureStore.getItemAsync(KID_TOKEN_KEY)

export const setKidToken = (token: string): Promise<void> =>
  SecureStore.setItemAsync(KID_TOKEN_KEY, token)

export const clearKidToken = (): Promise<void> => SecureStore.deleteItemAsync(KID_TOKEN_KEY)

// ── Active student ───────────────────────────────────────────────────────────

export const getStoredActiveStudent = (): Promise<string | null> =>
  SecureStore.getItemAsync(ACTIVE_STUDENT_KEY)

export const storeActiveStudent = (studentId: string): Promise<void> =>
  SecureStore.setItemAsync(ACTIVE_STUDENT_KEY, studentId)

/**
 * Signing out clears everything, the kid session included: the kid token was
 * issued off the back of this parent session, so leaving it behind would keep
 * the child's data reachable on a device the parent has signed out of.
 */
export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
  await SecureStore.deleteItemAsync(KID_TOKEN_KEY)
  await SecureStore.deleteItemAsync(ACTIVE_STUDENT_KEY)
}
