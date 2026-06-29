export default function HomeworkLoading() {
  return (
    <div className="flex min-h-dvh animate-pulse flex-col gap-4 bg-shell-kid p-4 portrait:max-md:p-3.5">
      <div className="h-10 w-40 rounded-xl bg-slate-200" />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-2xl bg-white/80" />
        ))}
      </div>
    </div>
  )
}
