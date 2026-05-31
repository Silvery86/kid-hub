'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import {
  KID_ACCESS_FEATURES,
  KID_ACCESS_GROUP_LABELS,
  type KidAccessGroup,
} from '@/lib/data/kid-access'
import { AccessToggleRow } from './AccessToggleRow'
import { KidPatternSetup } from './KidPatternSetup'
import { KidProgressPanel } from './KidProgressPanel'
import { RecentActivityPanel } from './RecentActivityPanel'
import { cn } from '@/lib/utils'
import type { KidProgressData } from '@/server/actions/kid-progress.actions'
import type { ScreenTimeData } from '@/server/actions/screen-time.actions'
import type { ActivityItem } from '@/server/actions/kid-access.actions'
import { saveKidAccessSettingsAction } from '@/server/actions/kid-access.actions'
import { setScreenTimeLimitAction } from '@/server/actions/screen-time.actions'

function ScreenTimeCard({
  screenTime,
  compact = false,
}: {
  screenTime: ScreenTimeData
  compact?: boolean
}) {
  const [limitMins, setLimitMins] = useState(screenTime.limitMins)
  const [, startTransition] = useTransition()

  const usedMins = Math.round(screenTime.usedSecs / 60)
  const pct = Math.min(100, Math.round((usedMins / limitMins) * 100))

  const adjustLimit = (delta: number) => {
    const next = Math.min(480, Math.max(30, limitMins + delta))
    setLimitMins(next)
    startTransition(() => { void setScreenTimeLimitAction(next) })
  }

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
            {usedMins} / {limitMins} phút
          </div>
        </div>
        {!compact && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => adjustLimit(-30)}
              className="rounded-full bg-white/20 px-2.5 py-1 text-sm font-extrabold hover:bg-white/30"
              aria-label="Giảm 30 phút"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => adjustLimit(30)}
              className="rounded-full bg-white/20 px-2.5 py-1 text-sm font-extrabold hover:bg-white/30"
              aria-label="Tăng 30 phút"
            >
              +
            </button>
          </div>
        )}
      </div>
      <div className={cn('overflow-hidden rounded-full bg-white/25', compact ? 'h-2' : 'h-2.5')}>
        <div
          className={cn('h-full rounded-full', pct >= 100 ? 'bg-red-300' : 'bg-white')}
          style={{ width: `${pct}%` }}
        />
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

export function KidAccessView({
  kidProgress,
  initialToggles,
  screenTime,
  recentActivity,
}: {
  kidProgress: KidProgressData | null
  initialToggles: Record<string, boolean>
  screenTime: ScreenTimeData
  recentActivity: ActivityItem[]
}) {
  const [toggles, setToggles] = useState<Record<string, boolean>>(initialToggles)
  const [, startTransition] = useTransition()

  const handleToggle = (id: string) => {
    setToggles((prev) => {
      const next = { ...prev, [id]: !(prev[id] ?? true) }
      startTransition(() => {
        void saveKidAccessSettingsAction(next)
      })
      return next
    })
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
        <ScreenTimeCard screenTime={screenTime} compact />
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
        <ScreenTimeCard screenTime={screenTime} />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1fr_280px]">
          <div className="min-h-0 overflow-y-auto">{mainGroups}</div>
          <aside className="flex flex-col gap-5 overflow-y-auto">
            <div>
              <div className="mb-2 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Tiến độ của Khôi
              </div>
              <div className="rounded-[22px] bg-white p-4 shadow-sm">
                <KidProgressPanel progress={kidProgress} />
              </div>
            </div>
            <div>
              <div className="mb-2 text-xs font-extrabold tracking-wide text-slate-400 uppercase">
                Hoạt động gần đây
              </div>
              <RecentActivityPanel activities={recentActivity} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
