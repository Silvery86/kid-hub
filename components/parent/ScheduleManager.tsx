'use client';

import { useState, useCallback } from 'react';
import { Plus, Trash2, Save, Check } from 'lucide-react';
import type { WeeklySchedule, DayOfWeek } from '@/types';
import { DAYS_OF_WEEK, DAY_LABELS, STORAGE_KEYS } from '@/lib/constants';
import { SUBJECTS } from '@/lib/data/subjects';
import { WEEKLY_SCHEDULE } from '@/lib/data/schedule';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KidButton } from '@/components/ui/KidButton';
import { cn } from '@/lib/utils';

type EditablePeriod = {
  tempId: string;
  subjectId: string;
  startTime: string;
  endTime: string;
};

type EditableSchedule = Record<DayOfWeek, EditablePeriod[]>;

const buildEditableSchedule = (schedule: WeeklySchedule): EditableSchedule =>
  DAYS_OF_WEEK.reduce<EditableSchedule>(
    (acc, day) => {
      const daySchedule = schedule.days.find((d) => d.day === day);
      acc[day] = (daySchedule?.periods ?? []).map((p) => ({
        tempId: `${day}-${p.periodNumber}`,
        subjectId: p.subjectId,
        startTime: p.startTime,
        endTime: p.endTime,
      }));
      return acc;
    },
    {} as EditableSchedule,
  );

const buildWeeklySchedule = (editable: EditableSchedule): WeeklySchedule => ({
  weekStartDate: WEEKLY_SCHEDULE.weekStartDate,
  days: DAYS_OF_WEEK.map((day) => ({
    day,
    periods: [...(editable[day] ?? [])]
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((p, i) => ({
        periodNumber: i + 1,
        subjectId: p.subjectId,
        startTime: p.startTime,
        endTime: p.endTime,
      })),
  })),
});

export const ScheduleManager = () => {
  const [storedSchedule, setStoredSchedule] = useLocalStorage<WeeklySchedule>(
    STORAGE_KEYS.SCHEDULE,
    WEEKLY_SCHEDULE,
  );
  const [editable, setEditable] = useState<EditableSchedule>(() =>
    buildEditableSchedule(storedSchedule),
  );
  const [activeDay, setActiveDay] = useState<DayOfWeek>('monday');
  const [isSaved, setIsSaved] = useState(false);

  const handleUpdatePeriod = useCallback(
    (day: DayOfWeek, tempId: string, field: keyof Omit<EditablePeriod, 'tempId'>, value: string) => {
      setEditable((prev) => ({
        ...prev,
        [day]: (prev[day] ?? []).map((p) =>
          p.tempId === tempId ? { ...p, [field]: value } : p,
        ),
      }));
    },
    [],
  );

  const handleAddPeriod = useCallback((day: DayOfWeek) => {
    setEditable((prev) => ({
      ...prev,
      [day]: [
        ...(prev[day] ?? []),
        { tempId: `new-${Date.now()}`, subjectId: 'math', startTime: '07:30', endTime: '08:10' },
      ],
    }));
  }, []);

  const handleDeletePeriod = useCallback((day: DayOfWeek, tempId: string) => {
    setEditable((prev) => ({
      ...prev,
      [day]: (prev[day] ?? []).filter((p) => p.tempId !== tempId),
    }));
  }, []);

  const handleSave = () => {
    setStoredSchedule(buildWeeklySchedule(editable));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const activePeriods = editable[activeDay] ?? [];

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-extrabold text-slate-700">📅 Thời khóa biểu</h2>
        <KidButton
          variant={isSaved ? 'secondary' : 'primary'}
          onClick={handleSave}
          className="gap-2 text-sm min-h-10 px-4"
        >
          {isSaved ? <Check size={16} /> : <Save size={16} />}
          {isSaved ? 'Đã lưu!' : 'Lưu'}
        </KidButton>
      </div>

      {/* Day tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-2xl p-1">
        {DAYS_OF_WEEK.map((dow) => (
          <button
            key={dow}
            onClick={() => setActiveDay(dow)}
            className={cn(
              'flex-1 rounded-xl py-2 text-sm font-bold transition-colors',
              activeDay === dow
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700',
            )}
          >
            {DAY_LABELS[dow].replace('Thứ ', '')}
          </button>
        ))}
      </div>

      {/* Period list */}
      <div className="flex flex-col gap-2 flex-1 overflow-y-auto">
        {activePeriods.map((period) => (
          <div key={period.tempId} className="flex items-center gap-2 bg-slate-50 rounded-2xl p-3">
            {/* Subject select */}
            <select
              value={period.subjectId}
              onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'subjectId', e.target.value)}
              className="flex-1 rounded-xl border-2 border-slate-200 px-3 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400"
            >
              {SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {/* Start time */}
            <input
              type="time"
              value={period.startTime}
              onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'startTime', e.target.value)}
              className="rounded-xl border-2 border-slate-200 px-2 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400 w-28"
            />
            <span className="text-slate-400 text-sm font-bold">–</span>
            {/* End time */}
            <input
              type="time"
              value={period.endTime}
              onChange={(e) => handleUpdatePeriod(activeDay, period.tempId, 'endTime', e.target.value)}
              className="rounded-xl border-2 border-slate-200 px-2 py-2 text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-400 w-28"
            />
            {/* Delete */}
            <button
              onClick={() => handleDeletePeriod(activeDay, period.tempId)}
              aria-label="Xóa tiết học"
              className="p-2 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors min-h-10 min-w-10 flex items-center justify-center"
            >
              <Trash2 size={18} />
            </button>
          </div>
        ))}

        {/* Add period button */}
        <button
          onClick={() => handleAddPeriod(activeDay)}
          className="flex items-center gap-2 justify-center rounded-2xl border-2 border-dashed border-slate-300 py-3 text-slate-500 hover:border-blue-400 hover:text-blue-500 font-bold text-sm transition-colors"
        >
          <Plus size={18} />
          Thêm tiết học
        </button>
      </div>
    </div>
  );
};
