'use client';

import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { BADGE_DEFINITIONS } from '@/lib/data/badges';
import { useUserProgress } from '@/hooks/useUserProgress';
import { cn } from '@/lib/utils';

interface BadgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BadgeModal = ({ isOpen, onClose }: BadgeModalProps) => {
  const { progress } = useUserProgress();
  const earnedCount = progress.earnedBadges.filter((b) => b.isEarned).length;

  return (
    <FullScreenModal isOpen={isOpen} onClose={onClose}>
      <div className="flex flex-col h-full bg-slate-900 p-8 overflow-y-auto">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-extrabold text-white">Huy hiệu của Khôi 🏆</h2>
          <p className="text-slate-400 text-lg mt-2">
            {earnedCount} / {BADGE_DEFINITIONS.length} đã đạt được
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 pb-8">
          {BADGE_DEFINITIONS.map((def) => {
            const earned = progress.earnedBadges.find((b) => b.id === def.id);
            const isEarned = earned?.isEarned ?? false;

            return (
              <div
                key={def.id}
                className={cn(
                  'rounded-3xl p-5 flex flex-col items-center gap-2 text-center',
                  isEarned
                    ? 'bg-white/15 ring-1 ring-white/30'
                    : 'bg-white/5 opacity-50',
                )}
              >
                <span className="text-5xl" aria-hidden="true">
                  {isEarned ? def.iconEmoji : '🔒'}
                </span>
                <p
                  className={cn(
                    'font-extrabold text-sm',
                    isEarned ? 'text-white' : 'text-slate-500',
                  )}
                >
                  {def.name}
                </p>
                <p className={cn('text-xs', isEarned ? 'text-slate-300' : 'text-slate-600')}>
                  {isEarned ? def.description : '???'}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </FullScreenModal>
  );
};
