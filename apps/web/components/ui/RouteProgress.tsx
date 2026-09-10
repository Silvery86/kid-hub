'use client'

/**
 * RouteProgress — a thin bar reporting that a navigation is in flight.
 *
 * WHY NOT useLinkStatus: Next 16 does export it, but it only reports `pending`
 * for the <Link> it is rendered inside. A bar mounted once in a layout sits
 * outside every Link's subtree and would report `pending: false` forever, so it
 * cannot be the mechanism for a global indicator.
 *
 * Instead: a capturing click listener notices navigations that start from an
 * internal anchor, and a pathname change ends them. Programmatic navigation
 * (router.push) is invisible to a click listener, so `startRouteProgress()` is
 * exported for those call sites to signal explicitly.
 *
 * The bar is indeterminate on purpose — it reports "working", never "how far",
 * because nothing here can know how far.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'

/** Module-level so a Server Action caller can signal without prop drilling. */
const listeners = new Set<() => void>()

/** Call before a programmatic navigation — router.push, form redirect. */
export const startRouteProgress = (): void => {
  listeners.forEach((fn) => fn())
}

/** Long enough to not flicker on an instant navigation. */
const SHOW_DELAY_MS = 120

export const RouteProgress = ({ className }: { className?: string }) => {
  const pathname = usePathname()
  const reduced = useReducedMotion()
  const [active, setActive] = useState(false)

  useEffect(() => {
    const begin = (): void => setActive(true)
    listeners.add(begin)

    const onClick = (event: MouseEvent): void => {
      // Let the browser have modified clicks and anything not a plain left-click.
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target && anchor.target !== '_self') return
      if (anchor.hasAttribute('download')) return
      if (anchor.origin !== window.location.origin) return
      // A same-page hash is not a navigation worth a progress bar.
      if (anchor.pathname === window.location.pathname && anchor.hash) return

      begin()
    }

    document.addEventListener('click', onClick, true)
    return () => {
      listeners.delete(begin)
      document.removeEventListener('click', onClick, true)
    }
  }, [])

  // The destination has rendered — whatever was in flight has landed.
  useEffect(() => {
    setActive(false)
  }, [pathname])

  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!active) {
      setVisible(false)
      return
    }
    const timer = window.setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [active])

  if (!visible) return null

  return (
    <div
      role="progressbar"
      aria-busy="true"
      aria-label="Đang tải trang"
      className={cn('pointer-events-none absolute inset-x-0 top-0 z-50 h-0.5 bg-surface-muted', className)}
    >
      <div
        className={cn('h-full bg-btn-primary', reduced ? 'w-1/3' : 'animate-route-progress')}
      />
    </div>
  )
}
