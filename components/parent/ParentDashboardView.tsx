'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useMemo, useState } from 'react'
import type { DailySchedule, SubjectGrade, TodayView } from '@/types'
import { cn } from '@/lib/utils'
import { formatWeekSubtitleForOffset, getWeekDates } from '@/lib/schedule-display'
import { getSubjectById } from '@/lib/data/subjects'
import { signOutParentAction } from '@/server/actions/auth.actions'
import { ParentSaveButton } from './ParentSaveButton'
import { ScheduleManager, type ParentSaveState } from './ScheduleManager'
import { GradesManager } from './GradesManager'
import { useUserProgress } from '@/hooks/useUserProgress'

type ManagerTab = 'overview' | 'schedule' | 'grades'

const TABS = [
  { id: 'overview' as const, label: '🏠 Tổng quan' },
  { id: 'schedule' as const, label: '📅 Lịch học' },
  { id: 'grades' as const, label: '🌟 Điểm số' },
]

export function ParentDashboardView({
  initialSchedule,
  initialGrades,
  todayView,
}: {
  initialSchedule: DailySchedule[]
  initialGrades: SubjectGrade[]
  todayView: TodayView | null
}) {
  const [scheduleSave, setScheduleSave] = useState<ParentSaveState | null>(null)
  const [gradesSave, setGradesSave] = useState<ParentSaveState | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const { progress } = useUserProgress()
  const router = useRouter()
  const searchParams = useSearchParams()
  const view = searchParams.get('view')
  const activeTab: ManagerTab = view === 'schedule' || view === 'grades' ? view : 'overview'

  const navigateTab = useCallback((tab: ManagerTab) => {
    const next = new URLSearchParams(searchParams.toString())
    if (tab === 'overview') next.delete('view')
    else next.set('view', tab)
    const query = next.toString()
    router.replace(query ? `/parent?${query}` : '/parent', { scroll: false })
  }, [router, searchParams])

  const handleSignOut = async () => {
    await signOutParentAction()
    router.push('/parent/login')
  }

  const isPastWeek = weekOffset < 0
  const weekLabel = weekOffset === 0 ? 'Tuần này' : formatWeekSubtitleForOffset(weekOffset)
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset])

  const averageScore = useMemo(() => {
    if (initialGrades.length === 0) return 0
    const total = initialGrades.reduce((sum, grade) => sum + grade.score, 0)
    return Number((total / initialGrades.length).toFixed(1))
  }, [initialGrades])

  const topSubject = useMemo(() => {
    const sorted = [...initialGrades].sort((a, b) => b.score - a.score)
    const best = sorted[0]
    if (!best) return '—'
    return `${getSubjectById(best.subjectId)?.name ?? best.subjectId} ${best.score}`
  }, [initialGrades])

  const homeworkDone = todayView?.homework.filter((h) => h.isDone).length ?? 0
  const homeworkTotal = todayView?.homework.length ?? 0
  const recentSubjects = (todayView?.schoolPeriods ?? []).slice(0, 5).map((p) => getSubjectById(p.subjectId))
  const streakDays = progress.currentStreak
  const totalPoints = progress.totalPoints

  const activityItems = useMemo(() => {
    const items: { icon: string; text: string; meta: string }[] = []
    for (const hw of todayView?.homework.slice(0, 3) ?? []) {
      const subject = getSubjectById(hw.subjectId)
      items.push({
        icon: subject?.icon ?? '📝',
        text: `Đã thêm bài tập: ${hw.label}`,
        meta: subject?.name ?? hw.subjectId,
      })
    }
    return items.slice(0, 5)
  }, [todayView])

  const onScheduleSaveState = useCallback((state: ParentSaveState) => {
    setScheduleSave(state)
  }, [])

  const onGradesSaveState = useCallback((state: ParentSaveState) => {
    setGradesSave(state)
  }, [])

  const weekNav = (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => setWeekOffset((o) => o - 1)}
        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-text-secondary hover:bg-slate-50"
        aria-label="Tuần trước"
      >
        ←
      </button>
      <button
        type="button"
        onClick={() => setWeekOffset(0)}
        className={cn(
          'rounded-full px-2.5 py-1 text-[11px] font-extrabold',
          weekOffset === 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-text-secondary hover:bg-slate-200'
        )}
      >
        {weekOffset === 0 ? 'Tuần này' : weekLabel.split('·')[0]?.trim()}
      </button>
      <button
        type="button"
        onClick={() => setWeekOffset((o) => o + 1)}
        className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-extrabold text-text-secondary hover:bg-slate-50"
        aria-label="Tuần sau"
      >
        →
      </button>
    </div>
  )

  const schedulePanelAction = weekNav

  const gradesPanelAction = gradesSave ? (
    <ParentSaveButton
      onClick={gradesSave.save}
      isPending={gradesSave.isPending}
      isSaved={gradesSave.isSaved}
    />
  ) : null

  const subpageIdentityChips = (
    <div className="hidden items-center gap-2 md:flex">
      <div className="inline-flex items-center gap-2 rounded-pill bg-white px-3 py-1.5 shadow-sm">
        <span className="grid size-7 place-items-center rounded-full bg-amber-100">🧒</span>
        <div className="leading-tight">
          <p className="text-xs font-black text-text-primary">Khôi</p>
          <p className="text-[10px] font-bold text-text-muted">Lớp 1A</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="rounded-pill bg-white px-3 py-1.5 text-xs font-black text-red-600 shadow-sm hover:bg-red-50"
      >
        🔓 Đăng xuất
      </button>
    </div>
  )

  const managerEditorPanel = activeTab === 'schedule' ? (
    <section className="flex min-h-0 flex-1 flex-col rounded-card bg-white p-4 shadow-sm md:p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-text-secondary hover:bg-slate-200"
          >
            ← Tổng quan
          </button>
          <div>
            <h2 className="text-base font-black text-text-primary md:text-lg">Lịch học</h2>
            <p className="text-xs font-bold text-text-secondary">Thêm, sửa, xóa tiết học của Khôi</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subpageIdentityChips}
          {schedulePanelAction}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <ScheduleManager
          initialSchedule={initialSchedule}
          embedded
          readOnly={isPastWeek}
          weekDates={weekDates}
          onSaveStateChange={onScheduleSaveState}
        />
      </div>
    </section>
  ) : (
    <section className="flex min-h-0 flex-1 flex-col rounded-card bg-white p-4 shadow-sm md:p-5 lg:p-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigateTab('overview')}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-extrabold text-text-secondary hover:bg-slate-200"
          >
            ← Tổng quan
          </button>
          <div>
            <h2 className="text-base font-black text-text-primary md:text-lg">Điểm số</h2>
            <p className="text-xs font-bold text-text-secondary">Cập nhật điểm từng môn</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {subpageIdentityChips}
          {gradesPanelAction}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <GradesManager initialGrades={initialGrades} embedded onSaveStateChange={onGradesSaveState} />
      </div>
    </section>
  )

  const overviewPanel = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <section className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-text-primary">Parent Mode</h1>
          <p className="mt-1 text-sm font-bold text-text-secondary">Tổng quan về việc học của Khôi</p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <div className="inline-flex items-center gap-2 rounded-pill bg-white px-3 py-1.5 shadow-sm">
            <span className="grid size-7 place-items-center rounded-full bg-amber-100">🧒</span>
            <div className="leading-tight">
              <p className="text-xs font-black text-text-primary">Khôi</p>
              <p className="text-[10px] font-bold text-text-muted">Lớp 1A</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="rounded-pill bg-white px-3 py-1.5 text-xs font-black text-red-600 shadow-sm hover:bg-red-50"
          >
            🔓 Đăng xuất
          </button>
        </div>
      </section>

      <section
        className="rounded-card p-4 text-white md:p-5"
        style={{
          background: 'linear-gradient(120deg, var(--color-btn-primary) 0%, var(--color-gradient-indigo) 100%)',
          boxShadow: '0 14px 30px -16px rgba(59, 130, 246, 0.75)',
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl">🧒</div>
            <div className="min-w-0">
              <h2 className="truncate text-2xl font-black leading-none">Khôi</h2>
              <p className="mt-1 text-sm font-bold text-white/90">Lớp 1A · 6 tuổi</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div className="rounded-2xl bg-white/20 px-3 py-2 text-center">
              <p className="text-xl font-black leading-none">🔥 {streakDays}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase text-white/90">chuỗi ngày</p>
            </div>
            <div className="hidden rounded-2xl bg-white/20 px-3 py-2 text-center sm:block">
              <p className="text-xl font-black leading-none">🪙 {totalPoints}</p>
              <p className="mt-1 text-[10px] font-extrabold uppercase text-white/90">điểm</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-2xl bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-bold text-text-secondary">📊 Điểm TB</p>
          <p className="mt-1 text-xl font-black text-text-primary">{averageScore || 0}</p>
          <p className="text-xs font-bold text-text-secondary">{topSubject}</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-bold text-text-secondary">📚 Bài tập</p>
          <p className="mt-1 text-xl font-black text-text-primary">{homeworkDone}/{homeworkTotal}</p>
          <p className="text-xs font-bold text-text-secondary">đã hoàn thành</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-bold text-text-secondary">⏱️ Màn hình</p>
          <p className="mt-1 text-xl font-black text-text-primary">47′</p>
          <p className="text-xs font-bold text-text-secondary">hôm nay</p>
        </div>
        <div className="rounded-2xl bg-white p-3 text-left shadow-sm">
          <p className="text-xs font-bold text-text-secondary">🏆 Huy hiệu</p>
          <p className="mt-1 text-xl font-black text-text-primary">7/10</p>
          <p className="text-xs font-bold text-text-secondary">đã mở</p>
        </div>
      </section>

      <section className="rounded-card bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-extrabold tracking-wide text-text-muted uppercase">Thao tác nhanh</p>
        <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4">
          <button
            type="button"
            onClick={() => navigateTab('schedule')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
          >
            ➕ Thêm tiết học
          </button>
          <button
            type="button"
            onClick={() => navigateTab('grades')}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
          >
            ✏️ Nhập điểm
          </button>
          <Link
            href="/parent/kid-access"
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
          >
            🛡️ Quyền truy cập
          </Link>
          <button
            type="button"
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-center text-xs font-extrabold text-text-primary transition-colors hover:bg-slate-50"
          >
            🔒 Khóa thiết bị
          </button>
        </div>
      </section>

      <section className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[1.5fr_1fr]">
        <div className="flex min-h-0 flex-col gap-4">
          <button
            type="button"
            onClick={() => navigateTab('schedule')}
            className="rounded-card bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-lg font-black text-text-primary">📅 Quản lý lịch học</h3>
              <span className="text-xs font-extrabold text-blue-600">Chỉnh sửa →</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSubjects.length > 0 ? recentSubjects.map((s, idx) => (
                <span
                  key={`${s?.id ?? idx}-${idx}`}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-text-primary"
                >
                  <span className="inline-block size-2 rounded-full" style={{ background: s?.color ?? '#94a3b8' }} />
                  {s?.name ?? 'Môn học'}
                </span>
              )) : (
                <span className="text-xs font-bold text-text-muted">Chưa có lịch hôm nay</span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigateTab('grades')}
            className="rounded-card bg-white p-4 text-left shadow-sm transition-colors hover:bg-slate-50"
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-lg font-black text-text-primary">⭐ Quản lý điểm số</h3>
              <span className="text-xs font-extrabold text-blue-600">Chỉnh sửa →</span>
            </div>
            <p className="text-sm font-bold text-text-secondary">
              Điểm trung bình {averageScore || 0} · Môn tốt nhất: {topSubject}
            </p>
          </button>
        </div>

        <aside className="min-h-0 rounded-card bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-extrabold tracking-wide text-text-muted uppercase">Hoạt động gần đây</h3>
          <div className="flex max-h-full flex-col gap-2 overflow-y-auto">
            {activityItems.length > 0 ? activityItems.map((item) => (
              <div key={`${item.icon}-${item.text}`} className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-2">
                <span className="text-base leading-none">{item.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-text-primary">{item.text}</p>
                  <p className="text-[11px] font-bold text-text-muted">{item.meta}</p>
                </div>
              </div>
            )) : (
              <p className="py-6 text-center text-sm font-bold text-text-muted">Chưa có hoạt động gần đây</p>
            )}
          </div>
        </aside>
      </section>
    </div>
  )

  const mobileActions = (
    <div className="flex gap-2">
      <div className="inline-flex items-center gap-1.5 rounded-pill bg-white px-2 py-1 shadow-sm">
        <span className="grid size-6 place-items-center rounded-full bg-amber-100">🧒</span>
        <span className="text-xs font-black text-text-primary">Khôi</span>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="rounded-full bg-red-100 px-3 py-1.5 text-xs font-extrabold text-red-700"
      >
        Đăng xuất
      </button>
    </div>
  )

  const mobileBottomNav = (
    <nav className="grid grid-cols-4 border-t border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => navigateTab('overview')}
        className={cn(
          'flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-extrabold',
          activeTab === 'overview' ? 'text-btn-primary' : 'text-text-muted'
        )}
      >
        <span className="text-lg">🏠</span>
        Tổng quan
      </button>
      <button
        type="button"
        onClick={() => navigateTab('schedule')}
        className={cn(
          'flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-extrabold',
          activeTab === 'schedule' ? 'text-btn-primary' : 'text-text-muted'
        )}
      >
        <span className="text-lg">📅</span>
        Lịch học
      </button>
      <button
        type="button"
        onClick={() => navigateTab('grades')}
        className={cn(
          'flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-extrabold',
          activeTab === 'grades' ? 'text-btn-primary' : 'text-text-muted'
        )}
      >
        <span className="text-lg">⭐</span>
        Điểm số
      </button>
      <Link
        href="/parent/kid-access"
        className="flex flex-col items-center gap-1 px-2 py-2 text-[10px] font-extrabold text-text-muted"
      >
        <span className="text-lg">🛡️</span>
        Truy cập
      </Link>
    </nav>
  )

  return (
    <>
      <div className="flex min-h-dvh flex-col bg-shell-parent md:hidden">
        <div className="shrink-0 border-b border-slate-200 bg-white px-3.5 py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h1 className="text-xl font-black tracking-tight text-text-primary">Parent Mode</h1>
              <p className="text-xs font-bold text-text-secondary">Tổng quan về việc học của Khôi</p>
            </div>
            {mobileActions}
          </div>
        </div>

        <main className="min-h-0 flex-1 overflow-y-auto p-3.5">
          {activeTab === 'overview' ? overviewPanel : managerEditorPanel}
        </main>
        {mobileBottomNav}
      </div>

      <div className="hidden min-h-dvh bg-shell-parent md:block">
        <main className="min-h-0 p-5 lg:p-6">
          {activeTab === 'overview' ? overviewPanel : managerEditorPanel}
        </main>
      </div>
    </>
  )
}
