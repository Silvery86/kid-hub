'use client'

/**
 * Turn newly-earned badge ids into celebrations.
 *
 * The bridge between a server result (`newBadgeIds: string[]`) and the motion
 * layer, which knows nothing about badges. Kept out of components/ui for that
 * reason: the primitives stay domain-free, and the domain knowledge lives here.
 *
 * Safe to call with an empty array, which is what most sessions return — so a
 * caller never has to guard it.
 */

import { BADGE_DEFINITIONS } from '@kid-hub/shared'
import { celebration } from '@/hooks/animation'

export const celebrateBadges = (badgeIds: readonly string[]): void => {
  badgeIds.forEach((id) => {
    const badge = BADGE_DEFINITIONS.find((b) => b.id === id)
    // An id with no definition is a catalogue mismatch, not something to show a
    // child a blank card for.
    if (!badge) return
    celebration.show({
      title: 'Con vừa nhận huy hiệu!',
      description: `${badge.name} — ${badge.description}`,
      icon: badge.iconEmoji,
      intensity: 'big',
      // Keyed by badge, so a re-render that reports the same award again — or a
      // retried save — cannot queue it twice.
      key: `badge:${id}`,
    })
  })
}
