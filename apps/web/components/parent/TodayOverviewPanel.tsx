import type { TodayView, ClassPeriod, DailyHomework } from '@/types'
import { getSubjectById } from '@/lib/data/subjects'
import { cn } from '@/lib/utils'

function formatViDate(dateStr: string): string {
  const parts = dateStr.split('-')
  const y = Number(parts[0] ?? 2025)
  const m = Number(parts[1] ?? 1)
  const d = Number(parts[2] ?? 1)
  const dow = new Date(y, m - 1, d).getDay()
  const names = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${names[dow]}, ${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}`
}

function PeriodRow({ period }: { period: ClassPeriod }) {
  const subj = getSubjectById(period.subjectId)
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className="shrink-0 text-base leading-none">{subj?.icon ?? '📚'}</span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-slate-700">
        {subj?.name ?? period.subjectId}
      </span>
      <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-400">
        {period.startTime}–{period.endTime}
      </span>
    </div>
  )
}

function HomeworkRow({ hw }: { hw: DailyHomework }) {
  const subj = getSubjectById(hw.subjectId)
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <span className={cn('shrink-0 text-base leading-none', hw.isDone && 'opacity-40')}>
        {subj?.icon ?? '📖'}
      </span>
      <span
        className={cn(
          'min-w-0 flex-1 truncate text-sm font-bold',
          hw.isDone ? 'text-slate-400 line-through' : 'text-slate-700'
        )}
      >
        {hw.label}
      </span>
      <span className="shrink-0 text-base leading-none">
        {hw.isDone ? '✅' : '⬜'}
      </span>
    </div>
  )
}

export function TodayOverviewPanel({
  todayView,
  compact = false,
}: {
  todayView: TodayView
  compact?: boolean
}) {
  const doneCount = todayView.homework.filter((hw) => hw.isDone).length
  const totalHw = todayView.homework.length
  const hasClasses = todayView.schoolPeriods.length > 0 || todayView.eveningBlocks.length > 0
  const isEmpty = !hasClasses && totalHw === 0

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {/* Date + homework badge */}
      <div className="flex shrink-0 items-center justify-between gap-2">
        <span className={cn('font-black text-slate-800', compact ? 'text-[15px]' : 'text-base')}>
          {formatViDate(todayView.date)}
        </span>
        {totalHw > 0 && (
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-[11px] font-extrabold',
              doneCount === totalHw
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
            )}
          >
            {doneCount}/{totalHw} bài tập
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-4 text-center">
          <span className="text-3xl">🌈</span>
          <span className="text-sm font-bold text-slate-400">Cuối tuần — không có lịch</span>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {/* School periods */}
          {todayView.schoolPeriods.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Lịch học ({todayView.schoolPeriods.length} tiết)
              </div>
              <div className="divide-y divide-slate-100">
                {todayView.schoolPeriods.map((p, i) => (
                  <PeriodRow key={p.id ?? i} period={p} />
                ))}
              </div>
            </div>
          )}

          {/* Evening extra classes */}
          {todayView.eveningBlocks.length > 0 && (
            <div>
              <div className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Học thêm buổi tối
              </div>
              <div className="divide-y divide-slate-100">
                {todayView.eveningBlocks.map((p, i) => (
                  <PeriodRow key={p.id ?? i} period={p} />
                ))}
              </div>
            </div>
          )}

          {/* Homework */}
          {totalHw > 0 ? (
            <div>
              <div className="mb-1 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
                Bài tập về nhà
              </div>
              <div className="divide-y divide-slate-100">
                {todayView.homework.map((hw) => (
                  <HomeworkRow key={hw.id} hw={hw} />
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-center text-xs font-bold text-slate-400">
              Chưa có bài tập nào được giao hôm nay
            </div>
          )}
        </div>
      )}
    </div>
  )
}
