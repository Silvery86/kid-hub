'use client'

/**
 * Where toasts appear. Mount once per route group layout.
 *
 * Placement is not symmetric between the two shells, on purpose:
 *
 *  - On a phone in parent mode, ParentBottomNav is fixed at h-14, so a toast
 *    anchored to the bottom would sit under it. It clears the nav *and* the
 *    home indicator via env(safe-area-inset-bottom).
 *  - From md up there is no bottom nav and the sidebar owns the left, so the
 *    toast moves to the top right, out of the reading column.
 */

import { cn } from '@/lib/utils'
import { toast, useToasts } from '@/hooks/useToast'
import { Toast } from './Toast'

export interface ToasterProps {
  /**
   * `parent` clears the fixed mobile bottom nav. `kid` has no such nav, so it
   * sits closer to the edge.
   */
  shell?: 'parent' | 'kid'
  className?: string
}

export const Toaster = ({ shell = 'parent', className }: ToasterProps) => {
  const toasts = useToasts()

  if (toasts.length === 0) return null

  return (
    <div
      // pointer-events-none on the container so the region never blocks a tap
      // meant for the page; each toast turns them back on for itself.
      className={cn(
        'pointer-events-none fixed z-50 flex flex-col gap-2',
        'inset-x-3 md:inset-x-auto md:top-4 md:right-4 md:w-80',
        shell === 'parent' ? 'bottom-[calc(3.5rem+env(safe-area-inset-bottom)+0.75rem)] md:bottom-auto'
                           : 'bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] md:bottom-auto',
        className
      )}
    >
      {toasts.map((item) => (
        <Toast key={item.id} toast={item} onDismiss={toast.dismiss} />
      ))}
    </div>
  )
}
