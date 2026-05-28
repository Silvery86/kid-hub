/* games.jsx — /games hub: Math + English + Coming Soon, 5 viewports.
   Reuses KH_USER, KH_SUBJECTS from shared.jsx.
   Links out to /math and /english. */

// ── Games catalogue ────────────────────────────────────────────────────
const GAME_SECTIONS = [
  {
    id: 'math',
    label: 'Toán Học',
    emoji: '🧮',
    color: '#3b82f6',
    colorDark: '#1d4ed8',
    gradient: 'linear-gradient(140deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)',
    desc: '3 trò chơi · Đếm, Cộng/Trừ, Hình học',
    totalStars: 5, maxStars: 9,
    games: [
      { id: 'counting', emoji: '🌟', name: 'Đếm Sao',         best: 2 },
      { id: 'addition', emoji: '🔢', name: 'Number Ninja',    best: 3 },
      { id: 'shapes',   emoji: '🔷', name: 'Khám Phá Hình',   best: 0 },
    ],
  },
  {
    id: 'english',
    label: 'Tiếng Anh',
    emoji: '🔤',
    color: '#10b981',
    colorDark: '#047857',
    gradient: 'linear-gradient(140deg, #34d399 0%, #10b981 55%, #047857 100%)',
    desc: '3 trò chơi · Chữ cái, Từ vựng, Phát âm',
    totalStars: 6, maxStars: 9,
    games: [
      { id: 'alphabet',   emoji: '🔤', name: 'Alphabet Explorer', best: 3 },
      { id: 'vocabulary', emoji: '🦁', name: 'Word Safari',        best: 2 },
      { id: 'phonics',    emoji: '🔊', name: 'Sound Hunt',         best: 1 },
    ],
  },
];

const COMING_SOON = [
  { id: 'science', emoji: '🌱', name: 'Khoa học vui',    desc: 'Tự nhiên & Xã hội',   color: '#84cc16' },
  { id: 'drawing', emoji: '🎨', name: 'Vẽ Sáng Tạo',    desc: 'Mĩ thuật & Hình học',  color: '#ec4899' },
  { id: 'music',   emoji: '🎵', name: 'Âm Nhạc',         desc: 'Nhận biết nốt nhạc',  color: '#f97316' },
];

// ── Reusable pieces ────────────────────────────────────────────────────

function GameSectionCard({ sec, compact = false, onClick }) {
  const pct = Math.round((sec.totalStars / sec.maxStars) * 100);
  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        background: sec.gradient,
        color: '#fff', border: 0,
        borderRadius: compact ? 22 : 28,
        padding: compact ? '16px 18px' : '22px 24px',
        fontFamily: 'inherit', textAlign: 'left',
        cursor: 'pointer', width: '100%',
        position: 'relative', overflow: 'hidden',
        boxShadow: `0 20px 40px -20px ${sec.color}`,
        display: 'flex', flexDirection: 'column',
        gap: compact ? 8 : 12,
      }}>
      {/* Watermark */}
      <div style={{
        position: 'absolute', right: -20, top: -20,
        fontSize: compact ? 110 : 140, lineHeight: 1,
        opacity: 0.15, pointerEvents: 'none',
        transform: 'rotate(-8deg)',
      }} aria-hidden="true">{sec.emoji}</div>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: compact ? 44 : 56, height: compact ? 44 : 56,
          borderRadius: compact ? 12 : 16,
          background: 'rgba(255,255,255,0.2)',
          display: 'grid', placeItems: 'center',
          fontSize: compact ? 24 : 30, flexShrink: 0,
        }}>{sec.emoji}</div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: compact ? 18 : 24, fontWeight: 900,
            letterSpacing: -0.02, lineHeight: 1.05,
          }}>{sec.label}</div>
          <div style={{
            fontSize: compact ? 11 : 13, fontWeight: 700,
            opacity: 0.85, marginTop: 2,
          }}>{sec.desc}</div>
        </div>
        <div style={{
          marginLeft: 'auto', flexShrink: 0,
          background: '#fff', color: sec.colorDark,
          borderRadius: 999, padding: compact ? '6px 12px' : '8px 16px',
          fontSize: compact ? 11 : 13, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}>Vào chơi →</div>
      </div>

      {/* Mini game row */}
      <div style={{ display: 'flex', gap: 8 }}>
        {sec.games.map((g) => (
          <div key={g.id} style={{
            flex: 1, background: 'rgba(255,255,255,0.14)',
            borderRadius: 12, padding: '8px 10px',
            display: 'flex', flexDirection: 'column', gap: 4,
            minWidth: 0,
          }}>
            <div style={{ fontSize: compact ? 18 : 22, lineHeight: 1 }}>{g.emoji}</div>
            <div style={{
              fontSize: compact ? 10 : 12, fontWeight: 800,
              overflow: 'hidden', textOverflow: 'ellipsis',
              whiteSpace: 'nowrap', lineHeight: 1.2,
            }}>{g.name}</div>
            <div style={{ display: 'flex', gap: 1 }}>
              {[1, 2, 3].map((i) => (
                <span key={i} style={{
                  fontSize: compact ? 10 : 12, lineHeight: 1,
                  color: i <= g.best ? '#fbbf24' : 'rgba(255,255,255,0.3)',
                }}>★</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: 5, fontSize: 11, fontWeight: 800, opacity: 0.85,
        }}>
          <span>{sec.totalStars} / {sec.maxStars} ⭐</span>
          <span>{pct}%</span>
        </div>
        <div style={{
          height: 6, background: 'rgba(255,255,255,0.25)',
          borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${pct}%`, height: '100%',
            background: '#fff', borderRadius: 999,
          }} />
        </div>
      </div>
    </button>
  );
}

function ComingSoonCard({ game, compact = false }) {
  return (
    <div style={{
      borderRadius: compact ? 16 : 20,
      padding: compact ? '12px 14px' : '16px 18px',
      background: '#fff',
      border: '2px dashed #e2e8f0',
      display: 'flex', flexDirection: 'column', gap: compact ? 6 : 8,
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', top: compact ? 8 : 10, right: compact ? 8 : 10,
        background: '#f1f5f9', color: '#94a3b8',
        padding: '2px 8px', borderRadius: 999,
        fontSize: 10, fontWeight: 800, letterSpacing: 0.04,
      }}>Sắp ra mắt</div>
      <div style={{ fontSize: compact ? 28 : 36, lineHeight: 1 }}>{game.emoji}</div>
      <div>
        <div style={{
          fontSize: compact ? 13 : 15, fontWeight: 900, color: '#475569',
        }}>{game.name}</div>
        <div style={{
          fontSize: compact ? 10 : 11, fontWeight: 700, color: '#94a3b8', marginTop: 2,
        }}>{game.desc}</div>
      </div>
    </div>
  );
}

function StatsBar({ compact = false, vertical = false, onAction }) {
  const total = KH_USER.points;
  const streak = KH_USER.streak;
  const badges = KH_USER.badges;
  const totalStars = 11;

  const chips = [
    { icon: '🪙', val: `${total}`, label: 'điểm', bg: '#fef3c7', fg: '#92400e' },
    { icon: '🔥', val: `${streak}`, label: 'ngày', bg: '#ffedd5', fg: '#9a3412' },
    { icon: '⭐', val: `${totalStars}/18`, label: 'sao', bg: '#dbeafe', fg: '#1d4ed8' },
    { icon: '🏆', val: `${badges}`, label: 'huy hiệu', bg: 'var(--kh-accent-soft)', fg: 'var(--kh-accent-deep)' },
  ];

  return (
    <div style={{
      display: 'flex', flexDirection: vertical ? 'column' : 'row',
      gap: compact ? 6 : 10, flexWrap: 'wrap',
    }}>
      {chips.map((c) => (
        <div key={c.label}
          onClick={() => onAction && onAction(c.label)}
          style={{
            background: c.bg, color: c.fg,
            borderRadius: 999, padding: compact ? '6px 12px' : '8px 14px',
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: compact ? 11 : 13, fontWeight: 800,
            cursor: 'default', whiteSpace: 'nowrap',
            flex: vertical ? 1 : undefined,
          }}>
          <span style={{ fontSize: compact ? 14 : 18 }}>{c.icon}</span>
          <span>{c.val} {c.label}</span>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PHONE PORTRAIT (390×844)
// ════════════════════════════════════════════════════════════════════
function GamesPhoneP({ tweaks, onAction, insets = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-shell-kid)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif',
      color: '#1e293b', paddingTop: insets.top ?? 0,
    }}>
      <div className="kh-scroll" style={{
        flex: 1, padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* Header */}
        <div>
          <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.02 }}>
            Trò chơi 🎮
          </div>
          <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginTop: 2 }}>
            Học mà chơi · chơi mà học!
          </div>
        </div>

        {/* Stats chips */}
        <StatsBar compact onAction={onAction} />

        {/* Game sections */}
        {GAME_SECTIONS.map((sec) => (
          <GameSectionCard key={sec.id} sec={sec} compact
            onClick={() => onAction(`Mở ${sec.label}…`)} />
        ))}

        {/* Coming soon */}
        <div>
          <div style={{
            fontSize: 13, fontWeight: 900, color: '#94a3b8',
            letterSpacing: 0.08, textTransform: 'uppercase',
            marginBottom: 8,
          }}>Sắp ra mắt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {COMING_SOON.map((g) => (
              <ComingSoonCard key={g.id} game={g} compact />
            ))}
          </div>
        </div>
      </div>

      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PHONE LANDSCAPE (844×390)
// ════════════════════════════════════════════════════════════════════
function GamesPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <NarrowRail onAction={onAction} />
      <main style={{
        flex: 1, padding: 10, display: 'flex', flexDirection: 'column',
        gap: 8, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Trò chơi 🎮</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>Học mà chơi</div>
          </div>
          <StatsBar compact onAction={onAction} />
        </div>

        {/* 2-col: Math + English */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          flex: 1, minHeight: 0,
        }}>
          {GAME_SECTIONS.map((sec) => (
            <GameSectionCard key={sec.id} sec={sec} compact
              onClick={() => onAction(`Mở ${sec.label}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TABLET PORTRAIT (820×1180)
// ════════════════════════════════════════════════════════════════════
function GamesTabletP({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: 24, display: 'flex', flexDirection: 'column',
        gap: 20, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Trò chơi 🎮</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Học mà chơi · chơi mà học!
            </p>
          </div>
          <StatsBar compact onAction={onAction} />
        </div>

        {/* Game sections stacked full-width */}
        {GAME_SECTIONS.map((sec) => (
          <GameSectionCard key={sec.id} sec={sec}
            onClick={() => onAction(`Mở ${sec.label}…`)} />
        ))}

        {/* Coming soon */}
        <div>
          <div className="kh-eyebrow" style={{ marginBottom: 10 }}>Sắp ra mắt</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {COMING_SOON.map((g) => (
              <ComingSoonCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// TABLET LANDSCAPE (1280×800)
// ════════════════════════════════════════════════════════════════════
function GamesTabletL({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: '22px 28px', display: 'flex', flexDirection: 'column',
        gap: 18, overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 34 }}>Trò chơi 🎮</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Chọn một chủ đề để bắt đầu
            </p>
          </div>
          <StatsBar onAction={onAction} />
        </div>

        {/* 2-col game sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          {GAME_SECTIONS.map((sec) => (
            <GameSectionCard key={sec.id} sec={sec}
              onClick={() => onAction(`Mở ${sec.label}…`)} />
          ))}
        </div>

        {/* Coming soon row */}
        <div>
          <div className="kh-eyebrow" style={{ marginBottom: 10 }}>Sắp ra mắt</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {COMING_SOON.map((g) => (
              <ComingSoonCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DESKTOP (1440×900)
// ════════════════════════════════════════════════════════════════════
function GamesDesktop({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, padding: '28px 36px', display: 'flex', flexDirection: 'column',
        gap: 22, overflow: 'hidden',
        maxWidth: 1280, margin: '0 auto', width: '100%',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 36 }}>Trò chơi 🎮</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 15, fontWeight: 700 }}>
              Học mà chơi · chơi mà học · Tổng {11}/18 ⭐ đã đạt
            </p>
          </div>
          <StatsBar onAction={onAction} />
        </div>

        {/* 2-col game sections */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
          {GAME_SECTIONS.map((sec) => (
            <GameSectionCard key={sec.id} sec={sec}
              onClick={() => onAction(`Mở ${sec.label}…`)} />
          ))}
        </div>

        {/* Coming soon */}
        <div>
          <div className="kh-eyebrow" style={{ marginBottom: 12 }}>Sắp ra mắt</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {COMING_SOON.map((g) => (
              <ComingSoonCard key={g.id} game={g} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

Object.assign(window, {
  GamesPhoneP, GamesPhoneL, GamesTabletP, GamesTabletL, GamesDesktop,
});
