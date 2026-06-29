/** Schedule page skeleton — shown while the DB query resolves. */

export default function ScheduleLoading() {
  return (
    <div className="flex h-dvh animate-pulse flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <div className="h-10 w-48 rounded-xl bg-slate-200" />
      <div className="h-12 rounded-2xl bg-white" />
      <div className="min-h-0 flex-1 rounded-2xl bg-white/80" />
    </div>
  )
}
