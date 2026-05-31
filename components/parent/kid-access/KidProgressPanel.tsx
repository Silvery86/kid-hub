import type { KidProgressData } from '@/server/actions/kid-progress.actions'
import { BADGE_DEFINITIONS } from '@/lib/data/badges'

function Stars({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <span className="text-sm">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < count ? 'opacity-100' : 'opacity-20'}>
          ★
        </span>
      ))}
    </span>
  )
}

export function KidProgressPanel({
  progress,
  compact = false,
}: {
  progress: KidProgressData | null
  compact?: boolean
}) {
  if (!progress) {
    return (
      <div className="flex flex-1 items-center justify-center py-6 text-center">
        <div>
          <div className="text-2xl">🎮</div>
          <div className="mt-2 text-xs font-bold text-slate-400">
            Khôi chưa chơi trò chơi nào
          </div>
        </div>
      </div>
    )
  }

  const earnedBadges = BADGE_DEFINITIONS.filter((b) =>
    progress.earnedBadgeIds.includes(b.id)
  )

  return (
    <div className="flex flex-col gap-4">
      {/* Points + streak */}
      <div className="flex gap-3">
        <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-amber-50 p-3">
          <span className="text-xl">🏅</span>
          <span className="text-lg font-black text-amber-700">{progress.totalPoints}</span>
          <span className="text-[10px] font-extrabold tracking-wide text-amber-500 uppercase">điểm</span>
        </div>
        <div className="flex flex-1 flex-col items-center gap-1 rounded-2xl bg-orange-50 p-3">
          <span className="text-xl">🔥</span>
          <span className="text-lg font-black text-orange-700">{progress.currentStreak}</span>
          <span className="text-[10px] font-extrabold tracking-wide text-orange-500 uppercase">ngày liên tiếp</span>
        </div>
      </div>

      {/* Game best stars */}
      <div>
        <div className="mb-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
          Trò chơi tốt nhất
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-base">🧮</span>
            <span className="flex-1 text-sm font-bold text-slate-700">Toán học</span>
            {progress.mathBestStars > 0 ? (
              <Stars count={progress.mathBestStars} />
            ) : (
              <span className="text-[11px] font-bold text-slate-300">Chưa chơi</span>
            )}
          </div>
          <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 px-3 py-2">
            <span className="text-base">🔤</span>
            <span className="flex-1 text-sm font-bold text-slate-700">Tiếng Anh</span>
            {progress.englishBestStars > 0 ? (
              <Stars count={progress.englishBestStars} />
            ) : (
              <span className="text-[11px] font-bold text-slate-300">Chưa chơi</span>
            )}
          </div>
        </div>
      </div>

      {/* Earned badges */}
      <div>
        <div className="mb-2 text-[10px] font-extrabold tracking-widest text-slate-400 uppercase">
          Huy hiệu đã nhận ({earnedBadges.length})
        </div>
        {earnedBadges.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {earnedBadges.map((b) => (
              <div
                key={b.id}
                title={b.name}
                className="flex items-center gap-1.5 rounded-xl bg-yellow-50 px-2.5 py-1.5"
              >
                <span className="text-base leading-none">{b.iconEmoji}</span>
                {!compact && (
                  <span className="text-[11px] font-extrabold text-yellow-700">{b.name}</span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl bg-slate-50 px-3 py-2 text-center text-[11px] font-bold text-slate-400">
            Chưa có huy hiệu nào
          </div>
        )}
      </div>
    </div>
  )
}
