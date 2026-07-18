import { useCallback } from 'react'
import { AppState } from 'react-native'
import { useFocusEffect } from 'expo-router'
import * as ScreenOrientation from 'expo-screen-orientation'

export type LockMode = 'portrait' | 'landscape'

/**
 * Lock to `mode` while focused. Landscape uses `OrientationLock.LANDSCAPE`
 * (both variants, all devices — decision #2); portrait uses `PORTRAIT_UP`.
 */
const toLock = (mode: LockMode) =>
  ScreenOrientation.lockAsync(
    mode === 'portrait'
      ? ScreenOrientation.OrientationLock.PORTRAIT_UP
      : ScreenOrientation.OrientationLock.LANDSCAPE
  )

/**
 * Locks orientation while the screen is focused and RESTORES portrait on blur.
 * The focus/blur pairing guarantees restoration on gesture-back, tab switch,
 * deep-link exit and hardware back. For landscape screens the lock is also
 * re-asserted on foreground, since the OS may reset orientation on resume.
 */
export function useOrientationLock(mode: LockMode) {
  useFocusEffect(
    useCallback(() => {
      // Await the rotation before revealing content (see the OrientationLock gate).
      toLock(mode).catch(() => {})

      const appStateSub =
        mode === 'landscape'
          ? AppState.addEventListener('change', (state) => {
              if (state === 'active') toLock('landscape').catch(() => {})
            })
          : null

      return () => {
        appStateSub?.remove()
        // Always return to the app baseline on leave.
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {})
      }
    }, [mode])
  )
}
