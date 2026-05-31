/* dashboard-v2-responsive.jsx — Today Hero in 5 viewports
   - HeroPhonePortrait   ( 390 x 844 )
   - HeroPhoneLandscape  ( 844 x 390 )
   - HeroTabletPortrait  ( 820 x 1180 )
   - HeroTabletLandscape ( 1280 x 800 )  — reuses the original
   - HeroDesktop         ( 1440 x 900 )
*/

// ── Shared bits ────────────────────────────────────────────────────────
function useNowState(time) {
  const state = khComputeNow(time);
  const subj = state.now ? KH_SUBJECTS[state.now.sid] : null;
  const minutesLeft = (() => {
    if (!state.now || state.progress == null) return null;
    const [eh, em] = state.now.end.split(':').map(Number);
    const [ch, cm] = state.label.split(':').map(Number);
    return (eh * 60 + em) - (ch * 60 + cm);
  })();
  return { state, subj, minutesLeft };
}

// Compact bottom nav for phone
function BottomNav({ onAction, active = 'home', items }) {
  const allItems = items || [
    { id: 'home',     label: 'Trang chủ', icon: '🏠' },
    { id: 'schedule', label: 'Lịch',      icon: '🗓️' },
    { id: 'grades',   label: 'Điểm',      icon: '⭐' },
    { id: 'games',    label: 'Trò chơi',  icon: '🎮' },
    { id: 'homework', label: 'Bài tập',   icon: '📚' },
    { id: 'unlock',   label: 'Huy hiệu',  icon: '🏆' },
  ];
  const [moreOpen, setMoreOpen] = React.useState(false);

  // When more than 4 items, show first 3 inline + a "More" slot.
  const overflow = allItems.length > 4;
  const visible = overflow ? allItems.slice(0, 3) : allItems;
  const hidden = overflow ? allItems.slice(3) : [];
  const activeInHidden = hidden.some((h) => h.id === active);

  const tab = (it, isActive) => (
    <button
      key={it.id}
      onClick={() => onAction(`Mở ${it.label}…`)}
      style={{
        flex: 1, border: 0, background: 'transparent',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 2, padding: '6px 4px', cursor: 'pointer', fontFamily: 'inherit',
        color: isActive ? 'var(--kh-accent)' : '#94a3b8',
        fontSize: 10, fontWeight: 800, letterSpacing: -0.01,
      }}>
      <span style={{ fontSize: 22 }}>{it.icon}</span>
      <span>{it.label}</span>
    </button>
  );

  return (
    <nav style={{
      display: 'flex', background: '#fff', position: 'relative',
      padding: '6px 4px 10px',
      borderTop: '1px solid #f1f5f9',
      boxShadow: '0 -4px 16px rgba(15,23,42,0.05)',
    }}>
      {visible.map((it) => tab(it, it.id === active))}

      {overflow && (
        <React.Fragment>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            style={{
              flex: 1, border: 0, background: 'transparent',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 2, padding: '6px 4px', cursor: 'pointer', fontFamily: 'inherit',
              color: (moreOpen || activeInHidden) ? 'var(--kh-accent)' : '#94a3b8',
              fontSize: 10, fontWeight: 800, letterSpacing: -0.01,
            }}>
            <span style={{ fontSize: 22 }}>⋯</span>
            <span>Thêm</span>
          </button>

          {moreOpen && (
            <React.Fragment>
              {/* click-away backdrop */}
              <div
                onClick={() => setMoreOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
              />
              {/* popover anchored bottom-right above the More tab */}
              <div style={{
                position: 'absolute', right: 8, bottom: '100%', marginBottom: 8,
                background: '#fff', borderRadius: 16, zIndex: 41,
                boxShadow: '0 12px 32px -8px rgba(15,23,42,0.25), 0 0 0 1px rgba(15,23,42,0.05)',
                padding: 8, minWidth: 180,
                display: 'flex', flexDirection: 'column', gap: 2,
                animation: 'kh-pop-in 0.14s ease-out',
              }}>
                {hidden.map((it) => {
                  const isActive = it.id === active;
                  return (
                    <button
                      key={it.id}
                      onClick={() => { setMoreOpen(false); onAction(`Mở ${it.label}…`); }}
                      className="kh-press"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '10px 12px', borderRadius: 12, border: 0,
                        background: isActive ? 'var(--kh-accent-soft)' : 'transparent',
                        color: isActive ? 'var(--kh-accent-deep)' : '#475569',
                        fontFamily: 'inherit', fontSize: 14, fontWeight: 800,
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}>
                      <span style={{ fontSize: 20 }}>{it.icon}</span>
                      <span>{it.label}</span>
                    </button>
                  );
                })}
              </div>
              {/* little caret */}
              <div style={{
                position: 'absolute', right: 8 + 78, bottom: '100%', marginBottom: 2,
                width: 12, height: 12, background: '#fff', transform: 'rotate(45deg)',
                zIndex: 41, boxShadow: '2px 2px 4px rgba(15,23,42,0.06)',
              }} />
            </React.Fragment>
          )}
        </React.Fragment>
      )}
    </nav>
  );
}

// Compact sidebar (icon-only) for mobile landscape
function NarrowRail({ onAction }) {
  const items = [
    { id: 'home',     icon: '🏠' },
    { id: 'schedule', icon: '🗓️' },
    { id: 'grades',   icon: '⭐' },
    { id: 'games',    icon: '🎮' },
  ];
  return (
    <aside style={{
      width: 56, background: '#fff', flexShrink: 0,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', padding: '10px 0',
      gap: 4, boxShadow: '4px 0 16px rgba(15,23,42,0.04)',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: 'var(--kh-accent)',
        color: '#fff', display: 'grid', placeItems: 'center',
        fontSize: 18, marginBottom: 8,
      }}>🌟</div>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onAction(`Mở ${it.id}…`)}
          style={{
            width: 44, height: 44, border: 0, borderRadius: 12,
            background: it.id === 'home' ? 'var(--kh-accent)' : 'transparent',
            color: it.id === 'home' ? '#fff' : '#94a3b8',
            fontSize: 20, cursor: 'pointer', flexShrink: 0,
          }}>{it.icon}</button>
      ))}
    </aside>
  );
}

// Wide sidebar with labels — desktop variant
function WideSidebar({ onAction }) {
  const items = [
    { id: 'home',     label: 'Trang chủ', icon: '🏠' },
    { id: 'schedule', label: 'Lịch học',  icon: '🗓️' },
    { id: 'grades',   label: 'Điểm số',   icon: '⭐' },
    { id: 'games',    label: 'Trò chơi',  icon: '🎮' },
    { id: 'homework', label: 'Bài tập',   icon: '📚' },
  ];
  return (
    <aside style={{
      width: 240, flexShrink: 0, background: '#fff',
      display: 'flex', flexDirection: 'column',
      padding: '20px 14px', gap: 4,
      boxShadow: '4px 0 24px rgba(15,23,42,0.04)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '0 8px 16px', marginBottom: 4,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 12,
          background: 'var(--kh-accent)', color: '#fff',
          display: 'grid', placeItems: 'center', fontSize: 20,
        }}>🌟</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 900 }}>Kid Hub</div>
          <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>Lớp 1A · Khôi</div>
        </div>
      </div>
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onAction(`Mở ${it.label}…`)}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px', borderRadius: 14, border: 0,
            background: it.id === 'home' ? 'var(--kh-accent)' : 'transparent',
            color: it.id === 'home' ? '#fff' : '#475569',
            fontFamily: 'inherit', fontWeight: 800, fontSize: 14,
            cursor: 'pointer', textAlign: 'left',
            boxShadow: it.id === 'home'
              ? '0 4px 12px -4px color-mix(in oklab, var(--kh-accent) 60%, transparent)'
              : 'none',
          }}>
          <span style={{ fontSize: 20 }}>{it.icon}</span>
          <span>{it.label}</span>
        </button>
      ))}
      <div style={{ flex: 1 }} />
      <button
        onClick={() => onAction('Bố mẹ mode')}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', borderRadius: 14, border: 0,
          background: '#f8fafc', color: '#64748b',
          fontFamily: 'inherit', fontWeight: 800, fontSize: 13,
          cursor: 'pointer', textAlign: 'left',
        }}>
        <span style={{ fontSize: 18 }}>🛡️</span>
        <span>Bố mẹ</span>
      </button>
    </aside>
  );
}

// ── Hero card — variants ───────────────────────────────────────────────
function HeroCard({ state, subj, minutesLeft, size = 'lg' }) {
  if (!state.now) {
    const small = size === 'sm' || size === 'xs';
    const showTomorrow = !state.pendingBreak && typeof KH_TOMORROW !== 'undefined';

    // Break state — simple centered message
    if (state.pendingBreak) {
      return (
        <div style={{
          borderRadius: small ? 20 : 28, padding: small ? 18 : 28,
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 14, textAlign: 'center',
          boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
          flex: 1, minHeight: 0,
        }}>
          <div style={{ fontSize: small ? 40 : 64 }} aria-hidden="true">☕</div>
          <div>
            <div style={{ fontSize: small ? 18 : 28, fontWeight: 900 }}>Đang nghỉ giữa giờ</div>
            <div style={{ fontSize: small ? 12 : 15, color: '#64748b', fontWeight: 700, marginTop: 4 }}>
              Toán bắt đầu 09:00
            </div>
          </div>
        </div>
      );
    }

    // Done — show tomorrow's schedule alongside
    return (
      <div style={{
        borderRadius: small ? 20 : 28, overflow: 'hidden',
        background: '#fff',
        display: 'flex', flexDirection: small ? 'column' : 'row',
        boxShadow: '0 1px 3px rgba(15,23,42,0.06)',
        flex: 1, minHeight: 0,
      }}>
        {/* Left / Top: done message */}
        <div style={{
          padding: small ? '16px 18px' : '24px 28px',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
          gap: small ? 6 : 8, flexShrink: 0,
          borderBottom: small ? '1px solid #f1f5f9' : 'none',
          borderRight: small ? 'none' : '1px solid #f1f5f9',
        }}>
          <div style={{ fontSize: small ? 32 : 48, lineHeight: 1 }}>🌙</div>
          <div style={{ fontSize: small ? 16 : 22, fontWeight: 900, color: '#1e293b' }}>
            Hết giờ học rồi!
          </div>
          <div style={{ fontSize: small ? 11 : 13, color: '#64748b', fontWeight: 700 }}>
            Nghỉ ngơi đi, Khôi nhé 😊
          </div>
        </div>

        {/* Right / Bottom: tomorrow's schedule */}
        {showTomorrow && (
          <div style={{
            flex: 1, padding: small ? '12px 18px' : '16px 22px',
            display: 'flex', flexDirection: 'column', gap: small ? 6 : 8,
            overflow: 'hidden',
          }}>
            <div style={{
              fontSize: small ? 9 : 11, fontWeight: 900, color: '#94a3b8',
              letterSpacing: 0.12, textTransform: 'uppercase',
            }}>Thứ Năm — Ngày mai</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: small ? 4 : 6 }}>
              {KH_TOMORROW.map((p) => {
                const s = KH_SUBJECTS[p.sid];
                return (
                  <div key={p.n} style={{
                    display: 'flex', alignItems: 'center', gap: small ? 8 : 10,
                    padding: small ? '6px 8px' : '7px 10px',
                    borderRadius: small ? 10 : 12, background: '#f8fafc',
                  }}>
                    <div style={{
                      width: small ? 6 : 8, height: small ? 6 : 8,
                      borderRadius: 999, background: s.color, flexShrink: 0,
                    }} />
                    <span style={{
                      flex: 1, fontSize: small ? 11 : 13, fontWeight: 800,
                      color: '#1e293b', overflow: 'hidden',
                      textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{s.name}</span>
                    <span style={{
                      fontSize: small ? 10 : 11, color: '#94a3b8',
                      fontWeight: 700, flexShrink: 0,
                    }}>{p.start}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const sizes = {
    xs: { pad: 14, gap: 8,  title: 28, sub: 12, glyph: 64,  rad: 18 },
    sm: { pad: 18, gap: 12, title: 36, sub: 13, glyph: 88,  rad: 22 },
    md: { pad: 22, gap: 14, title: 48, sub: 15, glyph: 100, rad: 26 },
    lg: { pad: 28, gap: 18, title: 64, sub: 18, glyph: 110, rad: 32 },
    xl: { pad: 32, gap: 20, title: 72, sub: 19, glyph: 130, rad: 36 },
  };
  const sz = sizes[size] || sizes.lg;

  return (
    <div style={{
      position: 'relative', borderRadius: sz.rad, overflow: 'hidden',
      background: subj.color, color: '#fff',
      padding: sz.pad,
      boxShadow: `0 24px 40px -24px ${subj.color}`,
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', gap: sz.gap,
      minHeight: 0,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="kh-pulse" />
          <span style={{
            fontSize: sz.sub - 4, fontWeight: 800, letterSpacing: 0.16,
            textTransform: 'uppercase', opacity: 0.9,
          }}>Đang học · Tiết {state.now.n}</span>
        </div>
      </div>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: sz.title, fontWeight: 900, letterSpacing: -0.025,
          lineHeight: 1, marginBottom: 6,
        }}>{subj.name}</div>
        <div style={{ fontSize: sz.sub, fontWeight: 700, opacity: 0.9 }}>
          {state.now.start} – {state.now.end}
          {minutesLeft != null && (
            <span style={{ marginLeft: 8 }}>
              · còn <strong>{minutesLeft} phút</strong>
            </span>
          )}
        </div>
      </div>
      <div>
        <div style={{
          height: 8, background: 'rgba(255,255,255,0.25)',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${Math.round((state.progress || 0) * 100)}%`,
            height: '100%', background: '#fff', borderRadius: 999,
            transition: 'width 0.4s',
          }} />
        </div>
      </div>
      <div style={{
        position: 'absolute', right: -14, bottom: -22,
        fontSize: sz.glyph, lineHeight: 1, opacity: 0.18,
        pointerEvents: 'none',
      }} aria-hidden="true">{subj.emoji}</div>
    </div>
  );
}

// Compact "next up" mini card (used in phone)
function NextChip({ state, onAction }) {
  if (!state.next) return null;
  const s = KH_SUBJECTS[state.next.sid];
  return (
    <button
      onClick={() => onAction(`Tiếp theo: ${s.name}`)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fff', padding: '8px 12px',
        borderRadius: 16, border: 0,
        boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
        fontFamily: 'inherit', cursor: 'pointer', textAlign: 'left',
        width: '100%',
      }}>
      <Subj sid={state.next.sid} size={32} rounded={9} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 10, fontWeight: 800, color: '#94a3b8',
          letterSpacing: 0.12, textTransform: 'uppercase',
        }}>Tiếp theo</div>
        <div style={{ fontWeight: 800, fontSize: 14 }}>{s.name}</div>
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#64748b' }}>
        {state.next.start}
      </span>
    </button>
  );
}

// Mini day rail item — used when very small
function MiniPeriod({ p, currentN, onAction }) {
  const s = KH_SUBJECTS[p.sid];
  const isNow = currentN === p.n;
  const isDone = currentN != null && p.n < currentN;
  return (
    <button
      onClick={() => onAction(`Tiết ${p.n}: ${s.name}`)}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4,
        padding: '8px 4px', minWidth: 56,
        border: isNow ? `2px solid ${s.color}` : '2px solid transparent',
        borderRadius: 14, background: '#fff',
        opacity: isDone ? 0.55 : 1,
        boxShadow: isNow ? `0 6px 16px -8px ${s.color}` : 'none',
        cursor: 'pointer', fontFamily: 'inherit',
        flexShrink: 0, transition: 'transform 0.1s',
      }}>
      <Subj sid={p.sid} size={28} rounded={9} />
      <span style={{
        fontSize: 10, fontWeight: 800, color: '#1e293b',
        whiteSpace: 'nowrap',
      }}>{p.start}</span>
    </button>
  );
}

// Game card — compact
function GameCardCompact({ color, emoji, title, sub, best, stars, onClick, size = 'md' }) {
  const padding = size === 'sm' ? 12 : 16;
  return (
    <div
      className="kh-press"
      onClick={onClick}
      style={{
        background: color, color: '#fff',
        borderRadius: size === 'sm' ? 16 : 20,
        padding, minHeight: 0,
        display: 'flex', flexDirection: 'column', gap: 6,
        position: 'relative', overflow: 'hidden',
        cursor: 'pointer',
        boxShadow: `0 10px 24px -14px ${color}`,
      }}>
      <div style={{ fontSize: size === 'sm' ? 24 : 30 }}>{emoji}</div>
      <div style={{ fontSize: size === 'sm' ? 14 : 17, fontWeight: 900, lineHeight: 1.1 }}>
        {title}
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, opacity: 0.85 }}>{sub}</div>
      <div style={{
        marginTop: 'auto', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center',
        fontSize: 11, fontWeight: 800, opacity: 0.9,
      }}>
        <span>Kỷ lục {best}</span>
        <Stars filled={stars} size={11} />
      </div>
    </div>
  );
}

// Homework list — used in all viewports
function HomeworkList({ onAction, compact = false }) {
  const pendingHw = KH_HOMEWORK.filter((h) => !h.done).length;
  return (
    <div className="kh-card" style={{
      padding: compact ? 12 : 14, background: '#fff',
      display: 'flex', flexDirection: 'column', gap: 8,
      minHeight: 0,
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18 }}>📚</span>
          <div style={{ fontWeight: 900, fontSize: compact ? 14 : 15 }}>Bài tập</div>
        </div>
        <Pill tone="amber">{pendingHw} chưa làm</Pill>
      </div>
      {KH_HOMEWORK.map((h) => {
        const s = KH_SUBJECTS[h.subject];
        return (
          <div
            key={h.id}
            className="kh-press"
            onClick={() => onAction(h.done ? 'Bài đã làm xong' : `Bắt đầu: ${h.title}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: 8, borderRadius: 12,
              background: h.done ? '#f1f5f9' : '#fefce8',
              opacity: h.done ? 0.6 : 1, cursor: 'pointer',
            }}>
            <Subj sid={h.subject} size={compact ? 24 : 28} rounded={8} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: compact ? 12 : 13, fontWeight: 800, color: '#1e293b',
                textDecoration: h.done ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{h.title}</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>
                {s.name}
              </div>
            </div>
            <div style={{
              width: 20, height: 20, borderRadius: 999,
              background: h.done ? '#10b981' : '#fff',
              border: h.done ? 'none' : '2px solid #e2e8f0',
              display: 'grid', placeItems: 'center',
              color: '#fff', fontSize: 11, fontWeight: 900,
              flexShrink: 0,
            }}>{h.done ? '✓' : ''}</div>
          </div>
        );
      })}
    </div>
  );
}

// Stat chip
function StatChip({ icon, value, bg, fg }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: bg, color: fg, padding: '5px 10px',
      borderRadius: 999, fontSize: 12, fontWeight: 800,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span>{value}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 1. PHONE PORTRAIT (390 x 844)
// ════════════════════════════════════════════════════════════════════
function HeroPhonePortrait({ tweaks, time, onAction, insets = {} }) {
  const { state, subj, minutesLeft } = useNowState(time);
  const topInset = insets.top ?? 0;
  const bottomInset = insets.bottom ?? 0;

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-shell-kid)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif',
      color: '#1e293b',
      paddingTop: topInset,
    }}>
      {/* Content scroll */}
      <div className="kh-scroll" style={{
        flex: 1, padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: -0.02 }}>Chào Khôi! 👋</div>
            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
              Thứ Tư 28/05 · {state.label}
            </div>
          </div>
          {tweaks.showGami && (
            <div style={{ display: 'flex', gap: 6 }}>
              <StatChip icon="🪙" value={KH_USER.points} bg="#fef3c7" fg="#92400e" />
              <StatChip icon="🔥" value={KH_USER.streak} bg="#ffedd5" fg="#9a3412" />
            </div>
          )}
        </div>

        {/* Hero */}
        <div style={{ minHeight: 200 }}>
          <HeroCard state={state} subj={subj} minutesLeft={minutesLeft} size="md" />
        </div>

        {/* Next up */}
        {state.next && <NextChip state={state} onAction={onAction} />}

        {/* Day rail — horizontal scroll */}
        <div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', marginBottom: 6, padding: '0 2px',
          }}>
            <div style={{ fontSize: 14, fontWeight: 900 }}>Hôm nay</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 800 }}>
              5 tiết
            </div>
          </div>
          <div className="kh-scroll" style={{
            display: 'flex', gap: 8, overflowX: 'auto',
            paddingBottom: 4, margin: '0 -14px', padding: '0 14px 4px',
          }}>
            {KH_TODAY.map((p) => (
              <MiniPeriod key={p.n} p={p}
                currentN={state.now ? state.now.n : null}
                onAction={onAction} />
            ))}
          </div>
        </div>

        {/* Games */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 6, padding: '0 2px' }}>
            Trò chơi 🎮
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <GameCardCompact color="#3b82f6" emoji="🔢" title="Number Ninja"
              sub="Toán cộng & trừ"
              best={KH_USER.bestMath.score} stars={KH_USER.bestMath.stars}
              onClick={() => onAction('Mở Number Ninja…')} size="md" />
            <GameCardCompact color="#10b981" emoji="🔤" title="Word Explorer"
              sub="Tiếng Anh vui"
              best={KH_USER.bestEnglish.score} stars={KH_USER.bestEnglish.stars}
              onClick={() => onAction('Mở Word Explorer…')} size="md" />
          </div>
        </div>

        {/* Homework */}
        <HomeworkList onAction={onAction} />
      </div>

      {/* Bottom nav */}
      <div style={{ paddingBottom: bottomInset, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 2. PHONE LANDSCAPE (844 x 390)
// ════════════════════════════════════════════════════════════════════
function HeroPhoneLandscape({ tweaks, time, onAction }) {
  const { state, subj, minutesLeft } = useNowState(time);

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
        flex: 1, padding: 12, minWidth: 0,
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gridTemplateRows: 'auto 1fr',
        gap: 10,
      }}>
        {/* Header row spans both columns */}
        <div style={{
          gridColumn: '1 / -1',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 900 }}>Chào Khôi! 👋</div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 700 }}>
              Thứ Tư 28/05 · {state.label}
            </div>
          </div>
          {tweaks.showGami && (
            <div style={{ display: 'flex', gap: 6 }}>
              <StatChip icon="🪙" value={KH_USER.points} bg="#fef3c7" fg="#92400e" />
              <StatChip icon="🔥" value={KH_USER.streak} bg="#ffedd5" fg="#9a3412" />
            </div>
          )}
        </div>

        {/* Left: Hero */}
        <div style={{ minHeight: 0 }}>
          <HeroCard state={state} subj={subj} minutesLeft={minutesLeft} size="sm" />
        </div>

        {/* Right: stacked day rail + games */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 0 }}>
          {/* Day rail — vertical small */}
          <div className="kh-scroll" style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            overflow: 'auto', flex: 1, minHeight: 0,
          }}>
            {KH_TODAY.map((p) => {
              const s = KH_SUBJECTS[p.sid];
              const isNow = state.now && state.now.n === p.n;
              const isDone = state.now && p.n < state.now.n;
              return (
                <button
                  key={p.n}
                  onClick={() => onAction(`Tiết ${p.n}: ${s.name}`)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 8px', borderRadius: 10,
                    background: isNow ? '#fff' : 'transparent',
                    border: isNow ? `2px solid ${s.color}` : '2px solid transparent',
                    cursor: 'pointer', fontFamily: 'inherit',
                    textAlign: 'left', opacity: isDone ? 0.55 : 1,
                  }}>
                  <Subj sid={p.sid} size={22} rounded={7} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 11, fontWeight: 800,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>{s.name}</div>
                  </div>
                  <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 800 }}>
                    {p.start}
                  </div>
                  {isDone && <span style={{ fontSize: 11, color: '#10b981' }}>✓</span>}
                  {isNow && <span className="kh-pulse" style={{ background: s.color, width: 8, height: 8 }} />}
                </button>
              );
            })}
          </div>
          {/* Tiny game CTAs */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <GameCardCompact color="#3b82f6" emoji="🔢" title="Toán"
              sub="Number Ninja"
              best={KH_USER.bestMath.score} stars={KH_USER.bestMath.stars}
              onClick={() => onAction('Mở Number Ninja…')} size="sm" />
            <GameCardCompact color="#10b981" emoji="🔤" title="Anh"
              sub="Word Explorer"
              best={KH_USER.bestEnglish.score} stars={KH_USER.bestEnglish.stars}
              onClick={() => onAction('Mở Word Explorer…')} size="sm" />
          </div>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 3. TABLET PORTRAIT (820 x 1180)
// ════════════════════════════════════════════════════════════════════
function HeroTabletPortrait({ tweaks, time, onAction }) {
  const { state, subj, minutesLeft } = useNowState(time);
  const pendingHw = KH_HOMEWORK.filter((h) => !h.done).length;

  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <Sidebar active="home" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 18, padding: 24, minWidth: 0, overflow: 'hidden',
      }}>
        {/* Greeting + chip stats */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Chào Khôi! 👋</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>
              Thứ Tư 28/05 · {state.label}
            </p>
          </div>
          {tweaks.showGami && (
            <div style={{ display: 'flex', gap: 8 }}>
              <StatChip icon="🪙" value={`${KH_USER.points} điểm`} bg="#fef3c7" fg="#92400e" />
              <StatChip icon="🔥" value={`${KH_USER.streak} ngày`} bg="#ffedd5" fg="#9a3412" />
              <StatChip icon="🏆" value={`${KH_USER.badges} huy hiệu`} bg="var(--kh-accent-soft)" fg="var(--kh-accent-deep)" />
            </div>
          )}
        </div>

        {/* Hero — tall */}
        <div style={{ minHeight: 260 }}>
          <HeroCard state={state} subj={subj} minutesLeft={minutesLeft} size="lg" />
        </div>

        {/* Day rail */}
        <section>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '0 2px', marginBottom: 10,
          }}>
            <h2 className="kh-h2">Hôm nay</h2>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>
              5 tiết · 07:30 → 11:10
            </span>
          </div>
          <DayRail
            periods={KH_TODAY}
            currentN={state.now ? state.now.n : null}
            progress={state.progress}
            onPick={(p) => onAction(`Tiết ${p.n}: ${KH_SUBJECTS[p.sid].name}`)}
          />
        </section>

        {/* Games row */}
        <section>
          <h2 className="kh-h2" style={{ marginBottom: 10, padding: '0 2px' }}>Trò chơi 🎮</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <GameCardCompact color="#3b82f6" emoji="🔢" title="Number Ninja"
              sub="Toán cộng & trừ"
              best={KH_USER.bestMath.score} stars={KH_USER.bestMath.stars}
              onClick={() => onAction('Mở Number Ninja…')} size="md" />
            <GameCardCompact color="#10b981" emoji="🔤" title="Word Explorer"
              sub="Tiếng Anh vui"
              best={KH_USER.bestEnglish.score} stars={KH_USER.bestEnglish.stars}
              onClick={() => onAction('Mở Word Explorer…')} size="md" />
          </div>
        </section>

        {/* Homework — full width */}
        <section style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <HomeworkList onAction={onAction} />
        </section>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// 4. DESKTOP (1440 x 900)
// ════════════════════════════════════════════════════════════════════
function HeroDesktop({ tweaks, time, onAction }) {
  const { state, subj, minutesLeft } = useNowState(time);
  const pendingHw = KH_HOMEWORK.filter((h) => !h.done).length;

  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 18, padding: '24px 32px', minWidth: 0, overflow: 'hidden',
        maxWidth: 1280, margin: '0 auto', width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 34 }}>Chào buổi sáng, Khôi! ☀️</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>
              Thứ Tư 28/05 · {state.label} · Tuần 14
            </p>
          </div>
          {tweaks.showGami && (
            <div style={{ display: 'flex', gap: 10 }}>
              <StatChip icon="🪙" value={`${KH_USER.points} điểm`} bg="#fef3c7" fg="#92400e" />
              <StatChip icon="🔥" value={`${KH_USER.streak} ngày`} bg="#ffedd5" fg="#9a3412" />
              <StatChip icon="🏆" value={`${KH_USER.badges} huy hiệu`} bg="var(--kh-accent-soft)" fg="var(--kh-accent-deep)" />
            </div>
          )}
        </div>

        {/* Hero — extra-large */}
        <div style={{ minHeight: 240 }}>
          <HeroCard state={state} subj={subj} minutesLeft={minutesLeft} size="xl" />
        </div>

        {/* Day rail */}
        <section>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            padding: '0 2px', marginBottom: 10,
          }}>
            <h2 className="kh-h2">Hôm nay</h2>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>
              5 tiết · 07:30 → 11:10
            </span>
          </div>
          <DayRail
            periods={KH_TODAY}
            currentN={state.now ? state.now.n : null}
            progress={state.progress}
            onPick={(p) => onAction(`Tiết ${p.n}: ${KH_SUBJECTS[p.sid].name}`)}
          />
        </section>

        {/* Bottom — Games + Homework in a 2-col grid */}
        <section style={{
          display: 'grid', gridTemplateColumns: '1.4fr 1fr',
          gap: 18, flex: 1, minHeight: 0,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <h2 className="kh-h2" style={{ padding: '0 2px' }}>Trò chơi 🎮</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, flex: 1, minHeight: 0 }}>
              <GameCardCompact color="#3b82f6" emoji="🔢" title="Number Ninja"
                sub="Toán cộng & trừ"
                best={KH_USER.bestMath.score} stars={KH_USER.bestMath.stars}
                onClick={() => onAction('Mở Number Ninja…')} size="md" />
              <GameCardCompact color="#10b981" emoji="🔤" title="Word Explorer"
                sub="Tiếng Anh vui"
                best={KH_USER.bestEnglish.score} stars={KH_USER.bestEnglish.stars}
                onClick={() => onAction('Mở Word Explorer…')} size="md" />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 0 }}>
            <h2 className="kh-h2" style={{ padding: '0 2px' }}>Bài tập</h2>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <HomeworkList onAction={onAction} />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

Object.assign(window, {
  HeroPhonePortrait,
  HeroPhoneLandscape,
  HeroTabletPortrait,
  HeroDesktop,
  BottomNav, NarrowRail, WideSidebar,
  HeroCard,
});
