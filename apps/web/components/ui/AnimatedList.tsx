'use client'

/**
 * AnimatedList — rows that arrive and leave rather than blinking in and out.
 *
 * Removal is the hard half: React drops the node the moment the item leaves the
 * array, so a departing row is held in local state until its exit finishes.
 * That makes this component the owner of what is on screen, which may briefly be
 * more than what is in `items`.
 *
 * Whether a row is new is recorded on the row itself when it is admitted, not
 * looked up from a ref while rendering — the compiler's `react-hooks/refs` rule
 * forbids the latter, and a discarded render must not leave a row marked seen.
 */

import { useEffect, useState, type ReactNode } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion, useStagger } from '@/hooks/animation'
import { DURATION_SLOW } from '@/lib/motion'

export interface AnimatedListProps<T> {
  items: readonly T[]
  getKey: (item: T) => string
  children: (item: T) => ReactNode
  className?: string
  /** Set false once the list is long enough that a cascade would drag. */
  stagger?: boolean
}

interface Row<T> {
  key: string
  item: T
  /** Plays an entrance. Cleared once the animation has had time to finish. */
  entering: boolean
  /** Held on screen only until its exit finishes. */
  leaving: boolean
}

export const AnimatedList = <T,>({
  items,
  getKey,
  children,
  className,
  stagger = true,
}: AnimatedListProps<T>) => {
  const reduced = useReducedMotion()
  const [rows, setRows] = useState<Row<T>[]>(() =>
    items.map((item) => ({ key: getKey(item), item, entering: true, leaving: false }))
  )

  useEffect(() => {
    const live = items.map((item) => ({ key: getKey(item), item }))
    const liveKeys = new Set(live.map((l) => l.key))

    setRows((current) => {
      const currentKeys = new Set(current.map((r) => r.key))

      // Existing rows keep their slot — a departing row holding position is what
      // stops the list jumping while it animates out.
      const kept: Row<T>[] = current.map((row) => {
        const still = live.find((l) => l.key === row.key)
        if (still) return { ...row, item: still.item, leaving: false }
        return { ...row, leaving: true }
      })

      const added: Row<T>[] = live
        .filter((l) => !currentKeys.has(l.key))
        .map((l) => ({ key: l.key, item: l.item, entering: true, leaving: false }))

      return [...kept, ...added]
    })

    const timer = window.setTimeout(
      () =>
        setRows((current) =>
          current.filter((r) => liveKeys.has(r.key)).map((r) => ({ ...r, entering: false }))
        ),
      reduced ? 0 : DURATION_SLOW
    )
    return () => window.clearTimeout(timer)
  }, [items, getKey, reduced])

  const delays = useStagger(rows.length)

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {rows.map((row, index) => (
        <div
          key={row.key}
          className={cn(
            !reduced && row.leaving && 'animate-fade-slide-down',
            !reduced && !row.leaving && row.entering && 'animate-fade-slide-up'
          )}
          style={
            !reduced && stagger && row.entering && !row.leaving && delays[index]
              ? { animationDelay: `${delays[index]}ms` }
              : undefined
          }
        >
          {children(row.item)}
        </div>
      ))}
    </div>
  )
}
