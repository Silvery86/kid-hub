'use client'

import { FullScreenModal } from '@/components/ui/FullScreenModal'
import { BADGE_DEFINITIONS } from '@/lib/data/badges'
import { useUserProgress } from '@/hooks/useUserProgress'
import { cn } from '@/lib/utils'

interface BadgeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const BadgeModal = ({ isOpen, onClose }: BadgeModalProps) => {
  const { progress } = useUserProgress()
  const earnedCount = progress.earnedBadges.filter((b) => b.isEarned).length

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <div className="flex h-full flex-col overflow-y-auto bg-slate-900 p-8">
        <div className="mb-8 text-center">
          <h2 className="text-4xl font-extrabold text-white">Huy hiệu của Khôi 🏆</h2>
          <p className="mt-2 text-lg text-slate-400">
            {earnedCount} / {BADGE_DEFINITIONS.length} đã đạt được
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 pb-8">
          {BADGE_DEFINITIONS.map((def) => {
            const earned = progress.earnedBadges.find((b) => b.id === def.id)
            const isEarned = earned?.isEarned ?? false

            return (
              <div
                key={def.id}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-3xl p-5 text-center',
                  isEarned ? 'bg-white/15 ring-1 ring-white/30' : 'bg-white/5 opacity-50'
                )}
              >
                <span className="text-5xl" aria-hidden="true">
                  {isEarned ? def.iconEmoji : '🔒'}
                </span>
                <p
                  className={cn(
                    'text-sm font-extrabold',
                    isEarned ? 'text-white' : 'text-slate-500'
                  )}
                >
                  {def.name}
                </p>
                <p className={cn('text-xs', isEarned ? 'text-slate-300' : 'text-slate-600')}>
                  {isEarned ? def.description : '???'}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </FullScreenModal>
  )
}
