import { useCallback } from 'react'
import { AppState } from 'react-native'
import { useFocusEffect } from 'expo-router'

import { lockLandscape, lockPortrait } from '@/lib/screen-orientation'

export type LockMode = 'portrait' | 'landscape'

/**
 * Lock to `mode` while focused. Landscape uses `OrientationLock.LANDSCAPE`
 * (both variants, all devices — decision #2); portrait uses `PORTRAIT_UP`.
 * Calls go through lib/screen-orientation, which no-ops when the native module
 * is absent (binary predates the config plugin) instead of throwing.
 */
const toLock = (mode: LockMode) => (mode === 'portrait' ? lockPortrait() : lockLandscape())

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
      void toLock(mode)

      const appStateSub =
        mode === 'landscape'
          ? AppState.addEventListener('change', (state) => {
              if (state === 'active') void lockLandscape()
            })
          : null

      return () => {
        appStateSub?.remove()
        // Always return to the app baseline on leave.
        void lockPortrait()
      }
    }, [mode])
  )
}
