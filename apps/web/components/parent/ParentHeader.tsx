'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOutParentAction } from '@/server/actions/auth.actions'

export function ParentHeader({ compact = false }: { compact?: boolean }) {
  const router = useRouter()

  const handleSignOut = async () => {
    await signOutParentAction()
    router.push('/parent/login')
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        compact ? 'mb-3' : 'mb-4 md:mb-5'
      )}
    >
      <div>
        <h1
          className={cn(
            'm-0 font-black tracking-tight text-slate-800',
            compact ? 'text-[22px]' : 'text-2xl md:text-[30px]'
          )}
        >
          ⚙️ Parent Mode
        </h1>
        <p
          className={cn(
            'mt-1 font-bold text-slate-500',
            compact ? 'text-xs' : 'text-sm'
          )}
        >
          Quản lý thời khóa biểu và điểm số của Khôi
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Link
          href="/parent/kid-access"
          className={cn(
            'rounded-2xl bg-emerald-50 font-extrabold text-emerald-700 shadow-sm transition-colors hover:bg-emerald-100',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm md:px-5 md:py-3'
          )}
        >
          🔓 Cài mở khóa bé
        </Link>
        <Link
          href="/dashboard"
          className={cn(
            'rounded-2xl bg-white font-extrabold text-slate-500 shadow-sm transition-colors hover:bg-slate-100',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm md:px-5 md:py-3'
          )}
        >
          ← Về Dashboard
        </Link>
        <button
          type="button"
          onClick={() => void handleSignOut()}
          className={cn(
            'rounded-2xl bg-red-100 font-extrabold text-red-700 shadow-sm transition-colors hover:bg-red-200',
            compact ? 'px-3 py-2 text-xs' : 'px-4 py-2.5 text-sm md:px-5 md:py-3'
          )}
        >
          🔓 Đăng xuất
        </button>
      </div>
    </div>
  )
}
