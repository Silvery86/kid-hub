import { Pressable, Text, View } from 'react-native'
import { GAME_QUESTIONS_PER_SESSION } from '@kid-hub/shared'

import { StarRating } from './star-rating'

const EMOJI_BY_STARS: Record<1 | 2 | 3, string> = { 1: '😊', 2: '🎉', 3: '🏆' }
const MESSAGE_BY_STARS: Record<1 | 2 | 3, string> = {
  1: 'Cố lên! Lần sau sẽ tốt hơn.',
  2: 'Làm tốt lắm! Tiếp tục nhé!',
  3: 'Xuất sắc! Khôi thật giỏi!',
}

/**
 * Post-game summary: stars, correct/points breakdown, and replay/exit actions.
 * Native port of the web GameResultScreen (landscape).
 */
export function GameResult({
  correctCount,
  starsEarned,
  pointsEarned,
  bestStars,
  onReplay,
  onExit,
  onHomeworkSubmit,
  homeworkSubmitted,
  saveError,
}: {
  correctCount: number
  starsEarned: 1 | 2 | 3
  pointsEarned: number
  bestStars: 1 | 2 | 3 | null
  onReplay: () => void
  onExit: () => void
  onHomeworkSubmit?: () => void
  homeworkSubmitted?: boolean
  saveError?: string
}) {
  const isNewBest = bestStars === null || starsEarned > bestStars

  return (
    <View className="flex-1 items-center justify-center gap-5 bg-slate-900 px-8">
      <Text style={{ fontSize: 72 }}>{EMOJI_BY_STARS[starsEarned]}</Text>

      <StarRating value={starsEarned} size={40} />

      <Text className="text-center text-2xl font-extrabold text-white">
        {MESSAGE_BY_STARS[starsEarned]}
      </Text>

      <View className="flex-row gap-4">
        <View className="items-center rounded-2xl bg-slate-700 px-6 py-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Đúng</Text>
          <Text className="text-3xl font-extrabold text-white">
            {correctCount}
            <Text className="text-xl text-slate-400"> / {GAME_QUESTIONS_PER_SESSION}</Text>
          </Text>
        </View>
        <View className="items-center rounded-2xl bg-slate-700 px-6 py-3">
          <Text className="text-xs font-bold uppercase tracking-wider text-slate-400">Điểm</Text>
          <Text className="text-3xl font-extrabold text-yellow-400">+{pointsEarned}</Text>
        </View>
        {isNewBest ? (
          <View className="items-center rounded-2xl bg-yellow-500 px-6 py-3">
            <Text className="text-xs font-bold uppercase tracking-wider text-yellow-900">Kỷ lục</Text>
            <Text className="text-3xl font-extrabold text-yellow-900">Mới! 🌟</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row flex-wrap justify-center gap-3">
        <Pressable
          onPress={onExit}
          className="rounded-2xl border-2 border-slate-600 px-6 py-3 active:bg-slate-800">
          <Text className="text-base font-extrabold text-slate-300">Về trang chủ</Text>
        </Pressable>
        <Pressable
          onPress={onReplay}
          className="rounded-2xl bg-blue-600 px-6 py-3 active:bg-blue-700">
          <Text className="text-base font-extrabold text-white">Chơi lại 🔄</Text>
        </Pressable>
        {onHomeworkSubmit && !homeworkSubmitted ? (
          <Pressable
            onPress={onHomeworkSubmit}
            testID="submit-homework-btn"
            className="rounded-2xl bg-emerald-600 px-6 py-3 active:bg-emerald-700">
            <Text className="text-base font-extrabold text-white">🏠 Nộp bài tập</Text>
          </Pressable>
        ) : null}
        {homeworkSubmitted ? (
          <View className="rounded-2xl bg-emerald-600 px-6 py-3">
            <Text className="text-base font-bold text-white">✅ Đã nộp bài!</Text>
          </View>
        ) : null}
      </View>

      {saveError ? (
        <Text className="text-center text-sm font-semibold text-red-400">
          ⚠️ Không thể lưu điểm — {saveError}
        </Text>
      ) : null}
    </View>
  )
}
