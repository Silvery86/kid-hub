'use client'

import Link from 'next/link'
import type { HomeworkItem } from '@/types'

interface HomeworkChipProps {
  items: HomeworkItem[]
}

/** Entry-point chip shown on the dashboard when today has pending homework. */
export const HomeworkChip = ({ items }: HomeworkChipProps) => {
  const pending = items.filter((i) => !i.isDone).length
  if (pending === 0) return null

  return (
    <Link
      href="/homework"
      className="flex min-h-tap items-center gap-3 rounded-2xl bg-amber-50 p-4 shadow-sm transition-colors hover:bg-amber-100 active:scale-[0.98]"
      aria-label={`${pending} bài tập chưa làm`}
    >
      <span className="text-3xl" aria-hidden="true">
        📚
      </span>
      <div>
        <p className="font-extrabold text-slate-700">Bài tập</p>
        <p className="text-sm font-semibold text-amber-600">{pending} bài chưa làm</p>
      </div>
    </Link>
  )
}
