/* extras.jsx — 4 routes × 5 viewports:
   /grades, /homework, /parent/kid-access, /unlock */

// ── Shared data ────────────────────────────────────────────────────────
const GRADES_DATA = [
  { sid: 'vietnamese', score: 9.5, sem1: 9.5, sem2: 9.0 },
  { sid: 'math',       score: 10,  sem1: 10,  sem2: 9.5 },
  { sid: 'english',    score: 8.5, sem1: 8.0, sem2: 8.5 },
  { sid: 'science',    score: 9.0, sem1: 8.5, sem2: 9.0 },
  { sid: 'ethics',     score: 9.5, sem1: 9.5, sem2: 9.5 },
  { sid: 'pe',         score: 8.0, sem1: 8.0, sem2: 8.0 },
  { sid: 'music',      score: 9.0, sem1: 9.0, sem2: 9.0 },
  { sid: 'art',        score: 9.5, sem1: 9.0, sem2: 9.5 },
  { sid: 'it',         score: 7.5, sem1: 7.5, sem2: 8.0 },
  { sid: 'activities', score: 9.0, sem1: 9.0, sem2: 9.0 },
];

const HOMEWORK_DATA = [
  { id: 'h1', sid: 'math',       title: 'Bài 12 — Phép cộng',    note: 'Tr. 24-25',   done: false, priority: true },
  { id: 'h2', sid: 'vietnamese', title: 'Tập viết chữ M',         note: 'Vở tập viết', done: false, priority: true },
  { id: 'h3', sid: 'english',    title: 'Học 5 từ mới',           note: 'Unit 4',      done: true,  priority: false },
  { id: 'h4', sid: 'science',    title: 'Vẽ vòng đời bướm',       note: 'Tr. 18',      done: false, priority: false },
  { id: 'h5', sid: 'art',        title: 'Tô màu bức tranh',       note: 'A4',          done: true,  priority: false },
];

const BADGE_DATA = [
  { id: 'first-login',    emoji: '🌟', name: 'Chào bạn mới!',      desc: 'Lần đầu mở ứng dụng',       earned: true,  date: '01/03' },
  { id: 'math-ace',       emoji: '🧮', name: 'Siêu Toán',           desc: 'Đạt xuất sắc môn Toán',     earned: true,  date: '15/03' },
  { id: 'reading-star',   emoji: '📚', name: 'Sao Đọc Sách',        desc: 'Xuất sắc Tiếng Việt',       earned: true,  date: '20/03' },
  { id: 'english-hero',   emoji: '🌍', name: 'Anh hùng Tiếng Anh', desc: 'Hoàn thành game Tiếng Anh', earned: false, progress: 75 },
  { id: 'perfect-10',     emoji: '💯', name: 'Điểm 10!',            desc: 'Đạt 10 điểm bất kỳ môn',   earned: true,  date: '22/03' },
  { id: 'streak-3',       emoji: '🔥', name: 'Kiên trì 3 ngày',     desc: 'Học 3 ngày liên tiếp',      earned: true,  date: '10/03' },
  { id: 'streak-7',       emoji: '⚡', name: 'Kiên trì 7 ngày',     desc: 'Học 7 ngày liên tiếp',      earned: false, progress: 86 },
  { id: 'all-green',      emoji: '🎯', name: 'Toàn diện',           desc: 'Tất cả môn đều đạt Giỏi',  earned: false, progress: 90 },
  { id: 'game-win',       emoji: '🎮', name: 'Chiến thắng!',        desc: 'Hoàn thành 1 trò chơi',     earned: true,  date: '08/03' },
  { id: 'top-score',      emoji: '🏆', name: 'Điểm cao nhất',       desc: 'Đạt điểm cao nhất game',    earned: false, progress: 60 },
];

const ACCESS_FEATURES = [
  { id: 'math-games',    icon: '🧮', label: 'Trò chơi Toán',      group: 'games',    on: true },
  { id: 'english-games', icon: '🔤', label: 'Trò chơi Tiếng Anh', group: 'games',    on: true },
  { id: 'schedule',      icon: '📅', label: 'Xem lịch học',        group: 'views',    on: true },
  { id: 'grades',        icon: '⭐', label: 'Xem điểm số',         group: 'views',    on: true },
  { id: 'homework',      icon: '📚', label: 'Bài tập về nhà',      group: 'views',    on: true },
  { id: 'badges',        icon: '🏆', label: 'Huy hiệu & phần thưởng', group: 'views', on: true },
  { id: 'sounds',        icon: '🔊', label: 'Âm thanh trò chơi',   group: 'settings', on: true },
  { id: 'animations',    icon: '✨', label: 'Hiệu ứng hoạt ảnh',   group: 'settings', on: true },
];

// ── Shared tiny components ─────────────────────────────────────────────
function GradeBadge({ score, size = 'md' }) {
  const tier = score >= 9 ? { label: 'Xuất sắc', bg: '#fef3c7', fg: '#b45309', border: '#fde68a' }
             : score >= 7 ? { label: 'Giỏi',     bg: '#dbeafe', fg: '#1d4ed8', border: '#bfdbfe' }
             : score >= 5 ? { label: 'Khá',      bg: '#ffedd5', fg: '#c2410c', border: '#fed7aa' }
             :               { label: 'Cần cố',  bg: '#fee2e2', fg: '#b91c1c', border: '#fecaca' };
  const sz = { sm: { pad: '2px 8px', fs: 10 }, md: { pad: '3px 10px', fs: 11 }, lg: { pad: '4px 12px', fs: 12 } }[size] || { pad: '3px 10px', fs: 11 };
  return (
    <span style={{
      background: tier.bg, color: tier.fg,
      border: `2px solid ${tier.border}`,
      borderRadius: 999, padding: sz.pad,
      fontSize: sz.fs, fontWeight: 900, whiteSpace: 'nowrap',
    }}>{tier.label}</span>
  );
}

function GradeCard({ g, semester = 1, compact = false }) {
  const s = KH_SUBJECTS[g.sid];
  const score = semester === 1 ? g.sem1 : g.sem2;
  const pct = (score / 10) * 100;
  const barColor = score >= 9 ? '#fbbf24' : score >= 7 ? '#3b82f6' : '#fb923c';
  return (
    <div style={{
      background: '#fff', borderRadius: compact ? 16 : 20,
      padding: compact ? '10px 12px' : '14px 16px',
      display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
      boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
    }}>
      <Subj sid={g.sid} size={compact ? 36 : 48} rounded={compact ? 10 : 13} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <span style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: '#1e293b' }}>{s.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <GradeBadge score={score} size={compact ? 'sm' : 'md'} />
            <span style={{ fontSize: compact ? 18 : 22, fontWeight: 900, color: '#1e293b', minWidth: compact ? 36 : 44, textAlign: 'right' }}>{score}</span>
          </div>
        </div>
        <div style={{ height: compact ? 5 : 7, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: barColor, borderRadius: 999 }} />
        </div>
      </div>
    </div>
  );
}

function GradesSummaryBar({ semester = 1, compact = false }) {
  const scores = GRADES_DATA.map((g) => semester === 1 ? g.sem1 : g.sem2);
  const avg = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  const top = GRADES_DATA.reduce((a, b) => (semester === 1 ? b.sem1 : b.sem2) > (semester === 1 ? a.sem1 : a.sem2) ? b : a);
  const topS = KH_SUBJECTS[top.sid];
  return (
    <div style={{ display: 'flex', gap: compact ? 8 : 12 }}>
      <div style={{
        flex: 1, background: '#3b82f6', borderRadius: compact ? 16 : 20,
        padding: compact ? '10px 12px' : '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10, color: '#fff',
      }}>
        <span style={{ fontSize: compact ? 24 : 32 }}>📊</span>
        <div>
          <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.1 }}>Điểm TB</div>
          <div style={{ fontSize: compact ? 22 : 28, fontWeight: 900, lineHeight: 1 }}>{avg}</div>
        </div>
      </div>
      <div style={{
        flex: 1, background: '#f0fdf4', borderRadius: compact ? 16 : 20,
        padding: compact ? '10px 12px' : '14px 16px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Subj sid={top.sid} size={compact ? 36 : 44} rounded={11} />
        <div>
          <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.1 }}>Môn giỏi nhất</div>
          <div style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: '#1e293b' }}>{topS.name}</div>
        </div>
      </div>
    </div>
  );
}

function SemesterTabs({ active, onChange, compact }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: '#fff', borderRadius: 16, width: 'fit-content',
      boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
    }}>
      {[1, 2].map((s) => (
        <button key={s} onClick={() => onChange(s)}
          style={{
            padding: compact ? '7px 16px' : '9px 22px',
            borderRadius: 12, border: 0,
            background: active === s ? 'var(--kh-accent)' : 'transparent',
            color: active === s ? '#fff' : '#64748b',
            fontFamily: 'inherit', fontSize: compact ? 12 : 14, fontWeight: 800,
            cursor: 'pointer',
            boxShadow: active === s ? '0 4px 10px -4px var(--kh-accent)' : 'none',
          }}>Học kỳ {s}</button>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /grades — 5 viewports
// ════════════════════════════════════════════════════════════════════
function GradesPhoneP({ tweaks, onAction, insets = {} }) {
  const [sem, setSem] = React.useState(tweaks.semester || 1);
  React.useEffect(() => setSem(tweaks.semester || 1), [tweaks.semester]);
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-shell-kid)', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1e293b', paddingTop: insets.top ?? 0 }}>
      <div className="kh-scroll" style={{ flex: 1, padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Điểm số ⭐</div>
          <SemesterTabs active={sem} onChange={setSem} compact />
        </div>
        <GradesSummaryBar semester={sem} compact />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GRADES_DATA.map((g) => <GradeCard key={g.sid} g={g} semester={sem} compact />)}
        </div>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

function GradesPhoneL({ tweaks, onAction }) {
  const [sem, setSem] = React.useState(tweaks.semester || 1);
  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <NarrowRail onAction={onAction} />
      <main style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 900 }}>Điểm số ⭐</div>
          <SemesterTabs active={sem} onChange={setSem} compact />
        </div>
        <GradesSummaryBar semester={sem} compact />
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {GRADES_DATA.map((g) => <GradeCard key={g.sid} g={g} semester={sem} compact />)}
        </div>
      </main>
    </div>
  );
}

function GradesTabletP({ tweaks, onAction }) {
  const [sem, setSem] = React.useState(tweaks.semester || 1);
  return (
    <div className="kh-app">
      <Sidebar active="grades" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 30 }}>Điểm số ⭐</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Năm học 2025-2026 · Lớp 1A</p></div>
          <SemesterTabs active={sem} onChange={setSem} compact />
        </div>
        <GradesSummaryBar semester={sem} />
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {GRADES_DATA.map((g) => <GradeCard key={g.sid} g={g} semester={sem} />)}
        </div>
      </main>
    </div>
  );
}

function GradesTabletL({ tweaks, onAction }) {
  const [sem, setSem] = React.useState(tweaks.semester || 1);
  return (
    <div className="kh-app">
      <Sidebar active="grades" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 32 }}>Điểm số ⭐</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Năm học 2025-2026 · Lớp 1A</p></div>
          <SemesterTabs active={sem} onChange={setSem} />
        </div>
        <GradesSummaryBar semester={sem} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {GRADES_DATA.map((g) => <GradeCard key={g.sid} g={g} semester={sem} />)}
        </div>
      </main>
    </div>
  );
}

function GradesDesktop({ tweaks, onAction }) {
  const [sem, setSem] = React.useState(tweaks.semester || 1);
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 34 }}>Điểm số ⭐</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>Năm học 2025-2026 · Lớp 1A · Học kỳ {sem}</p></div>
          <SemesterTabs active={sem} onChange={setSem} />
        </div>
        <GradesSummaryBar semester={sem} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, minHeight: 0, overflowY: 'auto' }}>
          {GRADES_DATA.map((g) => <GradeCard key={g.sid} g={g} semester={sem} />)}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /homework — 5 viewports
// ════════════════════════════════════════════════════════════════════
const HW_STATUS = { done: '✓', pending: '⏳' };

function HomeworkItem({ h, compact = false, onAction }) {
  const s = KH_SUBJECTS[h.sid];
  return (
    <div
      className="kh-press"
      onClick={() => onAction(h.done ? `${h.title} — hoàn thành` : `Bắt đầu: ${h.title}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
        padding: compact ? '10px 12px' : '14px 16px',
        borderRadius: compact ? 16 : 20,
        background: h.done ? '#f8fafc' : '#fff',
        border: h.priority && !h.done ? `2px solid ${s.color}` : '2px solid transparent',
        boxShadow: h.done ? 'none' : `0 1px 3px rgba(15,23,42,0.05)${h.priority ? `, 0 8px 20px -12px ${s.color}` : ''}`,
        opacity: h.done ? 0.6 : 1,
        cursor: 'pointer',
      }}>
      <div style={{
        width: compact ? 38 : 48, height: compact ? 38 : 48,
        borderRadius: compact ? 10 : 13,
        background: h.done ? '#f1f5f9' : `color-mix(in oklab, ${s.color} 15%, white)`,
        display: 'grid', placeItems: 'center',
        fontSize: compact ? 18 : 24, flexShrink: 0,
      }}>{s.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 13 : 15, fontWeight: 900, color: '#1e293b', textDecoration: h.done ? 'line-through' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {h.title}
        </div>
        <div style={{ fontSize: compact ? 11 : 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
          {s.name}{h.note ? ` · ${h.note}` : ''}
        </div>
      </div>
      {h.priority && !h.done && (
        <span style={{ fontSize: compact ? 10 : 11, fontWeight: 900, background: `color-mix(in oklab, ${s.color} 12%, white)`, color: s.color, padding: '3px 8px', borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0 }}>Ưu tiên</span>
      )}
      <div style={{
        width: compact ? 26 : 32, height: compact ? 26 : 32,
        borderRadius: 999, flexShrink: 0,
        background: h.done ? '#10b981' : '#fff',
        border: h.done ? 'none' : '3px solid #e2e8f0',
        display: 'grid', placeItems: 'center',
        color: '#fff', fontSize: compact ? 12 : 14, fontWeight: 900,
      }}>{h.done ? '✓' : ''}</div>
    </div>
  );
}

function HomeworkHeader({ compact = false, total, done, onAction }) {
  const pct = Math.round((done / total) * 100);
  return (
    <div style={{
      background: '#fff', borderRadius: compact ? 18 : 24, padding: compact ? 12 : 18,
      display: 'flex', flexDirection: 'column', gap: compact ? 8 : 12,
      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: compact ? 13 : 16, fontWeight: 900 }}>Bài tập hôm nay</div>
          <div style={{ fontSize: compact ? 11 : 13, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
            {done}/{total} bài đã hoàn thành · Thứ Tư
          </div>
        </div>
        <div style={{
          width: compact ? 48 : 60, height: compact ? 48 : 60,
          borderRadius: '50%', position: 'relative',
          display: 'grid', placeItems: 'center',
        }}>
          <svg width={compact ? 48 : 60} height={compact ? 48 : 60} style={{ position: 'absolute', top: 0, left: 0 }}>
            <circle cx={compact ? 24 : 30} cy={compact ? 24 : 30} r={compact ? 20 : 25} fill="none" stroke="#f1f5f9" strokeWidth={compact ? 5 : 6} />
            <circle cx={compact ? 24 : 30} cy={compact ? 24 : 30} r={compact ? 20 : 25} fill="none" stroke="#10b981" strokeWidth={compact ? 5 : 6}
              strokeDasharray={`${2 * Math.PI * (compact ? 20 : 25) * pct / 100} 999`}
              transform={`rotate(-90 ${compact ? 24 : 30} ${compact ? 24 : 30})`} strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: compact ? 11 : 13, fontWeight: 900, color: '#1e293b' }}>{pct}%</span>
        </div>
      </div>
      <div style={{ height: compact ? 6 : 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#10b981', borderRadius: 999, transition: 'width 0.4s' }} />
      </div>
    </div>
  );
}

function HomeworkPhoneP({ tweaks, onAction, insets = {} }) {
  const done = HOMEWORK_DATA.filter((h) => h.done).length;
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-shell-kid)', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1e293b', paddingTop: insets.top ?? 0 }}>
      <div className="kh-scroll" style={{ flex: 1, padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Bài tập 📚</div>
          <Pill tone="amber">{HOMEWORK_DATA.length - done} chưa làm</Pill>
        </div>
        <HomeworkHeader compact total={HOMEWORK_DATA.length} done={done} onAction={onAction} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {HOMEWORK_DATA.map((h) => <HomeworkItem key={h.id} h={h} compact onAction={onAction} />)}
        </div>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

function HomeworkPhoneL({ tweaks, onAction }) {
  const done = HOMEWORK_DATA.filter((h) => h.done).length;
  return (
    <div className="kh-app">
      <NarrowRail onAction={onAction} />
      <main style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <HomeworkHeader compact total={HOMEWORK_DATA.length} done={done} onAction={onAction} />
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {HOMEWORK_DATA.map((h) => <HomeworkItem key={h.id} h={h} compact onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

function HomeworkTabletP({ tweaks, onAction }) {
  const done = HOMEWORK_DATA.filter((h) => h.done).length;
  return (
    <div className="kh-app">
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 30 }}>Bài tập 📚</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Hôm nay · Thứ Tư</p></div>
          <Pill tone="amber">{HOMEWORK_DATA.length - done} bài chưa làm</Pill>
        </div>
        <HomeworkHeader total={HOMEWORK_DATA.length} done={done} onAction={onAction} />
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {HOMEWORK_DATA.map((h) => <HomeworkItem key={h.id} h={h} onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

function HomeworkTabletL({ tweaks, onAction }) {
  const done = HOMEWORK_DATA.filter((h) => h.done).length;
  const pending = HOMEWORK_DATA.filter((h) => !h.done);
  const finished = HOMEWORK_DATA.filter((h) => h.done);
  return (
    <div className="kh-app">
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 32 }}>Bài tập 📚</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Hôm nay · Thứ Tư · {done}/{HOMEWORK_DATA.length} hoàn thành</p></div>
        </div>
        <HomeworkHeader total={HOMEWORK_DATA.length} done={done} onAction={onAction} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div className="kh-eyebrow">Chưa làm ({pending.length})</div>
            <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {pending.map((h) => <HomeworkItem key={h.id} h={h} onAction={onAction} />)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div className="kh-eyebrow">Đã làm ({finished.length})</div>
            <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {finished.map((h) => <HomeworkItem key={h.id} h={h} onAction={onAction} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function HomeworkDesktop({ tweaks, onAction }) {
  const done = HOMEWORK_DATA.filter((h) => h.done).length;
  const pending = HOMEWORK_DATA.filter((h) => !h.done);
  const finished = HOMEWORK_DATA.filter((h) => h.done);
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 34 }}>Bài tập về nhà 📚</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>Hôm nay Thứ Tư · {done}/{HOMEWORK_DATA.length} đã hoàn thành</p></div>
          <Pill tone={done === HOMEWORK_DATA.length ? 'emerald' : 'amber'}>
            {done === HOMEWORK_DATA.length ? '🎉 Xong hết rồi!' : `${HOMEWORK_DATA.length - done} bài chưa làm`}
          </Pill>
        </div>
        <HomeworkHeader total={HOMEWORK_DATA.length} done={done} onAction={onAction} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, flex: 1, minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div className="kh-eyebrow">Chưa làm</div>
            <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pending.map((h) => <HomeworkItem key={h.id} h={h} onAction={onAction} />)}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <div className="kh-eyebrow">Đã hoàn thành</div>
            <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {finished.map((h) => <HomeworkItem key={h.id} h={h} onAction={onAction} />)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /parent/kid-access — 5 viewports
// ════════════════════════════════════════════════════════════════════

function AccessToggleRow({ feature, isDark = false, onAction, compact }) {
  const bg = isDark ? '#1e293b' : '#f8fafc';
  const fg = isDark ? '#fff' : '#1e293b';
  const sub = isDark ? '#94a3b8' : '#64748b';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: compact ? 10 : 14,
      padding: compact ? '10px 12px' : '12px 16px',
      borderRadius: compact ? 14 : 18, background: bg,
    }}>
      <div style={{
        width: compact ? 36 : 44, height: compact ? 36 : 44, borderRadius: compact ? 10 : 13,
        background: feature.on ? `color-mix(in oklab, var(--kh-accent) 15%, white)` : (isDark ? '#334155' : '#e2e8f0'),
        display: 'grid', placeItems: 'center',
        fontSize: compact ? 18 : 22, flexShrink: 0,
      }}>{feature.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: compact ? 13 : 14, fontWeight: 900, color: fg }}>{feature.label}</div>
      </div>
      <button
        onClick={() => onAction(`${feature.on ? 'Tắt' : 'Bật'}: ${feature.label}`)}
        className="kh-press"
        style={{
          width: compact ? 44 : 52, height: compact ? 26 : 30, borderRadius: 999,
          border: 0, cursor: 'pointer', flexShrink: 0, padding: 0,
          background: feature.on ? 'var(--kh-accent)' : (isDark ? '#334155' : '#e2e8f0'),
          position: 'relative', transition: 'background 0.2s',
        }}>
        <div style={{
          position: 'absolute', top: 3, left: feature.on ? (compact ? 21 : 25) : 3,
          width: compact ? 20 : 24, height: compact ? 20 : 24, borderRadius: 999,
          background: '#fff',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          transition: 'left 0.2s',
        }} />
      </button>
    </div>
  );
}

function ScreenTimeCard({ compact = false, onAction }) {
  const total = 120, used = 47;
  const pct = Math.round((used / total) * 100);
  return (
    <div style={{
      background: 'var(--kh-accent)', color: '#fff', borderRadius: compact ? 18 : 22,
      padding: compact ? '12px 16px' : '16px 20px',
      boxShadow: '0 12px 28px -12px var(--kh-accent)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <div>
          <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, opacity: 0.85, letterSpacing: 0.1, textTransform: 'uppercase' }}>Thời gian màn hình hôm nay</div>
          <div style={{ fontSize: compact ? 20 : 26, fontWeight: 900, lineHeight: 1, marginTop: 2 }}>{used} / {total} phút</div>
        </div>
        <div style={{
          background: 'rgba(255,255,255,0.2)', borderRadius: 999,
          padding: compact ? '6px 12px' : '8px 16px',
          fontSize: compact ? 11 : 13, fontWeight: 900,
          cursor: 'pointer',
        }} onClick={() => onAction('Điều chỉnh thời gian')}>Điều chỉnh</div>
      </div>
      <div style={{ height: compact ? 8 : 10, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: '#fff', borderRadius: 999 }} />
      </div>
    </div>
  );
}

function AccessGroups({ onAction, compact, isDark = false }) {
  const groups = [
    { id: 'games', label: 'Trò chơi' },
    { id: 'views', label: 'Màn hình xem' },
    { id: 'settings', label: 'Cài đặt' },
  ];
  return (
    <React.Fragment>
      {groups.map((grp) => (
        <div key={grp.id}>
          <div className="kh-eyebrow" style={{ marginBottom: compact ? 6 : 8, color: isDark ? '#475569' : undefined }}>{grp.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? 5 : 7 }}>
            {ACCESS_FEATURES.filter((f) => f.group === grp.id).map((f) => (
              <AccessToggleRow key={f.id} feature={f} compact={compact} isDark={isDark} onAction={onAction} />
            ))}
          </div>
        </div>
      ))}
    </React.Fragment>
  );
}

function KidAccessPhoneP({ tweaks, onAction, insets = {} }) {
  return (
    <div style={{ width: '100%', height: '100%', background: '#f8fafc', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1e293b', paddingTop: insets.top ?? 0 }}>
      <div className="kh-scroll" style={{ flex: 1, padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 900 }}>🛡️ Quyền truy cập</div>
          <button onClick={() => onAction('Về trang chủ')} style={{ border: 0, background: '#fff', padding: '7px 12px', borderRadius: 999, fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', color: '#475569' }}>← Quay lại</button>
        </div>
        <ScreenTimeCard compact onAction={onAction} />
        <AccessGroups onAction={onAction} compact />
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

function KidAccessPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <NarrowRail onAction={onAction} />
      <main style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 13, fontWeight: 900 }}>🛡️ Quyền truy cập</div>
          <ScreenTimeCard compact onAction={onAction} />
        </div>
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <AccessGroups onAction={onAction} compact />
        </div>
      </main>
    </div>
  );
}

function KidAccessTabletP({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 30 }}>🛡️ Quyền truy cập Khôi</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Kiểm soát những gì Khôi có thể truy cập</p></div>
          <button onClick={() => onAction('← Quay lại')} className="kh-ghost">← Quay lại</button>
        </div>
        <ScreenTimeCard onAction={onAction} />
        <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <AccessGroups onAction={onAction} />
        </div>
      </main>
    </div>
  );
}

function KidAccessTabletL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: '22px 28px', display: 'flex', gap: 22, overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18, minWidth: 0 }}>
          <div><h1 className="kh-h1" style={{ fontSize: 28 }}>🛡️ Quyền truy cập Khôi</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Kiểm soát nội dung & thời gian sử dụng</p></div>
          <ScreenTimeCard onAction={onAction} />
          <div className="kh-scroll" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AccessGroups onAction={onAction} />
          </div>
        </div>
        <aside style={{ width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="kh-eyebrow">Hoạt động gần đây</div>
          {[{ icon: '🔢', text: 'Chơi Number Ninja · Cấp 2', time: '09:20' }, { icon: '🔤', text: 'Mở Word Safari', time: '08:55' }, { icon: '📅', text: 'Xem lịch học', time: '07:35' }].map((a, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
              <span style={{ fontSize: 22 }}>{a.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
              </div>
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, flexShrink: 0 }}>{a.time}</span>
            </div>
          ))}
        </aside>
      </main>
    </div>
  );
}

function KidAccessDesktop({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <WideSidebar onAction={onAction} />
      <main style={{ flex: 1, padding: '28px 36px', display: 'flex', gap: 28, overflow: 'hidden', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 }}>
          <div><h1 className="kh-h1" style={{ fontSize: 32 }}>🛡️ Quyền truy cập của Khôi</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>Kiểm soát nội dung, thời gian sử dụng và tính năng</p></div>
          <ScreenTimeCard onAction={onAction} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, flex: 1, minHeight: 0, overflowY: 'auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <AccessGroups onAction={onAction} />
            </div>
            <aside style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="kh-eyebrow">Hoạt động gần đây</div>
              {[{ icon: '🔢', text: 'Chơi Number Ninja · Cấp 2', time: 'Hôm nay 09:20', dur: '12 phút' }, { icon: '🔤', text: 'Mở Word Safari · Cấp 1', time: 'Hôm nay 08:55', dur: '8 phút' }, { icon: '📅', text: 'Xem lịch học', time: 'Hôm nay 07:35', dur: '2 phút' }, { icon: '🌟', text: 'Đếm Sao · Cấp 1', time: 'Hôm qua 16:10', dur: '6 phút' }].map((a, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 18, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 1px 2px rgba(15,23,42,0.04)' }}>
                  <span style={{ fontSize: 26 }}>{a.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{a.text}</div>
                    <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700, marginTop: 2 }}>{a.time}</div>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b', background: '#f1f5f9', padding: '4px 10px', borderRadius: 999 }}>{a.dur}</span>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /unlock — Badges & achievements
// ════════════════════════════════════════════════════════════════════

function BadgeCard({ badge, compact = false, onAction }) {
  const pct = badge.earned ? 100 : (badge.progress || 0);
  return (
    <button
      onClick={() => onAction(badge.earned ? `Huy hiệu: ${badge.name}` : `Tiến độ ${badge.name}: ${pct}%`)}
      className="kh-press"
      style={{
        background: badge.earned ? '#fff' : '#f8fafc',
        borderRadius: compact ? 18 : 22, padding: compact ? '12px 14px' : '16px 18px',
        border: badge.earned ? '2px solid #fde68a' : '2px solid #e2e8f0',
        display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8,
        textAlign: 'left', fontFamily: 'inherit', cursor: 'pointer',
        boxShadow: badge.earned ? '0 4px 12px -6px rgba(251,191,36,0.4)' : 'none',
        opacity: badge.earned ? 1 : 0.75,
        position: 'relative', overflow: 'hidden',
      }}>
      <div style={{ fontSize: compact ? 32 : 40, lineHeight: 1, filter: badge.earned ? 'none' : 'grayscale(0.6)' }}>{badge.emoji}</div>
      <div>
        <div style={{ fontSize: compact ? 12 : 14, fontWeight: 900, color: '#1e293b' }}>{badge.name}</div>
        <div style={{ fontSize: compact ? 10 : 11, color: '#64748b', fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>{badge.desc}</div>
      </div>
      {badge.earned ? (
        <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, color: '#b45309' }}>{badge.date} ✓</div>
      ) : (
        <div>
          <div style={{ height: compact ? 4 : 5, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: 'var(--kh-accent)', borderRadius: 999 }} />
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, marginTop: 3 }}>{pct}%</div>
        </div>
      )}
    </button>
  );
}

function UnlockSummary({ compact = false }) {
  const earned = BADGE_DATA.filter((b) => b.earned).length;
  return (
    <div style={{
      background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)',
      borderRadius: compact ? 18 : 22, padding: compact ? '12px 16px' : '18px 22px',
      color: '#fff', display: 'flex', alignItems: 'center', gap: compact ? 12 : 18,
      boxShadow: '0 12px 28px -12px rgba(251,191,36,0.5)',
    }}>
      <div style={{ fontSize: compact ? 40 : 56, lineHeight: 1 }}>🏆</div>
      <div>
        <div style={{ fontSize: compact ? 10 : 11, fontWeight: 800, opacity: 0.85, textTransform: 'uppercase', letterSpacing: 0.1 }}>Bộ sưu tập huy hiệu của Khôi</div>
        <div style={{ fontSize: compact ? 24 : 32, fontWeight: 900, lineHeight: 1, marginTop: 2 }}>{earned} / {BADGE_DATA.length}</div>
        <div style={{ fontSize: compact ? 11 : 13, fontWeight: 700, opacity: 0.85 }}>huy hiệu đã đạt</div>
      </div>
      <div style={{ marginLeft: 'auto', display: 'flex', gap: 2 }}>
        {[1,2,3,4,5].map((i) => <span key={i} style={{ fontSize: compact ? 18 : 24, color: i <= Math.round(earned / BADGE_DATA.length * 5) ? '#fff' : 'rgba(255,255,255,0.3)' }}>★</span>)}
      </div>
    </div>
  );
}

function UnlockPhoneP({ tweaks, onAction, insets = {} }) {
  const filter = tweaks.badgeFilter || 'all';
  const filtered = BADGE_DATA.filter((b) => filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned);
  return (
    <div style={{ width: '100%', height: '100%', background: 'var(--color-shell-kid)', display: 'flex', flexDirection: 'column', fontFamily: 'Nunito, system-ui, sans-serif', color: '#1e293b', paddingTop: insets.top ?? 0 }}>
      <div className="kh-scroll" style={{ flex: 1, padding: '14px 14px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Huy hiệu 🏆</div>
        <UnlockSummary compact />
        <FilterTabs active={filter} onAction={onAction} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {filtered.map((b) => <BadgeCard key={b.id} badge={b} compact onAction={onAction} />)}
        </div>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

function FilterTabs({ active, onAction }) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[{ id: 'all', label: 'Tất cả' }, { id: 'earned', label: 'Đã đạt ✓' }, { id: 'locked', label: 'Chưa đạt' }].map((f) => (
        <button key={f.id} onClick={() => onAction(`Lọc: ${f.label}`)}
          style={{
            padding: '7px 14px', borderRadius: 999, border: 0,
            background: active === f.id ? 'var(--kh-accent)' : '#fff',
            color: active === f.id ? '#fff' : '#64748b',
            fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: active === f.id ? '0 4px 10px -4px var(--kh-accent)' : '0 1px 2px rgba(15,23,42,0.05)',
          }}>{f.label}</button>
      ))}
    </div>
  );
}

function UnlockPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <NarrowRail onAction={onAction} />
      <main style={{ flex: 1, padding: 10, display: 'flex', flexDirection: 'column', gap: 8, overflow: 'hidden' }}>
        <UnlockSummary compact />
        <div className="kh-scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, alignContent: 'start' }}>
          {BADGE_DATA.map((b) => <BadgeCard key={b.id} badge={b} compact onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

function UnlockTabletP({ tweaks, onAction }) {
  const filter = tweaks.badgeFilter || 'all';
  const filtered = BADGE_DATA.filter((b) => filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned);
  return (
    <div className="kh-app">
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div><h1 className="kh-h1" style={{ fontSize: 30 }}>Huy hiệu 🏆</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Bộ sưu tập thành tích của Khôi</p></div>
        <UnlockSummary />
        <FilterTabs active={filter} onAction={onAction} />
        <div className="kh-scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, alignContent: 'start' }}>
          {filtered.map((b) => <BadgeCard key={b.id} badge={b} onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

function UnlockTabletL({ tweaks, onAction }) {
  const filter = tweaks.badgeFilter || 'all';
  const filtered = BADGE_DATA.filter((b) => filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned);
  return (
    <div className="kh-app">
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{ flex: 1, padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 32 }}>Huy hiệu 🏆</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>Bộ sưu tập thành tích</p></div>
          <FilterTabs active={filter} onAction={onAction} />
        </div>
        <UnlockSummary />
        <div className="kh-scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, alignContent: 'start' }}>
          {filtered.map((b) => <BadgeCard key={b.id} badge={b} onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

function UnlockDesktop({ tweaks, onAction }) {
  const filter = tweaks.badgeFilter || 'all';
  const filtered = BADGE_DATA.filter((b) => filter === 'all' ? true : filter === 'earned' ? b.earned : !b.earned);
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{ flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column', gap: 22, overflow: 'hidden', maxWidth: 1280, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div><h1 className="kh-h1" style={{ fontSize: 34 }}>Huy hiệu 🏆</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>Bộ sưu tập thành tích · {BADGE_DATA.filter((b) => b.earned).length}/{BADGE_DATA.length} đã đạt</p></div>
          <FilterTabs active={filter} onAction={onAction} />
        </div>
        <UnlockSummary />
        <div className="kh-scroll" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, alignContent: 'start' }}>
          {filtered.map((b) => <BadgeCard key={b.id} badge={b} onAction={onAction} />)}
        </div>
      </main>
    </div>
  );
}

Object.assign(window, {
  GradesPhoneP, GradesPhoneL, GradesTabletP, GradesTabletL, GradesDesktop,
  HomeworkPhoneP, HomeworkPhoneL, HomeworkTabletP, HomeworkTabletL, HomeworkDesktop,
  KidAccessPhoneP, KidAccessPhoneL, KidAccessTabletP, KidAccessTabletL, KidAccessDesktop,
  UnlockPhoneP, UnlockPhoneL, UnlockTabletP, UnlockTabletL, UnlockDesktop,
});
