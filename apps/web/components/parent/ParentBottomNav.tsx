'use client'

/**
 * Mobile navigation for parent mode.
 *
 * This used to live inside ParentDashboardView, which meant it rendered on
 * /parent and nowhere else. The sidebar is `md:flex`, so on a phone every
 * sub-route — kid-access, bell-schedule, school-breaks, students, devices —
 * had no navigation at all: the only way out was the browser back button.
 *
 * It belongs in the layout for the same reason the sidebar does. Both are the
 * shell, not the page.
 *
 * Mirrors the sidebar's first four entries. The rest (Các bé, Thiết bị) are a
 * tap further away on a phone, and Các bé is now reachable from the header
 * switcher anyway.
 */

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/parent', label: 'Tổng quan', icon: '🏠', view: null },
  { href: '/parent?view=schedule', label: 'Lịch học', icon: '📅', view: 'schedule' },
  { href: '/parent?view=grades', label: 'Điểm số', icon: '⭐', view: 'grades' },
  { href: '/parent/kid-access', label: 'Truy cập', icon: '🛡️', view: null },
] as const

export function ParentBottomNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view')

  const isActive = (item: (typeof NAV)[number]): boolean => {
    if (item.href === '/parent/kid-access') return pathname === '/parent/kid-access'
    if (pathname !== '/parent') return false
    return currentView === item.view
  }

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white md:hidden"
      // Clears the iOS home indicator; collapses to nothing everywhere else.
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item) ? 'page' : undefined}
          className={cn(
            'flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2 text-[10px] font-extrabold',
            isActive(item) ? 'text-btn-primary' : 'text-text-muted'
          )}
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  )
}
