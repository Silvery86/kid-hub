'use client'

import Link from 'next/link'
import { useMemo } from 'react'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import {
  DEFAULT_KID_ACCESS_TOGGLES,
  KID_ACCESS_FEATURES,
  KID_ACCESS_GROUP_LABELS,
  type KidAccessGroup,
} from '@/lib/data/kid-access'
import { STORAGE_KEYS } from '@/lib/constants'
import { AccessToggleRow } from './AccessToggleRow'
import { KidPatternSetup } from './KidPatternSetup'
import { cn } from '@/lib/utils'

const RECENT_ACTIVITY = [
  { icon: '🔢', text: 'Chơi Number Ninja · Cấp 2', time: '09:20', dur: '12 phút' },
  { icon: '🔤', text: 'Mở Word Safari · Cấp 1', time: '08:55', dur: '8 phút' },
  { icon: '📅', text: 'Xem lịch học', time: '07:35', dur: '2 phút' },
] as const

function ScreenTimeCard({ compact = false }: { compact?: boolean }) {
  const total = 120
  const used = 47
  const pct = Math.round((used / total) * 100)

  return (
    <div
      className={cn(
        'rounded-[22px] bg-btn-primary text-white shadow-[0_12px_28px_-12px_rgba(59,130,246,0.55)]',
        compact ? 'p-3.5' : 'px-5 py-4'
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div>
          <div className="text-[11px] font-extrabold tracking-wide uppercase opacity-85">
            Thời gian màn hình hôm nay
          </div>
          <div className={cn('font-black leading-none', compact ? 'text-xl' : 'text-[26px]')}>
            {used} / {total} phút
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-white/20 px-3 py-1.5 text-xs font-extrabold">
          Điều chỉnh
        </span>
      </div>
      <div className={cn('overflow-hidden rounded-full bg-white/25', compact ? 'h-2' : 'h-2.5')}>
        <div className="h-full rounded-full bg-white" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function AccessGroups({
  toggles,
  onToggle,
  compact,
}: {
  toggles: Record<string, boolean>
  onToggle: (id: string) => void
  compact?: boolean
}) {
  const groups: KidAccessGroup[] = ['games', 'views', 'settings']
  return (
    <div className={cn('flex flex-col', compact ? 'gap-4' : 'gap-5')}>
      {groups.map((group) => (
        <div key={group}>
          <div className="mb-2 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
            {KID_ACCESS_GROUP_LABELS[group]}
          </div>
          <div className={cn('flex flex-col', compact ? 'gap-1.5' : 'gap-2')}>
            {KID_ACCESS_FEATURES.filter((f) => f.group === group).map((f) => (
              <AccessToggleRow
                key={f.id}
                feature={f}
                enabled={toggles[f.id] ?? true}
                onToggle={() => onToggle(f.id)}
                compact={compact}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function ActivitySidebar({ compact }: { compact?: boolean }) {
  return (
    <aside className="flex flex-col gap-3">
      <div className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
        Hoạt động gần đây
      </div>
      {RECENT_ACTIVITY.map((a) => (
        <div
          key={a.text}
          className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm md:rounded-[18px] md:p-4"
        >
          <span className={compact ? 'text-xl' : 'text-2xl'} aria-hidden="true">
            {a.icon}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-slate-800">{a.text}</div>
            {!compact ? (
              <div className="mt-0.5 text-xs font-bold text-slate-400">Hôm nay {a.time}</div>
            ) : null}
          </div>
          <span className="shrink-0 text-xs font-extrabold text-slate-500">{a.dur}</span>
        </div>
      ))}
    </aside>
  )
}

export function KidAccessView() {
  const [toggles, setToggles] = useLocalStorage<Record<string, boolean>>(
    STORAGE_KEYS.KID_ACCESS_TOGGLES,
    DEFAULT_KID_ACCESS_TOGGLES
  )

  const handleToggle = (id: string) => {
    setToggles((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))
  }

  const headerBack = (
    <Link
      href="/parent"
      className="shrink-0 rounded-full bg-white px-3 py-2 text-xs font-extrabold text-slate-600 shadow-sm md:px-4 md:text-sm"
    >
      ← Quay lại
    </Link>
  )

  const mainGroups = useMemo(
    () => <AccessGroups toggles={toggles} onToggle={handleToggle} />,
    [toggles]
  )

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Phone */}
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-3.5 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-black text-slate-800">🛡️ Quyền truy cập</h1>
          {headerBack}
        </div>
        <KidPatternSetup compact />
        <ScreenTimeCard compact />
        <AccessGroups toggles={toggles} onToggle={handleToggle} compact />
      </div>

      {/* Tablet+ */}
      <div className="hidden min-h-0 flex-1 flex-col gap-5 overflow-hidden p-5 md:flex md:p-6 lg:p-7">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-black text-slate-800 lg:text-[32px]">
              🛡️ Quyền truy cập Khôi
            </h1>
            <p className="mt-1 text-sm font-bold text-slate-500">
              Kiểm soát nội dung, thời gian sử dụng và tính năng
            </p>
          </div>
          {headerBack}
        </div>
        <KidPatternSetup />
        <ScreenTimeCard />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-y-auto">{mainGroups}</div>
          <ActivitySidebar />
        </div>
      </div>
    </div>
  )
}
