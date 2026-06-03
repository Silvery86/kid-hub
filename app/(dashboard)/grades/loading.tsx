export default function GradesLoading() {
  return (
    <div className="flex min-h-dvh animate-pulse flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <div className="h-10 w-32 rounded-xl bg-slate-200" />
      <div className="h-10 rounded-xl bg-slate-200" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-white/80" />
        ))}
      </div>
    </div>
  )
}
