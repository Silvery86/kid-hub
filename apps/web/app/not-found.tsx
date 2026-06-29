import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f3f2ec] p-4">
      <div className="flex w-full max-w-sm flex-col items-center rounded-3xl bg-white p-8 text-center shadow-xl">
        <span className="mb-4 select-none text-7xl" aria-hidden="true">🗺️</span>
        <h2 className="mb-2 text-2xl font-extrabold text-slate-700">Trang này không có rồi</h2>
        <p className="mb-6 text-lg text-slate-500">Khôi quay về trang chủ nhé!</p>
        <Link
          href="/"
          className="inline-block min-h-tap-lg min-w-40 rounded-2xl border-4 border-blue-700 bg-btn-primary px-6 py-3 text-center text-xl font-bold text-white transition-transform duration-100 active:scale-95 touch-manipulation"
        >
          Về trang chủ 🏠
        </Link>
      </div>
    </div>
  )
}
