'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

const NAV = [
  { href: '/parent', label: 'Tổng quan', icon: '🏠', view: 'overview' as const },
  { href: '/parent?view=schedule', label: 'Lịch học', icon: '📅', view: 'schedule' as const },
  { href: '/parent?view=grades', label: 'Điểm số', icon: '⭐', view: 'grades' as const },
  { href: '/parent/kid-access', label: 'Truy cập', icon: '🛡️', view: 'access' as const },
]

export function ParentSidebarNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view')

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
      <div className="mb-6 px-2">
        <div className="mb-2 flex items-center gap-2">
          <div className="grid size-8 place-items-center rounded-xl bg-btn-primary text-white">🌟</div>
          <div>
            <div className="text-[14px] font-black text-slate-800">Kid Hub</div>
            <div className="text-[10px] font-extrabold tracking-wide text-slate-400 uppercase">Parent</div>
          </div>
        </div>
        <div className="text-[15px] font-black text-slate-800">Parent Mode</div>
        <div className="mt-0.5 text-[11px] font-bold text-slate-400">Quản lý của Khôi</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.view === 'access'
            ? pathname.startsWith('/parent/kid-access')
            : pathname === '/parent' &&
              (
                (item.view === 'overview' && (currentView == null || currentView === 'overview')) ||
                (item.view === 'schedule' && currentView === 'schedule') ||
                (item.view === 'grades' && currentView === 'grades')
              )
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors',
                active ? 'bg-btn-primary text-white shadow-[0_8px_16px_-8px_var(--color-btn-primary)]' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-100 pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-bold text-amber-700 hover:bg-amber-100"
        >
          🧒 Về chế độ Kid
        </Link>
      </div>
    </aside>
  )
}
