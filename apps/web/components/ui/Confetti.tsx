'use client'

/**
 * Confetti — a burst of CSS-transform particles. No library.
 *
 * Renders nothing at all under reduced motion, which is the honest degradation:
 * confetti carries no information, so removing it loses nothing. The message it
 * accompanies lives in <CelebrationOverlay> and stays.
 */

import { useMemo } from 'react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'

export interface ConfettiProps {
  /** Particle count. Kept modest — this runs on a school tablet. */
  count?: number
  className?: string
}

/** Semantic tokens only; these are celebratory, not status colours. */
const COLORS = [
  'var(--color-btn-primary)',
  'var(--color-tier-excellent-border)',
  'var(--color-success-strong)',
  'var(--color-btn-danger)',
  'var(--color-music)',
]

interface Particle {
  cx: string
  cy: string
  cr: string
  color: string
  delay: number
  duration: number
}

const buildParticles = (count: number): Particle[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5
    const distance = 48 + Math.random() * 54
    return {
      cx: `${Math.cos(angle) * distance}px`,
      cy: `${Math.sin(angle) * distance - 14}px`,
      cr: `${Math.round(Math.random() * 540 - 270)}deg`,
      color: COLORS[i % COLORS.length] ?? COLORS[0]!,
      delay: Math.round(Math.random() * 90),
      duration: 620 + Math.round(Math.random() * 320),
    }
  })

export const Confetti = ({ count = 18, className }: ConfettiProps) => {
  const reduced = useReducedMotion()
  // Positions are random, so they must be fixed for the life of the burst —
  // recomputing on re-render would teleport every particle mid-flight.
  const particles = useMemo(() => buildParticles(count), [count])

  if (reduced) return null

  return (
    <div aria-hidden="true" className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}>
      {particles.map((p, i) => (
        <span
          key={i}
          className="absolute top-[44%] left-1/2 h-[11px] w-[7px] rounded-[2px]"
          style={{
            background: p.color,
            ['--cx' as string]: p.cx,
            ['--cy' as string]: p.cy,
            ['--cr' as string]: p.cr,
            animation: `confettiFall ${p.duration}ms var(--ease-decelerate) ${p.delay}ms both`,
          }}
        />
      ))}
    </div>
  )
}
