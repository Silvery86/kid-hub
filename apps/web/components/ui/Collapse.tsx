'use client'

/**
 * Collapse — an accordion section that opens to its own height.
 *
 * `height: auto` cannot be transitioned, so the content is measured and the
 * pixel height animated, then released back to auto once open. Releasing
 * matters: a section pinned to a measured height clips its own content when the
 * text inside it reflows or the viewport narrows.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'
import { DURATION_SLOW } from '@/lib/motion'

export interface CollapseProps {
  open: boolean
  children: ReactNode
  className?: string
  durationMs?: number
}

export const Collapse = ({ open, children, className, durationMs = DURATION_SLOW }: CollapseProps) => {
  const inner = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)

  useEffect(() => {
    const node = inner.current
    if (!node) return

    if (reduced) {
      setHeight(open ? 'auto' : 0)
      return
    }

    if (open) {
      setHeight(node.scrollHeight)
      const timer = window.setTimeout(() => setHeight('auto'), durationMs)
      return () => window.clearTimeout(timer)
    }

    // Going the other way needs a concrete starting height, or the transition
    // has nothing to run from.
    setHeight(node.scrollHeight)
    const raf = window.requestAnimationFrame(() => setHeight(0))
    return () => window.cancelAnimationFrame(raf)
  }, [open, durationMs, reduced])

  return (
    <div
      className={cn('overflow-hidden', className)}
      style={{
        height: height === 'auto' ? undefined : `${height}px`,
        transition: reduced ? undefined : `height ${durationMs}ms var(--ease-standard)`,
      }}
      aria-hidden={!open}
    >
      <div ref={inner}>{children}</div>
    </div>
  )
}
