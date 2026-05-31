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

function RewardCard({
  compact = false,
}: {
  compact?: boolean
}) {
  const [enabled, setEnabled] = useState(true)
  return (
    <div className={cn('rounded-[22px] border border-amber-200 bg-amber-50', compact ? 'p-3.5' : 'p-4')}>
      <div className="flex items-center gap-3">
        <span className={cn(compact ? 'text-2xl' : 'text-3xl')} aria-hidden="true">🎁</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-black text-amber-800">Phần thưởng thời gian chơi</p>
          <p className="mt-0.5 text-xs font-bold text-amber-700">
            Mỗi bài tập hoàn thành = +15 phút chơi game
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEnabled((v) => !v)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-extrabold text-white',
            enabled ? 'bg-amber-500' : 'bg-slate-400'
          )}
        >
          {enabled ? 'Đang bật' : 'Đang tắt'}
        </button>
      </div>
    </div>
  )
}

function DifficultyCaps({
  compact = false,
}: {
  compact?: boolean
}) {
  const [mathLevel, setMathLevel] = useState(2)
  const [englishLevel, setEnglishLevel] = useState(3)

  const Row = ({
    emoji,
    label,
    value,
    onChange,
  }: {
    emoji: string
    label: string
    value: number
    onChange: (next: number) => void
  }) => (
    <div className="flex items-center gap-2.5">
      <span className={cn(compact ? 'text-base' : 'text-lg')} aria-hidden="true">{emoji}</span>
      <span className="min-w-0 flex-1 text-sm font-extrabold text-slate-700">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3].map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => onChange(lv)}
            className={cn(
              'grid size-8 place-items-center rounded-lg text-xs font-black',
              value >= lv ? 'bg-btn-primary text-white' : 'bg-slate-100 text-slate-500'
            )}
          >
            {lv}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div className={cn('rounded-[22px] bg-white shadow-sm', compact ? 'p-3.5' : 'p-4')}>
      <p className="mb-3 text-xs font-extrabold tracking-wide text-slate-400 uppercase">Giới hạn độ khó</p>
      <div className="flex flex-col gap-3">
        <Row emoji="🧮" label="Toán" value={mathLevel} onChange={setMathLevel} />
        <Row emoji="🔤" label="Tiếng Anh" value={englishLevel} onChange={setEnglishLevel} />
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

  const mainGroups = useMemo(() => <AccessGroups toggles={toggles} onToggle={handleToggle} />, [toggles])
  const compactGroups = useMemo(() => <AccessGroups toggles={toggles} onToggle={handleToggle} compact />, [toggles])

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      {/* Phone */}
      <div className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-3.5 md:hidden">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-black text-slate-800">🛡️ Quyền truy cập</h1>
            <p className="text-xs font-bold text-slate-500">Kiểm soát nội dung và thời gian của Khôi</p>
          </div>
          {headerBack}
        </div>
        <ScreenTimeCard screenTime={screenTime} compact />
        <RewardCard compact />
        <DifficultyCaps compact />
        <KidPatternSetup compact />
        {compactGroups}
        <RecentActivityPanel activities={recentActivity} />
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
        <ScreenTimeCard screenTime={screenTime} />
        <RewardCard />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-6 overflow-hidden lg:grid-cols-[1.45fr_1fr]">
          <div className="min-h-0 overflow-y-auto">
            {mainGroups}
          </div>
          <aside className="flex flex-col gap-5 overflow-y-auto">
            <DifficultyCaps />
            <KidPatternSetup />
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
                Nhật ký hoạt động
              </div>
              <RecentActivityPanel activities={recentActivity} />
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
