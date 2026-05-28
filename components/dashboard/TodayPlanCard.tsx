'use client'

/**
 * TodayPlanCard — right panel of the schedule page.
 * Shows today's evening extra classes and one-off homework items.
 * Landscape: visible alongside ScheduleGrid. Portrait: first tab.
 */

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { EveningBlockChip } from '@/components/dashboard/EveningBlockChip'
import { HomeworkCheckbox } from '@/components/dashboard/HomeworkCheckbox'
import { cancelExtraClassAction } from '@/server/actions/schedule.actions'
import type { TodayView } from '@/types'

interface TodayPlanCardProps {
  todayView: TodayView | null
  isParentMode?: boolean
}

export const TodayPlanCard = ({ todayView, isParentMode = false }: TodayPlanCardProps) => {
  const [cancelledIds, setCancelledIds] = useState<Set<string>>(
    new Set(todayView?.cancelledIds ?? [])
  )

  if (!todayView) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white/70 p-6">
        <p className="text-sm font-bold text-slate-400">Không có dữ liệu hôm nay</p>
      </div>
    )
  }

  const hasEvening = todayView.eveningBlocks.length > 0 || cancelledIds.size > 0
  const hasHomework = todayView.homework.length > 0
  const isEmpty = !hasEvening && !hasHomework

  const handleCancel = async (periodId: string) => {
    setCancelledIds((prev) => new Set([...prev, periodId]))
    const result = await cancelExtraClassAction(periodId, todayView.date)
    if (!result.success) {
      setCancelledIds((prev) => {
        const next = new Set(prev)
        next.delete(periodId)
        return next
      })
    }
  }

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto rounded-3xl bg-white/70 p-4">
      {/* Evening extra classes */}
      {hasEvening && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-violet-800">
            <span aria-hidden>🌙</span> Tối Nay
          </h2>
          <div className="flex flex-col gap-2">
            {todayView.eveningBlocks.map((block) => (
              <EveningBlockChip
                key={block.id}
                period={block}
                isCancelled={cancelledIds.has(block.id ?? '')}
                onCancel={handleCancel}
                isParentMode={isParentMode}
              />
            ))}
          </div>
        </section>
      )}

      {/* Daily homework */}
      {hasHomework && (
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-amber-800">
            <span aria-hidden>📚</span> Bài Tập Về Nhà
          </h2>
          <div className="flex flex-col gap-2">
            {todayView.homework.map((item) => (
              <HomeworkCheckbox key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {isEmpty && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
          <span className="text-4xl" aria-hidden>🎉</span>
          <p className="text-sm font-extrabold text-slate-500">Hôm nay không có lớp tối hay bài tập!</p>
        </div>
      )}
    </div>
  )
}
