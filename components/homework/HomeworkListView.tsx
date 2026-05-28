'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { HomeworkHeader } from './HomeworkHeader'
import { HomeworkItemRow } from './HomeworkItemRow'
import { cn } from '@/lib/utils'
import type { HomeworkItem } from '@/types'

function StatusPill({ children, tone }: { children: React.ReactNode; tone: 'amber' | 'emerald' }) {
  return (
    <span
      className={cn(
        'rounded-full px-3 py-1 text-xs font-extrabold',
        tone === 'amber' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
      )}
    >
      {children}
    </span>
  )
}

export function HomeworkListView({ initialItems }: { initialItems: HomeworkItem[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [, startRefresh] = useTransition()
  const [showCelebration, setShowCelebration] = useState(false)

  const pending = useMemo(() => items.filter((i) => !i.isDone), [items])
  const finished = useMemo(() => items.filter((i) => i.isDone), [items])
  const doneCount = finished.length
  const total = items.length

  const priorityIds = useMemo(() => {
    return new Set(pending.slice(0, 2).map((i) => i.periodId))
  }, [pending])

  const onRowDone = (periodId: string) => {
    setItems((prev) => {
      const next = prev.map((i) => (i.periodId === periodId ? { ...i, isDone: true } : i))
      if (next.every((i) => i.isDone)) {
        setShowCelebration(true)
        setTimeout(() => router.push('/dashboard'), 2000)
      }
      return next
    })
    startRefresh(() => router.refresh())
  }

  if (total === 0) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-shell-kid p-6 text-center">
        <div className="text-8xl" aria-hidden="true">
          🎉
        </div>
        <h1 className="text-3xl font-extrabold text-slate-800">Không có bài tập!</h1>
        <p className="font-bold text-slate-500">Hôm nay rảnh rỗi, chơi game nào.</p>
      </div>
    )
  }

  const itemList = (list: HomeworkItem[], compact?: boolean) =>
    list.map((item) => (
      <HomeworkItemRow
        key={item.periodId}
        item={item}
        compact={compact}
        isPriority={priorityIds.has(item.periodId)}
        onDone={() => onRowDone(item.periodId)}
      />
    ))

  return (
    <div className="relative flex h-dvh min-h-0 flex-col overflow-hidden bg-shell-kid portrait:overflow-y-auto">
      {/* Phone portrait */}
      <div className="hidden min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3.5 pb-4 pt-3.5 portrait:max-md:flex">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-[22px] font-black text-slate-800">Bài tập 📚</h1>
          {pending.length > 0 ? (
            <StatusPill tone="amber">{pending.length} chưa làm</StatusPill>
          ) : (
            <StatusPill tone="emerald">Xong hết!</StatusPill>
          )}
        </div>
        <HomeworkHeader total={total} done={doneCount} compact />
        <div className="flex flex-col gap-2">{itemList(items, true)}</div>
      </div>

      {/* Tablet+ */}
      <div className="hidden min-h-0 flex-1 flex-col gap-4 overflow-hidden p-5 md:flex md:gap-5 md:p-6 lg:p-7">
        <div className="flex shrink-0 flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-[30px] font-black text-slate-800 lg:text-[34px]">Bài tập 📚</h1>
            <p className="mt-1 text-sm font-bold text-slate-500 lg:text-[15px]">
              Hôm nay · {doneCount}/{total} hoàn thành
            </p>
          </div>
          {pending.length > 0 ? (
            <StatusPill tone="amber">{pending.length} bài chưa làm</StatusPill>
          ) : (
            <StatusPill tone="emerald">🎉 Xong hết rồi!</StatusPill>
          )}
        </div>
        <HomeworkHeader total={total} done={doneCount} />
        <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 overflow-hidden lg:grid-cols-2 lg:gap-5">
          <div className="flex min-h-0 flex-col gap-2.5">
            <div className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              Chưa làm ({pending.length})
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {itemList(pending)}
            </div>
          </div>
          <div className="flex min-h-0 flex-col gap-2.5">
            <div className="text-xs font-extrabold tracking-wide text-slate-400 uppercase">
              Đã hoàn thành ({finished.length})
            </div>
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {itemList(finished)}
            </div>
          </div>
        </div>
      </div>

      {showCelebration ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90">
          <div className="text-center">
            <div className="mb-4 text-8xl" aria-hidden="true">
              🎉
            </div>
            <h2 className="text-4xl font-extrabold text-slate-800">Xong hết rồi!</h2>
            <p className="mt-2 text-xl text-slate-500">Giỏi lắm Khôi! ⭐</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
