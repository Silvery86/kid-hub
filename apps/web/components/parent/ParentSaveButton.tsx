'use client'

import { cn } from '@/lib/utils'

export function ParentSaveButton({
  onClick,
  isPending = false,
  isSaved = false,
  label = 'Lưu',
}: {
  onClick: () => void
  isPending?: boolean
  isSaved?: boolean
  label?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isPending}
      className={cn(
        'flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-[13px] font-extrabold text-white shadow-md transition-colors disabled:opacity-70',
        isSaved ? 'bg-emerald-400 shadow-emerald-500/30' : 'bg-blue-500 shadow-blue-500/40'
      )}
    >
      <span>{isSaved ? '✓' : '💾'}</span>
      <span>{isSaved ? 'Đã lưu!' : isPending ? 'Đang lưu...' : label}</span>
    </button>
  )
}
