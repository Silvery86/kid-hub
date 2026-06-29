/* english.jsx — /english hub + 3 mini-games × 5 viewport variants.
   Same architecture as math.jsx — reuses GameShell, MathHud, MathResult,
   AnswerButton, HomeworkBanner from math.jsx (exposed on window). */

const ENGLISH_GAMES = [
  { id: 'alphabet',   emoji: '🔤', title: 'Alphabet Explorer', desc: 'Nhận biết chữ hoa và chữ thường', bestStars: 3 },
  { id: 'vocabulary', emoji: '🦁', title: 'Word Safari',       desc: 'Ghép hình ảnh và từ vựng',         bestStars: 2 },
  { id: 'phonics',    emoji: '🔊', title: 'Sound Hunt',        desc: 'Tìm từ theo âm chữ cái',           bestStars: 1 },
];

// ── Level data ─────────────────────────────────────────────────────────
const ENGLISH_LEVELS = {
  alphabet: {
    emoji: '🔤', title: 'Alphabet Explorer', desc: 'Nhận biết chữ hoa và chữ thường!',
    levels: [
      { id: 1, text: 'A – M (Dễ)' },
      { id: 2, text: 'N – Z (Vừa)' },
      { id: 3, text: 'A – Z (Khó)' },
    ],
  },
  vocabulary: {
    emoji: '🦁', title: 'Word Safari', desc: 'Ghép hình ảnh và từ vựng tiếng Anh!',
    levels: [
      { id: 1, text: 'Động vật (Dễ)' },
      { id: 2, text: 'Động vật + Trái cây (Vừa)' },
      { id: 3, text: 'Tất cả từ vựng (Khó)' },
    ],
  },
  phonics: {
    emoji: '🔊', title: 'Sound Hunt', desc: 'Tìm từ bắt đầu bằng âm chữ cái!',
    levels: [
      { id: 1, text: 'Phụ âm rõ ràng (Dễ)' },
      { id: 2, text: 'Phụ âm khó (Vừa)' },
      { id: 3, text: 'Tất cả âm (Khó)' },
    ],
  },
};

// ── Mock session per game ───────────────────────────────────────────────
function getEnglishSession({ minigame, phase }) {
  if (minigame === 'alphabet') {
    return {
      qIdx: 5, correct: 4, total: 10, seconds: 11,
      mode: 'upper-to-lower',           // show uppercase, pick lowercase
      prompt: 'B',
      choices: ['b', 'd', 'p'],
      correctIdx: 0,
      stars: 3, pointsEarned: 90, bestStars: 2, scoreCorrect: 9,
    };
  }
  if (minigame === 'vocabulary') {
    return {
      qIdx: 5, correct: 4, total: 10, seconds: 8,
      mode: 'image-to-word',            // show emoji, pick word
      prompt: '🦁',
      choices: ['cat', 'lion', 'dog', 'bear'],
      correctIdx: 1,
      stars: 2, pointsEarned: 60, bestStars: 3, scoreCorrect: 7,
    };
  }
  // phonics
  return {
    qIdx: 4, correct: 3, total: 10, seconds: 9,
    targetLetter: 'C',
    phonemeHint: '/k/ — "c" trong từ "cat"',
    choices: ['🐱', '🐶', '🍎'],
    correctIdx: 0,
    stars: 1, pointsEarned: 30, bestStars: 1, scoreCorrect: 4,
  };
}

// ── English game content (3 game types) ─────────────────────────────────
function EnglishGameContent({ game, session, size = 'md', layout = 'stack' }) {
  const promptScale = { sm: 0.6, md: 1, lg: 1.2, xl: 1.4 }[size] || 1;
  const answerSize = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl' }[size] || 'md';

  let promptNode = null;
  let answerNodes = null;
  let instruction = null;

  if (game === 'alphabet') {
    instruction = session.mode === 'upper-to-lower'
      ? 'Chọn chữ thường tương ứng'
      : 'Chọn chữ HOA tương ứng';
    const promptBg = session.mode === 'upper-to-lower' ? '#1e293b' : '#10b981';
    promptNode = (
      <div style={{
        padding: `${32 * promptScale}px ${48 * promptScale}px`,
        borderRadius: 28, background: promptBg,
        boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{
          fontSize: 130 * promptScale, fontWeight: 900, color: '#fff',
          lineHeight: 1, letterSpacing: -0.04, fontFamily: 'Nunito, system-ui, sans-serif',
        }}>{session.prompt}</div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => (
      <AnswerButton key={i} size={answerSize} label={c}>
        <span style={{ fontWeight: 900, lineHeight: 1 }}>{c}</span>
      </AnswerButton>
    ));
  }

  if (game === 'vocabulary') {
    const isImageToWord = session.mode === 'image-to-word';
    instruction = isImageToWord ? 'Chọn từ đúng' : 'Chọn hình ảnh đúng';
    promptNode = isImageToWord ? (
      <div style={{
        padding: `${28 * promptScale}px`,
        borderRadius: 28, background: '#1e293b',
        boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
        display: 'grid', placeItems: 'center',
      }}>
        <div style={{
          fontSize: 120 * promptScale, lineHeight: 1,
        }} aria-hidden="true">{session.prompt}</div>
      </div>
    ) : (
      <div style={{
        padding: `${28 * promptScale}px ${44 * promptScale}px`,
        borderRadius: 28, background: '#1e293b',
        boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          fontSize: 68 * promptScale, fontWeight: 900, color: '#fff',
          lineHeight: 1.1, letterSpacing: -0.02,
        }}>{session.prompt}</div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => {
      // image-to-word → text buttons. word-to-image → emoji buttons.
      const isEmoji = !isImageToWord;
      return (
        <AnswerButton key={i} size={answerSize} label={c}>
          {isEmoji ? (
            <span style={{
              fontSize: { sm: 36, md: 56, lg: 80, xl: 92 }[answerSize],
              lineHeight: 1,
            }}>{c}</span>
          ) : (
            <span style={{
              fontSize: { sm: 16, md: 24, lg: 32, xl: 36 }[answerSize],
              fontWeight: 900, letterSpacing: -0.01,
            }}>{c}</span>
          )}
        </AnswerButton>
      );
    });
  }

  if (game === 'phonics') {
    instruction = 'Chọn hình bắt đầu bằng âm này';
    promptNode = (
      <div style={{
        padding: `${28 * promptScale}px ${44 * promptScale}px`,
        borderRadius: 28, background: '#10b981',
        boxShadow: '0 24px 48px -24px rgba(0,0,0,0.6)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 8 * promptScale,
      }}>
        <div style={{
          fontSize: 110 * promptScale, fontWeight: 900, color: '#fff',
          lineHeight: 1,
        }}>{session.targetLetter}</div>
        <div style={{
          fontSize: 16 * promptScale, fontWeight: 800,
          color: 'rgba(255,255,255,0.85)', textAlign: 'center',
          maxWidth: 320 * promptScale,
        }}>{session.phonemeHint}</div>
      </div>
    );
    answerNodes = session.choices.map((c, i) => (
      <AnswerButton key={i} size={answerSize} label={c}>
        <span style={{
          fontSize: { sm: 36, md: 56, lg: 80, xl: 92 }[answerSize],
          lineHeight: 1,
        }}>{c}</span>
      </AnswerButton>
    ));
  }

  const instructionNode = instruction && (
    <div style={{
      fontSize: 16 * promptScale, fontWeight: 900,
      color: '#94a3b8', letterSpacing: -0.01, textAlign: 'center',
    }}>{instruction}</div>
  );

  if (layout === 'split') {
    return (
      <div style={{
        flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 1fr',
        gap: 18, padding: 16, minHeight: 0, alignItems: 'center',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          {instructionNode}
          {promptNode}
        </div>
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
      gap: 22 * promptScale, padding: 18, minHeight: 0,
    }}>
      {instructionNode}
      {promptNode}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 14,
        justifyContent: 'center', maxWidth: '100%',
      }}>{answerNodes}</div>
    </div>
  );
}

// ── English hub card ────────────────────────────────────────────────────
function EnglishGameCardBig({ game, onClick, idx = 0, compact = false }) {
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
        background: 'linear-gradient(160deg, #34d399 0%, #10b981 55%, #047857 100%)',
        color: '#fff',
        borderRadius: sz.radius, padding: sz.pad,
        border: 0, fontFamily: 'inherit', textAlign: 'left',
        cursor: 'pointer', width: '100%',
        aspectRatio: sz.aspect,
        boxShadow: '0 18px 36px -16px rgba(16, 185, 129, 0.45)',
      }}>
      <div style={{
        position: 'absolute',
        right: -sz.wmOffset, top: -sz.wmOffset,
        fontSize: sz.watermark, lineHeight: 1, opacity: 0.18,
        transform: `rotate(${rot}deg)`, pointerEvents: 'none',
      }} aria-hidden="true">{game.emoji}</div>

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

      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
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
          background: '#fff', color: '#047857',
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

// Horizontal compact card for phone-P + tablet-P
function EnglishGameCardRow({ game, onClick, size = 'md' }) {
  const sz = {
    md: { pad: 14, emoji: 44, title: 18, desc: 12, star: 18, cta: 11, ctaPad: '6px 12px' },
    lg: { pad: 18, emoji: 56, title: 24, desc: 14, star: 22, cta: 13, ctaPad: '8px 14px' },
  }[size] || { pad: 14, emoji: 44, title: 18, desc: 12, star: 18, cta: 11, ctaPad: '6px 12px' };
  return (
    <button
      onClick={onClick}
      className="kh-press"
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        background: 'linear-gradient(110deg, #34d399 0%, #10b981 55%, #047857 100%)',
        color: '#fff', borderRadius: 22, padding: sz.pad,
        border: 0, fontFamily: 'inherit', textAlign: 'left',
        cursor: 'pointer', width: '100%',
        position: 'relative', overflow: 'hidden',
        boxShadow: '0 14px 28px -14px rgba(16, 185, 129, 0.5)',
      }}>
      <div style={{
        position: 'absolute', right: -10, top: -10,
        fontSize: 110, opacity: 0.18, lineHeight: 1,
        transform: 'rotate(-8deg)', pointerEvents: 'none',
      }} aria-hidden="true">{game.emoji}</div>
      <div style={{
        width: sz.emoji + 12, height: sz.emoji + 12,
        background: 'rgba(255,255,255,0.18)', borderRadius: 14,
        display: 'grid', placeItems: 'center',
        fontSize: sz.emoji, lineHeight: 1, flexShrink: 0,
        position: 'relative', zIndex: 1,
      }} aria-hidden="true">{game.emoji}</div>
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: sz.title, fontWeight: 900, letterSpacing: -0.01, lineHeight: 1.1,
        }}>{game.title}</div>
        <div style={{
          fontSize: sz.desc, fontWeight: 700, opacity: 0.85, marginTop: 4,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{game.desc}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 6 }}>
          {[1, 2, 3].map((i) => (
            <span key={i} style={{
              fontSize: sz.star, lineHeight: 1,
              color: i <= game.bestStars ? '#fbbf24' : 'rgba(255,255,255,0.3)',
            }}>★</span>
          ))}
        </div>
      </div>
      <div style={{
        background: '#fff', color: '#047857',
        padding: sz.ctaPad, borderRadius: 999,
        fontSize: sz.cta, fontWeight: 900,
        display: 'flex', alignItems: 'center', gap: 4,
        flexShrink: 0, position: 'relative', zIndex: 1,
        whiteSpace: 'nowrap',
      }}>
        Chơi <span style={{ fontSize: sz.cta + 2 }}>→</span>
      </div>
    </button>
  );
}

// ════════════════════════════════════════════════════════════════════
// ENGLISH HUB (/english) — 5 viewports
// ════════════════════════════════════════════════════════════════════

function EnglishHomeworkBanner({ onAction }) {
  return (
    <div
      role="alert"
      onClick={() => onAction('Hôm nay có bài tập Tiếng Anh!')}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        background: '#fbbf24', borderRadius: 20, padding: '14px 18px',
        boxShadow: '0 6px 16px -8px rgba(251, 191, 36, 0.7)',
        cursor: 'pointer',
      }}>
      <span style={{ fontSize: 32 }} aria-hidden="true">🏠</span>
      <div>
        <div style={{ fontSize: 16, fontWeight: 900, color: '#78350f' }}>
          Hôm nay có bài tập Tiếng Anh!
        </div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#92400e' }}>
          Hoàn thành 1 trò chơi để nộp bài.
        </div>
      </div>
    </div>
  );
}

// PHONE PORTRAIT
function EnglishHubPhoneP({ tweaks, onAction, insets = {} }) {
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
          <div style={{ fontSize: 22, fontWeight: 900 }}>Tiếng Anh 🔤</div>
          <div style={{ width: 90 }} />
        </div>
        {tweaks.showHomework && <EnglishHomeworkBanner onAction={onAction} />}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ENGLISH_GAMES.map((g) => (
            <EnglishGameCardRow key={g.id} game={g}
              onClick={() => onAction(`Mở ${g.title}…`)} size="md" />
          ))}
        </div>
      </div>
      <div style={{ paddingBottom: insets.bottom ?? 0, background: '#fff' }}>
        <BottomNav onAction={onAction} />
      </div>
    </div>
  );
}

// PHONE LANDSCAPE
function EnglishHubPhoneL({ tweaks, onAction }) {
  return (
    <div className="kh-app" style={{ flexDirection: 'row' }}>
      <NarrowRail onAction={onAction} />
      <main style={{
        flex: 1, padding: 10, display: 'flex', flexDirection: 'column',
        gap: 8, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 900 }}>Tiếng Anh 🔤</div>
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
          {ENGLISH_GAMES.map((g, i) => (
            <EnglishGameCardBig key={g.id} game={g} idx={i} compact
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// TABLET PORTRAIT
function EnglishHubTabletP({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: 24, display: 'flex', flexDirection: 'column',
        gap: 18, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Tiếng Anh 🔤</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              3 trò chơi · Chữ cái, Từ vựng, Phát âm
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <EnglishHomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr', gap: 14,
          flex: 1, minHeight: 0, alignContent: 'start',
        }}>
          {ENGLISH_GAMES.map((g) => (
            <EnglishGameCardRow key={g.id} game={g}
              onClick={() => onAction(`Mở ${g.title}…`)} size="lg" />
          ))}
        </div>
      </main>
    </div>
  );
}

// TABLET LANDSCAPE
function EnglishHubTabletL({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <Sidebar active="games" onNav={(id) => onAction(`Nav: ${id}`)} />
      <main style={{
        flex: 1, padding: '24px 32px', display: 'flex', flexDirection: 'column',
        gap: 18, overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 30 }}>Tiếng Anh 🔤</h1>
            <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Chọn một trò chơi để bắt đầu
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <EnglishHomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18,
          flex: 1, minHeight: 0, alignItems: 'center',
          maxWidth: 1000, width: '100%', margin: '0 auto',
        }}>
          {ENGLISH_GAMES.map((g, i) => (
            <EnglishGameCardBig key={g.id} game={g} idx={i}
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// DESKTOP
function EnglishHubDesktop({ tweaks, onAction }) {
  return (
    <div className="kh-app">
      <WideSidebar onAction={onAction} />
      <main style={{
        flex: 1, padding: '28px 32px', display: 'flex', flexDirection: 'column',
        gap: 22, overflow: 'hidden', maxWidth: 1280, margin: '0 auto', width: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <div>
            <h1 className="kh-h1" style={{ fontSize: 32 }}>Tiếng Anh 🔤</h1>
            <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: 14, fontWeight: 700 }}>
              Chọn một trò chơi nhỏ để bắt đầu · Tổng kỷ lục 6/9 ⭐
            </p>
          </div>
          <button onClick={() => onAction('Về trang chủ')} className="kh-ghost">
            ← Trang chủ
          </button>
        </div>
        {tweaks.showHomework && <EnglishHomeworkBanner onAction={onAction} />}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 22,
          flex: 1, minHeight: 0, alignItems: 'center',
          maxWidth: 1100, width: '100%', margin: '0 auto',
        }}>
          {ENGLISH_GAMES.map((g, i) => (
            <EnglishGameCardBig key={g.id} game={g} idx={i}
              onClick={() => onAction(`Mở ${g.title}…`)} />
          ))}
        </div>
      </main>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// PER-GAME VARIANTS — alphabet / vocabulary / phonics × 5 viewports
// ════════════════════════════════════════════════════════════════════
function makeEnglishGameVariants(gameId, gameTitle) {
  const onExit = (onAction) => () => onAction(`Thoát ${gameTitle}`);
  const onReplay = (onAction) => () => onAction(`Chơi lại ${gameTitle}`);
  const onPickLevel = (onAction) => (level) => onAction(`Bắt đầu: ${gameTitle} · ${level.text}`);
  const meta = ENGLISH_LEVELS[gameId];
  const ACCENT = '#10b981';

  const PhoneP = ({ tweaks, onAction, insets = {} }) => {
    const session = getEnglishSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <div style={{ width: '100%', height: '100%', background: 'var(--color-shell-kid)', paddingTop: insets.top ?? 0, paddingBottom: insets.bottom ?? 0, boxSizing: 'border-box' }}>
          <LevelSelect meta={meta} accent={ACCENT} isDark={false} size="sm"
            onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
        </div>
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
          <MathResult session={session} gameTitle={gameTitle} color={ACCENT}
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="sm" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
        <EnglishGameContent game={gameId} session={session} size="sm" layout="stack" />
      </GameShell>
    );
  };

  const PhoneL = ({ tweaks, onAction }) => {
    const session = getEnglishSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelectSplit meta={meta} accent={ACCENT} isDark={false}
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
          <MathResult session={session} gameTitle={gameTitle} color={ACCENT}
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="xs" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="sm">
        <EnglishGameContent game={gameId} session={session} size="sm" layout="split" />
      </GameShell>
    );
  };

  const TabletP = ({ tweaks, onAction }) => {
    const session = getEnglishSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark={false} size="md"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color={ACCENT}
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="md" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <EnglishGameContent game={gameId} session={session} size="md" layout="stack" />
      </GameShell>
    );
  };

  const TabletL = ({ tweaks, onAction }) => {
    const session = getEnglishSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark={false} size="lg"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color={ACCENT}
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="lg" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <EnglishGameContent game={gameId} session={session} size="lg" layout="stack" />
      </GameShell>
    );
  };

  const Desktop = ({ tweaks, onAction }) => {
    const session = getEnglishSession({ minigame: gameId, phase: tweaks.phase });
    if (tweaks.phase === 'idle') {
      return (
        <LevelSelect meta={meta} accent={ACCENT} isDark={false} size="lg"
          onPick={onPickLevel(onAction)} onExit={onExit(onAction)} />
      );
    }
    if (tweaks.phase === 'result') {
      return (
        <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
          <MathResult session={session} gameTitle={gameTitle} color={ACCENT}
            onReplay={onReplay(onAction)} onExit={onExit(onAction)} size="lg" />
        </GameShell>
      );
    }
    return (
      <GameShell session={session} onExit={onExit(onAction)} hudSize="lg">
        <EnglishGameContent game={gameId} session={session} size="xl" layout="stack" />
      </GameShell>
    );
  };

  return { PhoneP, PhoneL, TabletP, TabletL, Desktop };
}

const ALPHA = makeEnglishGameVariants('alphabet',   'Alphabet Explorer');
const SAFARI = makeEnglishGameVariants('vocabulary', 'Word Safari');
const SOUND = makeEnglishGameVariants('phonics',    'Sound Hunt');

Object.assign(window, {
  EnglishHubPhoneP, EnglishHubPhoneL, EnglishHubTabletP, EnglishHubTabletL, EnglishHubDesktop,
  AlphaPhoneP: ALPHA.PhoneP,   AlphaPhoneL: ALPHA.PhoneL,
  AlphaTabletP: ALPHA.TabletP, AlphaTabletL: ALPHA.TabletL,
  AlphaDesktop: ALPHA.Desktop,
  SafariPhoneP: SAFARI.PhoneP,   SafariPhoneL: SAFARI.PhoneL,
  SafariTabletP: SAFARI.TabletP, SafariTabletL: SAFARI.TabletL,
  SafariDesktop: SAFARI.Desktop,
  SoundPhoneP: SOUND.PhoneP,   SoundPhoneL: SOUND.PhoneL,
  SoundTabletP: SOUND.TabletP, SoundTabletL: SOUND.TabletL,
  SoundDesktop: SOUND.Desktop,
});
