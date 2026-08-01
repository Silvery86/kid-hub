import { useEffect, useState, type ReactNode } from 'react'
import { View } from 'react-native'

import { useOrientationLock, type LockMode } from '@/hooks/use-orientation-lock'
import { isOrientationControlAvailable, subscribeToLandscape } from '@/lib/screen-orientation'

/**
 * Wrap a screen's content. It (1) locks orientation via the hook and (2) holds
 * a splash-colored curtain over the content until the device reports the target
 * orientation, eliminating the white flash / layout tear during rotation.
 *
 * Content is rendered underneath the curtain the whole time (so it lays out at
 * the correct size), and is revealed only once the orientation-change event
 * confirms the target — no wrong-orientation frame is ever shown.
 */
export function OrientationLock({
  mode,
  children,
}: {
  mode: LockMode
  children: ReactNode
}) {
  useOrientationLock(mode)

  // Portrait needs no rotation. And without the native module no rotation ever
  // happens (so no event ever fires) — start revealed rather than trapping the
  // screen behind a curtain that could never lift.
  const [settled, setSettled] = useState(mode === 'portrait' || !isOrientationControlAvailable)

  useEffect(() => {
    if (mode === 'portrait' || !isOrientationControlAvailable) return
    return subscribeToLandscape(() => setSettled(true))
  }, [mode])

  return (
    <View style={{ flex: 1 }}>
      {children}
      {!settled && (
        // Curtain matches the splash brand background (#208AEF) so the rotate
        // reads as an intentional transition, not a glitch.
        <View
          pointerEvents="none"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#208AEF' }}
        />
      )}
    </View>
  )
}
