'use client'

/**
 * The one place a "something wonderful happened" moment is raised.
 *
 * A module-level queue rather than component state, for the same reason
 * hooks/useToast.ts is: the moment is *raised* deep inside a game hook or a
 * homework handler, and *rendered* by a host mounted in a layout. Local state
 * cannot span that, and threading a callback from a layout down into every game
 * would put the celebration's plumbing in the way of the games themselves.
 *
 * A queue, not a slot. Finishing a session that earns two badges at once is
 * rare, but a child who earns two and is shown one has been short-changed by an
 * implementation detail.
 *
 * Sound is deliberately NOT here. Playing it needs useAudio, which is a hook, so
 * it belongs to <CelebrationHost> — the component that knows a celebration has
 * appeared on screen.
 */

import { useSyncExternalStore } from 'react'

export interface Celebration {
  title: string
  description?: string
  /** An emoji or short glyph. Nothing interprets it. */
  icon?: string
  /** `big` earns confetti; `small` is a quieter acknowledgement. */
  intensity?: 'small' | 'big'
  /** Distinct moments with the same key are only ever shown once. */
  key?: string
}

let queue: Celebration[] = []
const listeners = new Set<() => void>()

const emit = (): void => {
  listeners.forEach((fn) => fn())
}

export const celebration = {
  show: (input: Celebration): void => {
    // A re-render that re-reports the same award must not queue it twice.
    if (input.key && queue.some((c) => c.key === input.key)) return
    queue = [...queue, input]
    emit()
  },
  /** Dismiss the one on screen and let the next through. */
  next: (): void => {
    queue = queue.slice(1)
    emit()
  },
  clear: (): void => {
    queue = []
    emit()
  },
}

const subscribe = (onChange: () => void): (() => void) => {
  listeners.add(onChange)
  return () => listeners.delete(onChange)
}

const getSnapshot = (): Celebration | null => queue[0] ?? null
const getServerSnapshot = (): Celebration | null => null

/** The celebration currently on screen, if any. Only <CelebrationHost> needs it. */
export const useCelebration = (): Celebration | null =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
