'use client'

/** FullScreenModal — portal-rendered overlay with close button and focus trap. */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnimatedMount, useReducedMotion } from '@/hooks/animation'
import { DURATION_BASE } from '@/lib/motion'

export interface FullScreenModalProps {
  isOpen: boolean
  onClose?: () => void
  hasCloseButton?: boolean
  children: React.ReactNode
  className?: string
}

export const FullScreenModal = ({
  isOpen,
  onClose,
  hasCloseButton = true,
  children,
  className,
}: FullScreenModalProps) => {
  const canUsePortal = typeof document !== 'undefined'
  const reduced = useReducedMotion()
  // The modal entered with zoom-in-95 and then vanished on the frame `isOpen`
  // went false — React unmounts immediately, so the exit half never had anything
  // to play. This holds the node until the animation has run.
  const { shouldRender, state } = useAnimatedMount(isOpen, DURATION_BASE)

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!shouldRender || !canUsePortal) return null

  const leaving = state === 'exiting'

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 min-h-dvh w-screen safe-top',
        'bg-black/60 backdrop-blur-sm',
        'flex items-center justify-center',
        // Entry and exit both, from globals.css. Symmetric now: it used to
        // enter over 200ms and leave in a single frame.
        !reduced && (leaving ? 'animate-pop-out' : 'animate-in fade-in zoom-in-95 anim-duration-200')
      )}
      // A dialog mid-exit must not swallow a click meant for the page behind it.
      style={leaving ? { pointerEvents: 'none' } : undefined}
    >
      <div className={cn('relative h-full w-full', className)}>
        {hasCloseButton && onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{ minHeight: '3.5rem', minWidth: '3.5rem' }}
            className="absolute top-4 right-4 z-10 flex items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform active:scale-95"
          >
            <X size={28} className="text-text-primary" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
