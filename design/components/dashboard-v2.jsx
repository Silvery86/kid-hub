/* dashboard-v2.jsx — Direction 2: "Today Hero"
   Big NOW card spans the full top width; a horizontal time-rail shows
   all 5 periods at a glance; games + homework + streak sit below in a
   3-column strip. Optimised for landscape tablet (1280×800).
   Used by Kid Hub Today Hero - Responsive.html for the Tablet Landscape artboard. */

function DashboardHero({ tweaks, time, onAction }) {
  const showGami = tweaks.showGami;
  const state = khComputeNow(time);
  const subj = state.now ? KH_SUBJECTS[state.now.sid] : null;
  const pendingHw = KH_HOMEWORK.filter((h) => !h.done).length;

  const minutesLeft = (() => {
    if (!state.now || state.progress == null) return null;
    const [eh, em] = state.now.end.split(':').map(Number);
    const [ch, cm] = state.label.split(':').map(Number);
    return (eh * 60 + em) - (ch * 60 + cm);
  })();

  return (
    <div className="kh-app">
      <Sidebar active="home" />

      <main style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: 16, padding: 20, minWidth: 0, overflow: 'hidden',
      }}>
        {/* ── Greeting + meta row ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1">Chào Khôi! 👋</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 15, fontWeight: 600 }}>
              Thứ Tư, 27 Tháng 5 · {state.label}
            </p>
          </div>
          {showGami && (
            <div style={{ display: 'flex', gap: 10 }}>
              <div className="kh-tag" style={{ background: '#fef3c7', color: '#92400e', padding: '8px 14px', fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>🪙</span>
                <span>{KH_USER.points} điểm</span>
              </div>
              <div className="kh-tag" style={{ background: '#ffedd5', color: '#9a3412', padding: '8px 14px', fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>🔥</span>
                <span>{KH_USER.streak} ngày</span>
              </div>
              <button
                className="kh-press"
                onClick={() => onAction(`${KH_USER.badges} huy hiệu đã đạt`)}
                style={{
                  border: 0, background: '#fff', padding: '8px 14px', borderRadius: 999,
                  fontFamily: 'inherit', fontSize: 13, fontWeight: 800,
                  display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
                }}>
                <span style={{ fontSize: 18 }}>🏆</span>
                <span>{KH_USER.badges} huy hiệu</span>
              </button>
            </div>
          )}
        </div>

        {/* ── HERO: now card ── */}
        {state.now ? (
          <div style={{
            position: 'relative', borderRadius: 32, overflow: 'hidden',
            background: subj.color, color: '#fff',
            padding: '28px 32px',
            boxShadow: `0 28px 48px -28px ${subj.color}`,
            display: 'flex', alignItems: 'stretch', gap: 32,
            minHeight: 200,
          }}>
            {/* Left: heading */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="kh-pulse" />
                <span style={{
                  fontSize: 12, fontWeight: 800, letterSpacing: 0.18, textTransform: 'uppercase',
                  opacity: 0.9,
                }}>Đang học · Tiết {state.now.n}</span>
              </div>
              <div>
                <div style={{
                  fontSize: 64, fontWeight: 900, letterSpacing: -0.025,
                  lineHeight: 1, marginBottom: 8,
                }}>{subj.name}</div>
                <div style={{ fontSize: 18, fontWeight: 700, opacity: 0.85 }}>
                  {state.now.start} – {state.now.end}
                  {minutesLeft != null && (
                    <span style={{ marginLeft: 12, opacity: 0.85 }}>
                      · còn <strong>{minutesLeft} phút</strong>
                    </span>
                  )}
                </div>
              </div>
              {/* Progress through period */}
              <div>
                <div style={{
                  height: 10, background: 'rgba(255,255,255,0.25)',
                  borderRadius: 999, overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${Math.round((state.progress || 0) * 100)}%`,
                    height: '100%', background: '#fff', borderRadius: 999,
                    transition: 'width 0.4s',
                  }} />
                </div>
              </div>
            </div>
            {/* Right: big glyph + Next */}
            <div style={{
              width: 240, display: 'flex', flexDirection: 'column',
              alignItems: 'flex-end', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ fontSize: 110, lineHeight: 1, opacity: 0.65 }} aria-hidden="true">
                {subj.emoji}
              </div>
              {state.next && (
                <div style={{
                  background: 'rgba(255,255,255,0.18)',
                  borderRadius: 16, padding: '10px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%',
                }}>
                  <Subj sid={state.next.sid} size={36} rounded={10} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{
                      fontSize: 10, fontWeight: 800, opacity: 0.8,
                      letterSpacing: 0.12, textTransform: 'uppercase',
                    }}>Tiếp theo</div>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>
                      {KH_SUBJECTS[state.next.sid].name}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85, fontWeight: 700 }}>
                      {state.next.start}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{
            borderRadius: 32, padding: 36, minHeight: 200,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 18, textAlign: 'center', boxShadow: '0 1px 2px rgba(15,23,42,0.04)',
          }}>
            <div style={{ fontSize: 64 }} aria-hidden="true">🎉</div>
            <div>
              <div style={{ fontSize: 28, fontWeight: 900, color: '#1e293b' }}>
                {state.pendingBreak ? 'Đang nghỉ giữa giờ' : 'Học xong rồi!'}
              </div>
              <div style={{ fontSize: 15, color: '#64748b', fontWeight: 700, marginTop: 4 }}>
                {state.pendingBreak ? 'Toán bắt đầu lúc 09:00' : 'Hẹn gặp lại ngày mai nhé.'}
              </div>
            </div>
          </div>
        )}

        {/* ── Day rail — all 5 periods at a glance ── */}
        <section>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'baseline', padding: '0 2px', marginBottom: 8,
          }}>
            <h2 className="kh-h2">Hôm nay</h2>
            <span style={{ fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>5 tiết · 07:30 → 11:10</span>
          </div>
          <DayRail
            periods={KH_TODAY}
            currentN={state.now ? state.now.n : null}
            progress={state.progress}
            onPick={(p) => onAction(`Tiết ${p.n}: ${KH_SUBJECTS[p.sid].name}`)}
          />
        </section>

        {/* ── Bottom strip: Games + Homework ── */}
        <section style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 14, flex: 1, minHeight: 0,
        }}>
          {/* Number Ninja */}
          <div
            className="kh-game-card kh-press"
            style={{ background: '#3b82f6', minHeight: 'auto' }}
            onClick={() => onAction('Mở Number Ninja…')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 36 }}>🔢</span>
              <Pill tone="slate">Toán</Pill>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 'auto' }}>Number Ninja</div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 12, fontWeight: 800, opacity: 0.9,
            }}>
              <span>Kỷ lục {KH_USER.bestMath.score}</span>
              <Stars filled={KH_USER.bestMath.stars} size={13} />
            </div>
          </div>

          {/* Word Explorer */}
          <div
            className="kh-game-card kh-press"
            style={{ background: '#10b981', minHeight: 'auto' }}
            onClick={() => onAction('Mở Word Explorer…')}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 36 }}>🔤</span>
              <Pill tone="slate">English</Pill>
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, marginTop: 'auto' }}>Word Explorer</div>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', fontSize: 12, fontWeight: 800, opacity: 0.9,
            }}>
              <span>Kỷ lục {KH_USER.bestEnglish.score}</span>
              <Stars filled={KH_USER.bestEnglish.stars} size={13} />
            </div>
          </div>

          {/* Homework list */}
          <div className="kh-card" style={{
            padding: 16, display: 'flex', flexDirection: 'column',
            background: '#fff', minHeight: 0,
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: 10,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 20 }}>📚</span>
                <div style={{ fontWeight: 900, fontSize: 16 }}>Bài tập</div>
              </div>
              <Pill tone="amber">{pendingHw} chưa làm</Pill>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, overflow: 'auto' }}>
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
                      opacity: h.done ? 0.6 : 1,
                    }}>
                    <Subj sid={h.subject} size={28} rounded={8} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 800, color: '#1e293b',
                        textDecoration: h.done ? 'line-through' : 'none',
                      }}>{h.title}</div>
                      <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700 }}>{s.name}</div>
                    </div>
                    <div style={{
                      width: 22, height: 22, borderRadius: 999,
                      background: h.done ? '#10b981' : '#fff',
                      border: h.done ? 'none' : '2px solid #e2e8f0',
                      display: 'grid', placeItems: 'center',
                      color: '#fff', fontSize: 12, fontWeight: 900,
                    }}>{h.done ? '✓' : ''}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

window.DashboardHero = DashboardHero;
