import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ClassPeriod, Subject } from '@/types';

interface CurrentClassHighlightProps {
  period: ClassPeriod | null;
  subject: Subject | null;
}

/**
 * Shows a full-colour card for the currently active class period.
 * Includes a live pulse indicator and fades to an "off-hours" state when there is no active class.
 */
export const CurrentClassHighlight = ({ period, subject }: CurrentClassHighlightProps) => {
  if (!period || !subject) {
    return (
      <div className="rounded-3xl bg-slate-100 p-8 flex flex-col items-center justify-center gap-3 text-center min-h-44">
        <Clock size={36} className="text-slate-300" aria-hidden="true" />
        <p className="text-slate-400 text-lg font-semibold">Không có tiết học</p>
        <p className="text-slate-400 text-sm">Ngoài giờ học</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'rounded-3xl p-8 shadow-xl flex flex-col justify-between relative overflow-hidden min-h-44',
        subject.colorClass,
      )}
      aria-label={`Đang học: ${subject.name}`}
    >
      {/* Live pulse indicator */}
      <div className="absolute top-5 right-5" aria-hidden="true">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
          <span className="relative inline-flex rounded-full h-4 w-4 bg-white" />
        </span>
      </div>

      <p className="text-white/80 text-sm font-bold uppercase tracking-widest">Đang học</p>

      <div>
        <h2 className="text-5xl font-extrabold text-white leading-tight mb-1">{subject.name}</h2>
        <p className="text-white/80 text-xl font-semibold">
          Tiết {period.periodNumber} · {period.startTime} – {period.endTime}
        </p>
      </div>
    </div>
  );
};
