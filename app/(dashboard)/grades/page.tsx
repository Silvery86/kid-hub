'use client';

import {
  Calculator, BookOpen, Globe, Leaf, Heart,
  Dumbbell, Music, Palette, Monitor, Star,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { TabletPageContainer } from '@/components/layout/TabletPageContainer';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useGrades } from '@/hooks/useGrades';
import { getSubjectById } from '@/lib/data/subjects';

const ICON_MAP: Record<string, LucideIcon> = {
  Calculator, BookOpen, Globe, Leaf, Heart,
  Dumbbell, Music, Palette, Monitor, Star,
};

export default function GradesPage() {
  const { reportCard } = useGrades();

  return (
    <TabletPageContainer className="p-6 overflow-y-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Bảng điểm</h1>
          <p className="text-slate-500 text-lg mt-1">Học kỳ 1 · 2025–2026</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">Điểm trung bình</p>
          <p className="text-5xl font-extrabold text-blue-600">{reportCard.averageScore}</p>
        </div>
      </div>

      {/* Subject cards grid */}
      <div className="grid grid-cols-2 gap-4">
        {reportCard.grades.map((grade) => {
          const subject = getSubjectById(grade.subjectId);
          if (!subject) return null;
          const Icon = ICON_MAP[subject.iconName] ?? Star;

          return (
            <div key={grade.subjectId} className="bg-white rounded-3xl p-5 shadow-sm flex gap-4">
              {/* Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shrink-0 ${subject.colorClass}`}
                aria-hidden="true"
              >
                <Icon size={26} strokeWidth={2} />
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-extrabold text-slate-800 text-base truncate">
                    {subject.name}
                  </p>
                  <span className="text-2xl font-extrabold text-slate-800 shrink-0 ml-2">
                    {grade.score}
                  </span>
                </div>
                <ProgressBar
                  value={grade.score}
                  max={10}
                  aria-label={`Điểm ${subject.name}: ${grade.score}/10`}
                  className="mb-2"
                />
                <Badge variant={grade.badge} />
              </div>
            </div>
          );
        })}
      </div>
    </TabletPageContainer>
  );
}
