'use client'

export default function ParentError({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-shell-light p-4">
      <div className="flex w-full max-w-md flex-col items-center rounded-2xl bg-white p-8 text-center shadow-lg">
        <span className="mb-4 select-none text-6xl" aria-hidden="true">⚠️</span>
        <h2 className="mb-2 text-xl font-bold text-slate-700">Đã xảy ra lỗi</h2>
        <p className="mb-6 text-slate-500">Vui lòng thử lại hoặc tải lại trang.</p>
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-btn-primary px-6 py-3 font-semibold text-white hover:bg-btn-primary-hover transition-colors"
        >
          Thử lại
        </button>
      </div>
    </div>
  )
}
