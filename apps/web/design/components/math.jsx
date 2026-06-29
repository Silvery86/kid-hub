/* math.jsx — /math hub + 3 mini-games in 5 viewport variants.

   Phases are driven by the `phase` tweak (hub / playing / result) so a
   single set of artboards covers every state.

   Hub is on light shell (bg-shell-kid); active games use the dark
   shell (slate-900) to match the games route group. */

// ── Shape SVGs (mirrors components/games/ShapeDisplay.tsx) ─────────────
const SHAPE_LABELS = {
  circle:    'Hình tròn',
  square:    'Hình vuông',
  triangle:  'Hình tam giác',
  rectangle: 'Hình chữ nhật',
  star:      'Hình ngôi sao',
  heart:     'Hình trái tim',
};

function ShapeSVG({ shape, size = 80, color = '#fff', filled = true }) {
  const fill = filled ? color : 'none';
  const stroke = color;
  const sw = 6;
  if (shape === 'circle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="44" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'square') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <rect x="8" y="8" width="84" height="84" rx="6" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'triangle') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon points="50,8 95,92 5,92" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round" />
      </svg>
    );
  }
  if (shape === 'rectangle') {
    return (
      <svg width={size} height={size * 0.6} viewBox="0 0 100 60">
        <rect x="5" y="5" width="90" height="50" rx="4" fill={fill} stroke={stroke} strokeWidth={sw} />
      </svg>
    );
  }
  if (shape === 'star') {
    return (
      <svg width={size} height={size} viewBox="0 0 100 100">
        <polygon
          points="50,5 61,35 95,35 68,57 79,91 50,70 21,91 32,57 5,35 39,35"
          fill={fill} stroke={stroke} strokeWidth={4} strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (shape === 'heart') {
    return (
      <svg width={size} height={size * 0.9} viewBox="0 0 100 90">
        <path
          d="M50,82 C50,82 8,52 8,28 C8,15 18,5 30,5 C38,5 45,10 50,17 C55,10 62,5 70,5 C82,5 92,15 92,28 C92,52 50,82 50,82 Z"
          fill={fill} stroke={stroke} strokeWidth={5} strokeLinejoin="round"
        />
      </svg>
    );
  }
  return null;
}

// ── Mock per-game session data (driven by tweak phase) ─────────────────
function getMockSession({ minigame, phase, qIdx = 5, correct = 4, total = 10 }) {
  // returns { qIdx, correct, total, seconds, question, choices, correctIdx }
  if (minigame === 'counting') {
    return {
      qIdx, correct, total, seconds: 11,
      prompt: 'Có bao nhiêu cái?',
      emoji: '🐝',
      count: 6,
      choices: [5, 6, 7],
      correctIdx: 1,
      stars: 3, pointsEarned: 90, bestStars: 2, scoreCorrect: 9,
    };
  }
  if (minigame === 'addition') {
    return {
      qIdx, correct, total, seconds: 8,
      prompt: '',  // not used
      operandA: 7, operandB: 3, operator: '+',
      choices: [9, 10],
      correctIdx: 1,
      stars: 2, pointsEarned: 60, bestStars: 3, scoreCorrect: 7,
    };
  }
  // shapes
  return {
    qIdx, correct, total, seconds: 9,
    mode: 'name-to-shape',
    prompt: 'Hình nào là...?',
    targetShape: 'triangle',
    choices: ['circle', 'triangle', 'square'],
    correctIdx: 1,
    stars: 1, pointsEarned: 30, bestStars: 1, scoreCorrect: 4,
  };
}

// ── Game HUD (top bar) — adaptive size ─────────────────────────────────
function MathHud({ session, onExit, size = 'lg' }) {
  const radius = size === 'sm' ? 14 : 18;
  const ringSize = size === 'sm' ? 38 : 48;
  const isUrgent = session.seconds <= 3;
  const progress = session.qIdx / session.total;
  const timeProgress = session.seconds / 12;
  const circ = 2 * Math.PI * radius;
  const dash = circ * timeProgress;

  const pad = size === 'sm' ? '8px 12px' : '12px 20px';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(15, 23, 42, 0.85)',
      backdropFilter: 'blur(8px)',
      padding: pad, color: '#fff',
    }}>
      <button
        onClick={onExit}
        aria-label="Thoát"
        style={{
          width: size === 'sm' ? 36 : 48,
          height: size === 'sm' ? 36 : 48,
          flexShrink: 0,
          borderRadius: 12, border: 0,
          background: '#334155', color: '#cbd5e1',
          fontSize: size === 'sm' ? 14 : 18,
          fontWeight: 900, cursor: 'pointer',
          fontFamily: 'inherit',
        }}>✕</button>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: size === 'sm' ? 10 : 12,
          fontWeight: 800, color: '#94a3b8', marginBottom: 4,
        }}>
          <span>Câu {session.qIdx + 1} / {session.total}</span>
          <span style={{ color: '#34d399' }}>{session.correct} đúng</span>
        </div>
        <div style={{
          height: size === 'sm' ? 6 : 8,
          background: '#334155', borderRadius: 999, overflow: 'hidden',
        }}>
          <div style={{
            width: `${progress * 100}%`, height: '100%',
            background: '#60a5fa', borderRadius: 999,
            transition: 'width 0.3s',
          }} />
        </div>
      </div>
      <div style={{ flexShrink: 0, position: 'relative' }}>
        <svg width={ringSize} height={ringSize} viewBox="0 0 48 48">
          <circle cx="24" cy="24" r={radius} fill="none" stroke="#334155" strokeWidth="4" />
          <circle
            cx="24" cy="24" r={radius} fill="none"
            stroke={isUrgent ? '#f87171' : '#60a5fa'}
            strokeWidth="4" strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            transform="rotate(-90 24 24)"
          />
          <text x="24" y="29" textAnchor="middle"
                fontSize="13" fontWeight="900"
                fill={isUrgent ? '#f87171' : '#e2e8f0'}>
            {session.seconds}
          </text>
        </svg>
      </div>
    </div>
  );
}

// ── Big answer button (used by all 3 games) ─────────────────────────────
function AnswerButton({ children, onClick, status = 'idle', size = 'md', label }) {
  const sizes = {
    sm: { minW: 70,  minH: 70,  fs: 28, pad: '12px 14px' },
    md: { minW: 110, minH: 110, fs: 44, pad: '18px 22px' },
    lg: { minW: 160, minH: 130, fs: 56, pad: '20px 28px' },
    xl: { minW: 180, minH: 150, fs: 64, pad: '24px 32px' },
  };
  const sz = sizes[size] || sizes.md;
  const base = {
    minWidth: sz.minW, minHeight: sz.minH, padding: sz.pad,
    border: '4px solid #334155', borderRadius: 22,
    background: '#334155', color: '#fff',
    fontSize: sz.fs, fontWeight: 900,
    cursor: 'pointer', fontFamily: 'inherit',
    transition: 'transform 0.1s, background 0.2s, border-color 0.2s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 8,
  };
  if (status === 'correct') {
    base.background = '#10b981'; base.borderColor = '#047857';
  } else if (status === 'wrong') {
    base.background = '#ef4444'; base.borderColor = '#b91c1c';
  }
  return (
    <button onClick={onClick} aria-label={label} className="kh-press" style={base}>
      {children}
    </button>
  );
}

// ── Result screen ─────────────────────────────────────────────────────
function MathResult({ session, gameTitle, color, onReplay, onExit, size = 'lg' }) {
  const emojiByStars = { 1: '😊', 2: '🎉', 3: '🏆' };
  const msgByStars = {
    1: 'Cố lên! Lần sau sẽ tốt hơn.',
    2: 'Làm tốt lắm! Tiếp tục nhé!',
    3: 'Xuất sắc! Khôi thật giỏi!',
  };
  const isNewBest = session.stars > session.bestStars;
  const sz = {
    xs: { hero: 80,  star: 36, msg: 18, num: 28, gap: 12 },
    sm: { hero: 110, star: 44, msg: 22, num: 36, gap: 16 },
    md: { hero: 150, star: 56, msg: 26, num: 44, gap: 20 },
    lg: { hero: 180, star: 64, msg: 30, num: 50, gap: 24 },
  }[size] || { hero: 150, star: 56, msg: 26, num: 44, gap: 20 };

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: sz.gap, padding: 16, textAlign: 'center',
      color: '#fff', minHeight: 0,
    }}>
      <div style={{ fontSize: sz.hero, lineHeight: 1 }} aria-hidden="true">
        {emojiByStars[session.stars]}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3].map((i) => (
          <span key={i} style={{
            fontSize: sz.star, lineHeight: 1,
            color: i <= session.stars ? '#fbbf24' : '#475569',
          }}>★</span>
        ))}
      </div>
      <div style={{
        fontSize: sz.msg, fontWeight: 900, letterSpacing: -0.01,
        maxWidth: 480,
      }}>{msgByStars[session.stars]}</div>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{
          background: '#334155', padding: '12px 18px', borderRadius: 16,
          minWidth: 120,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#94a3b8',
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>Đúng</div>
          <div style={{ fontSize: sz.num, fontWeight: 900, lineHeight: 1.1 }}>
            {session.scoreCorrect}
            <span style={{ color: '#94a3b8', fontSize: sz.num * 0.55 }}> / {session.total}</span>
          </div>
        </div>
        <div style={{
          background: '#334155', padding: '12px 18px', borderRadius: 16,
          minWidth: 120,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 800, color: '#94a3b8',
            letterSpacing: 0.16, textTransform: 'uppercase',
          }}>Điểm</div>
          <div style={{ fontSize: sz.num, fontWeight: 900, color: '#fbbf24', lineHeight: 1.1 }}>
            +{session.pointsEarned}
          </div>
        </div>
        {isNewBest && (
          <div style={{
            background: '#f59e0b', padding: '12px 18px', borderRadius: 16, minWidth: 120,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 800, color: '#78350f',
              letterSpacing: 0.16, textTransform: 'uppercase',
            }}>Kỷ lục</div>
            <div style={{ fontSize: sz.num, fontWeight: 900, color: '#78350f', lineHeight: 1.1 }}>
              Mới! 🌟
            </div>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginTop: 4 }}>
        <button onClick={onExit} className="kh-press" style={{
          padding: '12px 20px', borderRadius: 999, border: '3px solid #475569',
          background: 'transparent', color: '#cbd5e1', fontFamily: 'inherit',
          fontSize: 14, fontWeight: 800, cursor: 'pointer',
        }}>Về trang chủ</button>
        <button onClick={onReplay} className="kh-press" style={{
          padding: '12px 22px', borderRadius: 999, border: 0,
          background: color, color: '#fff', fontFamily: 'inherit',
          fontSize: 15, fontWeight: 900, cursor: 'pointer',
          boxShadow: `0 8px 18px -8px ${color}`,
        }}>Chơi lại 🔄</button>
      </div>
    </div>
  );
}

// ── Game shell: dark background + HUD + content slot ──────────────────
function GameShell({ children, session, onExit, hudSize = 'lg' }) {
  return (
    <div style={{
      width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
      background: '#0f172a', color: '#fff', overflow: 'hidden',
      fontFamily: 'Nunito, system-ui, sans-serif',
    }}>
      <MathHud session={session} onExit={onExit} size={hudSize} />
      {children}
    </div>
  );
}

// ── Game content: Counting / Number Ninja / Shape Quest ────────────────
function GameContent({ game, session, size = 'md', layout = 'stack' }) {
  // size: 'sm' | 'md' | 'lg' | 'xl' — controls visual scale
  // layout: 'stack' (vertical, default) | 'split' (left prompt + right answers, for landscape)

  const promptScale = { sm: 0.6, md: 1, lg: 1.2, xl: 1.4 }[size] || 1;
  const answerSize = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' }[size] || 'md';

  let promptNode = null;
  let answerNodes = null;

  if (game === 'counting') {
    // Render `count` emoji in a wrap-grid
    const grid = [];
    for (let i = 0; i < session.count; i++) {
      grid.push(
        <span key={i} style={{
          fontSize: 56 * promptScale,
          lineHeight: 1,
        }} aria-hidden="true">{session.emoji}</span>
      );
    }
    promptNode = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{
          fontSize: 22 * promptScale, fontWeight: 900, color: '#fff',
        }}>{session.prompt}</div>
        <div style={{
          padding: 24 * promptScale, borderRadius: 28, background: '#1e293b',
          boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
          display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
          gap: 12 * promptScale, maxWidth: 380 * promptScale,
        }}>{grid}</div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => (
      <AnswerButton key={i} size={answerSize}
        status={i === session.correctIdx ? 'idle' : 'idle'}
        label={String(c)}>{c}</AnswerButton>
    ));
  }

  if (game === 'addition') {
    promptNode = (
      <div style={{
        padding: `${28 * promptScale}px ${48 * promptScale}px`,
        borderRadius: 28, background: '#1e293b',
        boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          fontSize: 92 * promptScale, fontWeight: 900, color: '#fff',
          letterSpacing: -0.03, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
        }}>
          {session.operandA} {session.operator} {session.operandB} = ?
        </div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => (
      <AnswerButton key={i} size={answerSize} label={String(c)}>{c}</AnswerButton>
    ));
  }

  if (game === 'shapes') {
    const isNameToShape = session.mode === 'name-to-shape';
    promptNode = (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div style={{
          fontSize: 18 * promptScale, fontWeight: 900, color: '#94a3b8',
        }}>{session.prompt}</div>
        <div style={{
          padding: 24 * promptScale, borderRadius: 28, background: '#1e293b',
          boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
          minWidth: 130 * promptScale, display: 'grid', placeItems: 'center',
        }}>
          {isNameToShape ? (
            <div style={{
              fontSize: 60 * promptScale, fontWeight: 900, color: '#fff',
              letterSpacing: -0.02,
            }}>{SHAPE_LABELS[session.targetShape]}</div>
          ) : (
            <ShapeSVG shape={session.targetShape} size={120 * promptScale} color="#fff" />
          )}
        </div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => (
      <AnswerButton key={i} size={answerSize}
        label={isNameToShape ? SHAPE_LABELS[c] : SHAPE_LABELS[c]}>
        {isNameToShape ? (
          <ShapeSVG shape={c} size={{ sm: 36, md: 64, lg: 90, xl: 100 }[answerSize]} color="#fff" />
        ) : (
          <span style={{
            fontSize: { sm: 14, md: 22, lg: 28, xl: 32 }[answerSize],
            fontWeight: 900,
          }}>{SHAPE_LABELS[c]}</span>
        )}
      </AnswerButton>
    ));
  }

  if (layout === 'split') {
    return (
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr',
        gap: 18, padding: 16, minHeight: 0, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{promptNode}</div>
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center',
        }}>{answerNodes}</div>
      </div>
    );
  }
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 28 * promptScale, padding: 18, minHeight: 0,
    }}>
      {promptNode}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14,
        justifyContent: 'center', maxWidth: '100%',
      }}>{answerNodes}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MATH HUB (/math) — 5 viewports
// ════════════════════════════════════════════════════════════════════

const MATH_GAMES = [
  { id: 'counting', emoji: '🌟', title: 'Đếm Sao',         desc: 'Đếm số đồ vật (1–10)',     bestStars: 2 },
  { id: 'addition', emoji: '🔢', title: 'Number Ninja',    desc: 'Cộng & trừ trong 10',      bestStars: 3 },
  { id: 'shapes',   emoji: '🔷', title: 'Khám Phá Hình',   desc: 'Nhận biết hình học',       bestStars: 1 },
];

function HomeworkBanner({ onAction }) {
  return (
    <div
      role="alert"
      onClick={() => onAction('Hôm nay có bài tập Toán!')}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fbbf24', borderRadius: 20, padding: '14px 18px',
        boxShadow: '0 6px 16px -8px rgba(251, 191, 36, 0.7)',
        cursor: 'pointer',
      }}>
      <span style={{ fontSize: 32 }} aria-hidden="true">🏠</span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#78350f' }}>
          Hôm nay có bài tập Toán!
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
          Hoàn thành 1 trò chơi để nộp bài.
        </div>
      </div>
    </div>
  );
}

function MathGameCard({ game, onClick, size = 'md', orient = 'vertical' }) {
  const sz = {
    sm: { pad: 14, emoji: 36, title: 17, desc: 12, star: 18 },
    md: { pad: 18, emoji: 48, title: 22, desc: 13, star: 22 },
    lg: { pad: 22, emoji: 64, title: 26, desc: 14, star: 26 },
  }[size] || { pad: 18, emoji: 48, title: 22, desc: 13, star: 22 };

  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        display: 'flex',
        flexDirection: orient === 'horizontal' ? 'row' : 'column',
        gap: 10,
        background: '#3b82f6', color: '#fff',
        borderRadius: 24, padding: sz.pad,
        border: 0, fontFamily: 'inherit', textAlign: 'left',
        cursor: 'pointer',
        boxShadow: '0 16px 32px -16px #3b82f6',
        position: 'relative', overflow: 'hidden',
        alignItems: orient === 'horizontal' ? 'center' : 'flex-start',
        minHeight: orient === 'horizontal' ? 80 : 'auto',
      }}>
      <div style={{
        fontSize: sz.emoji, lineHeight: 1,
        flexShrink: 0,
      }} aria-hidden="true">{game.emoji}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: sz.title, fontWeight: 900, letterSpacing: -0.01,
          lineHeight: 1.1,
        }}>{game.title}</div>
        <div style={{
          fontSize: sz.desc, fontWeight: 700, opacity: 0.85,
          marginTop: 4,
        }}>{game.desc}</div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4, marginTop: 8,
        }}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{
              fontSize: sz.star, lineHeight: 1,
              color: i <= game.bestStars ? '#fbbf24' : 'rgba(255,255,255,0.3)',
            }}>★</span>
          ))}
          <span style={{
            fontSize: 11, fontWeight: 800, opacity: 0.7, marginLeft: 6,
          }}>Kỷ lục</span>
        </div>
      </div>
      <div style={{
        position: 'absolute', right: -16, top: -16,
        width: 90, height: 90, borderRadius: 999,
        background: 'rgba(255,255,255,0.12)', pointerEvents: 'none',
      }} />
    </button>
  );
}

// PHONE PORTRAIT — vertical scroll, single column
function MathHubPhoneP({ tweaks, onAction, insets = {} }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'var(--color-shell-kid)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Nunito, system-ui, sans-serif',
      color: '#1e293b', paddingTop: insets.top ?? 0,
    }}>
      <div className="kh-scroll" style={{
        flex: 1, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => onAction('Về trang chủ')}
            style={{
              border: 0, background: '#fff', padding: '8px 12px', borderRadius: 999,
              fontSize: 12, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
              color: '#475569',
            }}>← Trang chủ</button>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Toán 🧮</div>
          <div style={{ width: 90 }} />
        </div>

        {tweaks.showHomework && <HomeworkBanner onAction={onAction} />}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {MATH_GAMES.map((g) => (
            <MathGameCard key={g.id} game={g}
              onClick={() => onAction(`Mở ${g.title}…`)}
              size="md" orient="horizontal" />
          ))}
        </div>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// PHONE LANDSCAPE — narrow rail + 3 fitted cards
function MathHubPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <NarrowRail onAction={onAction} />
      <main style={{
        flex: 1, padding: 10, display: 'flex', flexDirection: 'column',
        gap: 8, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Toán Học 🧮</div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700 }}>
              Chọn một trò chơi
            </div>
          </div>
          {tweaks.showHomework && <Pill tone="amber">🏠 Có bài tập</Pill>}
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
          gap: 8, flex: 1, minHeight: 0, alignItems: 'center',
        }}>
          {MATH_GAMES.map((g, i) => (
            <MathGameCardBig key={g.id} game={g} idx={i} compact
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// TABLET PORTRAIT — sidebar + stacked cards
function MathHubTabletP({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: 24, display: 'flex', flexDirection: 'column',
        gap: 18, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Toán Học 🧮</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              3 trò chơi nhỏ · Cộng/trừ, Đếm, Hình học
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <HomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 14,
          flex: 1, minHeight: 0, alignContent: 'start',
        }}>
          {MATH_GAMES.map((g) => (
            <MathGameCard key={g.id} game={g}
              onClick={() => onAction(`Mở ${g.title}…`)}
              size="lg" orient="horizontal" />
          ))}
        </div>
      </main>
    </div>
  );
}

// TABLET LANDSCAPE — sidebar + 3 fitted game cards, centered
function MathHubTabletL({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column',
        gap: 18, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 30 }}>Toán Học 🧮</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Chọn một trò chơi để bắt đầu
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <HomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18,
          flex: 1, minHeight: 0, alignItems: 'center',
          maxWidth: 1000, width: '100%', margin: '0 auto',
        }}>
          {MATH_GAMES.map((g, i) => (
            <MathGameCardBig key={g.id} game={g} idx={i}
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// Big vertical hub card — used by phone-L (compact), tablet-L, desktop
function MathGameCardBig({ game, onClick, idx = 0, compact = false }) {
  const sz = compact ? {
    radius: 16, pad: 12, watermark: 90, wmOffset: 8, rotMax: 10,
    emoji: 26, tagFs: 9, tagPad: '3px 7px',
    title: 13, desc: 10, star: 13, cta: 10, ctaPad: '4px 8px',
    gap: 4, aspect: '3 / 2',
  } : {
    radius: 24, pad: 20, watermark: 170, wmOffset: 12, rotMax: 8,
    emoji: 42, tagFs: 11, tagPad: '4px 10px',
    title: 22, desc: 12, star: 20, cta: 12, ctaPad: '7px 14px',
    gap: 8, aspect: '4 / 3',
  };
  const rot = [-sz.rotMax, sz.rotMax * 0.7, -sz.rotMax * 0.5][idx % 3];

  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', gap: sz.gap,
        background: 'linear-gradient(160deg, #60a5fa 0%, #3b82f6 55%, #2563eb 100%)',
        color: '#fff',
        borderRadius: sz.radius, padding: sz.pad,
        border: 0, fontFamily: 'inherit', textAlign: 'left',
        cursor: 'pointer', width: '100%',
        aspectRatio: sz.aspect,
        boxShadow: '0 18px 36px -16px rgba(37, 99, 235, 0.45)',
      }}>
      {/* watermark emoji backdrop */}
      <div style={{
        position: 'absolute',
        right: -sz.wmOffset, top: -sz.wmOffset,
        fontSize: sz.watermark, lineHeight: 1, opacity: 0.18,
        transform: `rotate(${rot}deg)`, pointerEvents: 'none',
      }} aria-hidden="true">{game.emoji}</div>

      {/* top row: tag pill + foreground emoji */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 8, position: 'relative', zIndex: 1,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.22)',
          padding: sz.tagPad, borderRadius: 999,
          fontSize: sz.tagFs, fontWeight: 800,
          letterSpacing: 0.04, whiteSpace: 'nowrap',
        }}>Trò chơi {idx + 1}</div>
        <div style={{
          fontSize: sz.emoji, lineHeight: 1, flexShrink: 0,
        }} aria-hidden="true">{game.emoji}</div>
      </div>

      {/* text — grows to fill */}
      <div style={{
        marginTop: 'auto', position: 'relative', zIndex: 1,
      }}>
        <div style={{
          fontSize: sz.title, fontWeight: 900,
          letterSpacing: -0.01, lineHeight: 1.1,
        }}>{game.title}</div>
        {!compact && (
          <div style={{
            fontSize: sz.desc, fontWeight: 700, opacity: 0.85, marginTop: 3,
          }}>{game.desc}</div>
        )}
      </div>

      {/* footer: stars + Chơi CTA */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 8, position: 'relative', zIndex: 1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{
              fontSize: sz.star, lineHeight: 1,
              color: i <= game.bestStars ? '#fbbf24' : 'rgba(255,255,255,0.3)',
            }}>★</span>
          ))}
        </div>
        <div style={{
          background: '#fff', color: '#1d4ed8',
          padding: sz.ctaPad, borderRadius: 999,
          fontSize: sz.cta, fontWeight: 900,
          display: 'flex', alignItems: 'center', gap: 4,
          whiteSpace: 'nowrap',
        }}>
          Chơi <span style={{ fontSize: sz.cta + 2 }}>→</span>
        </div>
      </div>
    </button>
  );
}

// DESKTOP — wide sidebar + 3 fitted big cards, centered
function MathHubDesktop({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column',
        gap: 22, overflow: 'hidden', maxWidth: 1280, margin: '0 auto', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Toán Học 🧮</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Chọn một trò chơi nhỏ để bắt đầu · Tổng kỷ lục 6/9 ⭐
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <HomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22,
          flex: 1, minHeight: 0, alignItems: 'center',
          maxWidth: 1100, width: '100%', margin: '0 auto',
        }}>
          {MATH_GAMES.map((g, i) => (
            <MathGameCardBig key={g.id} game={g} idx={i}
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LEVEL-SELECT SCREEN (shared by math + english games)
// Mirrors the {idle} state of each game's level picker. Dark variant
// matches Math (which mounts inside the dark games layout); light
// variant matches the English games' explicit bg-shell-kid.
// ════════════════════════════════════════════════════════════════════

const MATH_LEVELS = {
  counting: {
    emoji: '🌟', title: 'Đếm Sao', desc: 'Đếm số đồ vật trên màn hình!',
    levels: [
      { id: 1, text: 'Dễ (1–5)' },
      { id: 2, text: 'Vừa (1–10)' },
      { id: 3, text: 'Khó (hỗn hợp)' },
    ],
  },
  addition: {
    emoji: '🔢', title: 'Number Ninja', desc: 'Cộng & trừ thật nhanh!',
    levels: [
      { id: 1, text: 'Cấp 1 (1–10)' },
      { id: 2, text: 'Cấp 2 (1–20)' },
      { id: 3, text: 'Cấp 3 (1–50)' },
    ],
  },
  shapes: {
    emoji: '🔷', title: 'Khám Phá Hình', desc: 'Nhận biết các hình học!',
    levels: [
      { id: 1, text: 'Dễ (4 hình)' },
      { id: 2, text: 'Vừa (6 hình)' },
      { id: 3, text: 'Khó (2 chế độ)' },
    ],
  },
};

// Pill-shaped level button matching the app's KidButton primary variant.
function LevelPill({ text, accent, size = 'md', onClick }) {
  const sz = {
    sm: { fs: 15, pad: '12px 22px', minH: 48, border: 3 },
    md: { fs: 18, pad: '14px 28px', minH: 56, border: 4 },
    lg: { fs: 20, pad: '16px 34px', minH: 64, border: 4 },
  }[size] || { fs: 18, pad: '14px 28px', minH: 56, border: 4 };
  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        background: accent, color: '#fff',
        border: `${sz.border}px solid color-mix(in oklab, ${accent} 60%, black)`,
        borderRadius: 999,
        padding: sz.pad, minHeight: sz.minH,
        fontSize: sz.fs, fontWeight: 800,
        letterSpacing: -0.01, cursor: 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
        boxShadow: `0 10px 22px -10px ${accent}`,
      }}>{text}</button>
  );
}

function QuayLaiButton({ onClick, isDark, size = 'md' }) {
  const sz = {
    sm: { fs: 13, pad: '10px 20px', minH: 40, border: 3 },
    md: { fs: 15, pad: '12px 26px', minH: 48, border: 4 },
    lg: { fs: 16, pad: '14px 30px', minH: 52, border: 4 },
  }[size] || { fs: 15, pad: '12px 26px', minH: 48, border: 4 };
  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        background: '#fff', color: '#475569',
        border: `${sz.border}px solid #e2e8f0`,
        borderRadius: 999,
        padding: sz.pad, minHeight: sz.minH,
        fontSize: sz.fs, fontWeight: 800,
        cursor: 'pointer', fontFamily: 'inherit',
      }}>Quay lại</button>
  );
}

function LevelSelect({ meta, accent, isDark, size = 'md', onPick, onExit }) {
  const sz = {
    sm: { emoji: 80,  title: 32, desc: 14, gap: 16, btnGap: 10, btnSize: 'sm' },
    md: { emoji: 110, title: 44, desc: 17, gap: 26, btnGap: 14, btnSize: 'md' },
    lg: { emoji: 130, title: 54, desc: 19, gap: 32, btnGap: 16, btnSize: 'lg' },
  }[size] || { emoji: 110, title: 44, desc: 17, gap: 26, btnGap: 14, btnSize: 'md' };

  const bg = isDark ? '#0f172a' : 'var(--color-shell-kid)';
  const titleColor = isDark ? '#fff' : '#1e293b';
  const subColor = isDark ? '#94a3b8' : '#64748b';
  const stackButtons = size === 'sm';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg, color: titleColor,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'Nunito, system-ui, sans-serif',
      gap: sz.gap, padding: '20px 16px', textAlign: 'center',
      overflow: 'hidden',
    }}>
      <div style={{ fontSize: sz.emoji, lineHeight: 1 }} aria-hidden="true">{meta.emoji}</div>
      <div>
        <div style={{
          fontSize: sz.title, fontWeight: 900,
          letterSpacing: -0.02, lineHeight: 1.05,
        }}>{meta.title}</div>
        <div style={{
          fontSize: sz.desc, fontWeight: 700, color: subColor, marginTop: 10,
        }}>{meta.desc}</div>
      </div>
      <div style={{
        display: 'flex', gap: sz.btnGap, justifyContent: 'center',
        flexWrap: 'wrap',
        flexDirection: stackButtons ? 'column' : 'row',
        width: stackButtons ? '100%' : 'auto',
        maxWidth: stackButtons ? 320 : '100%',
        alignItems: 'center',
      }}>
        {meta.levels.map((level) => (
          <LevelPill key={level.id} text={level.text} accent={accent}
            size={sz.btnSize} onClick={() => onPick && onPick(level)} />
        ))}
      </div>
      {onExit && (
        <QuayLaiButton onClick={onExit} isDark={isDark} size={sz.btnSize} />
      )}
    </div>
  );
}

function LevelSelectSplit({ meta, accent, isDark, onPick, onExit }) {
  const bg = isDark ? '#0f172a' : 'var(--color-shell-kid)';
  const titleColor = isDark ? '#fff' : '#1e293b';
  const subColor = isDark ? '#94a3b8' : '#64748b';
  return (
    <div style={{
      width: '100%', height: '100%',
      background: bg, color: titleColor,
      display: 'grid', gridTemplateColumns: '1fr 1fr',
      gap: 18, padding: 18, alignItems: 'center',
      fontFamily: 'Nunito, system-ui, sans-serif',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 10, textAlign: 'center',
      }}>
        <div style={{ fontSize: 64, lineHeight: 1 }} aria-hidden="true">{meta.emoji}</div>
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: -0.01 }}>{meta.title}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: subColor }}>{meta.desc}</div>
        {onExit && <div style={{ marginTop: 4 }}><QuayLaiButton onClick={onExit} isDark={isDark} size="sm" /></div>}
      </div>
      <div style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        alignItems: 'stretch',
      }}>
        {meta.levels.map((level) => (
          <LevelPill key={level.id} text={level.text} accent={accent}
            size="sm" onClick={() => onPick && onPick(level)} />
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PER-GAME VARIANTS (counting / addition / shapes) — 5 viewports each
// ════════════════════════════════════════════════════════════════════
function makeGameVariants(gameId, gameTitle) {
  const onExit = (onAction) => () => onAction(`Thoát ${gameTitle}`);
  const onReplay = (onAction) => () => onAction(`Chơi lại ${gameTitle}`);
  const onPickLevel = (onAction) => (level) => onAction(`Bắt đầu: ${gameTitle} · ${level.text}`);
  const meta = MATH_LEVELS[gameId];
  const ACCENT = '#3b82f6';

  const PhoneP = ({ tweaks, onAction, insets = {} }) => {
    const session = getMockSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <div style={{ width: '100%', height: '100%', background: '#0f172a', paddingTop: insets.top ?? 0, paddingBottom: insets.bottom ?? 0, boxSizing: 'border-box' }}>
          <LevelSelect meta={meta} accent={ACCENT} isDark size="sm"
            onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
        </div>
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
          <MathResult session={session} gameTitle={gameTitle} color="#3b82f6"
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="sm" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
        <GameContent game={gameId} session={session} size="sm" layout="stack" />
      </GameShell>
    );
  };

  const PhoneL = ({ tweaks, onAction }) => {
    const session = getMockSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelectSplit meta={meta} accent={ACCENT} isDark
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
          <MathResult session={session} gameTitle={gameTitle} color="#3b82f6"
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="xs" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
        <GameContent game={gameId} session={session} size="sm" layout="split" />
      </GameShell>
    );
  };

  const TabletP = ({ tweaks, onAction }) => {
    const session = getMockSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark size="md"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color="#3b82f6"
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="md" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <GameContent game={gameId} session={session} size="md" layout="stack" />
      </GameShell>
    );
  };

  const TabletL = ({ tweaks, onAction }) => {
    const session = getMockSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark size="lg"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color="#3b82f6"
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="lg" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <GameContent game={gameId} session={session} size="lg" layout="stack" />
      </GameShell>
    );
  };

  const Desktop = ({ tweaks, onAction }) => {
    const session = getMockSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark size="lg"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color="#3b82f6"
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="lg" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <GameContent game={gameId} session={session} size="xl" layout="stack" />
      </GameShell>
    );
  };

  return { PhoneP, PhoneL, TabletP, TabletL, Desktop };
}

const COUNTING = makeGameVariants('counting', 'Đếm Sao');
const NINJA    = makeGameVariants('addition', 'Number Ninja');
const SHAPES   = makeGameVariants('shapes',   'Khám Phá Hình');

Object.assign(window, {
  // Shared game atoms (reused by english.jsx)
  GameShell, GameContent: GameContent, MathHud, MathResult, AnswerButton,
  HomeworkBanner, LevelSelect, LevelSelectSplit, LevelPill, QuayLaiButton,
  MathHubPhoneP, MathHubPhoneL, MathHubTabletP, MathHubTabletL, MathHubDesktop,
  CountingPhoneP: COUNTING.PhoneP, CountingPhoneL: COUNTING.PhoneL,
  CountingTabletP: COUNTING.TabletP, CountingTabletL: COUNTING.TabletL,
  CountingDesktop: COUNTING.Desktop,
  NinjaPhoneP: NINJA.PhoneP, NinjaPhoneL: NINJA.PhoneL,
  NinjaTabletP: NINJA.TabletP, NinjaTabletL: NINJA.TabletL,
  NinjaDesktop: NINJA.Desktop,
  ShapesPhoneP: SHAPES.PhoneP, ShapesPhoneL: SHAPES.PhoneL,
  ShapesTabletP: SHAPES.TabletP, ShapesTabletL: SHAPES.TabletL,
  ShapesDesktop: SHAPES.Desktop,
});
