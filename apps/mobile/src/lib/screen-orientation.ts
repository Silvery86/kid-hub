// screen-orientation.ts — defensive wrapper around expo-screen-orientation.
//
// The native side of this module only exists in a dev/EAS build made AFTER the
// `expo-screen-orientation` config plugin was added. Importing the package at
// module scope on an older binary throws `Cannot find native module
// 'ExpoScreenOrientation'` while the module is still evaluating — which means the
// importing route never gets a default export and expo-router tears down the whole
// tree (root `_layout` included). OTA updates ship JS to existing binaries, so this
// is reachable in production, not just during local development.
//
// Everything here therefore no-ops when the native module is absent: the app keeps
// running, it just loses orientation control until the device takes a new build.

type OrientationModule = typeof import('expo-screen-orientation')

const native: OrientationModule | null = (() => {
  try {
    return require('expo-screen-orientation') as OrientationModule
  } catch {
    return null
  }
})()

/** False when running on a binary that predates the config plugin. */
export const isOrientationControlAvailable = native !== null

export const lockPortrait = async (): Promise<void> => {
  if (!native) return
  try {
    await native.lockAsync(native.OrientationLock.PORTRAIT_UP)
  } catch {
    // Ignore — orientation is best-effort.
  }
}

export const lockLandscape = async (): Promise<void> => {
  if (!native) return
  try {
    await native.lockAsync(native.OrientationLock.LANDSCAPE)
  } catch {
    // Ignore — orientation is best-effort.
  }
}

/**
 * Fire `onLandscape` once the device reports either landscape variant.
 * Returns an unsubscribe function. No-ops (never fires) when unavailable —
 * callers must not gate rendering on it without checking availability.
 */
export const subscribeToLandscape = (onLandscape: () => void): (() => void) => {
  if (!native) return () => {}
  const mod = native
  const sub = mod.addOrientationChangeListener((event) => {
    const o = event.orientationInfo.orientation
    if (
      o === mod.Orientation.LANDSCAPE_LEFT ||
      o === mod.Orientation.LANDSCAPE_RIGHT
    ) {
      onLandscape()
    }
  })
  return () => sub.remove()
}
