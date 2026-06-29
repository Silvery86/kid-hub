/* shared.jsx — common data + small components used by all three dashboards */

// ── Data (matches kid-hub/lib/data/subjects.ts + schedule.ts) ──────────
const SUBJECTS = {
  math:        { id: 'math',        name: 'Toán',           icon: '🧮', emoji: '🔢', color: '#3b82f6' },
  vietnamese:  { id: 'vietnamese',  name: 'Tiếng Việt',     icon: '📖', emoji: '🇻🇳', color: '#ef4444' },
  english:     { id: 'english',     name: 'Tiếng Anh',      icon: '🌍', emoji: '🔤', color: '#10b981' },
  science:     { id: 'science',     name: 'Tự nhiên & XH',  icon: '🌱', emoji: '🌿', color: '#84cc16' },
  ethics:      { id: 'ethics',      name: 'Đạo đức',        icon: '💗', emoji: '💗', color: '#a78bfa' },
  pe:          { id: 'pe',          name: 'Thể dục',        icon: '🏃', emoji: '⚽', color: '#f59e0b' },
  music:       { id: 'music',       name: 'Âm nhạc',        icon: '🎵', emoji: '🎵', color: '#f97316' },
  art:         { id: 'art',         name: 'Mĩ thuật',       icon: '🎨', emoji: '🎨', color: '#ec4899' },
  it:          { id: 'it',          name: 'Tin học',        icon: '💻', emoji: '💻', color: '#06b6d4' },
  activities:  { id: 'activities',  name: 'Hoạt động',      icon: '⭐', emoji: '🎪', color: '#84cc16' },
};

// Wednesday — packed, recognizable
const TODAY_PERIODS = [
  { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
  { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
  { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
  { n: 4, sid: 'music',      start: '09:40', end: '10:20' },
  { n: 5, sid: 'science',    start: '10:30', end: '11:10' },
];

// Thursday — shown in "upcoming" section when today is done
const TOMORROW_PERIODS = [
  { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
  { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
  { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
  { n: 4, sid: 'english',    start: '09:40', end: '10:20' },
  { n: 5, sid: 'art',        start: '10:30', end: '11:10' },
];

// Mock current state — driven by a "time-of-day" tweak. Returns the
// active period plus a 0..1 progress within that period.
function computeNow(timeMode) {
  // timeMode: 'morning' (09:15, period 3 Toán in-progress)
  //           'break'   (08:55, between p2 and p3 — no active)
  //           'after'   (14:00, school done)
  if (timeMode === 'after') {
    return { now: null, next: null, doneAll: true, label: '14:00', greeting: 'Chiều' };
  }
  if (timeMode === 'break') {
    return {
      now: null,
      next: TODAY_PERIODS[2],
      pendingBreak: true,
      label: '08:55',
      greeting: 'Sáng',
    };
  }
  // morning default
  const cur = TODAY_PERIODS[2]; // Toán 09:00–09:40
  const startMin = 9 * 60;
  const endMin = 9 * 60 + 40;
  const nowMin = 9 * 60 + 15;
  return {
    now: cur,
    next: TODAY_PERIODS[3],
    progress: (nowMin - startMin) / (endMin - startMin),
    label: '09:15',
    greeting: 'Sáng',
  };
}

// Sample homework + progress
const HOMEWORK_ITEMS = [
  { id: 'h1', subject: 'math',       title: 'Bài 12 — Phép cộng', done: false },
  { id: 'h2', subject: 'vietnamese', title: 'Tập viết chữ M',     done: false },
  { id: 'h3', subject: 'english',    title: 'Học 5 từ mới',       done: true },
];

const USER_PROGRESS = {
  name: 'Khôi',
  points: 1280,
  streak: 6,           // days
  weekStreak: [1,1,1,1,1,0,0], // mon-sun
  badges: 7,
  bestMath: { score: 92, stars: 3 },
  bestEnglish: { score: 78, stars: 2 },
};

// ── Tiny components ────────────────────────────────────────────────────

function Subj({ sid, soft, size = 40, rounded = 12 }) {
  const s = SUBJECTS[sid];
  const bg = soft ? `color-mix(in oklab, ${s.color} 18%, white)` : s.color;
  const fg = soft ? s.color : '#fff';
  return (
    <div
      style={{
        width: size, height: size, borderRadius: rounded,
        background: bg, color: fg,
        display: 'grid', placeItems: 'center',
        fontSize: size * 0.5, fontWeight: 800,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {s.icon}
    </div>
  );
}

function Pill({ children, tone = 'slate' }) {
  const tones = {
    slate:  { bg: '#f1f5f9', fg: '#475569' },
    accent: { bg: 'var(--kh-accent-soft)', fg: 'var(--kh-accent-deep)' },
    amber:  { bg: '#fef3c7', fg: '#b45309' },
    rose:   { bg: '#ffe4e6', fg: '#be123c' },
    emerald:{ bg: '#d1fae5', fg: '#047857' },
  };
  const t = tones[tone] || tones.slate;
  return (
    <span style={{
      background: t.bg, color: t.fg,
      padding: '4px 10px', borderRadius: 999,
      fontSize: 11, fontWeight: 800, letterSpacing: 0.04,
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{children}</span>
  );
}

function Stars({ filled = 0, total = 3, size = 16 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 2 }}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} style={{
          fontSize: size,
          color: i < filled ? 'var(--color-star-filled)' : 'var(--color-star-empty)',
          lineHeight: 1,
        }}>★</span>
      ))}
    </span>
  );
}

function Sidebar({ active = 'home', accent, onNav }) {
  const items = [
    { id: 'home',     label: 'Trang chủ', icon: '🏠' },
    { id: 'schedule', label: 'Lịch',      icon: '🗓️' },
    { id: 'grades',   label: 'Điểm',      icon: '⭐' },
    { id: 'games',    label: 'Trò chơi',  icon: '🎮' },
  ];
  return (
    <aside className="kh-sidebar">
      <div className="kh-logo">🌟</div>
      <nav className="kh-nav">
        {items.map((it) => (
          <button
            key={it.id}
            className={'kh-nav-btn' + (it.id === active ? ' is-active' : '')}
            onClick={() => onNav && onNav(it.id)}
          >
            <span style={{ fontSize: 22 }} aria-hidden="true">{it.icon}</span>
            <span>{it.label}</span>
          </button>
        ))}
      </nav>
      <div className="kh-nav-spacer" />
      <button className="kh-nav-btn" style={{ color: '#94a3b8' }} title="Parent">
        <span style={{ fontSize: 20 }}>🛡️</span>
        <span style={{ fontSize: 11 }}>Bố mẹ</span>
      </button>
    </aside>
  );
}

// Day-rail used by Direction 2 — horizontal strip of all 5 periods
function DayRail({ periods, currentN, progress, onPick }) {
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {periods.map((p) => {
        const s = SUBJECTS[p.sid];
        const isNow = currentN === p.n;
        const isDone = currentN != null && p.n < currentN;
        return (
          <div
            key={p.n}
            className={'kh-rail-period' + (isNow ? ' is-now' : '') + (isDone ? ' is-done' : '')}
            onClick={() => onPick && onPick(p)}
          >
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              justifyContent: 'space-between',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 800, letterSpacing: 0.08,
                color: '#94a3b8', textTransform: 'uppercase',
              }}>Tiết {p.n}</span>
              {isDone && <span style={{ fontSize: 14, color: '#10b981' }}>✓</span>}
              {isNow && <span className="kh-pulse" style={{ background: s.color }} />}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Subj sid={p.sid} size={28} rounded={8} />
              <div style={{ minWidth: 0 }}>
                <div style={{
                  fontSize: 13, fontWeight: 800, color: '#1e293b',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>{s.name}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
                  {p.start}
                </div>
              </div>
            </div>
            {isNow && progress != null && (
              <div className="kh-track" style={{ height: 4 }}>
                <div style={{
                  width: `${Math.round(progress * 100)}%`,
                  background: s.color,
                }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Expose for other Babel scripts
Object.assign(window, {
  KH_SUBJECTS: SUBJECTS,
  KH_TODAY: TODAY_PERIODS,
  KH_TOMORROW: TOMORROW_PERIODS,
  KH_HOMEWORK: HOMEWORK_ITEMS,
  KH_USER: USER_PROGRESS,
  khComputeNow: computeNow,
  Subj, Pill, Stars, Sidebar, DayRail,
});
