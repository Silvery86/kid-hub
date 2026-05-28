/* schedule.jsx — Schedule (/schedule) screen in 5 viewports.
   Reuses the Mon-Fri × 5-period data from lib/data/schedule.ts. */

// ── Full weekly schedule (mirror of lib/data/schedule.ts) ───────────────
const WEEK_DAYS = [
  { id: 'monday',    label: 'Thứ Hai', short: 'T2', narrow: 'H' },
  { id: 'tuesday',   label: 'Thứ Ba',  short: 'T3', narrow: 'B' },
  { id: 'wednesday', label: 'Thứ Tư',  short: 'T4', narrow: 'T' },
  { id: 'thursday',  label: 'Thứ Năm', short: 'T5', narrow: 'N' },
  { id: 'friday',    label: 'Thứ Sáu', short: 'T6', narrow: 'S' },
];

const WEEKLY = {
  monday:    [
    { n: 1, sid: 'activities', start: '07:30', end: '08:10' },
    { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
    { n: 3, sid: 'vietnamese', start: '09:00', end: '09:40' },
    { n: 4, sid: 'math',       start: '09:40', end: '10:20' },
    { n: 5, sid: 'ethics',     start: '10:30', end: '11:10' },
  ],
  tuesday:   [
    { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
    { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
    { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
    { n: 4, sid: 'english',    start: '09:40', end: '10:20' },
    { n: 5, sid: 'pe',         start: '10:30', end: '11:10' },
  ],
  wednesday: [
    { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
    { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
    { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
    { n: 4, sid: 'music',      start: '09:40', end: '10:20' },
    { n: 5, sid: 'science',    start: '10:30', end: '11:10' },
  ],
  thursday:  [
    { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
    { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
    { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
    { n: 4, sid: 'english',    start: '09:40', end: '10:20' },
    { n: 5, sid: 'art',        start: '10:30', end: '11:10' },
  ],
  friday:    [
    { n: 1, sid: 'vietnamese', start: '07:30', end: '08:10' },
    { n: 2, sid: 'vietnamese', start: '08:10', end: '08:50' },
    { n: 3, sid: 'math',       start: '09:00', end: '09:40' },
    { n: 4, sid: 'it',         start: '09:40', end: '10:20' },
    { n: 5, sid: 'activities', start: '10:30', end: '11:10' },
  ],
};

const PERIOD_TIMES = [
  { n: 1, start: '07:30', end: '08:10' },
  { n: 2, start: '08:10', end: '08:50' },
  { n: 3, start: '09:00', end: '09:40' },
  { n: 4, start: '09:40', end: '10:20' },
  { n: 5, start: '10:30', end: '11:10' },
];

// "Today" anchor — Wednesday 09:15 by default (same as Hero)
function getScheduleNow(time) {
  // time: morning | break | after
  const todayId = 'wednesday';
  if (time === 'after')   return { todayId, currentN: null, doneAll: true,    label: '14:00' };
  if (time === 'break')   return { todayId, currentN: null, pendingBreak: true, nextN: 3, label: '08:55' };
  return { todayId, currentN: 3, progress: 0.375, label: '09:15' };
}

// ── Small reused pieces ────────────────────────────────────────────────

function PeriodCell({ p, isNow, isFree, compact, onClick, mini }) {
  if (isFree || !p) {
    return (
      <div style={{
        background: '#f8fafc', borderRadius: compact ? 10 : 14,
        border: '2px dashed #e2e8f0',
        display: 'grid', placeItems: 'center',
        color: '#cbd5e1', fontSize: compact ? 11 : 13, fontWeight: 800,
        minHeight: compact ? 40 : 60,
      }}>—</div>
    );
  }
  const s = KH_SUBJECTS[p.sid];
  const bg = isNow ? s.color : `color-mix(in oklab, ${s.color} 14%, white)`;
  const fg = isNow ? '#fff' : s.color;
  return (
    <button
      onClick={onClick}
      title={`${s.name} · ${p.start}–${p.end}`}
      style={{
        background: bg, color: fg,
        border: isNow ? `2px solid ${s.color}` : '2px solid transparent',
        borderRadius: compact ? 10 : 14,
        padding: compact ? '6px 8px' : '10px 12px',
        display: 'flex', flexDirection: 'column',
        alignItems: 'flex-start', justifyContent: 'space-between',
        cursor: 'pointer', fontFamily: 'inherit',
        textAlign: 'left', minHeight: compact ? 40 : 60,
        boxShadow: isNow ? `0 10px 24px -12px ${s.color}` : 'none',
        transition: 'transform 0.1s',
        position: 'relative', overflow: 'hidden',
      }}
      className="kh-press"
    >
      {mini ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
          <span style={{ fontSize: 14 }}>{s.icon}</span>
          <span style={{
            fontSize: 11, fontWeight: 900, lineHeight: 1.1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{s.name}</span>
        </div>
      ) : (
        <React.Fragment>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: compact ? 14 : 16 }}>{s.icon}</span>
            <span style={{
              fontSize: compact ? 12 : 13, fontWeight: 900,
              lineHeight: 1.1,
            }}>{s.name}</span>
          </div>
          {!compact && (
            <div style={{
              fontSize: 11, fontWeight: 800,
              opacity: 0.85,
            }}>{p.start}</div>
          )}
        </React.Fragment>
      )}
      {isNow && (
        <span className="kh-pulse" style={{
          position: 'absolute', top: 6, right: 6,
          background: '#fff', width: 8, height: 8,
        }} />
      )}
    </button>
  );
}

function DayList({ dayId, currentN, onPick }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {WEEKLY[dayId].map((p) => {
        const s = KH_SUBJECTS[p.sid];
        const isNow = currentN === p.n;
        return (
          <button
            key={p.n}
            onClick={() => onPick && onPick(p)}
            className="kh-press"
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: 12, borderRadius: 16,
              background: '#fff',
              border: isNow ? `2px solid ${s.color}` : '2px solid transparent',
              boxShadow: isNow
                ? `0 8px 22px -10px ${s.color}`
                : '0 1px 2px rgba(15,23,42,0.04)',
              cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}>
            {/* Period number badge */}
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: isNow ? s.color : '#f1f5f9',
              color: isNow ? '#fff' : '#64748b',
              display: 'grid', placeItems: 'center',
              fontSize: 13, fontWeight: 900, flexShrink: 0,
            }}>{p.n}</div>
            <Subj sid={p.sid} size={40} rounded={11} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#1e293b' }}>
                {s.name}
              </div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                {p.start} – {p.end}
              </div>
            </div>
            {isNow && <Pill tone="accent">Đang học</Pill>}
          </button>
        );
      })}
    </div>
  );
}

function DayTabs({ activeDay, todayId, onChange, compact }) {
  return (
    <div style={{
      display: 'flex', gap: 4, padding: 4,
      background: '#fff', borderRadius: 16,
      boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
    }}>
      {WEEK_DAYS.map((d) => {
        const active = d.id === activeDay;
        return (
          <button
            key={d.id}
            onClick={() => onChange(d.id)}
            style={{
              flex: 1, padding: compact ? '6px 4px' : '10px 8px',
              border: 0, borderRadius: 12,
              background: active ? 'var(--kh-accent)' : 'transparent',
              color: active ? '#fff' : (d.id === todayId ? 'var(--kh-accent-deep)' : '#475569'),
              fontFamily: 'inherit', fontSize: compact ? 11 : 13,
              fontWeight: 900, cursor: 'pointer',
              boxShadow: active ? '0 4px 10px -3px color-mix(in oklab, var(--kh-accent) 50%, transparent)' : 'none',
              position: 'relative',
              letterSpacing: -0.01,
            }}>
            {compact ? d.short : d.label}
            {d.id === todayId && !active && (
              <span style={{
                position: 'absolute', bottom: 2, left: '50%',
                transform: 'translateX(-50%)',
                width: 4, height: 4, borderRadius: 999,
                background: 'var(--kh-accent)',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Full week grid — used by tablet/desktop. Periods are columns, days are rows
// (or rows/cols flipped depending on orientation).
function WeekGrid({ orient = 'cols-periods', currentN, todayId, onPick, compact, mini }) {
  // orient: 'cols-periods' → periods across, days down (LANDSCAPE friendly)
  //         'rows-periods' → periods down, days across (PORTRAIT friendly)
  const dayCells = (dayId) => WEEKLY[dayId];

  if (orient === 'rows-periods') {
    // Periods as rows, days as columns. Best when there's more vertical room.
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `64px repeat(${WEEK_DAYS.length}, 1fr)`, gap: 6 }}>
        {/* corner */}
        <div></div>
        {WEEK_DAYS.map((d) => (
          <div key={d.id} style={{
            textAlign: 'center', padding: '8px 4px',
            fontSize: 12, fontWeight: 900,
            color: d.id === todayId ? 'var(--kh-accent-deep)' : '#64748b',
            background: d.id === todayId ? 'var(--kh-accent-soft)' : '#f8fafc',
            borderRadius: 12,
          }}>
            <div>{d.label}</div>
            {d.id === todayId && (
              <div style={{ fontSize: 10, marginTop: 2 }}>Hôm nay</div>
            )}
          </div>
        ))}
        {PERIOD_TIMES.map((pt) => (
          <React.Fragment key={pt.n}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#94a3b8',
              display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', justifyContent: 'center',
              paddingRight: 6, textAlign: 'right',
            }}>
              <div style={{ fontSize: 14, color: '#475569' }}>{pt.n}</div>
              <div>{pt.start}</div>
            </div>
            {WEEK_DAYS.map((d) => {
              const p = dayCells(d.id).find((x) => x.n === pt.n);
              const isNow = d.id === todayId && currentN === pt.n;
              return (
                <PeriodCell key={d.id} p={p} isNow={isNow}
                  compact={compact} mini={mini}
                  onClick={() => onPick && onPick({ day: d.id, p })} />
              );
            })}
          </React.Fragment>
        ))}
      </div>
    );
  }

  // cols-periods: days as rows, periods as columns
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `100px repeat(${PERIOD_TIMES.length}, 1fr)`, gap: 6 }}>
      <div></div>
      {PERIOD_TIMES.map((pt) => (
        <div key={pt.n} style={{
          textAlign: 'center', padding: '6px 4px',
          fontSize: 11, fontWeight: 800, color: '#64748b',
          background: '#f8fafc', borderRadius: 10,
        }}>
          <div style={{ fontSize: 13, color: '#1e293b' }}>Tiết {pt.n}</div>
          <div>{pt.start}–{pt.end}</div>
        </div>
      ))}
      {WEEK_DAYS.map((d) => (
        <React.Fragment key={d.id}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '0 8px',
            fontSize: 13, fontWeight: 900,
            color: d.id === todayId ? 'var(--kh-accent-deep)' : '#1e293b',
            background: d.id === todayId ? 'var(--kh-accent-soft)' : 'transparent',
            borderRadius: 12,
          }}>
            <span>{d.label}</span>
            {d.id === todayId && (
              <span style={{ fontSize: 10, color: 'var(--kh-accent)' }}>● hôm nay</span>
            )}
          </div>
          {PERIOD_TIMES.map((pt) => {
            const p = dayCells(d.id).find((x) => x.n === pt.n);
            const isNow = d.id === todayId && currentN === pt.n;
            return (
              <PeriodCell key={pt.n} p={p} isNow={isNow}
                compact={compact} mini={mini}
                onClick={() => onPick && onPick({ day: d.id, p })} />
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── Subject distribution legend (used in detail panels) ────────────────
function SubjectLegend() {
  const counts = {};
  Object.values(WEEKLY).forEach((day) => {
    day.forEach((p) => { counts[p.sid] = (counts[p.sid] || 0) + 1; });
  });
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((a, [, n]) => a + n, 0);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {entries.map(([sid, n]) => {
        const s = KH_SUBJECTS[sid];
        const pct = (n / total) * 100;
        return (
          <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Subj sid={sid} size={26} rounded={8} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1e293b' }}>{s.name}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{n} tiết</span>
              </div>
              <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, marginTop: 4 }}>
                <div style={{
                  width: `${pct}%`, height: '100%',
                  background: s.color, borderRadius: 999,
                }} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 1. PHONE PORTRAIT — day tabs + period list
// ════════════════════════════════════════════════════════════════════
function SchedulePhonePortrait({ tweaks, time, onAction, insets = {} }) {
  const now = getScheduleNow(time);
  const [activeDay, setActiveDay] = React.useState(now.todayId);
  const dayPeriods = WEEKLY[activeDay];

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-shell-kid)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif',
      color: '#1e293b',
      paddingTop: insets.top ?? 0,
    }}>
      <div className="kh-scroll" style={{
        flex: 1, padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.02 }}>Lịch học</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
              Tuần 14 · 25–29 Tháng 5
            </div>
          </div>
          <button
            onClick={() => onAction('Sửa lịch (Parent mode)')}
            style={{
              border: 0, background: '#fff', padding: 8, borderRadius: 12,
              fontSize: 18, cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(15,23,42,0.06)',
            }}>✏️</button>
        </div>

        {/* Day tabs */}
        <DayTabs activeDay={activeDay} todayId={now.todayId} onChange={setActiveDay} compact />

        {/* Today summary card */}
        <div style={{
          background: '#fff', borderRadius: 18, padding: 14,
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'var(--kh-accent-soft)', color: 'var(--kh-accent-deep)',
            display: 'grid', placeItems: 'center',
            fontSize: 22, fontWeight: 900, flexShrink: 0,
          }}>{dayPeriods.length}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 900 }}>
              {WEEK_DAYS.find((d) => d.id === activeDay).label}
            </div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>
              {dayPeriods.length} tiết · {dayPeriods[0].start} → {dayPeriods.at(-1).end}
            </div>
          </div>
          {activeDay === now.todayId && (
            <Pill tone="accent">Hôm nay</Pill>
          )}
        </div>

        {/* Period list */}
        <DayList
          dayId={activeDay}
          currentN={activeDay === now.todayId ? now.currentN : null}
          onPick={(p) => onAction(`Tiết ${p.n}: ${KH_SUBJECTS[p.sid].name}`)}
        />
      </div>

      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2. PHONE LANDSCAPE — full week mini-grid
// ════════════════════════════════════════════════════════════════════
function SchedulePhoneLandscape({ tweaks, time, onAction }) {
  const now = getScheduleNow(time);

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-shell-kid)',
      display: 'flex',
      fontFamily: 'Nunito, system-ui, sans-serif',
      color: '#1e293b',
    }}>
      <NarrowRail onAction={onAction} />
      <main style={{
        flex: 1, padding: 10, minWidth: 0,
        display: 'flex', flexDirection: 'column', gap: 8,
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900 }}>Lịch học · Tuần 14</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
              25–29 Tháng 5 · Hôm nay Thứ Tư
            </div>
          </div>
          <Pill tone="accent">{Object.values(WEEKLY).reduce((a, d) => a + d.length, 0)} tiết / tuần</Pill>
        </div>

        {/* Compact week grid — periods as rows for landscape */}
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <WeekGrid orient="rows-periods"
            currentN={now.currentN} todayId={now.todayId}
            onPick={(x) => onAction(`${WEEK_DAYS.find((d) => d.id === x.day).label} · Tiết ${x.p.n}: ${KH_SUBJECTS[x.p.sid].name}`)}
            compact mini />
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3. TABLET PORTRAIT — week grid (compact) + today highlight rail
// ════════════════════════════════════════════════════════════════════
function ScheduleTabletPortrait({ tweaks, time, onAction }) {
  const now = getScheduleNow(time);

  return (
    <div className="kh-app">
      <Sidebar active="schedule" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 18, padding: 22, minWidth: 0, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 30 }}>Lịch học</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Tuần 14 · 25–29 Tháng 5 · {now.label}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="kh-ghost" onClick={() => onAction('Tuần trước')}>← Tuần trước</button>
            <button className="kh-ghost" onClick={() => onAction('Tuần sau')}>Tuần sau →</button>
            <button className="kh-cta" onClick={() => onAction('Sửa lịch (Parent mode)')}>✏️ Sửa</button>
          </div>
        </div>

        {/* Full week grid — periods as rows, days as cols */}
        <div style={{ flex: 1, minHeight: 0 }}>
          <WeekGrid orient="rows-periods"
            currentN={now.currentN} todayId={now.todayId}
            onPick={(x) => onAction(`${WEEK_DAYS.find((d) => d.id === x.day).label} · ${KH_SUBJECTS[x.p.sid].name}`)} />
        </div>

        {/* Today rail — recap of current day periods at the bottom */}
        <div style={{
          background: '#fff', borderRadius: 22, padding: 16,
          boxShadow: '0 1px 3px rgba(15,23,42,0.05)',
        }}>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            marginBottom: 10,
          }}>
            <div style={{ fontWeight: 900, fontSize: 15 }}>
              Hôm nay — {WEEK_DAYS.find((d) => d.id === now.todayId).label}
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 800 }}>
              {WEEKLY[now.todayId].length} tiết · 07:30 → 11:10
            </span>
          </div>
          <DayRail
            periods={WEEKLY[now.todayId]}
            currentN={now.currentN}
            progress={now.progress}
            onPick={(p) => onAction(`Tiết ${p.n}: ${KH_SUBJECTS[p.sid].name}`)}
          />
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4. TABLET LANDSCAPE — week grid (cols=periods) + side stats
// ════════════════════════════════════════════════════════════════════
function ScheduleTabletLandscape({ tweaks, time, onAction }) {
  const now = getScheduleNow(time);
  const todayDay = WEEK_DAYS.find((d) => d.id === now.todayId);

  return (
    <div className="kh-app">
      <Sidebar active="schedule" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, display: 'flex', gap: 18, padding: 22,
        minWidth: 0, overflow: 'hidden',
      }}>
        {/* Left: grid */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h1 className="kh-h1" style={{ fontSize: 30 }}>Lịch học</h1>
              <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
                Tuần 14 · 25–29 Tháng 5
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="kh-ghost" onClick={() => onAction('Tuần trước')}>←</button>
              <button className="kh-ghost" onClick={() => onAction('Tuần này')}>Tuần này</button>
              <button className="kh-ghost" onClick={() => onAction('Tuần sau')}>→</button>
              <button className="kh-cta" onClick={() => onAction('Sửa lịch')}>✏️ Sửa</button>
            </div>
          </div>

          {/* Week grid */}
          <div style={{ flex: 1, minHeight: 0 }}>
            <WeekGrid orient="cols-periods"
              currentN={now.currentN} todayId={now.todayId}
              onPick={(x) => onAction(`${WEEK_DAYS.find((d) => d.id === x.day).label} · ${KH_SUBJECTS[x.p.sid].name}`)} />
          </div>
        </div>

        {/* Right: today + week stats */}
        <aside style={{
          width: 280, flexShrink: 0,
          display: 'flex', flexDirection: 'column', gap: 14, overflow: 'auto',
        }}>
          {/* Today card */}
          <div style={{
            background: 'var(--kh-accent)', color: '#fff',
            borderRadius: 22, padding: 18,
            boxShadow: '0 16px 32px -16px var(--kh-accent)',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, opacity: 0.85,
              letterSpacing: 0.14, textTransform: 'uppercase',
            }}>Hôm nay</div>
            <div style={{ fontSize: 26, fontWeight: 900, marginTop: 2 }}>
              {todayDay.label}
            </div>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, marginBottom: 12 }}>
              {WEEKLY[now.todayId].length} tiết · 07:30 → 11:10
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {WEEKLY[now.todayId].map((p) => {
                const s = KH_SUBJECTS[p.sid];
                const isNow = now.currentN === p.n;
                return (
                  <div key={p.n} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 8px', borderRadius: 10,
                    background: isNow ? 'rgba(255,255,255,0.22)' : 'rgba(255,255,255,0.08)',
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 7,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'grid', placeItems: 'center',
                      fontSize: 11, fontWeight: 900, flexShrink: 0,
                    }}>{p.n}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, fontWeight: 800,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>{s.name}</div>
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.85 }}>
                      {p.start}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject distribution */}
          <div className="kh-card" style={{ padding: 16 }}>
            <div style={{
              fontSize: 11, fontWeight: 800, color: '#94a3b8',
              letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 10,
            }}>Phân bố môn học</div>
            <SubjectLegend />
          </div>
        </aside>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 5. DESKTOP — full week grid + detail panel
// ════════════════════════════════════════════════════════════════════
function ScheduleDesktop({ tweaks, time, onAction }) {
  const now = getScheduleNow(time);
  const [selected, setSelected] = React.useState({
    day: now.todayId, n: now.currentN || 3,
  });
  const selectedDay = WEEK_DAYS.find((d) => d.id === selected.day);
  const selectedP = WEEKLY[selected.day].find((x) => x.n === selected.n);
  const selectedSubj = selectedP ? KH_SUBJECTS[selectedP.sid] : null;

  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 18, padding: '22px 28px',
        minWidth: 0, overflow: 'hidden',
        maxWidth: 1280, margin: '0 auto', width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Lịch học</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Tuần 14 · 25–29 Tháng 5 · {now.label}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="kh-ghost" onClick={() => onAction('Tuần trước')}>← Tuần trước</button>
            <div style={{
              fontSize: 14, fontWeight: 900,
              padding: '8px 14px', borderRadius: 999,
              background: 'var(--kh-accent-soft)', color: 'var(--kh-accent-deep)',
            }}>Tuần 14</div>
            <button className="kh-ghost" onClick={() => onAction('Tuần sau')}>Tuần sau →</button>
            <button className="kh-cta" onClick={() => onAction('Sửa lịch')}>✏️ Sửa lịch</button>
          </div>
        </div>

        {/* Body: grid + side detail */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18,
          flex: 1, minHeight: 0,
        }}>
          {/* Grid */}
          <div style={{ minWidth: 0 }}>
            <WeekGrid orient="cols-periods"
              currentN={now.currentN} todayId={now.todayId}
              onPick={(x) => x.p && setSelected({ day: x.day, n: x.p.n })} />
          </div>

          {/* Detail */}
          <aside style={{
            display: 'flex', flexDirection: 'column', gap: 14,
            overflow: 'auto', minHeight: 0,
          }}>
            <div className="kh-eyebrow">Chi tiết tiết học</div>

            {selectedP && (
              <div style={{
                background: selectedSubj.color, color: '#fff',
                borderRadius: 22, padding: 20, position: 'relative', overflow: 'hidden',
                boxShadow: `0 18px 36px -18px ${selectedSubj.color}`,
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 800, letterSpacing: 0.12,
                  textTransform: 'uppercase', opacity: 0.85,
                }}>{selectedDay.label} · Tiết {selectedP.n}</div>
                <div style={{ fontSize: 32, fontWeight: 900, marginTop: 4, letterSpacing: -0.02 }}>
                  {selectedSubj.name}
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, opacity: 0.9, marginTop: 4 }}>
                  {selectedP.start} – {selectedP.end} · 40 phút
                </div>
                <div style={{
                  marginTop: 16, display: 'flex', gap: 8,
                }}>
                  <button
                    onClick={() => onAction(`Mở bài học: ${selectedSubj.name}`)}
                    style={{
                      background: '#fff', color: selectedSubj.color,
                      border: 0, padding: '10px 16px', borderRadius: 999,
                      fontFamily: 'inherit', fontWeight: 800, fontSize: 13,
                      cursor: 'pointer',
                    }}>
                    Mở bài học
                  </button>
                  {(selectedP.sid === 'math' || selectedP.sid === 'english') && (
                    <button
                      onClick={() => onAction(`Mở ${selectedP.sid === 'math' ? 'Number Ninja' : 'Word Explorer'}…`)}
                      style={{
                        background: 'rgba(255,255,255,0.2)', color: '#fff',
                        border: 0, padding: '10px 16px', borderRadius: 999,
                        fontFamily: 'inherit', fontWeight: 800, fontSize: 13,
                        cursor: 'pointer',
                      }}>
                      🎮 Chơi game
                    </button>
                  )}
                </div>
                <div style={{
                  position: 'absolute', right: -10, bottom: -28,
                  fontSize: 130, opacity: 0.18, lineHeight: 1,
                  pointerEvents: 'none',
                }} aria-hidden="true">{selectedSubj.emoji}</div>
              </div>
            )}

            {/* Subject distribution */}
            <div className="kh-card" style={{ padding: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: '#94a3b8',
                letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 10,
              }}>Phân bố môn học</div>
              <SubjectLegend />
            </div>

            {/* Week summary stats */}
            <div className="kh-card" style={{ padding: 16 }}>
              <div style={{
                fontSize: 11, fontWeight: 800, color: '#94a3b8',
                letterSpacing: 0.12, textTransform: 'uppercase', marginBottom: 10,
              }}>Tổng kết tuần</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{
                  padding: 12, borderRadius: 14, background: '#f8fafc',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b' }}>25</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Tổng tiết học</div>
                </div>
                <div style={{
                  padding: 12, borderRadius: 14, background: '#f8fafc',
                }}>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#1e293b' }}>9</div>
                  <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>Môn khác nhau</div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, {
  SchedulePhonePortrait,
  SchedulePhoneLandscape,
  ScheduleTabletPortrait,
  ScheduleTabletLandscape,
  ScheduleDesktop,
});
