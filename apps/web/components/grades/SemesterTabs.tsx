'use client'

import { cn } from '@/lib/utils'

export function SemesterTabs({
  active,
  onChange,
  compact = false,
}: {
  active: 1 | 2
  onChange: (sem: 1 | 2) => void
  compact?: boolean
}) {
  return (
    <div className="flex w-fit gap-1 rounded-2xl bg-white p-1 shadow-sm">
      {([1, 2] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          className={cn(
            'rounded-xl border-0 font-extrabold transition-colors',
            compact ? 'px-4 py-1.5 text-xs' : 'px-5 py-2 text-sm',
            active === s
              ? 'bg-btn-primary text-white shadow-[0_4px_10px_-4px_rgba(59,130,246,0.55)]'
              : 'text-slate-500'
          )}
        >
          Học kỳ {s}
        </button>
      ))}
    </div>
  )
}
