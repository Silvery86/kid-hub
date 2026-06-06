'use client'

import { useTransition } from 'react'
import { cn } from '@/lib/utils'
import { getSubjectById } from '@/lib/data/subjects'
import { completeHomeworkAction } from '@/server/actions/homework.actions'
import type { HomeworkItem } from '@/types'

export function HomeworkItemRow({
  item,
  isPriority = false,
  compact = false,
  onDone,
}: {
  item: HomeworkItem
  isPriority?: boolean
  compact?: boolean
  onDone?: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const subject = getSubjectById(item.subjectId)
  const color = subject?.color ?? '#94a3b8'

  const handleToggle = () => {
    if (item.isDone || isPending) return
    startTransition(async () => {
      const result = await completeHomeworkAction(item.periodId)
      if (result.success) onDone?.()
    })
  }

  return (
    <button
      type="button"
      onClick={() => handleToggle()}
      disabled={item.isDone || isPending}
      className={cn(
        'flex w-full items-center gap-3 text-left transition-opacity',
        compact ? 'gap-2.5 rounded-2xl p-3' : 'gap-3.5 rounded-[20px] p-4',
        item.isDone ? 'bg-slate-50 opacity-60' : 'bg-white shadow-sm',
        isPriority && !item.isDone && 'border-2'
      )}
      style={
        isPriority && !item.isDone
          ? { borderColor: color, boxShadow: `0 8px 20px -12px ${color}` }
          : undefined
      }
    >
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-[13px]',
          compact ? 'h-[38px] w-[38px] text-lg rounded-[10px]' : 'h-12 w-12 text-2xl'
        )}
        style={{
          background: item.isDone ? '#f1f5f9' : `color-mix(in oklab, ${color} 15%, white)`,
        }}
        aria-hidden="true"
      >
        {subject?.icon ?? '📚'}
      </div>
      <div className="min-w-0 flex-1">
        <div
          className={cn(
            'truncate font-black text-slate-800',
            compact ? 'text-[13px]' : 'text-[15px]',
            item.isDone && 'line-through'
          )}
        >
          {item.homeworkNote || subject?.name || 'Bài tập'}
        </div>
        {subject ? (
          <div className={cn('font-bold text-slate-500', compact ? 'mt-0.5 text-[11px]' : 'mt-0.5 text-xs')}>
            {subject.name}
          </div>
        ) : null}
      </div>
      {isPriority && !item.isDone ? (
        <span
          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-black md:text-[11px]"
          style={{
            background: `color-mix(in oklab, ${color} 12%, white)`,
            color,
          }}
        >
          Ưu tiên
        </span>
      ) : null}
      <div
        className={cn(
          'grid shrink-0 place-items-center rounded-full font-black text-white',
          compact ? 'h-[26px] w-[26px] text-xs' : 'h-8 w-8 text-sm',
          item.isDone ? 'bg-emerald-500' : 'border-[3px] border-slate-200 bg-white text-transparent'
        )}
        aria-hidden="true"
      >
        {item.isDone ? '✓' : ''}
      </div>
    </button>
  )
}
