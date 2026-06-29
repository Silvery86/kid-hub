'use client'

/** Silently increments today's screen time counter every 60 seconds while kid area is mounted. */

import { useEffect, useRef } from 'react'
import { addScreenTimeAction } from '@/server/actions/screen-time.actions'

const HEARTBEAT_SECS = 60

export function ScreenTimeTracker() {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      void addScreenTimeAction(HEARTBEAT_SECS)
    }, HEARTBEAT_SECS * 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return null
}
