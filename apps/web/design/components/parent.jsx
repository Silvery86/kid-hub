/* parent.jsx — /parent/pin + /parent dashboard, 5 viewports each.
   Mirrors PinKeypad.tsx, ScheduleManager.tsx, GradesManager.tsx.

   PIN page uses the dark slate-900 fullscreen shell.
   Parent dashboard uses bg-slate-50 with two white panels. */

// ── Sample editable data (mirrors initial seed) ────────────────────────
const PARENT_SCHEDULE = {
  monday:    [
    { id: 'm1', sid: 'activities', start: '07:30', end: '08:10', hw: false },
    { id: 'm2', sid: 'vietnamese', start: '08:10', end: '08:50', hw: true,  note: 'Tập viết chữ M' },
    { id: 'm3', sid: 'vietnamese', start: '09:00', end: '09:40', hw: false },
    { id: 'm4', sid: 'math',       start: '09:40', end: '10:20', hw: true,  note: 'Bài 12 trang 24' },
    { id: 'm5', sid: 'ethics',     start: '10:30', end: '11:10', hw: false },
  ],
  tuesday:   [
    { id: 't1', sid: 'vietnamese', start: '07:30', end: '08:10', hw: false },
    { id: 't2', sid: 'vietnamese', start: '08:10', end: '08:50', hw: false },
    { id: 't3', sid: 'math',       start: '09:00', end: '09:40', hw: false },
    { id: 't4', sid: 'english',    start: '09:40', end: '10:20', hw: true,  note: 'Học 5 từ mới' },
    { id: 't5', sid: 'pe',         start: '10:30', end: '11:10', hw: false },
  ],
  wednesday: [
    { id: 'w1', sid: 'vietnamese', start: '07:30', end: '08:10', hw: false },
    { id: 'w2', sid: 'vietnamese', start: '08:10', end: '08:50', hw: false },
    { id: 'w3', sid: 'math',       start: '09:00', end: '09:40', hw: false },
    { id: 'w4', sid: 'music',      start: '09:40', end: '10:20', hw: false },
    { id: 'w5', sid: 'science',    start: '10:30', end: '11:10', hw: false },
  ],
  thursday:  [
    { id: 'th1', sid: 'vietnamese', start: '07:30', end: '08:10', hw: false },
    { id: 'th2', sid: 'vietnamese', start: '08:10', end: '08:50', hw: false },
    { id: 'th3', sid: 'math',       start: '09:00', end: '09:40', hw: false },
    { id: 'th4', sid: 'english',    start: '09:40', end: '10:20', hw: false },
    { id: 'th5', sid: 'art',        start: '10:30', end: '11:10', hw: false },
  ],
  friday:    [
    { id: 'f1', sid: 'vietnamese', start: '07:30', end: '08:10', hw: false },
    { id: 'f2', sid: 'vietnamese', start: '08:10', end: '08:50', hw: false },
    { id: 'f3', sid: 'math',       start: '09:00', end: '09:40', hw: false },
    { id: 'f4', sid: 'it',         start: '09:40', end: '10:20', hw: false },
    { id: 'f5', sid: 'activities', start: '10:30', end: '11:10', hw: false },
  ],
};

const DAY_LABELS_PARENT = {
  monday: 'Hai', tuesday: 'Ba', wednesday: 'Tư', thursday: 'Năm', friday: 'Sáu',
};
const DAY_LIST = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const PARENT_GRADES = [
  { sid: 'vietnamese', score: 9.5 },
  { sid: 'math',       score: 10  },
  { sid: 'english',    score: 8.5 },
  { sid: 'science',    score: 9   },
  { sid: 'ethics',     score: 9.5 },
  { sid: 'pe',         score: 8   },
  { sid: 'music',      score: 9   },
  { sid: 'art',        score: 9.5 },
  { sid: 'it',         score: 7.5 },
  { sid: 'activities', score: 9   },
];

function badgeTier(score) {
  if (score >= 9) return { label: 'Xuất sắc', bg: '#fef3c7', fg: '#b45309', dot: '#f59e0b' };
  if (score >= 7) return { label: 'Giỏi',     bg: '#dbeafe', fg: '#1d4ed8', dot: '#3b82f6' };
  if (score >= 5) return { label: 'Khá',      bg: '#fef3c7', fg: '#92400e', dot: '#f97316' };
  return            { label: 'Cần cố gắng', bg: '#fee2e2', fg: '#b91c1c', dot: '#ef4444' };
}

// ════════════════════════════════════════════════════════════════════
// PIN KEYPAD COMPONENTS
// ════════════════════════════════════════════════════════════════════

function PinDots({ length, filled, size = 'md', shake }) {
  const sizes = { sm: 14, md: 20, lg: 24 }[size] || 20;
  return (
    <div style={{
      display: 'flex', gap: 16,
      animation: shake ? 'kh-shake 0.4s ease-in-out' : undefined,
    }}>
      {Array.from({ length }).map((_, i) => (
        <div key={i} style={{
          width: sizes, height: sizes, borderRadius: 999,
          border: `4px solid ${i < filled ? '#3b82f6' : '#94a3b8'}`,
          background: i < filled ? '#3b82f6' : 'transparent',
          transition: 'background-color 0.15s, border-color 0.15s',
        }} />
      ))}
    </div>
  );
}

function PinKey({ children, variant = 'primary', size = 'md', onClick, disabled }) {
  const sz = {
    sm: { w: 56, h: 56, fs: 22, border: 3 },
    md: { w: 72, h: 72, fs: 26, border: 4 },
    lg: { w: 88, h: 88, fs: 32, border: 4 },
  }[size] || { w: 72, h: 72, fs: 26, border: 4 };
  const styles = variant === 'primary' ? {
    bg: '#3b82f6', fg: '#fff', border: '#1d4ed8',
  } : variant === 'ghost' ? {
    bg: 'transparent', fg: '#cbd5e1', border: '#475569',
  } : {
    bg: '#334155', fg: '#fff', border: '#1e293b',
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="kh-press"
      style={{
        width: sz.w, height: sz.h,
        borderRadius: '50%',
        background: styles.bg, color: styles.fg,
        border: `${sz.border}px solid ${styles.border}`,
        fontSize: sz.fs, fontWeight: 800,
        fontFamily: 'inherit',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        display: 'grid', placeItems: 'center',
      }}>
      {children}
    </button>
  );
}

function PinKeypad({ size = 'md', pinLength = 4, filled = 0, onKey, shake, disabled }) {
  const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];
  const gapPx = { sm: 8, md: 12, lg: 16 }[size] || 12;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', gap: { sm: 18, md: 24, lg: 32 }[size] || 24,
    }}>
      <PinDots length={pinLength} filled={filled} size={size} shake={shake} />
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, max-content)', gap: gapPx,
      }}>
        {keys.map((k, i) => {
          if (k === null) return <div key={`blank-${i}`} />;
          if (k === 'del') return (
            <PinKey key="del" variant="ghost" size={size}
              onClick={() => onKey && onKey('del')}
              disabled={disabled || filled === 0}>⌫</PinKey>
          );
          return (
            <PinKey key={k} size={size} onClick={() => onKey && onKey(String(k))} disabled={disabled}>
              {k}
            </PinKey>
          );
        })}
      </div>
    </div>
  );
}

// Hero block (lock emoji + title + subtitle) above the keypad
function PinHero({ icon, title, subtitle, size = 'md' }) {
  const sz = {
    sm: { emoji: 56, title: 22, sub: 13, gap: 4 },
    md: { emoji: 80, title: 30, sub: 16, gap: 8 },
    lg: { emoji: 110, title: 38, sub: 18, gap: 10 },
  }[size] || { emoji: 80, title: 30, sub: 16, gap: 8 };
  return (
    <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: sz.gap }}>
      <div style={{ fontSize: sz.emoji, lineHeight: 1 }} aria-hidden="true">{icon}</div>
      <div style={{ fontSize: sz.title, fontWeight: 900, color: '#fff', letterSpacing: -0.01 }}>
        {title}
      </div>
      <div style={{ fontSize: sz.sub, color: '#94a3b8', fontWeight: 700 }}>
        {subtitle}
      </div>
    </div>
  );
}

// PIN state config — derived from pinState tweak
function getPinConfig(state, lockoutSeconds) {
  if (state === 'setup-enter') return {
    icon: '🔐', title: 'Tạo mã PIN', subtitle: 'Nhập mã PIN 4 chữ số mới',
    filled: 0, locked: false,
  };
  if (state === 'setup-confirm') return {
    icon: '✅', title: 'Xác nhận PIN', subtitle: 'Nhập lại mã PIN vừa tạo',
    filled: 4, locked: false,
  };
  if (state === 'verify-error') return {
    icon: '🔒', title: 'Parent Mode', subtitle: 'Sai mã PIN. Thử lại.',
    filled: 3, shake: true, locked: false, error: true,
  };
  if (state === 'locked') return {
    icon: '⛔', title: 'Đã khóa tạm thời', subtitle: `Vui lòng thử lại sau ${lockoutSeconds || 38}s`,
    locked: true,
  };
  // default verify
  return {
    icon: '🔒', title: 'Parent Mode', subtitle: 'Nhập mã PIN để tiếp tục',
    filled: 2, locked: false,
  };
}

// ── PIN page layout — 5 viewports ─────────────────────────────────────
function PinScreen({ state, size = 'md', onAction }) {
  const cfg = getPinConfig(state);
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: { sm: 18, md: 28, lg: 36 }[size] || 28,
      padding: '20px 16px',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <PinHero icon={cfg.icon} title={cfg.title} subtitle={cfg.subtitle} size={size} />
      {!cfg.locked ? (
        <PinKeypad
          size={size}
          filled={cfg.filled}
          shake={cfg.shake}
          onKey={(k) => onAction && onAction(`Nhấn ${k}`)} />
      ) : (
        <button
          onClick={() => onAction && onAction('Đặt lại PIN')}
          className="kh-press"
          style={{
            background: 'transparent', color: '#cbd5e1',
            border: '3px solid #475569', borderRadius: 999,
            padding: '12px 24px', fontSize: 14, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
          }}>Đặt lại PIN</button>
      )}
      {state === 'verify' && (
        <button
          onClick={() => onAction && onAction('Quên mã PIN?')}
          style={{
            background: 'transparent', border: 0,
            color: '#475569', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, cursor: 'pointer',
            padding: 4,
          }}>Quên mã PIN?</button>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────
// Parent Dashboard pieces
// ────────────────────────────────────────────────────────────────────────

function ParentHeader({ size = 'md', onAction, compact }) {
  const isCompact = compact || size === 'sm';
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', gap: 12,
      marginBottom: isCompact ? 12 : 18,
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          margin: 0, fontSize: isCompact ? 22 : 30,
          fontWeight: 900, color: '#1e293b', letterSpacing: -0.02,
        }}>⚙️ Parent Mode</h1>
        <p style={{
          margin: '4px 0 0', color: '#64748b',
          fontSize: isCompact ? 12 : 14, fontWeight: 700,
        }}>Quản lý thời khóa biểu và điểm số của Khôi</p>
      </div>
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => onAction('Về Dashboard')}
          className="kh-press"
          style={{
            background: '#fff', color: '#64748b',
            border: 0, borderRadius: 16,
            padding: isCompact ? '8px 12px' : '12px 18px',
            fontSize: isCompact ? 12 : 14, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            whiteSpace: 'nowrap',
          }}>← Về Dashboard</button>
        <button
          onClick={() => onAction('Đăng xuất')}
          className="kh-press"
          style={{
            background: '#fee2e2', color: '#b91c1c',
            border: 0, borderRadius: 16,
            padding: isCompact ? '8px 12px' : '12px 18px',
            fontSize: isCompact ? 12 : 14, fontWeight: 800,
            fontFamily: 'inherit', cursor: 'pointer',
            boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
            whiteSpace: 'nowrap',
          }}>🔓 Đăng xuất</button>
      </div>
    </div>
  );
}

function ManagerPanel({ title, action, children, compact }) {
  return (
    <div style={{
      background: '#fff', borderRadius: 22,
      padding: compact ? 14 : 20,
      display: 'flex', flexDirection: 'column',
      gap: compact ? 10 : 14, minHeight: 0,
      boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <h2 style={{
          margin: 0, fontSize: compact ? 16 : 20, fontWeight: 900, color: '#475569',
        }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function SaveButton({ onAction, label = 'Lưu', saved = false }) {
  return (
    <button
      onClick={() => onAction(saved ? 'Đã lưu' : 'Lưu')}
      className="kh-press"
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        background: saved ? '#34d399' : '#3b82f6',
        color: '#fff', border: 0,
        borderRadius: 12, padding: '8px 14px',
        fontSize: 13, fontWeight: 800,
        fontFamily: 'inherit', cursor: 'pointer',
        boxShadow: `0 6px 14px -8px ${saved ? '#10b981' : '#3b82f6'}`,
      }}>
      <span>{saved ? '✓' : '💾'}</span>
      <span>{saved ? 'Đã lưu!' : label}</span>
    </button>
  );
}

// Schedule manager body
function ScheduleManagerBody({ onAction, compact, activeDay = 'wednesday' }) {
  const periods = PARENT_SCHEDULE[activeDay];
  return (
    <React.Fragment>
      {/* Day tabs */}
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: '#f1f5f9', borderRadius: 16,
      }}>
        {DAY_LIST.map((d) => {
          const active = d === activeDay;
          return (
            <button
              key={d}
              onClick={() => onAction(`Chuyển sang ${DAY_LABELS_PARENT[d]}`)}
              className="kh-press"
              style={{
                flex: 1, padding: '8px 4px',
                borderRadius: 12, border: 0,
                background: active ? '#fff' : 'transparent',
                color: active ? '#1d4ed8' : '#64748b',
                fontFamily: 'inherit', fontSize: compact ? 11 : 13, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                whiteSpace: 'nowrap',
              }}>{DAY_LABELS_PARENT[d]}</button>
          );
        })}
      </div>

      {/* Period rows */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {periods.map((p) => (
          <SchedulePeriodRow key={p.id} period={p}
            onAction={onAction} compact={compact} />
        ))}
        {/* Add button */}
        <button
          onClick={() => onAction('Thêm tiết học mới')}
          className="kh-press"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, padding: '10px 14px',
            border: '2px dashed #cbd5e1', borderRadius: 16,
            background: 'transparent', color: '#64748b',
            fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
            cursor: 'pointer',
          }}>+ Thêm tiết học</button>
      </div>
    </React.Fragment>
  );
}

function SchedulePeriodRow({ period, onAction, compact }) {
  const s = KH_SUBJECTS[period.sid];
  const inputStyle = {
    border: '2px solid #e2e8f0', borderRadius: 10,
    background: '#fff', padding: compact ? '6px 8px' : '7px 10px',
    fontSize: compact ? 11 : 13, fontWeight: 800,
    fontFamily: 'inherit', color: '#475569',
  };
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 6,
      padding: compact ? 10 : 12, borderRadius: 16,
      background: '#f8fafc',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <div style={{
          ...inputStyle, flex: 1, minWidth: 110,
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
        }} onClick={() => onAction(`Đổi môn: ${s.name}`)}>
          <span style={{
            width: 10, height: 10, borderRadius: 999,
            background: s.color, flexShrink: 0,
          }} />
          <span style={{ flex: 1, minWidth: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.name}</span>
          <span style={{ color: '#94a3b8' }}>▾</span>
        </div>
        <div style={{ ...inputStyle, width: compact ? 56 : 70, fontVariantNumeric: 'tabular-nums' }}
          onClick={() => onAction(`Sửa giờ ${period.start}`)}>
          {period.start}
        </div>
        <span style={{ color: '#cbd5e1', fontWeight: 800 }}>–</span>
        <div style={{ ...inputStyle, width: compact ? 56 : 70, fontVariantNumeric: 'tabular-nums' }}
          onClick={() => onAction(`Sửa giờ ${period.end}`)}>
          {period.end}
        </div>
        <button
          onClick={() => onAction(period.hw ? 'Bỏ đánh dấu bài tập' : 'Đánh dấu bài tập')}
          className="kh-press"
          style={{
            border: 0, borderRadius: 10,
            width: compact ? 28 : 34, height: compact ? 28 : 34,
            display: 'grid', placeItems: 'center',
            background: period.hw ? '#fef3c7' : 'transparent',
            color: period.hw ? '#b45309' : '#94a3b8',
            fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }} title="Đánh dấu là bài tập">📖</button>
        <button
          onClick={() => onAction(`Xóa tiết ${s.name}`)}
          className="kh-press"
          style={{
            border: 0, borderRadius: 10,
            width: compact ? 28 : 34, height: compact ? 28 : 34,
            display: 'grid', placeItems: 'center',
            background: 'transparent', color: '#ef4444',
            fontFamily: 'inherit', fontSize: 14, cursor: 'pointer',
          }} title="Xóa">🗑️</button>
      </div>
      {period.hw && (
        <input
          readOnly
          defaultValue={period.note}
          onClick={() => onAction(`Sửa ghi chú: ${period.note}`)}
          style={{
            border: '2px solid #fde68a', borderRadius: 10,
            background: '#fef3c7', padding: compact ? '6px 10px' : '7px 12px',
            fontSize: compact ? 11 : 12, fontWeight: 700,
            fontFamily: 'inherit', color: '#92400e',
            outline: 0, cursor: 'pointer', width: '100%', boxSizing: 'border-box',
          }} />
      )}
    </div>
  );
}

// Grades manager body
function GradesManagerBody({ onAction, compact, semester = 1 }) {
  return (
    <React.Fragment>
      {/* Semester pill */}
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: '#f1f5f9', borderRadius: 16, width: 'fit-content',
      }}>
        {[1, 2].map((s) => {
          const active = s === semester;
          return (
            <button
              key={s}
              onClick={() => onAction(`Học kỳ ${s}`)}
              className="kh-press"
              style={{
                padding: '8px 18px', borderRadius: 12, border: 0,
                background: active ? '#fff' : 'transparent',
                color: active ? '#1d4ed8' : '#64748b',
                fontFamily: 'inherit', fontSize: compact ? 12 : 13, fontWeight: 800,
                cursor: 'pointer',
                boxShadow: active ? '0 1px 2px rgba(15,23,42,0.08)' : 'none',
                whiteSpace: 'nowrap',
              }}>Học kỳ {s}</button>
          );
        })}
      </div>

      {/* Subject rows */}
      <div style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {PARENT_GRADES.map((g) => (
          <GradeRow key={g.sid} sid={g.sid} score={g.score} onAction={onAction} compact={compact} />
        ))}
      </div>
    </React.Fragment>
  );
}

function GradeRow({ sid, score, onAction, compact }) {
  const s = KH_SUBJECTS[sid];
  const tier = badgeTier(score);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: compact ? '8px 10px' : '10px 14px',
      borderRadius: 16, background: '#f8fafc',
    }}>
      <span style={{
        width: 10, height: 10, borderRadius: 999,
        background: s.color, flexShrink: 0,
      }} />
      <span style={{
        flex: 1, minWidth: 0,
        fontSize: compact ? 12 : 14, fontWeight: 800, color: '#1e293b',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{s.name}</span>
      <input
        readOnly
        defaultValue={score}
        onClick={() => onAction(`Sửa điểm: ${s.name} (${score})`)}
        style={{
          width: compact ? 50 : 64, padding: compact ? '6px 4px' : '8px 4px',
          border: '2px solid #e2e8f0', borderRadius: 10,
          background: '#fff', textAlign: 'center',
          fontFamily: 'inherit', fontSize: compact ? 14 : 16, fontWeight: 900,
          color: '#1e293b', outline: 0, cursor: 'pointer',
        }} />
      <span style={{
        background: tier.bg, color: tier.fg,
        padding: compact ? '2px 8px' : '3px 10px', borderRadius: 999,
        fontSize: compact ? 10 : 11, fontWeight: 900, whiteSpace: 'nowrap',
      }}>{tier.label}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /parent — 5 viewports
// ════════════════════════════════════════════════════════════════════

// Phone portrait — tabbed view (Lịch / Điểm)
function ParentPhoneP({ tweaks, onAction, insets = {} }) {
  const [activeTab, setActiveTab] = React.useState(tweaks.activeManager || 'schedule');
  React.useEffect(() => setActiveTab(tweaks.activeManager || 'schedule'), [tweaks.activeManager]);
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#f8fafc',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif', color: '#1e293b',
      paddingTop: insets.top ?? 0,
    }}>
      <div style={{ padding: '12px 14px 0', flexShrink: 0 }}>
        <ParentHeader size="sm" compact onAction={onAction} />
        {/* Tab switcher */}
        <div style={{
          display: 'flex', gap: 4, padding: 4,
          background: '#fff', borderRadius: 16, marginBottom: 10,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        }}>
          {[{ id: 'schedule', label: '📅 Lịch học' }, { id: 'grades', label: '🌟 Điểm số' }].map((t) => (
            <button key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: '10px 6px',
                borderRadius: 12, border: 0,
                background: activeTab === t.id ? '#3b82f6' : 'transparent',
                color: activeTab === t.id ? '#fff' : '#64748b',
                fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                cursor: 'pointer',
              }}>{t.label}</button>
          ))}
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0, padding: '0 14px 12px', overflow: 'hidden' }}>
        <ManagerPanel
          compact
          title={activeTab === 'schedule' ? '📅 Thời khóa biểu' : '🌟 Điểm số'}
          action={<SaveButton onAction={onAction} />}>
          {activeTab === 'schedule'
            ? <ScheduleManagerBody onAction={onAction} compact />
            : <GradesManagerBody onAction={onAction} compact />}
        </ManagerPanel>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// Phone landscape — narrow rail + 2-col panels
function ParentPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <NarrowRail onAction={onAction} />
      <main style={{
        flex: 1, padding: 10, display: 'flex', flexDirection: 'column',
        gap: 8, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 900 }}>⚙️ Parent Mode</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
              Quản lý lịch + điểm
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onAction('Lưu')} className="kh-press"
              style={{ border: 0, borderRadius: 10, background: '#3b82f6', color: '#fff',
                padding: '6px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
              💾 Lưu
            </button>
            <button onClick={() => onAction('Đăng xuất')} className="kh-press"
              style={{ border: 0, borderRadius: 10, background: '#fee2e2', color: '#b91c1c',
                padding: '6px 10px', fontSize: 11, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer' }}>
              🔓
            </button>
          </div>
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          flex: 1, minHeight: 0,
        }}>
          <ManagerPanel compact title="📅 Lịch học">
            <ScheduleManagerBody onAction={onAction} compact />
          </ManagerPanel>
          <ManagerPanel compact title="🌟 Điểm số">
            <GradesManagerBody onAction={onAction} compact />
          </ManagerPanel>
        </div>
      </main>
    </div>
  );
}

// Tablet portrait — stacked panels (schedule on top, grades below)
function ParentTabletP({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: 24, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ParentHeader onAction={onAction} />
        <div style={{
          display: 'grid', gridTemplateRows: '1fr 1fr', gap: 18,
          flex: 1, minHeight: 0,
        }}>
          <ManagerPanel title="📅 Thời khóa biểu"
            action={<SaveButton onAction={onAction} />}>
            <ScheduleManagerBody onAction={onAction} />
          </ManagerPanel>
          <ManagerPanel title="🌟 Điểm số"
            action={<SaveButton onAction={onAction} saved />}>
            <GradesManagerBody onAction={onAction} />
          </ManagerPanel>
        </div>
      </main>
    </div>
  );
}

// Tablet landscape — 2-col panels (canonical /parent layout)
function ParentTabletL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: 24, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        <ParentHeader onAction={onAction} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18,
          flex: 1, minHeight: 0,
        }}>
          <ManagerPanel title="📅 Thời khóa biểu"
            action={<SaveButton onAction={onAction} />}>
            <ScheduleManagerBody onAction={onAction} />
          </ManagerPanel>
          <ManagerPanel title="🌟 Điểm số"
            action={<SaveButton onAction={onAction} saved />}>
            <GradesManagerBody onAction={onAction} />
          </ManagerPanel>
        </div>
      </main>
    </div>
  );
}

// Desktop — wide sidebar + 2-col panels with more breathing room
function ParentDesktop({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ background: '#f8fafc' }}>
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', maxWidth: 1320, margin: '0 auto', width: '100%',
      }}>
        <ParentHeader onAction={onAction} />
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22,
          flex: 1, minHeight: 0,
        }}>
          <ManagerPanel title="📅 Thời khóa biểu"
            action={<SaveButton onAction={onAction} />}>
            <ScheduleManagerBody onAction={onAction} />
          </ManagerPanel>
          <ManagerPanel title="🌟 Điểm số"
            action={<SaveButton onAction={onAction} saved />}>
            <GradesManagerBody onAction={onAction} />
          </ManagerPanel>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /parent/pin — 5 viewports
// ════════════════════════════════════════════════════════════════════

function PinPhoneP({ tweaks, onAction, insets = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#0f172a',
      paddingTop: insets.top ?? 0, paddingBottom: insets.bottom ?? 0,
      boxSizing: 'border-box',
    }}>
      <PinScreen state={tweaks.pinState} size="sm" onAction={onAction} />
    </div>
  );
}

function PinPhoneL({ tweaks, onAction }) {
  const cfg = getPinConfig(tweaks.pinState);
  return (
    <div style={{
      width: '100%', height: '100%', background: '#0f172a',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      alignItems: 'center', padding: 18, gap: 18,
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 64, lineHeight: 1 }}>{cfg.icon}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>{cfg.title}</div>
        <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 700 }}>{cfg.subtitle}</div>
        {tweaks.pinState === 'verify' && (
          <button onClick={() => onAction('Quên mã PIN?')}
            style={{ background: 'transparent', border: 0, color: '#64748b',
              fontFamily: 'inherit', fontSize: 11, fontWeight: 700,
              cursor: 'pointer', marginTop: 4,
            }}>Quên mã PIN?</button>
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {cfg.locked ? (
          <button onClick={() => onAction('Đặt lại PIN')} className="kh-press"
            style={{ background: 'transparent', color: '#cbd5e1',
              border: '3px solid #475569', borderRadius: 999,
              padding: '10px 22px', fontSize: 13, fontWeight: 800,
              fontFamily: 'inherit', cursor: 'pointer' }}>Đặt lại PIN</button>
        ) : (
          <PinKeypad size="sm" filled={cfg.filled} shake={cfg.shake}
            onKey={(k) => onAction(`Nhấn ${k}`)} />
        )}
      </div>
    </div>
  );
}

function PinTabletP({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PinScreen state={tweaks.pinState} size="md" onAction={onAction} />
    </div>
  );
}

function PinTabletL({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PinScreen state={tweaks.pinState} size="md" onAction={onAction} />
    </div>
  );
}

function PinDesktop({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <PinScreen state={tweaks.pinState} size="lg" onAction={onAction} />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// /parent/login — First-time PIN setup & onboarding
// Steps: welcome → create → confirm → success
// ════════════════════════════════════════════════════════════════════

const LOGIN_STEPS = [
  { id: 'email',   n: 1, label: 'Đăng nhập' },
  { id: 'welcome', n: 2, label: 'Giới thiệu' },
  { id: 'create',  n: 3, label: 'Tạo PIN' },
  { id: 'confirm', n: 4, label: 'Xác nhận' },
  { id: 'success', n: 5, label: 'Hoàn tất' },
];

function StepIndicator({ step, compact = false }) {
  const cur = LOGIN_STEPS.findIndex((s) => s.id === step);
  const sz = compact ? { dot: 24, fs: 10, gap: 6, lineH: 2 } : { dot: 32, fs: 12, gap: 10, lineH: 3 };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: sz.gap }}>
      {LOGIN_STEPS.map((s, i) => {
        const done = i < cur;
        const active = i === cur;
        return (
          <React.Fragment key={s.id}>
            {i > 0 && (
              <div style={{
                flex: 1, height: sz.lineH, borderRadius: 999,
                background: done ? '#3b82f6' : 'rgba(255,255,255,0.15)',
                minWidth: compact ? 16 : 24,
              }} />
            )}
            <div style={{
              width: sz.dot, height: sz.dot,
              borderRadius: '50%',
              background: active ? '#3b82f6' : done ? '#1d4ed8' : 'rgba(255,255,255,0.12)',
              border: active ? '3px solid #93c5fd' : 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              transition: 'background 0.3s',
            }}>
              {done ? (
                <span style={{ fontSize: sz.fs, color: '#fff', fontWeight: 900 }}>✓</span>
              ) : (
                <span style={{ fontSize: sz.fs, color: active ? '#fff' : 'rgba(255,255,255,0.4)', fontWeight: 900 }}>
                  {s.n}
                </span>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Feature bullets shown on the welcome screen
const PARENT_FEATURES = [
  { icon: '📅', title: 'Quản lý lịch học', desc: 'Thêm, sửa, xóa thời khóa biểu của Khôi' },
  { icon: '🌟', title: 'Cập nhật điểm số', desc: 'Nhập điểm từng môn, xem xếp loại tự động' },
  { icon: '🔒', title: 'Bảo mật bằng PIN', desc: '4 chữ số · mã hóa SHA-256 · không ai xem được' },
];

// Email + Password login form (step 1)
function LoginEmail({ size = 'md', onNext }) {
  const sz = {
    sm: { logo: 52, logoBr: 14, h1: 20, sub: 12, inputH: 44, inputFs: 14, gap: 14, btnFs: 14, btnPad: '12px 24px' },
    md: { logo: 72, logoBr: 18, h1: 28, sub: 15, inputH: 54, inputFs: 15, gap: 18, btnFs: 16, btnPad: '14px 32px' },
    lg: { logo: 88, logoBr: 22, h1: 34, sub: 17, inputH: 60, inputFs: 16, gap: 22, btnFs: 18, btnPad: '16px 40px' },
  }[size] || { logo: 72, logoBr: 18, h1: 28, sub: 15, inputH: 54, inputFs: 15, gap: 18, btnFs: 16, btnPad: '14px 32px' };

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    height: sz.inputH,
    background: 'rgba(255,255,255,0.06)',
    border: '2px solid rgba(255,255,255,0.12)',
    borderRadius: 14, padding: '0 16px',
    color: '#fff', fontFamily: 'inherit',
    fontSize: sz.inputFs, fontWeight: 700,
    outline: 'none',
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: sz.gap, color: '#fff', width: '100%', maxWidth: 440,
    }}>
      {/* Logo */}
      <div style={{
        width: sz.logo, height: sz.logo, borderRadius: sz.logoBr,
        background: '#3b82f6', display: 'grid', placeItems: 'center',
        fontSize: sz.logo * 0.48,
        boxShadow: '0 16px 32px -12px rgba(59,130,246,0.55)',
      }}>🌟</div>

      {/* Heading */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: sz.h1, fontWeight: 900, letterSpacing: -0.02 }}>Kid Hub</div>
        <div style={{ fontSize: sz.sub, color: '#94a3b8', fontWeight: 700, marginTop: 4 }}>
          Đăng nhập vào tài khoản phụ huynh
        </div>
      </div>

      {/* Form */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: sz.gap - 6, width: '100%' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: 0.08, textTransform: 'uppercase' }}>
            Email
          </label>
          <input
            type="email"
            readOnly
            defaultValue="bome@email.com"
            style={inputStyle}
            placeholder="email@example.com"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 800, color: '#94a3b8', letterSpacing: 0.08, textTransform: 'uppercase' }}>
            Mật khẩu
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="password"
              readOnly
              defaultValue="password123"
              style={{ ...inputStyle, paddingRight: 44 }}
              placeholder="Nhập mật khẩu"
            />
            <span style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              fontSize: 18, cursor: 'pointer', color: '#64748b',
            }}>👁️</span>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#60a5fa', cursor: 'pointer' }}>
            Quên mật khẩu?
          </span>
        </div>
      </div>

      {/* Login button */}
      <button
        onClick={onNext}
        className="kh-press"
        style={{
          width: '100%', background: '#3b82f6', color: '#fff',
          border: '4px solid #1d4ed8', borderRadius: 999,
          padding: sz.btnPad, fontSize: sz.btnFs, fontWeight: 900,
          fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 12px 24px -10px rgba(59,130,246,0.6)',
        }}>Đăng nhập</button>

      <div style={{ fontSize: 12, color: '#475569', fontWeight: 700 }}>
        Lần đầu đăng nhập? Hãy tạo mã PIN sau khi xác thực.
      </div>
    </div>
  );
}

function LoginWelcome({ size = 'md', onNext, compact }) {
  const sz = {
    sm: { logo: 60, logoBr: 16, h1: 24, sub: 13, featIcon: 28, featTitle: 13, featDesc: 11, gap: 14, btnPad: '12px 24px', btnFs: 14 },
    md: { logo: 80, logoBr: 20, h1: 32, sub: 16, featIcon: 36, featTitle: 16, featDesc: 12, gap: 18, btnPad: '14px 32px', btnFs: 16 },
    lg: { logo: 96, logoBr: 24, h1: 40, sub: 18, featIcon: 44, featTitle: 18, featDesc: 13, gap: 22, btnPad: '16px 40px', btnFs: 18 },
  }[size] || { logo: 80, logoBr: 20, h1: 32, sub: 16, featIcon: 36, featTitle: 16, featDesc: 12, gap: 18, btnPad: '14px 32px', btnFs: 16 };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: sz.gap, textAlign: 'center', color: '#fff',
      width: '100%', maxWidth: 520,
    }}>
      {/* Logo */}
      <div style={{
        width: sz.logo, height: sz.logo, borderRadius: sz.logoBr,
        background: '#3b82f6',
        display: 'grid', placeItems: 'center',
        fontSize: sz.logo * 0.48,
        boxShadow: '0 16px 32px -12px rgba(59, 130, 246, 0.6)',
      }}>🌟</div>

      {/* Headline */}
      <div>
        <div style={{ fontSize: sz.h1, fontWeight: 900, letterSpacing: -0.02, lineHeight: 1.1 }}>
          Xin chào Bố / Mẹ! 👋
        </div>
        <div style={{
          fontSize: sz.sub, color: '#94a3b8', fontWeight: 700, marginTop: 6,
        }}>
          Hãy tạo mã PIN để bảo vệ chế độ quản lý của bạn.
        </div>
      </div>

      {/* Feature list */}
      <div style={{
        width: '100%', display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8,
      }}>
        {PARENT_FEATURES.map((f) => (
          <div key={f.icon} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: 'rgba(255,255,255,0.06)', borderRadius: 16,
            padding: compact ? '10px 14px' : '12px 16px',
            textAlign: 'left',
          }}>
            <div style={{
              width: sz.featIcon + 8, height: sz.featIcon + 8,
              borderRadius: 12, background: 'rgba(255,255,255,0.1)',
              display: 'grid', placeItems: 'center',
              fontSize: sz.featIcon * 0.7, flexShrink: 0,
            }}>{f.icon}</div>
            <div>
              <div style={{ fontSize: sz.featTitle, fontWeight: 900 }}>{f.title}</div>
              <div style={{ fontSize: sz.featDesc, color: '#94a3b8', fontWeight: 700, marginTop: 2 }}>
                {f.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <button
        onClick={onNext}
        className="kh-press"
        style={{
          background: '#3b82f6', color: '#fff',
          border: '4px solid #1d4ed8',
          borderRadius: 999, padding: sz.btnPad,
          fontSize: sz.btnFs, fontWeight: 900,
          fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 12px 24px -10px rgba(59, 130, 246, 0.6)',
          marginTop: 4,
        }}>Bắt đầu tạo PIN →</button>
    </div>
  );
}

function LoginCreatePin({ size = 'md', isConfirm = false, onNext, onBack }) {
  const keypadSize = { sm: 'sm', md: 'md', lg: 'lg' }[size] || 'md';
  const filled = isConfirm ? 4 : 2;
  const sz = {
    sm: { h1: 20, sub: 12 },
    md: { h1: 28, sub: 15 },
    lg: { h1: 34, sub: 17 },
  }[size] || { h1: 28, sub: 15 };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: 20, color: '#fff',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: sz.h1, fontWeight: 900, letterSpacing: -0.01 }}>
          {isConfirm ? 'Xác nhận mã PIN' : 'Tạo mã PIN mới'}
        </div>
        <div style={{ fontSize: sz.sub, color: '#94a3b8', fontWeight: 700, marginTop: 6 }}>
          {isConfirm ? 'Nhập lại mã PIN vừa tạo để xác nhận' : 'Chọn 4 chữ số cho mã PIN của bạn'}
        </div>
      </div>
      <PinKeypad
        size={keypadSize}
        filled={filled}
        onKey={(k) => onNext && onNext(k)} />
      {onBack && (
        <button onClick={onBack} style={{
          background: 'transparent', border: 0, color: '#64748b',
          fontFamily: 'inherit', fontSize: 13, fontWeight: 700, cursor: 'pointer',
        }}>← Quay lại</button>
      )}
    </div>
  );
}

function LoginSuccess({ size = 'md', onEnter }) {
  const sz = {
    sm: { trophy: 60, h1: 22, sub: 13, gap: 14, btnFs: 14, btnPad: '12px 24px' },
    md: { trophy: 90, h1: 30, sub: 16, gap: 18, btnFs: 16, btnPad: '14px 32px' },
    lg: { trophy: 110, h1: 38, sub: 18, gap: 22, btnFs: 18, btnPad: '16px 40px' },
  }[size] || { trophy: 90, h1: 30, sub: 16, gap: 18, btnFs: 16, btnPad: '14px 32px' };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: sz.gap, textAlign: 'center', color: '#fff',
      maxWidth: 440,
    }}>
      <div style={{ fontSize: sz.trophy, lineHeight: 1 }} aria-hidden="true">✅</div>
      <div>
        <div style={{ fontSize: sz.h1, fontWeight: 900, letterSpacing: -0.02 }}>
          Đã tạo PIN thành công!
        </div>
        <div style={{ fontSize: sz.sub, color: '#94a3b8', fontWeight: 700, marginTop: 6 }}>
          Mã PIN của bạn đã được lưu an toàn. Bạn có thể quản lý lịch học và điểm số của Khôi ngay bây giờ.
        </div>
      </div>
      {/* Quick summary chips */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
        {['📅 Lịch học', '🌟 Điểm số', '🔒 PIN bảo mật'].map((label) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 999, padding: '6px 14px',
            fontSize: 13, fontWeight: 800, color: '#cbd5e1',
          }}>{label}</div>
        ))}
      </div>
      <button
        onClick={onEnter}
        className="kh-press"
        style={{
          background: '#3b82f6', color: '#fff',
          border: '4px solid #1d4ed8',
          borderRadius: 999, padding: sz.btnPad,
          fontSize: sz.btnFs, fontWeight: 900,
          fontFamily: 'inherit', cursor: 'pointer',
          boxShadow: '0 12px 24px -10px rgba(59, 130, 246, 0.6)',
          marginTop: 4,
        }}>Vào Parent Mode 🚀</button>
    </div>
  );
}

// Full login screen — wraps step indicator + step content
function LoginScreen({ step, size = 'md', onAction }) {
  const isCompact = size === 'sm';
  const contentByStep = {
    email:   <LoginEmail size={size} onNext={() => onAction('Đăng nhập thành công')} />,
    welcome: <LoginWelcome size={size} compact={isCompact}
      onNext={() => onAction('Bắt đầu tạo PIN')} />,
    create:  <LoginCreatePin size={size} isConfirm={false}
      onNext={(k) => onAction(`Nhấn ${k}`)}
      onBack={() => onAction('Quay lại welcome')} />,
    confirm: <LoginCreatePin size={size} isConfirm
      onNext={(k) => onAction(`Xác nhận ${k}`)}
      onBack={() => onAction('Quay lại tạo PIN')} />,
    success: <LoginSuccess size={size}
      onEnter={() => onAction('Vào Parent Mode!')} />,
  };
  const padV = { sm: 14, md: 28, lg: 36 }[size] || 28;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0f172a',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: `${padV}px 20px`,
      gap: 24, fontFamily: 'Nunito, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <StepIndicator step={step} compact={isCompact} />
      {contentByStep[step] || contentByStep.welcome}
    </div>
  );
}

// Landscape split: step indicator + hero text left, keypad/content right
function LoginScreenSplit({ step, onAction }) {
  const leftContent = {
    email: (
      <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, background: '#3b82f6',
          display: 'grid', placeItems: 'center', fontSize: 24,
          boxShadow: '0 8px 18px -8px rgba(59,130,246,0.6)',
        }}>🌟</div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Kid Hub</div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
          Đăng nhập tài khoản phụ huynh
        </div>
      </div>
    ),
    welcome: (
      <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14, background: '#3b82f6',
          display: 'grid', placeItems: 'center', fontSize: 26,
          boxShadow: '0 8px 18px -8px rgba(59,130,246,0.6)',
        }}>🌟</div>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: -0.01 }}>
          Xin chào Bố / Mẹ! 👋
        </div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, lineHeight: 1.4 }}>
          Tạo mã PIN để bảo vệ chế độ quản lý của bạn.
        </div>
        {PARENT_FEATURES.map((f) => (
          <div key={f.icon} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            fontSize: 11, fontWeight: 700, color: '#cbd5e1',
          }}>
            <span style={{ fontSize: 16 }}>{f.icon}</span>
            <span>{f.title}</span>
          </div>
        ))}
      </div>
    ),
    create: (
      <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Tạo mã PIN mới</div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
          Chọn 4 chữ số cho mã PIN
        </div>
        <PinDots length={4} filled={2} size="sm" />
      </div>
    ),
    confirm: (
      <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Xác nhận mã PIN</div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>
          Nhập lại mã PIN vừa tạo
        </div>
        <PinDots length={4} filled={4} size="sm" />
      </div>
    ),
    success: (
      <div style={{ color: '#fff', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 52, lineHeight: 1 }}>✅</div>
        <div style={{ fontSize: 18, fontWeight: 900 }}>Đã tạo PIN thành công!</div>
        <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, lineHeight: 1.4 }}>
          Mã PIN đã được lưu an toàn.
        </div>
      </div>
    ),
  };

  const rightContent = {
    email: (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        <input type="email" readOnly defaultValue="bome@email.com"
          style={{
            height: 44, background: 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(255,255,255,0.12)', borderRadius: 12,
            padding: '0 14px', color: '#fff', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, outline: 'none', width: '100%',
            boxSizing: 'border-box',
          }} />
        <input type="password" readOnly defaultValue="pass"
          style={{
            height: 44, background: 'rgba(255,255,255,0.07)',
            border: '2px solid rgba(255,255,255,0.12)', borderRadius: 12,
            padding: '0 14px', color: '#fff', fontFamily: 'inherit',
            fontSize: 13, fontWeight: 700, outline: 'none', width: '100%',
            boxSizing: 'border-box',
          }} />
        <button onClick={() => onAction('Đăng nhập')} className="kh-press" style={{
          background: '#3b82f6', color: '#fff',
          border: '3px solid #1d4ed8', borderRadius: 999,
          padding: '10px 0', fontSize: 14, fontWeight: 900,
          fontFamily: 'inherit', cursor: 'pointer', width: '100%',
          boxShadow: '0 8px 18px -8px rgba(59,130,246,0.6)',
        }}>Đăng nhập</button>
      </div>
    ),
    welcome: (
      <button onClick={() => onAction('Bắt đầu tạo PIN')} className="kh-press" style={{
        background: '#3b82f6', color: '#fff',
        border: '3px solid #1d4ed8', borderRadius: 999,
        padding: '12px 26px', fontSize: 14, fontWeight: 900,
        fontFamily: 'inherit', cursor: 'pointer',
        boxShadow: '0 10px 22px -8px rgba(59,130,246,0.6)',
      }}>Bắt đầu →</button>
    ),
    create:  <PinKeypad size="sm" filled={2} onKey={(k) => onAction(`Nhấn ${k}`)} />,
    confirm: <PinKeypad size="sm" filled={4} onKey={(k) => onAction(`Xác nhận ${k}`)} />,
    success: (
      <button onClick={() => onAction('Vào Parent Mode!')} className="kh-press" style={{
        background: '#3b82f6', color: '#fff',
        border: '3px solid #1d4ed8', borderRadius: 999,
        padding: '12px 26px', fontSize: 14, fontWeight: 900,
        fontFamily: 'inherit', cursor: 'pointer',
        boxShadow: '0 10px 22px -8px rgba(59,130,246,0.6)',
      }}>Vào Parent Mode 🚀</button>
    ),
  };

  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#0f172a',
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 18, padding: 18, alignItems: 'center',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <StepIndicator step={step} compact />
        {leftContent[step] || leftContent.welcome}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {rightContent[step] || rightContent.welcome}
      </div>
    </div>
  );
}

// ── 5 viewport variants ───────────────────────────────────────────────
function LoginPhoneP({ tweaks, onAction, insets = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%', background: '#0f172a',
      paddingTop: insets.top ?? 0, paddingBottom: insets.bottom ?? 0,
      boxSizing: 'border-box',
    }}>
      <LoginScreen step={tweaks.loginStep} size="sm" onAction={onAction} />
    </div>
  );
}

function LoginPhoneL({ tweaks, onAction }) {
  return <LoginScreenSplit step={tweaks.loginStep} onAction={onAction} />;
}

function LoginTabletP({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LoginScreen step={tweaks.loginStep} size="md" onAction={onAction} />
    </div>
  );
}

function LoginTabletL({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LoginScreen step={tweaks.loginStep} size="lg" onAction={onAction} />
    </div>
  );
}

function LoginDesktop({ tweaks, onAction }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <LoginScreen step={tweaks.loginStep} size="lg" onAction={onAction} />
    </div>
  );
}

Object.assign(window, {
  PinPhoneP, PinPhoneL, PinTabletP, PinTabletL, PinDesktop,
  ParentPhoneP, ParentPhoneL, ParentTabletP, ParentTabletL, ParentDesktop,
  LoginPhoneP, LoginPhoneL, LoginTabletP, LoginTabletL, LoginDesktop,
});
