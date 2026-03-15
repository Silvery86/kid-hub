/** Static badge metadata — earned state lives in UserProgress, not here. */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  iconEmoji: string;
}

export const BADGE_DEFINITIONS: readonly BadgeDefinition[] = [
  { id: 'first-login',    name: 'Chào bạn mới!',       description: 'Lần đầu mở ứng dụng',           iconEmoji: '🌟' },
  { id: 'math-ace',       name: 'Siêu Toán',            description: 'Đạt xuất sắc môn Toán',         iconEmoji: '🧮' },
  { id: 'reading-star',   name: 'Sao Đọc Sách',         description: 'Đạt xuất sắc Tiếng Việt',       iconEmoji: '📚' },
  { id: 'english-hero',   name: 'Anh hùng Tiếng Anh',   description: 'Hoàn thành game Tiếng Anh',     iconEmoji: '🌍' },
  { id: 'perfect-10',     name: 'Điểm 10!',             description: 'Đạt 10 điểm bất kỳ môn',       iconEmoji: '💯' },
  { id: 'streak-3',       name: 'Kiên trì 3 ngày',      description: 'Học 3 ngày liên tiếp',          iconEmoji: '🔥' },
  { id: 'streak-7',       name: 'Kiên trì 7 ngày',      description: 'Học 7 ngày liên tiếp',          iconEmoji: '⚡' },
  { id: 'all-green',      name: 'Toàn diện',            description: 'Tất cả môn đều đạt Giỏi',       iconEmoji: '🎯' },
  { id: 'game-win',       name: 'Chiến thắng!',         description: 'Hoàn thành 1 trò chơi',         iconEmoji: '🎮' },
  { id: 'top-score',      name: 'Điểm cao nhất',        description: 'Đạt điểm cao nhất trong game',  iconEmoji: '🏆' },
] as const;
