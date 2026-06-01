'use client';

import { useState } from 'react';

interface WCTeam { name: string; flag: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; }
interface BracketMatch { t1: string; f1: string; s1?: number; t2: string; f2: string; s2?: number; done?: boolean; }

const GROUPS: Record<string, WCTeam[]> = {
  A: [
    { name: 'USA',         flag: '🇺🇸', p:3, w:2, d:1, l:0, gf:6, ga:2, pts:7 },
    { name: 'Mexico',      flag: '🇲🇽', p:3, w:2, d:0, l:1, gf:4, ga:3, pts:6 },
    { name: 'Bolivia',     flag: '🇧🇴', p:3, w:1, d:0, l:2, gf:2, ga:5, pts:3 },
    { name: 'Saudi Arabia',flag: '🇸🇦', p:3, w:0, d:1, l:2, gf:1, ga:3, pts:1 },
  ],
  B: [
    { name: 'Brazil',      flag: '🇧🇷', p:3, w:3, d:0, l:0, gf:8, ga:1, pts:9 },
    { name: 'Germany',     flag: '🇩🇪', p:3, w:2, d:0, l:1, gf:5, ga:3, pts:6 },
    { name: 'Australia',   flag: '🇦🇺', p:3, w:0, d:1, l:2, gf:2, ga:6, pts:1 },
    { name: 'Honduras',    flag: '🇭🇳', p:3, w:0, d:1, l:2, gf:1, ga:6, pts:1 },
  ],
  C: [
    { name: 'France',      flag: '🇫🇷', p:3, w:2, d:1, l:0, gf:7, ga:3, pts:7 },
    { name: 'Argentina',   flag: '🇦🇷', p:3, w:2, d:0, l:1, gf:5, ga:4, pts:6 },
    { name: 'Japan',       flag: '🇯🇵', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name: 'Cameroon',    flag: '🇨🇲', p:3, w:0, d:0, l:3, gf:0, ga:5, pts:0 },
  ],
  D: [
    { name: 'Spain',       flag: '🇪🇸', p:3, w:3, d:0, l:0, gf:9, ga:2, pts:9 },
    { name: 'England',     flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', p:3, w:1, d:1, l:1, gf:4, ga:4, pts:4 },
    { name: 'Ecuador',     flag: '🇪🇨', p:3, w:1, d:1, l:1, gf:3, ga:4, pts:4 },
    { name: 'Tunisia',     flag: '🇹🇳', p:3, w:0, d:0, l:3, gf:0, ga:6, pts:0 },
  ],
  E: [
    { name: 'Netherlands', flag: '🇳🇱', p:3, w:2, d:1, l:0, gf:5, ga:2, pts:7 },
    { name: 'Belgium',     flag: '🇧🇪', p:3, w:2, d:0, l:1, gf:4, ga:3, pts:6 },
    { name: 'Poland',      flag: '🇵🇱', p:3, w:1, d:0, l:2, gf:2, ga:4, pts:3 },
    { name: 'Panama',      flag: '🇵🇦', p:3, w:0, d:1, l:2, gf:1, ga:3, pts:1 },
  ],
  F: [
    { name: 'Portugal',    flag: '🇵🇹', p:3, w:2, d:1, l:0, gf:7, ga:3, pts:7 },
    { name: 'South Korea', flag: '🇰🇷', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name: 'Nigeria',     flag: '🇳🇬', p:3, w:1, d:0, l:2, gf:2, ga:5, pts:3 },
    { name: 'Costa Rica',  flag: '🇨🇷', p:3, w:1, d:0, l:2, gf:2, ga:4, pts:3 },
  ],
  G: [
    { name: 'Canada',      flag: '🇨🇦', p:3, w:2, d:0, l:1, gf:4, ga:2, pts:6 },
    { name: 'Morocco',     flag: '🇲🇦', p:3, w:2, d:0, l:1, gf:3, ga:2, pts:6 },
    { name: 'Croatia',     flag: '🇭🇷', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name: 'Algeria',     flag: '🇩🇿', p:3, w:0, d:1, l:2, gf:1, ga:4, pts:1 },
  ],
  H: [
    { name: 'Ukraine',     flag: '🇺🇦', p:3, w:2, d:1, l:0, gf:5, ga:2, pts:7 },
    { name: 'Colombia',    flag: '🇨🇴', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name: 'Serbia',      flag: '🇷🇸', p:3, w:1, d:0, l:2, gf:3, ga:4, pts:3 },
    { name: 'Iran',        flag: '🇮🇷', p:3, w:0, d:2, l:1, gf:1, ga:3, pts:2 },
  ],
};

/* Round of 16: A1 vs B2, B1 vs A2, C1 vs D2, D1 vs C2, E1 vs F2, F1 vs E2, G1 vs H2, H1 vs G2 */
const R16: BracketMatch[] = [
  { t1:'USA',         f1:'🇺🇸', s1:2, t2:'Germany',     f2:'🇩🇪', s2:1, done:true },
  { t1:'Brazil',      f1:'🇧🇷', s1:3, t2:'Mexico',      f2:'🇲🇽', s2:0, done:true },
  { t1:'France',      f1:'🇫🇷', s1:2, t2:'England',     f2:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', s2:1, done:true },
  { t1:'Spain',       f1:'🇪🇸', s1:2, t2:'Argentina',   f2:'🇦🇷', s2:2, done:false },
  { t1:'Netherlands', f1:'🇳🇱', s1:1, t2:'South Korea', f2:'🇰🇷', s2:0, done:true },
  { t1:'Portugal',    f1:'🇵🇹', s1:2, t2:'Belgium',     f2:'🇧🇪', s2:1, done:true },
  { t1:'Canada',      f1:'🇨🇦', s1:1, t2:'Ukraine',     f2:'🇺🇦', s2:0, done:true },
  { t1:'Morocco',     f1:'🇲🇦', s1:1, t2:'Colombia',    f2:'🇨🇴', s2:0, done:true },
];

const QF: BracketMatch[] = [
  { t1:'USA',         f1:'🇺🇸', t2:'Brazil',      f2:'🇧🇷' },
  { t1:'France',      f1:'🇫🇷', t2:'Spain',       f2:'🇪🇸' },
  { t1:'Netherlands', f1:'🇳🇱', t2:'Portugal',    f2:'🇵🇹' },
  { t1:'Canada',      f1:'🇨🇦', t2:'Morocco',     f2:'🇲🇦' },
];

const SF: BracketMatch[] = [
  { t1:'TBD', f1:'?', t2:'TBD', f2:'?' },
  { t1:'TBD', f1:'?', t2:'TBD', f2:'?' },
];

const FINAL: BracketMatch = { t1:'TBD', f1:'?', t2:'TBD', f2:'?' };

/* ── Group table ── */
function GroupTable({ letter, teams }: { letter: string; teams: WCTeam[] }) {
  const sorted = [...teams].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '5px 10px', fontSize: '11px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px' }}>
        GROUP {letter}
      </div>
      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 22px 22px 22px 22px 22px 28px', gap: '2px', padding: '3px 8px', fontSize: '9px', color: 'var(--text3)' }}>
        <div>Team</div><div style={{ textAlign:'center' }}>P</div><div style={{ textAlign:'center' }}>W</div><div style={{ textAlign:'center' }}>D</div><div style={{ textAlign:'center' }}>L</div><div style={{ textAlign:'center' }}>GD</div><div style={{ textAlign:'center' }}>Pts</div>
      </div>
      {sorted.map((t, i) => (
        <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '1fr 22px 22px 22px 22px 22px 28px', gap: '2px', padding: '5px 8px', borderTop: '1px solid rgba(255,255,255,0.04)', background: i < 2 ? 'rgba(34,197,94,0.05)' : 'transparent', borderLeft: i < 2 ? '2px solid rgba(34,197,94,0.4)' : '2px solid transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
            <span style={{ fontSize: '13px' }}>{t.flag}</span>
            <span style={{ fontSize: '11px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
          </div>
          {[t.p, t.w, t.d, t.l, t.gf-t.ga].map((v, vi) => (
            <div key={vi} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text2)' }}>{vi === 4 && v > 0 ? `+${v}` : v}</div>
          ))}
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' }}>{t.pts}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Bracket match row ── */
function MatchRow({ m, round }: { m: BracketMatch; round?: string }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <span style={{ fontSize: '14px' }}>{m.f1}</span>
      <span style={{ fontSize: '12px', fontWeight: '600', color: m.done && m.s1! > m.s2! ? '#fff' : 'var(--text3)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.t1}</span>
      {m.done ? (
        <span style={{ fontSize: '13px', fontWeight: '700', color: '#fff', fontFamily: 'Poppins', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>{m.s1} – {m.s2}</span>
      ) : (
        <span style={{ fontSize: '11px', color: 'var(--text3)', flexShrink: 0 }}>vs</span>
      )}
      <span style={{ fontSize: '12px', fontWeight: '600', color: m.done && m.s2! > m.s1! ? '#fff' : 'var(--text3)', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.t2}</span>
      <span style={{ fontSize: '14px' }}>{m.f2}</span>
    </div>
  );
}

/* ── Bracket section ── */
function BracketSection({ label, matches }: { label: string; matches: BracketMatch[] }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>{label}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {matches.map((m, i) => <MatchRow key={i} m={m} />)}
      </div>
    </div>
  );
}

/* ── Main WC2026 component ── */
export default function WC2026() {
  const [view, setView] = useState<'groups' | 'bracket'>('groups');

  const btnStyle = (active: boolean): React.CSSProperties => ({
    flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600',
    background: active ? 'linear-gradient(135deg, var(--green), #16a34a)' : 'rgba(255,255,255,0.06)',
    color: active ? '#fff' : 'var(--text2)',
  });

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '12px' }}>
        <button style={btnStyle(view === 'groups')}  onClick={() => setView('groups')}>📊 Skupiny</button>
        <button style={btnStyle(view === 'bracket')} onClick={() => setView('bracket')}>🏆 Pavouk</button>
      </div>

      {view === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(GROUPS).map(([letter, teams]) => (
            <GroupTable key={letter} letter={letter} teams={teams} />
          ))}
        </div>
      )}

      {view === 'bracket' && (
        <div>
          <div style={{ fontSize: '11px', color: 'rgba(34,197,94,0.8)', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: '8px', padding: '5px 10px', marginBottom: '10px', textAlign: 'center' }}>
            ✓ Výsledky R16 · QF nezahájen
          </div>
          <BracketSection label="Round of 16" matches={R16} />
          <BracketSection label="Čtvrtfinále" matches={QF} />
          <BracketSection label="Semifinále"  matches={SF} />
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: 'var(--amber)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>🏆 Finále</div>
            <MatchRow m={FINAL} />
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
            Statická data · USA, Kanada, Mexiko 2026
          </div>
        </div>
      )}
    </div>
  );
}
