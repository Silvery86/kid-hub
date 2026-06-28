'use client'

/** ServiceWorkerRegistrar — registers the PWA service worker on mount. Renders nothing. */

import { useEffect } from 'react'

/**
 * Registers the service worker on first user interaction.
 * Renders nothing — side-effect only.
 */
export const ServiceWorkerRegistrar = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    // The ?v= parameter changes on every deploy, triggering SW update + cache rotation.
    const buildId = process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev'
    navigator.serviceWorker
      .register(`/sw.js?v=${buildId}`, { scope: '/' })
      .catch((err) => console.warn('[SW] Registration failed:', err))
  }, [])

  return null
}
