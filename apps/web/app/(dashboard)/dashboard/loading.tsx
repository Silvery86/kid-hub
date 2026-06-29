export default function DashboardLoading() {
  return (
    <div className="flex min-h-dvh animate-pulse flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <div className="h-10 w-40 rounded-xl bg-slate-200" />
      <div className="h-28 rounded-3xl bg-white/80" />
      <div className="grid grid-cols-3 gap-3">
        <div className="h-20 rounded-2xl bg-white/80" />
        <div className="h-20 rounded-2xl bg-white/80" />
        <div className="h-20 rounded-2xl bg-white/80" />
      </div>
      <div className="flex-1 rounded-2xl bg-white/80" />
    </div>
  )
}
