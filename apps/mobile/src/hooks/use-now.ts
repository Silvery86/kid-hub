// use-now.ts — a ticking clock for "what is happening right now" UI.
//
// Mirrors the web useSchedule clock: 30s cadence, and no ticking while the app
// is not in the foreground, so a backgrounded app is not woken up to re-render.

import { useEffect, useState } from 'react'
import { AppState } from 'react-native'

const TICK_MS = 30_000

export function useNow(): Date | null {
  // Null on the first frame so nothing time-dependent renders before mount.
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const tick = () => {
      if (AppState.currentState === 'active') setNow(new Date())
    }
    const interval = setInterval(tick, TICK_MS)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') setNow(new Date())
    })
    return () => {
      clearInterval(interval)
      sub.remove()
    }
  }, [])

  return now
}
