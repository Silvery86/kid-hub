'use client';

import {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassPeriod, Subject } from '@/types';

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator,
  BookOpen,
  Globe,
  Leaf,
  Heart,
  Dumbbell,
  Music,
  Palette,
  Monitor,
  Star,
};

interface SubjectCardProps {
  period: ClassPeriod;
  subject: Subject;
  isActive?: boolean;
  isNext?: boolean;
  isCompact?: boolean;
}

export const SubjectCard = ({
  period,
  subject,
  isActive = false,
  isNext = false,
  isCompact = false,
}: SubjectCardProps) => {
  const Icon = ICON_MAP[subject.iconName] ?? Star;

  return (
    <div
      role="listitem"
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 transition-all duration-300',
        isCompact ? 'py-2' : 'py-3',
        isActive ? 'bg-white ring-2 ring-blue-400 shadow-lg scale-[1.01]' : 'bg-white',
        isNext && !isActive && 'bg-blue-50',
      )}
    >
      {/* Subject icon bubble */}
      <div
        className={cn(
          'flex items-center justify-center rounded-xl shrink-0 text-white',
          subject.colorClass,
          isCompact ? 'w-9 h-9' : 'w-12 h-12',
        )}
        aria-hidden="true"
      >
        <Icon size={isCompact ? 16 : 22} strokeWidth={2} />
      </div>

      {/* Period info */}
      <div className="flex-1 min-w-0">
        <p className={cn('font-bold text-slate-800 truncate', isCompact ? 'text-sm' : 'text-base')}>
          {subject.name}
        </p>
        <p className={cn('text-slate-500', isCompact ? 'text-xs' : 'text-sm')}>
          Tiết {period.periodNumber} · {period.startTime} – {period.endTime}
        </p>
      </div>

      {/* Status pill */}
      {isActive && (
        <span className="shrink-0 text-xs font-bold text-blue-600 bg-blue-100 rounded-lg px-2 py-1">
          Đang học
        </span>
      )}
      {!isActive && isNext && (
        <span className="shrink-0 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg px-2 py-1">
          Tiếp theo
        </span>
      )}
    </div>
  );
};
