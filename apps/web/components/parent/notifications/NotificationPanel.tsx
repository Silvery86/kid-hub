'use client'

/** The inbox itself — a list, a read state, and a way to clear it. */

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Stagger } from '@/components/ui/Stagger'
import { Spinner } from '@/components/ui/Spinner'
import { STAGGER_TIGHT } from '@/lib/motion'
import { relativeTime } from '@/lib/relative-time'
import type { NotificationView } from '@/server/actions/notification.actions'

export interface NotificationPanelProps {
  items: NotificationView[]
  isLoading: boolean
  onMarkAllRead: () => void
  onOpen: (item: NotificationView) => void
}


export const NotificationPanel = ({
  items,
  isLoading,
  onMarkAllRead,
  onOpen,
}: NotificationPanelProps) => {
  const hasUnread = items.some((i) => !i.isRead)

  return (
    <div className="w-80 overflow-hidden rounded-2xl border border-border-soft bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-border-soft px-4 py-2.5">
        <p className="text-[11px] font-extrabold tracking-wide text-text-muted uppercase">
          Thông báo
        </p>
        {hasUnread ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[11px] font-black text-btn-primary hover:underline"
          >
            Đánh dấu đã đọc
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 px-4 py-8 text-xs font-bold text-text-muted">
          <Spinner size={14} /> Đang tải…
        </div>
      ) : items.length === 0 ? (
        <p className="px-4 py-8 text-center text-xs font-bold text-text-muted">
          Chưa có thông báo nào.
        </p>
      ) : (
        <ul className="max-h-96 list-none overflow-y-auto p-2">
          <Stagger preset="fadeSlideUp" step={STAGGER_TIGHT}>
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href ?? '/parent'}
                  onClick={() => onOpen(item)}
                  className={cn(
                    'flex items-start gap-2.5 rounded-xl px-2 py-2.5 hover:bg-surface-muted',
                    // Unread is carried by weight and a dot, not colour alone.
                    !item.isRead && 'bg-schedule-soft'
                  )}
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-pill bg-surface-muted text-sm">
                    {item.iconKey ?? '🔔'}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span
                      className={cn(
                        'block text-xs text-text-primary',
                        item.isRead ? 'font-bold' : 'font-black'
                      )}
                    >
                      {item.label}
                    </span>
                    <span className="mt-0.5 block text-[10px] font-bold text-text-muted">
                      {relativeTime(item.createdAt)}
                    </span>
                  </span>
                  {!item.isRead ? (
                    <span
                      aria-label="Chưa đọc"
                      className="mt-1 size-2 shrink-0 rounded-pill bg-btn-primary"
                    />
                  ) : null}
                </Link>
              </li>
            ))}
          </Stagger>
        </ul>
      )}
    </div>
  )
}
