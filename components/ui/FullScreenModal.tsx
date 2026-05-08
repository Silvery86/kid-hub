'use client'

/** FullScreenModal — portal-rendered overlay with close button and focus trap. */

import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

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

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!isOpen || !canUsePortal) return null

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      className={cn(
        'fixed inset-0 z-50 h-screen w-screen',
        'bg-black/60 backdrop-blur-sm',
        'flex items-center justify-center',
        // Entry animation — uses utilities defined in globals.css
        'animate-in fade-in zoom-in-95 anim-duration-200'
      )}
    >
      <div className={cn('relative h-full w-full', className)}>
        {hasCloseButton && onClose && (
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute top-4 right-4 z-10 flex min-h-14 min-w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform active:scale-95"
          >
            <X size={28} className="text-slate-700" />
          </button>
        )}
        {children}
      </div>
    </div>,
    document.body
  )
}
