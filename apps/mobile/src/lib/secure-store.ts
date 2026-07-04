// secure-store.ts
//
// Thin wrapper around expo-secure-store for the parent session tokens.
// The web app keeps these in httpOnly cookies; mobile stores them in the
// device keychain/keystore and attaches the access token as a Bearer header.
import * as SecureStore from 'expo-secure-store'

const ACCESS_KEY = 'kidhub.access'
const REFRESH_KEY = 'kidhub.refresh'

export const getAccessToken = (): Promise<string | null> => SecureStore.getItemAsync(ACCESS_KEY)
export const getRefreshToken = (): Promise<string | null> => SecureStore.getItemAsync(REFRESH_KEY)

export const setTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  await SecureStore.setItemAsync(ACCESS_KEY, accessToken)
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken)
}

export const clearTokens = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(ACCESS_KEY)
  await SecureStore.deleteItemAsync(REFRESH_KEY)
}
