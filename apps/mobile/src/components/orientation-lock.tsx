import { useEffect, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import * as ScreenOrientation from 'expo-screen-orientation'

import { useOrientationLock, type LockMode } from '@/hooks/use-orientation-lock'

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
  const [settled, setSettled] = useState(mode === 'portrait')

  useEffect(() => {
    if (mode === 'portrait') return
    const sub = ScreenOrientation.addOrientationChangeListener((event) => {
      const o = event.orientationInfo.orientation
      if (
        o === ScreenOrientation.Orientation.LANDSCAPE_LEFT ||
        o === ScreenOrientation.Orientation.LANDSCAPE_RIGHT
      ) {
        setSettled(true)
      }
    })
    return () => sub.remove()
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
