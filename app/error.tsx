'use client'

export default function RootError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f3f2ec] p-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-8 text-center shadow-xl">
        <span className="mb-4 select-none text-7xl" aria-hidden="true">😵</span>
        <h2 className="mb-2 text-2xl font-extrabold text-slate-700">Ối! Có lỗi rồi</h2>
        <p className="mb-6 text-lg text-slate-500">Khôi thử nhấn nút bên dưới nhé!</p>
        <button
          type="button"
          onClick={reset}
          className="min-h-tap-lg min-w-40 rounded-2xl border-4 border-blue-700 bg-blue-500 px-6 py-3 text-xl font-bold text-white transition-transform duration-100 active:scale-95 touch-manipulation"
        >
          Thử lại 🔄
        </button>
      </div>
    </div>
  )
}
