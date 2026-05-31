'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOutParentAction } from '@/server/actions/auth.actions'

const NAV = [
  { href: '/parent', label: 'Tổng quan', icon: '⚙️', exact: true },
  { href: '/parent/kid-access', label: 'Quyền truy cập', icon: '🛡️', exact: false },
]

export function ParentSidebarNav() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOutParentAction()
    router.push('/parent/login')
  }

  return (
    <aside className="hidden w-52 shrink-0 flex-col border-r border-slate-200 bg-white px-3 py-5 md:flex">
      <div className="mb-6 px-2">
        <div className="text-[15px] font-black text-slate-800">⚙️ Parent Mode</div>
        <div className="mt-0.5 text-[11px] font-bold text-slate-400">Quản lý của Khôi</div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-extrabold transition-colors',
                active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
              )}
            >
              <span className="text-base leading-none">{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="flex flex-col gap-1 border-t border-slate-100 pt-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-slate-500 hover:bg-slate-50"
        >
          ← Trang của bé
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
        >
          🔓 Đăng xuất
        </button>
      </div>
    </aside>
  )
}
