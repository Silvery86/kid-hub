/** Schedule page skeleton — shown while the DB query resolves. */

export default function ScheduleLoading() {
  return (
    <div className="flex h-[calc(100dvh-4rem)] gap-4 p-6 animate-pulse">
      {/* School grid skeleton (left half) */}
      <div className="flex flex-1 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-1 flex-col gap-2 rounded-3xl bg-slate-100 p-3">
            <div className="h-9 rounded-2xl bg-slate-200" />
            {Array.from({ length: 5 }).map((_, j) => (
              <div key={j} className="flex-1 rounded-xl bg-slate-200" />
            ))}
          </div>
        ))}
      </div>
      {/* Today panel skeleton (right half) */}
      <div className="w-64 flex-shrink-0 rounded-3xl bg-slate-100 p-4">
        <div className="mb-3 h-6 w-24 rounded-xl bg-slate-200" />
        <div className="flex flex-col gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 rounded-2xl bg-slate-200" />
          ))}
        </div>
      </div>
    </div>
  )
}
