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

Object.assign(window, {
  PinPhoneP, PinPhoneL, PinTabletP, PinTabletL, PinDesktop,
  ParentPhoneP, ParentPhoneL, ParentTabletP, ParentTabletL, ParentDesktop,
});
