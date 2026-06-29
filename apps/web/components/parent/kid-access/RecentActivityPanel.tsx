import type { ActivityItem } from '@/server/actions/kid-access.actions'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const todayStr = new Date().toISOString().split('T')[0]
  const eventStr = iso.split('T')[0]
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const time = `${hh}:${mm}`
  return eventStr === todayStr ? `Hôm nay ${time}` : time
}

export function RecentActivityPanel({ activities }: { activities: ActivityItem[] }) {
  if (activities.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="text-2xl">🎮</span>
        <span className="text-xs font-bold text-slate-400">Chưa có hoạt động nào</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {activities.map((a) => (
        <div key={a.id} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="shrink-0 text-xl leading-none" aria-hidden="true">
            {a.iconKey ?? '📋'}
          </span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-extrabold text-slate-800">{a.label}</div>
            <div className="mt-0.5 text-xs font-bold text-slate-400">{formatTime(a.createdAt)}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
