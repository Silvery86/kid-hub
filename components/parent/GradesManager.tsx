'use client';

import { useState } from 'react';
import { Save, Check } from 'lucide-react';
import type { SubjectGrade } from '@/types';
import { SUBJECTS } from '@/lib/data/subjects';
import { SEED_GRADES } from '@/lib/data/grades';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { STORAGE_KEYS } from '@/lib/constants';
import { calculateBadgeTier, cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { KidButton } from '@/components/ui/KidButton';

export const GradesManager = () => {
  const [storedGrades, setStoredGrades] = useLocalStorage<SubjectGrade[]>(
    STORAGE_KEYS.GRADES,
    SEED_GRADES as SubjectGrade[],
  );

  // Use string inputs so partial values like "9." are allowed mid-edit
  const [editableScores, setEditableScores] = useState<Record<string, string>>(() =>
    Object.fromEntries(storedGrades.map((g) => [g.subjectId, String(g.score)])),
  );
  const [semester, setSemester] = useState<1 | 2>(storedGrades[0]?.semester ?? 1);
  const [isSaved, setIsSaved] = useState(false);

  const handleScoreChange = (subjectId: string, raw: string) => {
    setEditableScores((prev) => ({ ...prev, [subjectId]: raw }));
  };

  const handleSave = () => {
    const updated: SubjectGrade[] = SUBJECTS.map((s) => {
      const raw = editableScores[s.id] ?? '';
      const parsed = parseFloat(raw);
      const score = isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed));
      return {
        subjectId: s.id,
        score,
        badge: calculateBadgeTier(score),
        semester,
        academicYear: '2025-2026',
      };
    });
    setStoredGrades(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-700">🌟 Điểm số</h2>
        <KidButton
          variant={isSaved ? 'secondary' : 'primary'}
          onClick={handleSave}
          className="gap-2 text-sm min-h-10 px-4"
        >
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? 'Đã lưu!' : 'Lưu'}
        </KidButton>
      </div>

      {/* Semester selector */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1 w-fit">
        {([1, 2] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSemester(s)}
            className={cn(
              'rounded-xl px-5 py-2 text-sm font-bold transition-colors',
              semester === s
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            Học kỳ {s}
          </button>
        ))}
      </div>

      {/* Subject list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {SUBJECTS.map((subject) => {
          const raw = editableScores[subject.id] ?? '';
          const parsed = parseFloat(raw);
          const score = isNaN(parsed) ? 0 : Math.min(10, Math.max(0, parsed));
          const tier = calculateBadgeTier(score);

          return (
            <div
              key={subject.id}
              className="flex items-center gap-3 bg-slate-50 rounded-2xl p-3"
            >
              {/* Subject colour dot */}
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${subject.colorClass}`}
                aria-hidden="true"
              />
              <span className="flex-1 font-bold text-slate-700 text-sm truncate">
                {subject.name}
              </span>
              {/* Score input */}
              <input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={raw}
                onChange={(e) => handleScoreChange(subject.id, e.target.value)}
                className="w-20 rounded-xl border-2 border-slate-200 px-2 py-2 text-center text-sm font-extrabold text-slate-800 bg-white focus:outline-none focus:border-blue-400"
                aria-label={`Điểm ${subject.name}`}
              />
              {/* Live badge preview */}
              <Badge variant={tier} className="shrink-0 text-xs py-1 px-2" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
