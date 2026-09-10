'use client'

/**
 * One toast. Presentational, plus the clock that decides when it leaves.
 *
 * The clock lives here rather than in the store because it has to respond to
 * this element's own hover, and because a toast whose timer ran while the tab
 * was hidden was never actually shown to anyone — see the pause below.
 */

import { useEffect, useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useReducedMotion } from '@/hooks/animation'
import type { ToastItem } from '@/hooks/useToast'

export interface ToastProps {
  toast: ToastItem
  onDismiss: (id: string) => void
}

const TONE_STYLE: Record<ToastItem['tone'], { bar: string; icon: string }> = {
  success: { bar: 'border-l-success-strong', icon: 'text-success-strong' },
  error: { bar: 'border-l-btn-danger-border', icon: 'text-btn-danger-border' },
  info: { bar: 'border-l-btn-primary', icon: 'text-btn-primary' },
}

const TONE_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} as const

export const Toast = ({ toast, onDismiss }: ToastProps) => {
  const reduced = useReducedMotion()
  const [paused, setPaused] = useState(false)
  // Time left, so a resumed timer does not restart from the top.
  const remaining = useRef(toast.duration)
  const Icon = TONE_ICON[toast.tone]
  const tone = TONE_STYLE[toast.tone]

  useEffect(() => {
    if (toast.duration === null || toast.leaving) return

    const hidden = (): boolean => typeof document !== 'undefined' && document.hidden
    const shouldHold = (): boolean => paused || hidden()

    let started = Date.now()
    let timer: number | null = null

    const start = (): void => {
      if (shouldHold() || remaining.current === null) return
      started = Date.now()
      timer = window.setTimeout(() => onDismiss(toast.id), remaining.current)
    }

    const stop = (): void => {
      if (timer === null) return
      window.clearTimeout(timer)
      timer = null
      if (remaining.current !== null) remaining.current -= Date.now() - started
    }

    const onVisibility = (): void => {
      if (hidden()) stop()
      else start()
    }

    start()
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      stop()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [toast.id, toast.duration, toast.leaving, paused, onDismiss])

  return (
    <div
      // Success is an aside; a failure needs to interrupt whatever the screen
      // reader is doing, because the viewer's action did not take effect.
      role={toast.tone === 'error' ? 'alert' : 'status'}
      aria-live={toast.tone === 'error' ? 'assertive' : 'polite'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className={cn(
        'pointer-events-auto flex w-full items-start gap-2.5 rounded-row border border-border-soft border-l-4 bg-white p-3 shadow-lg',
        tone.bar,
        !reduced && (toast.leaving ? 'animate-pop-out' : 'animate-pop-in')
      )}
    >
      <Icon size={18} className={cn('mt-0.5 shrink-0', tone.icon)} aria-hidden="true" />

      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-text-primary">{toast.title}</p>
        {toast.description ? (
          <p className="mt-0.5 text-xs font-bold text-text-secondary">{toast.description}</p>
        ) : null}
        {toast.action ? (
          <button
            type="button"
            onClick={() => {
              toast.action?.onClick()
              onDismiss(toast.id)
            }}
            className="mt-1.5 text-xs font-black text-btn-primary hover:underline"
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Đóng thông báo"
        className="-mt-0.5 -mr-0.5 shrink-0 rounded-chip p-1 text-text-muted hover:bg-surface-muted hover:text-text-primary"
      >
        <X size={15} />
      </button>
    </div>
  )
}
