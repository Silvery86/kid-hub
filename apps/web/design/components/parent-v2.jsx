/* parent-v2.jsx — Re-designed /parent + /parent/kid-access
   Goal: restructure to an OVERVIEW dashboard with managers as sub-pages.
   Tone: warm but grown-up (stone bg, indigo accent, tighter radii) —
   deliberately distinct from the kid side. Reuses KH_SUBJECTS. */

// ── Warm parent palette ────────────────────────────────────────────────
const P = {
  bg:        '#f5f2ec',   // warm stone
  bgAlt:     '#efebe3',
  card:      '#ffffff',
  border:    '#e9e3d8',
  ink:       '#2a2520',   // warm near-black
  sub:       '#8a8276',   // warm gray
  faint:     '#b8b0a3',
  accent:    '#4f46e5',   // trustworthy indigo
  accentDk:  '#4338ca',
  accentSoft:'#eef0fe',
  accentInk: '#3730a3',
  good:      '#0f766e',   // teal (positive)
  goodSoft:  '#e6f3f1',
  warn:      '#b45309',   // amber (attention)
  warnSoft:  '#fdf2e3',
  danger:    '#be4242',
  dangerSoft:'#fbeceb',
};

// ── Data ────────────────────────────────────────────────────────────────
const KID = { name: 'Khôi', grade: 'Lớp 1A', age: 6, streak: 6, points: 1280, avatar: '🧒' };

const PV_WEEK = {
  monday:    [['activities','07:30'],['vietnamese','08:10'],['vietnamese','09:00'],['math','09:40'],['ethics','10:30']],
  tuesday:   [['vietnamese','07:30'],['vietnamese','08:10'],['math','09:00'],['english','09:40'],['pe','10:30']],
  wednesday: [['vietnamese','07:30'],['vietnamese','08:10'],['math','09:00'],['music','09:40'],['science','10:30']],
  thursday:  [['vietnamese','07:30'],['vietnamese','08:10'],['math','09:00'],['english','09:40'],['art','10:30']],
  friday:    [['vietnamese','07:30'],['vietnamese','08:10'],['math','09:00'],['it','09:40'],['activities','10:30']],
};
const PV_DAYS = [['monday','Hai','26/05'],['tuesday','Ba','27/05'],['wednesday','Tư','28/05'],['thursday','Năm','29/05'],['friday','Sáu','30/05']];

const PV_GRADES = [
  ['vietnamese', 9.5], ['math', 10], ['english', 8.5], ['science', 9], ['ethics', 9.5],
  ['pe', 8], ['music', 9], ['art', 9.5], ['it', 7.5], ['activities', 9],
];

const PV_ACTIVITY = [
  { icon: '🔢', text: 'Chơi Number Ninja · Cấp 2', meta: '09:20 · 12 phút', tone: 'accent' },
  { icon: '✅', text: 'Hoàn thành bài tập Tiếng Anh', meta: '08:50', tone: 'good' },
  { icon: '🔤', text: 'Mở Word Safari · Cấp 1', meta: '08:55 · 8 phút', tone: 'accent' },
  { icon: '🏆', text: 'Đạt huy hiệu "Siêu Toán"', meta: 'Hôm qua', tone: 'warn' },
];

function pvAvg(){ return (PV_GRADES.reduce((a,[,s])=>a+s,0)/PV_GRADES.length).toFixed(1); }
function pvTier(score){
  if (score>=9) return { label:'Xuất sắc', bg:P.warnSoft, fg:P.warn };
  if (score>=7) return { label:'Giỏi',     bg:P.accentSoft, fg:P.accentInk };
  if (score>=5) return { label:'Khá',      bg:'#fbecdf', fg:'#c2410c' };
  return            { label:'Cần cố',  bg:P.dangerSoft, fg:P.danger };
}

// ── size config ─────────────────────────────────────────────────────────
function cfg(size){
  const compact = size==='sm-p' || size==='sm-l';
  const wide = size==='lg' || size==='xl';
  return {
    compact, wide,
    pad: compact?14:wide?28:22,
    gap: compact?12:wide?20:16,
    radius: compact?14:18,
    h1: compact?19:wide?26:23,
    statCols: size==='sm-p'?2:size==='sm-l'?4:wide?4:2,
  };
}

// ── Chrome ────────────────────────────────────────────────────────────
function PvHeader({ c, title, sub, onBack, onAction }) {
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      gap:12, flexWrap:'wrap',
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
        {onBack && (
          <button onClick={onBack} className="kh-press" style={{
            width: c.compact?36:42, height: c.compact?36:42, flexShrink:0,
            borderRadius:12, border:`1px solid ${P.border}`, background:P.card,
            color:P.ink, fontSize:16, fontWeight:900, cursor:'pointer', fontFamily:'inherit',
          }}>←</button>
        )}
        <div style={{ minWidth:0 }}>
          <h1 style={{ margin:0, fontSize:c.h1, fontWeight:900, color:P.ink, letterSpacing:-0.02 }}>{title}</h1>
          {sub && <p style={{ margin:'3px 0 0', fontSize:c.compact?11:13, color:P.sub, fontWeight:700 }}>{sub}</p>}
        </div>
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
        <div style={{
          display:'flex', alignItems:'center', gap:8,
          background:P.card, border:`1px solid ${P.border}`,
          borderRadius:999, padding: c.compact?'5px 10px 5px 6px':'6px 14px 6px 6px',
        }}>
          <div style={{
            width: c.compact?26:30, height: c.compact?26:30, borderRadius:999,
            background:P.accentSoft, display:'grid', placeItems:'center', fontSize:c.compact?15:17,
          }}>{KID.avatar}</div>
          <div style={{ lineHeight:1.1 }}>
            <div style={{ fontSize:c.compact?12:13, fontWeight:900, color:P.ink }}>{KID.name}</div>
            {!c.compact && <div style={{ fontSize:10, fontWeight:700, color:P.sub }}>{KID.grade}</div>}
          </div>
        </div>
        <button onClick={()=>onAction('Đăng xuất Parent Mode')} className="kh-press" style={{
          border:0, borderRadius:12, background:P.dangerSoft, color:P.danger,
          padding: c.compact?'8px 10px':'10px 14px', fontSize:c.compact?12:13, fontWeight:800,
          fontFamily:'inherit', cursor:'pointer', whiteSpace:'nowrap',
        }}>🔓{c.compact?'':' Đăng xuất'}</button>
      </div>
    </div>
  );
}

function PvShell({ c, children }) {
  return (
    <div className="kh-scroll" style={{
      width:'100%', height:'100%', background:P.bg, color:P.ink,
      fontFamily:'Nunito, system-ui, sans-serif',
      display:'flex', flexDirection:'column', gap:c.gap,
      padding:c.pad, boxSizing:'border-box', overflowY:'auto',
    }}>{children}</div>
  );
}

function PvCard({ c, children, pad, style }) {
  return (
    <div style={{
      background:P.card, border:`1px solid ${P.border}`,
      borderRadius:c.radius, padding: pad ?? (c.compact?14:18),
      boxShadow:'0 1px 2px rgba(42,37,32,0.04)',
      ...style,
    }}>{children}</div>
  );
}

function PvEyebrow({ children, style }) {
  return <div style={{ fontSize:11, fontWeight:800, letterSpacing:0.1, textTransform:'uppercase', color:P.faint, ...style }}>{children}</div>;
}

// ── Overview pieces ─────────────────────────────────────────────────────
function KidProfileCard({ c }) {
  return (
    <PvCard c={c} style={{
      display:'flex', alignItems:'center', gap: c.compact?12:16,
      background:`linear-gradient(120deg, ${P.accent} 0%, ${P.accentDk} 100%)`,
      border:'none', color:'#fff',
      boxShadow:`0 14px 30px -16px ${P.accent}`,
    }}>
      <div style={{
        width:c.compact?52:64, height:c.compact?52:64, borderRadius:18, flexShrink:0,
        background:'rgba(255,255,255,0.18)', display:'grid', placeItems:'center',
        fontSize:c.compact?28:34,
      }}>{KID.avatar}</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:c.compact?20:26, fontWeight:900, letterSpacing:-0.02 }}>{KID.name}</div>
        <div style={{ fontSize:c.compact?12:14, fontWeight:700, opacity:0.85 }}>{KID.grade} · {KID.age} tuổi</div>
      </div>
      <div style={{ display:'flex', gap:8, flexShrink:0 }}>
        <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:14, padding:c.compact?'8px 12px':'10px 16px' }}>
          <div style={{ fontSize:c.compact?18:22, fontWeight:900, lineHeight:1 }}>🔥{KID.streak}</div>
          <div style={{ fontSize:10, fontWeight:700, opacity:0.85, marginTop:3 }}>chuỗi ngày</div>
        </div>
        {!c.compact && (
          <div style={{ textAlign:'center', background:'rgba(255,255,255,0.15)', borderRadius:14, padding:'10px 16px' }}>
            <div style={{ fontSize:22, fontWeight:900, lineHeight:1 }}>🪙{KID.points}</div>
            <div style={{ fontSize:10, fontWeight:700, opacity:0.85, marginTop:3 }}>điểm</div>
          </div>
        )}
      </div>
    </PvCard>
  );
}

function StatTiles({ c, onAction }) {
  const stats = [
    { icon:'📊', val:pvAvg(),   label:'Điểm TB',     tone:'accent' },
    { icon:'📚', val:'2/5',     label:'Bài tập',     tone:'warn' },
    { icon:'⏱️', val:'47′',     label:'Màn hình',    tone:'good' },
    { icon:'🏆', val:'7/10',    label:'Huy hiệu',    tone:'accent' },
  ];
  const toneBg = { accent:P.accentSoft, warn:P.warnSoft, good:P.goodSoft };
  const toneFg = { accent:P.accentInk, warn:P.warn, good:P.good };
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${c.statCols}, 1fr)`, gap:c.compact?8:12 }}>
      {stats.map((s)=>(
        <PvCard key={s.label} c={c} pad={c.compact?12:16}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:c.compact?34:42, height:c.compact?34:42, borderRadius:12, flexShrink:0,
              background:toneBg[s.tone], display:'grid', placeItems:'center', fontSize:c.compact?16:20,
            }}>{s.icon}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:c.compact?18:24, fontWeight:900, color:P.ink, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontSize:c.compact?10:12, fontWeight:700, color:P.sub, marginTop:2 }}>{s.label}</div>
            </div>
          </div>
        </PvCard>
      ))}
    </div>
  );
}

function QuickActions({ c, onAction, onNav }) {
  const acts = [
    { icon:'➕', label:'Thêm tiết học', go:()=>onNav('schedule') },
    { icon:'✏️', label:'Nhập điểm',     go:()=>onNav('grades') },
    { icon:'🛡️', label:'Quyền truy cập', go:()=>onAction('Mở Quyền truy cập') },
    { icon:'🔒', label:'Khóa thiết bị',  go:()=>onAction('Đã khóa thiết bị của Khôi') },
  ];
  return (
    <div style={{ display:'grid', gridTemplateColumns:`repeat(${c.compact?2:4}, 1fr)`, gap:c.compact?8:12 }}>
      {acts.map((a)=>(
        <button key={a.label} onClick={a.go} className="kh-press" style={{
          background:P.card, border:`1px solid ${P.border}`, borderRadius:c.radius,
          padding:c.compact?'12px 10px':'16px 12px', cursor:'pointer', fontFamily:'inherit',
          display:'flex', flexDirection:'column', alignItems:'center', gap:6,
        }}>
          <div style={{
            width:c.compact?36:44, height:c.compact?36:44, borderRadius:12,
            background:P.accentSoft, display:'grid', placeItems:'center', fontSize:c.compact?18:22,
          }}>{a.icon}</div>
          <span style={{ fontSize:c.compact?11:13, fontWeight:800, color:P.ink, textAlign:'center' }}>{a.label}</span>
        </button>
      ))}
    </div>
  );
}

function ManagerPreview({ c, kind, onNav }) {
  const isSchedule = kind==='schedule';
  const today = PV_WEEK.wednesday;
  return (
    <button onClick={()=>onNav(kind)} className="kh-press" style={{
      background:P.card, border:`1px solid ${P.border}`, borderRadius:c.radius,
      padding:c.compact?14:18, cursor:'pointer', fontFamily:'inherit', textAlign:'left',
      display:'flex', flexDirection:'column', gap:10, width:'100%',
    }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{
            width:c.compact?36:42, height:c.compact?36:42, borderRadius:12,
            background:isSchedule?P.accentSoft:P.goodSoft, display:'grid', placeItems:'center', fontSize:c.compact?18:20,
          }}>{isSchedule?'📅':'⭐'}</div>
          <div>
            <div style={{ fontSize:c.compact?15:17, fontWeight:900, color:P.ink }}>{isSchedule?'Lịch học':'Điểm số'}</div>
            <div style={{ fontSize:c.compact?11:12, fontWeight:700, color:P.sub }}>
              {isSchedule?'5 tiết hôm nay · Thứ Tư':`Điểm TB ${pvAvg()} · 10 môn`}
            </div>
          </div>
        </div>
        <span style={{ fontSize:13, fontWeight:900, color:P.accent }}>Chỉnh sửa →</span>
      </div>
      {/* mini preview row */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        {isSchedule
          ? today.slice(0,5).map(([sid,t],i)=>{ const s=KH_SUBJECTS[sid]; return (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, background:P.bgAlt, borderRadius:999, padding:'4px 9px', fontSize:11, fontWeight:800, color:P.ink }}>
                <span style={{ width:7,height:7,borderRadius:999,background:s.color }}/>{s.name}
              </span>); })
          : PV_GRADES.slice(0,5).map(([sid,score],i)=>{ const s=KH_SUBJECTS[sid]; return (
              <span key={i} style={{ display:'inline-flex', alignItems:'center', gap:5, background:P.bgAlt, borderRadius:999, padding:'4px 9px', fontSize:11, fontWeight:800, color:P.ink }}>
                <span style={{ width:7,height:7,borderRadius:999,background:s.color }}/>{s.name} {score}
              </span>); })
        }
      </div>
    </button>
  );
}

function ActivityFeed({ c, onAction, dense }) {
  const toneBg = { accent:P.accentSoft, good:P.goodSoft, warn:P.warnSoft };
  return (
    <PvCard c={c}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <PvEyebrow>Hoạt động gần đây</PvEyebrow>
        <span onClick={()=>onAction('Xem tất cả hoạt động')} style={{ fontSize:12, fontWeight:800, color:P.accent, cursor:'pointer' }}>Tất cả</span>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:c.compact?8:10 }}>
        {(dense?PV_ACTIVITY:PV_ACTIVITY).map((a,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:c.compact?32:38, height:c.compact?32:38, borderRadius:10, flexShrink:0, background:toneBg[a.tone], display:'grid', placeItems:'center', fontSize:c.compact?15:18 }}>{a.icon}</div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:c.compact?12:14, fontWeight:800, color:P.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.text}</div>
              <div style={{ fontSize:c.compact?10:11, fontWeight:700, color:P.faint, marginTop:1 }}>{a.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </PvCard>
  );
}

// ── Schedule sub-page ─────────────────────────────────────────────────
function ScheduleManagerPage({ c, onAction, saved, setSaved }) {
  const [day, setDay] = React.useState('wednesday');
  const periods = PV_WEEK[day];
  return (
    <PvCard c={c} style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:c.compact?10:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <PvEyebrow>Thời khóa biểu</PvEyebrow>
        <button onClick={()=>{ setSaved(true); onAction('Đã lưu lịch học'); }} className="kh-press" style={{
          border:0, borderRadius:10, background:saved?P.good:P.accent, color:'#fff',
          padding:'8px 14px', fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer',
          display:'flex', alignItems:'center', gap:6,
        }}>{saved?'✓ Đã lưu':'💾 Lưu'}</button>
      </div>
      {/* day tabs */}
      <div style={{ display:'flex', gap:4, padding:4, background:P.bgAlt, borderRadius:14 }}>
        {PV_DAYS.map(([id,lbl,date])=>(
          <button key={id} onClick={()=>setDay(id)} style={{
            flex:1, padding:c.compact?'6px 4px':'7px 6px', borderRadius:10, border:0,
            background: day===id?P.card:'transparent', color: day===id?P.accentInk:P.sub,
            fontFamily:'inherit', fontSize:c.compact?12:13, fontWeight:800, cursor:'pointer',
            boxShadow: day===id?'0 1px 2px rgba(42,37,32,0.1)':'none', whiteSpace:'nowrap',
            display:'flex', flexDirection:'column', alignItems:'center', gap:1,
          }}>
            <span>{lbl}</span>
            <span style={{ fontSize:c.compact?9:10, fontWeight:800, opacity:0.65 }}>{date}</span>
          </button>
        ))}
      </div>
      {/* rows */}
      <div className="kh-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
        {periods.map(([sid,t],i)=>{ const s=KH_SUBJECTS[sid]; return (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:c.compact?'9px 10px':'11px 12px', borderRadius:12, background:P.bg }}>
            <div style={{ width:26,height:26,borderRadius:8,background:s.color,display:'grid',placeItems:'center',fontSize:13,flexShrink:0 }}>{s.icon}</div>
            <div onClick={()=>onAction(`Đổi môn: ${s.name}`)} style={{ flex:1, minWidth:0, fontSize:c.compact?13:14, fontWeight:800, color:P.ink, cursor:'pointer', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</div>
            <div onClick={()=>onAction(`Sửa giờ ${t}`)} style={{ fontSize:c.compact?12:13, fontWeight:800, color:P.sub, background:P.card, border:`1px solid ${P.border}`, borderRadius:8, padding:'5px 9px', cursor:'pointer', fontVariantNumeric:'tabular-nums' }}>{t}</div>
            <button onClick={()=>onAction(`Xóa tiết ${s.name}`)} className="kh-press" style={{ border:0, borderRadius:8, width:30,height:30, background:'transparent', color:P.danger, fontSize:14, cursor:'pointer', flexShrink:0 }}>🗑️</button>
          </div>
        ); })}
        <button onClick={()=>onAction('Thêm tiết học mới')} className="kh-press" style={{
          padding:'11px', border:`1.5px dashed ${P.faint}`, borderRadius:12, background:'transparent',
          color:P.sub, fontFamily:'inherit', fontSize:13, fontWeight:800, cursor:'pointer',
        }}>+ Thêm tiết học</button>
      </div>
    </PvCard>
  );
}

// ── Grades sub-page ─────────────────────────────────────────────────────
function GradesManagerPage({ c, onAction, saved, setSaved }) {
  const [sem, setSem] = React.useState(1);
  return (
    <PvCard c={c} style={{ flex:1, minHeight:0, display:'flex', flexDirection:'column', gap:c.compact?10:14 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <PvEyebrow>Điểm số · Học kỳ {sem}</PvEyebrow>
        <button onClick={()=>{ setSaved(true); onAction('Đã lưu điểm số'); }} className="kh-press" style={{
          border:0, borderRadius:10, background:saved?P.good:P.accent, color:'#fff',
          padding:'8px 14px', fontSize:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer',
        }}>{saved?'✓ Đã lưu':'💾 Lưu'}</button>
      </div>
      <div style={{ display:'flex', gap:4, padding:4, background:P.bgAlt, borderRadius:14, width:'fit-content' }}>
        {[1,2].map((s)=>(
          <button key={s} onClick={()=>setSem(s)} style={{
            padding:c.compact?'7px 16px':'9px 20px', borderRadius:10, border:0,
            background: sem===s?P.card:'transparent', color: sem===s?P.accentInk:P.sub,
            fontFamily:'inherit', fontSize:c.compact?12:13, fontWeight:800, cursor:'pointer',
            boxShadow: sem===s?'0 1px 2px rgba(42,37,32,0.1)':'none',
          }}>Học kỳ {s}</button>
        ))}
      </div>
      <div className="kh-scroll" style={{ flex:1, minHeight:0, overflowY:'auto', display:c.wide?'grid':'flex', gridTemplateColumns:c.wide?'1fr 1fr':undefined, flexDirection:c.wide?undefined:'column', gap:8 }}>
        {PV_GRADES.map(([sid,score])=>{ const s=KH_SUBJECTS[sid]; const tier=pvTier(score); return (
          <div key={sid} style={{ display:'flex', alignItems:'center', gap:10, padding:c.compact?'9px 10px':'11px 12px', borderRadius:12, background:P.bg }}>
            <div style={{ width:26,height:26,borderRadius:8,background:s.color,display:'grid',placeItems:'center',fontSize:13,flexShrink:0 }}>{s.icon}</div>
            <span style={{ flex:1, minWidth:0, fontSize:c.compact?13:14, fontWeight:800, color:P.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{s.name}</span>
            <span style={{ background:tier.bg, color:tier.fg, borderRadius:999, padding:'3px 9px', fontSize:11, fontWeight:900, whiteSpace:'nowrap' }}>{tier.label}</span>
            <div onClick={()=>onAction(`Sửa điểm ${s.name}: ${score}`)} style={{ width:46, textAlign:'center', fontSize:c.compact?15:17, fontWeight:900, color:P.ink, background:P.card, border:`1px solid ${P.border}`, borderRadius:8, padding:'5px 0', cursor:'pointer' }}>{score}</div>
          </div>
        ); })}
      </div>
    </PvCard>
  );
}

// ── Parent navigation chrome ────────────────────────────────────────────
const PARENT_NAV = [
  { id:'overview', icon:'🏠', label:'Tổng quan' },
  { id:'schedule', icon:'📅', label:'Lịch học' },
  { id:'grades',   icon:'⭐', label:'Điểm số' },
  { id:'access',   icon:'🛡️', label:'Truy cập' },
];

function PvNav({ size, active, onNav, onAction }) {
  const iconOnly = size === 'sm-l';
  const w = iconOnly ? 60 : size === 'md' ? 196 : 212;
  return (
    <aside style={{
      width:w, flexShrink:0, height:'100%', boxSizing:'border-box',
      background:P.card, borderRight:`1px solid ${P.border}`,
      display:'flex', flexDirection:'column',
      padding: iconOnly ? '12px 8px' : '18px 14px', gap:6,
    }}>
      {/* logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, padding: iconOnly?'0 0 10px':'0 6px 14px', justifyContent: iconOnly?'center':'flex-start' }}>
        <div style={{ width:36, height:36, borderRadius:11, background:P.accent, color:'#fff', display:'grid', placeItems:'center', fontSize:18, flexShrink:0 }}>🌟</div>
        {!iconOnly && (
          <div style={{ lineHeight:1.1 }}>
            <div style={{ fontSize:14, fontWeight:900, color:P.ink }}>Kid Hub</div>
            <div style={{ fontSize:10, fontWeight:800, color:P.faint, letterSpacing:0.06, textTransform:'uppercase' }}>Parent</div>
          </div>
        )}
      </div>
      {PARENT_NAV.map((it)=>{
        const on = it.id === active;
        return (
          <button key={it.id} onClick={()=>onNav(it.id)} className="kh-press" title={it.label} style={{
            display:'flex', alignItems:'center', gap:12, width:'100%',
            justifyContent: iconOnly?'center':'flex-start',
            padding: iconOnly?'10px 0':'10px 12px', borderRadius:12, border:0, cursor:'pointer',
            background: on?P.accent:'transparent', color: on?'#fff':P.sub,
            fontFamily:'inherit', fontWeight:800, fontSize:14, textAlign:'left',
            boxShadow: on?`0 6px 14px -6px ${P.accent}`:'none',
          }}>
            <span style={{ fontSize:19 }}>{it.icon}</span>
            {!iconOnly && <span>{it.label}</span>}
          </button>
        );
      })}
      <div style={{ flex:1 }} />
      <button onClick={()=>onAction('Về chế độ Kid')} className="kh-press" title="Về chế độ Kid" style={{
        display:'flex', alignItems:'center', gap:10, width:'100%',
        justifyContent: iconOnly?'center':'flex-start',
        padding: iconOnly?'10px 0':'10px 12px', borderRadius:12,
        border:`1px solid ${P.border}`, background:P.bg, color:P.sub,
        fontFamily:'inherit', fontWeight:800, fontSize:13, cursor:'pointer',
      }}>
        <span style={{ fontSize:17 }}>🧒</span>
        {!iconOnly && <span>Về chế độ Kid</span>}
      </button>
    </aside>
  );
}

function PvBottomBar({ active, onNav, onAction, insets={} }) {
  return (
    <nav style={{
      display:'flex', background:P.card, borderTop:`1px solid ${P.border}`,
      paddingBottom: insets.bottom ?? 0, flexShrink:0,
    }}>
      {PARENT_NAV.map((it)=>{
        const on = it.id === active;
        return (
          <button key={it.id} onClick={()=>onNav(it.id)} style={{
            flex:1, border:0, background:'transparent', cursor:'pointer', fontFamily:'inherit',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'8px 4px 10px', color: on?P.accent:P.faint,
            fontSize:10, fontWeight:800, letterSpacing:-0.01,
          }}>
            <span style={{ fontSize:21 }}>{it.icon}</span>
            <span>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

function PvLayout({ size, active, onNav, onAction, insets={}, children }) {
  if (size === 'sm-p') {
    return (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', background:P.bg, paddingTop: insets.top ?? 0, boxSizing:'border-box' }}>
        <div style={{ flex:1, minHeight:0 }}>{children}</div>
        <PvBottomBar active={active} onNav={onNav} onAction={onAction} insets={insets} />
      </div>
    );
  }
  return (
    <div style={{ width:'100%', height:'100%', display:'flex', background:P.bg }}>
      <PvNav size={size} active={active} onNav={onNav} onAction={onAction} />
      <div style={{ flex:1, minWidth:0, height:'100%' }}>{children}</div>
    </div>
  );
}

// ── /parent screen (overview + sub-page nav) ────────────────────────────
function ParentScreen({ size, tweaks, onAction, insets }) {
  const c = cfg(size);
  const [view, setView] = React.useState(tweaks.parentView || 'overview');
  const [saved, setSaved] = React.useState(false);
  React.useEffect(()=>{ setView(tweaks.parentView || 'overview'); setSaved(false); }, [tweaks.parentView]);
  const onNav = (v)=>{ setView(v); setSaved(false); };
  const navTo = (id)=>{
    if (id==='overview'||id==='schedule'||id==='grades') onNav(id);
    else onAction('Mở Quyền truy cập');
  };

  if (view === 'schedule' || view === 'grades') {
    return (
      <PvLayout size={size} active={view} onNav={navTo} onAction={onAction} insets={insets}>
        <PvShell c={c}>
          <PvHeader c={c}
            title={view==='schedule'?'Lịch học':'Điểm số'}
            sub={view==='schedule'?'Thêm, sửa, xóa tiết học của Khôi':'Cập nhật điểm từng môn'}
            onBack={()=>onNav('overview')} onAction={onAction} />
          {view==='schedule'
            ? <ScheduleManagerPage c={c} onAction={onAction} saved={saved} setSaved={setSaved} />
            : <GradesManagerPage c={c} onAction={onAction} saved={saved} setSaved={setSaved} />}
        </PvShell>
      </PvLayout>
    );
  }

  // OVERVIEW
  const managersAndActivity = (
    c.wide ? (
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:c.gap, alignItems:'start' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:c.gap }}>
          <ManagerPreview c={c} kind="schedule" onNav={onNav} />
          <ManagerPreview c={c} kind="grades" onNav={onNav} />
        </div>
        <ActivityFeed c={c} onAction={onAction} />
      </div>
    ) : (
      <React.Fragment>
        <div style={{ display:'grid', gridTemplateColumns: c.compact?'1fr':'1fr 1fr', gap:c.gap }}>
          <ManagerPreview c={c} kind="schedule" onNav={onNav} />
          <ManagerPreview c={c} kind="grades" onNav={onNav} />
        </div>
        <ActivityFeed c={c} onAction={onAction} />
      </React.Fragment>
    )
  );

  return (
    <PvLayout size={size} active="overview" onNav={navTo} onAction={onAction} insets={insets}>
      <PvShell c={c}>
        <PvHeader c={c} title="Parent Mode" sub="Tổng quan về việc học của Khôi" onAction={onAction} />
        <KidProfileCard c={c} />
        <StatTiles c={c} onAction={onAction} />
        <div>
          <PvEyebrow style={{ marginBottom:c.compact?8:10 }}>Thao tác nhanh</PvEyebrow>
          <QuickActions c={c} onAction={onAction} onNav={onNav} />
        </div>
        {managersAndActivity}
      </PvShell>
    </PvLayout>
  );
}

// ── /parent/kid-access screen ───────────────────────────────────────────
const KA_FEATURES = {
  games: [
    { id:'math', icon:'🧮', label:'Trò chơi Toán', on:true },
    { id:'english', icon:'🔤', label:'Trò chơi Tiếng Anh', on:true },
    { id:'newgames', icon:'🌱', label:'Trò chơi sắp ra mắt', on:false },
  ],
  screens: [
    { id:'schedule', icon:'📅', label:'Xem lịch học', on:true },
    { id:'grades', icon:'⭐', label:'Xem điểm số', on:true },
    { id:'homework', icon:'📚', label:'Bài tập về nhà', on:true },
    { id:'badges', icon:'🏆', label:'Huy hiệu', on:true },
  ],
  system: [
    { id:'sounds', icon:'🔊', label:'Âm thanh trò chơi', on:true },
    { id:'anim', icon:'✨', label:'Hiệu ứng hoạt ảnh', on:true },
  ],
};

function KaToggle({ c, f, onAction }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:c.compact?'9px 10px':'11px 14px', borderRadius:12, background:P.bg }}>
      <div style={{ width:c.compact?32:38, height:c.compact?32:38, borderRadius:10, flexShrink:0, background: f.on?P.accentSoft:P.bgAlt, display:'grid', placeItems:'center', fontSize:c.compact?15:18 }}>{f.icon}</div>
      <span style={{ flex:1, minWidth:0, fontSize:c.compact?13:14, fontWeight:800, color:P.ink }}>{f.label}</span>
      <button onClick={()=>onAction(`${f.on?'Tắt':'Bật'}: ${f.label}`)} className="kh-press" style={{
        width:c.compact?42:48, height:c.compact?24:28, borderRadius:999, border:0, cursor:'pointer', padding:0, flexShrink:0,
        background: f.on?P.accent:'#d8d2c6', position:'relative', transition:'background 0.2s',
      }}>
        <div style={{ position:'absolute', top:3, left: f.on?(c.compact?21:23):3, width:c.compact?18:22, height:c.compact?18:22, borderRadius:999, background:'#fff', boxShadow:'0 1px 3px rgba(0,0,0,0.25)', transition:'left 0.2s' }} />
      </button>
    </div>
  );
}

function ScreenTimeCard({ c, onAction }) {
  const used=47, total=120, pct=Math.round(used/total*100);
  const week=[40,65,52,47,80,30,20];
  return (
    <PvCard c={c} style={{ background:`linear-gradient(120deg, ${P.accent} 0%, ${P.accentDk} 100%)`, border:'none', color:'#fff', boxShadow:`0 14px 30px -16px ${P.accent}` }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:12 }}>
        <div>
          <div style={{ fontSize:11, fontWeight:800, opacity:0.85, letterSpacing:0.1, textTransform:'uppercase' }}>Thời gian màn hình hôm nay</div>
          <div style={{ fontSize:c.compact?22:28, fontWeight:900, lineHeight:1, marginTop:3 }}>{used}<span style={{ fontSize:c.compact?13:16, opacity:0.8 }}> / {total} phút</span></div>
        </div>
        <button onClick={()=>onAction('Điều chỉnh giới hạn thời gian')} className="kh-press" style={{ border:0, borderRadius:999, background:'rgba(255,255,255,0.2)', color:'#fff', padding:c.compact?'6px 12px':'8px 16px', fontSize:c.compact?11:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer' }}>Điều chỉnh</button>
      </div>
      <div style={{ height:c.compact?8:10, background:'rgba(255,255,255,0.25)', borderRadius:999, overflow:'hidden', marginBottom:12 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:'#fff', borderRadius:999 }} />
      </div>
      {/* weekly mini bars */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', gap:5, height:c.compact?32:40 }}>
        {week.map((v,i)=>(
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
            <div style={{ width:'100%', height:`${v/100*(c.compact?24:32)}px`, background:'rgba(255,255,255,0.55)', borderRadius:4 }} />
            <span style={{ fontSize:9, fontWeight:700, opacity:0.7 }}>{['H','B','T','N','S','B','C'][i]}</span>
          </div>
        ))}
      </div>
    </PvCard>
  );
}

function RewardCard({ c, onAction }) {
  return (
    <PvCard c={c} style={{ background:P.warnSoft, border:`1px solid #f3dcb8`, display:'flex', alignItems:'center', gap:12 }}>
      <div style={{ fontSize:c.compact?30:38, lineHeight:1 }}>🎁</div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontSize:c.compact?13:15, fontWeight:900, color:P.warn }}>Phần thưởng thời gian chơi</div>
        <div style={{ fontSize:c.compact?11:12, fontWeight:700, color:'#a16207', marginTop:2 }}>Mỗi bài tập hoàn thành = +15 phút chơi game</div>
      </div>
      <button onClick={()=>onAction('Bật/tắt phần thưởng')} className="kh-press" style={{ border:0, borderRadius:999, background:P.warn, color:'#fff', padding:c.compact?'7px 12px':'9px 16px', fontSize:c.compact?11:13, fontWeight:800, fontFamily:'inherit', cursor:'pointer', whiteSpace:'nowrap', flexShrink:0 }}>Đang bật</button>
    </PvCard>
  );
}

function DifficultyCaps({ c, onAction }) {
  const caps = [
    { icon:'🧮', label:'Toán', level:2 },
    { icon:'🔤', label:'Tiếng Anh', level:3 },
  ];
  return (
    <PvCard c={c}>
      <PvEyebrow style={{ marginBottom:10 }}>Giới hạn độ khó</PvEyebrow>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {caps.map((cap)=>(
          <div key={cap.label} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:18 }}>{cap.icon}</span>
            <span style={{ flex:1, fontSize:c.compact?13:14, fontWeight:800, color:P.ink }}>{cap.label}</span>
            <div style={{ display:'flex', gap:4 }}>
              {[1,2,3].map((lv)=>(
                <button key={lv} onClick={()=>onAction(`${cap.label}: tối đa Cấp ${lv}`)} className="kh-press" style={{
                  width:c.compact?30:34, height:c.compact?30:34, borderRadius:9, border:0, cursor:'pointer', fontFamily:'inherit',
                  background: lv<=cap.level?P.accent:P.bgAlt, color: lv<=cap.level?'#fff':P.faint,
                  fontSize:13, fontWeight:900,
                }}>{lv}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PvCard>
  );
}

function KaFeatureGroups({ c, onAction }) {
  const groups = [['games','Trò chơi'],['screens','Màn hình xem'],['system','Cài đặt']];
  return (
    <React.Fragment>
      {groups.map(([key,label])=>(
        <PvCard key={key} c={c}>
          <PvEyebrow style={{ marginBottom:10 }}>{label}</PvEyebrow>
          <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
            {KA_FEATURES[key].map((f)=>(<KaToggle key={f.id} c={c} f={f} onAction={onAction} />))}
          </div>
        </PvCard>
      ))}
    </React.Fragment>
  );
}

function KaActivityLog({ c, onAction }) {
  return (
    <PvCard c={c}>
      <PvEyebrow style={{ marginBottom:10 }}>Nhật ký hoạt động</PvEyebrow>
      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {PV_ACTIVITY.map((a,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:c.compact?16:20 }}>{a.icon}</span>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:c.compact?12:13, fontWeight:800, color:P.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.text}</div>
              <div style={{ fontSize:10, fontWeight:700, color:P.faint }}>{a.meta}</div>
            </div>
          </div>
        ))}
      </div>
    </PvCard>
  );
}

function KidAccessScreen({ size, tweaks, onAction, insets }) {
  const c = cfg(size);
  const navTo = (id)=>{
    const item = PARENT_NAV.find((n)=>n.id===id);
    onAction(id==='access' ? 'Đang ở Quyền truy cập' : `Mở ${item?item.label:id}`);
  };
  return (
    <PvLayout size={size} active="access" onNav={navTo} onAction={onAction} insets={insets}>
      <PvShell c={c}>
        <PvHeader c={c} title="Quyền truy cập" sub="Kiểm soát nội dung & thời gian của Khôi"
          onBack={()=>onAction('Về Parent Mode')} onAction={onAction} />
        <ScreenTimeCard c={c} onAction={onAction} />
        <RewardCard c={c} onAction={onAction} />
        {c.wide ? (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:c.gap, alignItems:'start' }}>
            <div style={{ display:'flex', flexDirection:'column', gap:c.gap }}>
              <KaFeatureGroups c={c} onAction={onAction} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:c.gap }}>
              <DifficultyCaps c={c} onAction={onAction} />
              <KaActivityLog c={c} onAction={onAction} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:c.gap }} />
          </div>
        ) : (
          <React.Fragment>
            <div style={{ display:'grid', gridTemplateColumns: c.compact?'1fr':'1fr 1fr', gap:c.gap, alignItems:'start' }}>
              <KaFeatureGroups c={c} onAction={onAction} />
            </div>
            <DifficultyCaps c={c} onAction={onAction} />
            <KaActivityLog c={c} onAction={onAction} />
          </React.Fragment>
        )}
      </PvShell>
    </PvLayout>
  );
}

// ── 5-viewport exports ──────────────────────────────────────────────────
Object.assign(window, {
  ParentV2PhoneP: ({tweaks,onAction,insets={}}) => <ParentScreen size="sm-p" tweaks={tweaks} onAction={onAction} insets={insets} />,
  ParentV2PhoneL: ({tweaks,onAction}) => <ParentScreen size="sm-l" tweaks={tweaks} onAction={onAction} />,
  ParentV2TabletP: ({tweaks,onAction}) => <ParentScreen size="md" tweaks={tweaks} onAction={onAction} />,
  ParentV2TabletL: ({tweaks,onAction}) => <ParentScreen size="lg" tweaks={tweaks} onAction={onAction} />,
  ParentV2Desktop: ({tweaks,onAction}) => <ParentScreen size="xl" tweaks={tweaks} onAction={onAction} />,

  KidAccessV2PhoneP: ({tweaks,onAction,insets={}}) => <KidAccessScreen size="sm-p" tweaks={tweaks} onAction={onAction} insets={insets} />,
  KidAccessV2PhoneL: ({tweaks,onAction}) => <KidAccessScreen size="sm-l" tweaks={tweaks} onAction={onAction} />,
  KidAccessV2TabletP: ({tweaks,onAction}) => <KidAccessScreen size="md" tweaks={tweaks} onAction={onAction} />,
  KidAccessV2TabletL: ({tweaks,onAction}) => <KidAccessScreen size="lg" tweaks={tweaks} onAction={onAction} />,
  KidAccessV2Desktop: ({tweaks,onAction}) => <KidAccessScreen size="xl" tweaks={tweaks} onAction={onAction} />,
});
