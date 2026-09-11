'use client'

/**
 * The bell in the parent header, and its unread count.
 *
 * The count arrives from the server on render and is refreshed when the panel is
 * opened. There is no polling and no socket: an inbox that costs a persistent
 * connection per parent is a real bill on Vercel's function model, and the
 * events here — a badge, a finished homework — are not ones a parent is waiting
 * on by the second.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { Bell } from 'lucide-react'

import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import {
  getNotificationsAction,
  markAllNotificationsReadAction,
  markNotificationsReadAction,
  type NotificationView,
} from '@/server/actions/notification.actions'
import { NotificationPanel } from './NotificationPanel'

export interface NotificationBellProps {
  /** Rendered by the server so the badge is correct on first paint. */
  initialUnread: number
}

export const NotificationBell = ({ initialUnread }: NotificationBellProps) => {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationView[]>([])
  const [unread, setUnread] = useState(initialUnread)
  const [isLoading, setIsLoading] = useState(false)
  const [, startTransition] = useTransition()
  const containerRef = useRef<HTMLDivElement>(null)

  // Same reasoning as StudentSwitcher: pointerdown so the menu closes before the
  // tap behind it lands.
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const load = useCallback(async () => {
    setIsLoading(true)
    const result = await getNotificationsAction()
    setIsLoading(false)
    if (!result.success) return
    setItems(result.data)
    setUnread(result.data.filter((i) => !i.isRead).length)
  }, [])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) void load()
  }

  const markAllRead = () => {
    // Optimistic: the server cannot refuse this one, and a parent who taps
    // "đánh dấu đã đọc" should not watch a round-trip to see it happen.
    setItems((current) => current.map((i) => ({ ...i, isRead: true })))
    setUnread(0)
    startTransition(async () => {
      await markAllNotificationsReadAction()
    })
  }

  const openItem = (item: NotificationView) => {
    if (item.isRead) return
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, isRead: true } : i)))
    setUnread((n) => Math.max(0, n - 1))
    startTransition(async () => {
      await markNotificationsReadAction([item.id])
    })
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={unread > 0 ? `Thông báo, ${unread} chưa đọc` : 'Thông báo'}
        className="relative grid size-9 place-items-center rounded-pill bg-white shadow-sm transition-colors hover:bg-surface-muted"
      >
        <Bell size={17} className="text-text-secondary" />
        {unread > 0 ? (
          <span className="animate-pop-in absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-pill border-2 border-shell-parent bg-btn-danger-border px-1 text-[10px] font-black text-white">
            <AnimatedNumber value={unread > 99 ? 99 : unread} />
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="animate-in fade-in zoom-in-95 anim-duration-200 absolute right-0 z-50 mt-2 origin-top-right">
          <NotificationPanel
            items={items}
            isLoading={isLoading}
            onMarkAllRead={markAllRead}
            onOpen={openItem}
          />
        </div>
      ) : null}
    </div>
  )
}
