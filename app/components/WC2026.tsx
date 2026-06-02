'use client';

import { useState, useEffect, useMemo } from 'react';

/* ── Types ── */
interface WCTeam { name: string; flag: string; p: number; w: number; d: number; l: number; gf: number; ga: number; pts: number; }
interface BracketMatch { t1: string; f1: string; s1?: number; t2: string; f2: string; s2?: number; done?: boolean; }
interface WCMatch {
  id: string;
  group: string;
  matchday: 1 | 2 | 3;
  t1: string; f1: string;
  t2: string; f2: string;
  utc: string;          // ISO UTC datetime
  venueName: string;
  venueCity: string;
  s1?: number; s2?: number;
  status: 'upcoming' | 'live' | 'final';
}

/* ── Group standings ── */
const GROUPS: Record<string, WCTeam[]> = {
  A: [
    { name:'USA',          flag:'🇺🇸', p:3, w:2, d:1, l:0, gf:6, ga:2, pts:7 },
    { name:'Mexico',       flag:'🇲🇽', p:3, w:2, d:0, l:1, gf:4, ga:3, pts:6 },
    { name:'Bolivia',      flag:'🇧🇴', p:3, w:1, d:0, l:2, gf:2, ga:5, pts:3 },
    { name:'Saudi Arabia', flag:'🇸🇦', p:3, w:0, d:1, l:2, gf:1, ga:3, pts:1 },
  ],
  B: [
    { name:'Brazil',       flag:'🇧🇷', p:3, w:3, d:0, l:0, gf:8, ga:1, pts:9 },
    { name:'Germany',      flag:'🇩🇪', p:3, w:2, d:0, l:1, gf:5, ga:3, pts:6 },
    { name:'Australia',    flag:'🇦🇺', p:3, w:0, d:1, l:2, gf:2, ga:6, pts:1 },
    { name:'Honduras',     flag:'🇭🇳', p:3, w:0, d:1, l:2, gf:1, ga:6, pts:1 },
  ],
  C: [
    { name:'France',       flag:'🇫🇷', p:3, w:2, d:1, l:0, gf:7, ga:3, pts:7 },
    { name:'Argentina',    flag:'🇦🇷', p:3, w:2, d:0, l:1, gf:5, ga:4, pts:6 },
    { name:'Japan',        flag:'🇯🇵', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name:'Cameroon',     flag:'🇨🇲', p:3, w:0, d:0, l:3, gf:0, ga:5, pts:0 },
  ],
  D: [
    { name:'Spain',        flag:'🇪🇸', p:3, w:3, d:0, l:0, gf:9, ga:2, pts:9 },
    { name:'England',      flag:'🏴󠁧󠁢󠁥󠁮󠁧󠁿', p:3, w:1, d:1, l:1, gf:4, ga:4, pts:4 },
    { name:'Ecuador',      flag:'🇪🇨', p:3, w:1, d:1, l:1, gf:3, ga:4, pts:4 },
    { name:'Tunisia',      flag:'🇹🇳', p:3, w:0, d:0, l:3, gf:0, ga:6, pts:0 },
  ],
  E: [
    { name:'Netherlands',  flag:'🇳🇱', p:3, w:2, d:1, l:0, gf:5, ga:2, pts:7 },
    { name:'Belgium',      flag:'🇧🇪', p:3, w:2, d:0, l:1, gf:4, ga:3, pts:6 },
    { name:'Poland',       flag:'🇵🇱', p:3, w:1, d:0, l:2, gf:2, ga:4, pts:3 },
    { name:'Panama',       flag:'🇵🇦', p:3, w:0, d:1, l:2, gf:1, ga:3, pts:1 },
  ],
  F: [
    { name:'Portugal',     flag:'🇵🇹', p:3, w:2, d:1, l:0, gf:7, ga:3, pts:7 },
    { name:'South Korea',  flag:'🇰🇷', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name:'Nigeria',      flag:'🇳🇬', p:3, w:1, d:0, l:2, gf:2, ga:5, pts:3 },
    { name:'Costa Rica',   flag:'🇨🇷', p:3, w:1, d:0, l:2, gf:2, ga:4, pts:3 },
  ],
  G: [
    { name:'Canada',       flag:'🇨🇦', p:3, w:2, d:0, l:1, gf:4, ga:2, pts:6 },
    { name:'Morocco',      flag:'🇲🇦', p:3, w:2, d:0, l:1, gf:3, ga:2, pts:6 },
    { name:'Croatia',      flag:'🇭🇷', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name:'Algeria',      flag:'🇩🇿', p:3, w:0, d:1, l:2, gf:1, ga:4, pts:1 },
  ],
  H: [
    { name:'Ukraine',      flag:'🇺🇦', p:3, w:2, d:1, l:0, gf:5, ga:2, pts:7 },
    { name:'Colombia',     flag:'🇨🇴', p:3, w:1, d:1, l:1, gf:3, ga:3, pts:4 },
    { name:'Serbia',       flag:'🇷🇸', p:3, w:1, d:0, l:2, gf:3, ga:4, pts:3 },
    { name:'Iran',         flag:'🇮🇷', p:3, w:0, d:2, l:1, gf:1, ga:3, pts:2 },
  ],
};

/* ── Venues ── */
const VENUES = [
  { name:'Estadio Azteca',        city:'Mexico City',   tz:'America/Mexico_City' },
  { name:'MetLife Stadium',       city:'New York/NJ',   tz:'America/New_York'   },
  { name:'SoFi Stadium',          city:'Los Angeles',   tz:'America/Los_Angeles' },
  { name:'AT&T Stadium',          city:'Dallas',        tz:'America/Chicago'    },
  { name:'NRG Stadium',           city:'Houston',       tz:'America/Chicago'    },
  { name:'Levi\'s Stadium',       city:'San Francisco', tz:'America/Los_Angeles' },
  { name:'Hard Rock Stadium',     city:'Miami',         tz:'America/New_York'   },
  { name:'Lincoln Financial',     city:'Philadelphia',  tz:'America/New_York'   },
  { name:'Arrowhead Stadium',     city:'Kansas City',   tz:'America/Chicago'    },
  { name:'Lumen Field',           city:'Seattle',       tz:'America/Los_Angeles' },
  { name:'Empower Field',         city:'Denver',        tz:'America/Denver'     },
  { name:'BC Place',              city:'Vancouver',     tz:'America/Vancouver'  },
  { name:'BMO Field',             city:'Toronto',       tz:'America/Toronto'    },
  { name:'Estadio BBVA',          city:'Monterrey',     tz:'America/Monterrey'  },
  { name:'Estadio Akron',         city:'Guadalajara',   tz:'America/Mexico_City' },
];

/* ── Match generation ── */
// MD dates per group (Matchday 1, 2, 3)
const MD_DATES: Record<string, [string, string, string]> = {
  G: ['2026-06-11','2026-06-18','2026-06-25'],
  A: ['2026-06-12','2026-06-19','2026-06-26'],
  H: ['2026-06-12','2026-06-19','2026-06-26'],
  B: ['2026-06-13','2026-06-20','2026-06-27'],
  C: ['2026-06-14','2026-06-21','2026-06-28'],
  D: ['2026-06-15','2026-06-22','2026-06-29'],
  E: ['2026-06-16','2026-06-23','2026-06-30'],
  F: ['2026-06-17','2026-06-24','2026-07-01'],
};
// Times (UTC) for match A and B per matchday
const MATCH_TIMES_UTC = [
  { A: '18:00', B: '22:00' }, // MD1
  { A: '19:00', B: '23:00' }, // MD2
  { A: '20:00', B: '20:00' }, // MD3 (simultaneous)
];
// Venue index rotation per group
const VENUE_MAP: Record<string, [number,number,number,number,number,number]> = {
  A: [0,1,2,3,4,5], B:[5,6,7,8,9,10], C:[10,11,12,13,14,0],
  D: [1,2,3,4,5,6], E:[6,7,8,9,10,11],F:[11,12,13,14,0,1],
  G: [2,3,12,4,11,5],H:[0,13,14,7,8,9],
};

// Results for "played" matches (group stage is done in mock data)
const RESULTS: Record<string, [number,number]> = {
  'A-1-1':[2,2], 'A-1-2':[0,1], 'A-2-1':[2,0], 'A-2-2':[3,0], 'A-3-1':[2,0], 'A-3-2':[1,0],
  'B-1-1':[3,0], 'B-1-2':[1,1], 'B-2-1':[2,1], 'B-2-2':[2,0], 'B-3-1':[3,0], 'B-3-2':[0,0],
  'C-1-1':[3,1], 'C-1-2':[1,0], 'C-2-1':[2,1], 'C-2-2':[2,2], 'C-3-1':[2,1], 'C-3-2':[0,0],
  'D-1-1':[4,0], 'D-1-2':[2,2], 'D-2-1':[3,1], 'D-2-2':[1,0], 'D-3-1':[2,0], 'D-3-2':[1,1],
  'E-1-1':[2,1], 'E-1-2':[1,1], 'E-2-1':[2,0], 'E-2-2':[2,1], 'E-3-1':[2,0], 'E-3-2':[1,0],
  'F-1-1':[3,1], 'F-1-2':[0,0], 'F-2-1':[2,0], 'F-2-2':[2,0], 'F-3-1':[2,1], 'F-3-2':[0,0],
  'G-1-1':[1,0], 'G-1-2':[2,2], 'G-2-1':[1,2], 'G-2-2':[1,0], 'G-3-1':[2,1], 'G-3-2':[0,0],
  'H-1-1':[2,0], 'H-1-2':[2,2], 'H-2-1':[1,0], 'H-2-2':[1,1], 'H-3-1':[2,0], 'H-3-2':[1,0],
};

function buildMatches(): WCMatch[] {
  const matches: WCMatch[] = [];
  const PAIRINGS: [number,number][] = [[0,1],[2,3],[0,2],[1,3],[0,3],[1,2]]; // MD1×2, MD2×2, MD3×2

  Object.entries(GROUPS).forEach(([grp, teams]) => {
    const mdDates = MD_DATES[grp];
    const venueIdxs = VENUE_MAP[grp];
    let pairIdx = 0;
    for (let md = 1; md <= 3; md++) {
      const times = MATCH_TIMES_UTC[md - 1];
      const [mA, mB] = [times.A, times.B];
      const date = mdDates[md - 1];
      // match 1 of matchday
      const [i1,j1] = PAIRINGS[pairIdx];
      const id1 = `${grp}-${md}-1`;
      const res1 = RESULTS[id1];
      const v1 = VENUES[venueIdxs[pairIdx]];
      matches.push({
        id: id1, group: grp, matchday: md as 1|2|3,
        t1: teams[i1].name, f1: teams[i1].flag,
        t2: teams[j1].name, f2: teams[j1].flag,
        utc: `${date}T${mA}:00Z`,
        venueName: v1.name, venueCity: v1.city,
        s1: res1?.[0], s2: res1?.[1],
        status: res1 ? 'final' : 'upcoming',
      });
      // match 2 of matchday
      pairIdx++;
      const [i2,j2] = PAIRINGS[pairIdx];
      const id2 = `${grp}-${md}-2`;
      const res2 = RESULTS[id2];
      const v2 = VENUES[venueIdxs[pairIdx]];
      matches.push({
        id: id2, group: grp, matchday: md as 1|2|3,
        t1: teams[i2].name, f1: teams[i2].flag,
        t2: teams[j2].name, f2: teams[j2].flag,
        utc: `${date}T${mB}:00Z`,
        venueName: v2.name, venueCity: v2.city,
        s1: res2?.[0], s2: res2?.[1],
        status: res2 ? 'final' : 'upcoming',
      });
      pairIdx++;
    }
  });
  return matches.sort((a, b) => a.utc.localeCompare(b.utc));
}

const ALL_MATCHES = buildMatches();

/* ── Timezone helpers ── */
const EN_DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const EN_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatMatchTime(utcStr: string, userTz: string): { line1: string; time: string; tzAbbr: string } {
  const date = new Date(utcStr);
  const inTz = new Date(date.toLocaleString('en-US', { timeZone: userTz }));
  const day = EN_DAYS[inTz.getDay()];
  const month = EN_MONTHS[inTz.getMonth()];
  const dayNum = inTz.getDate();

  const time = new Intl.DateTimeFormat('en-US', {
    timeZone: userTz, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date);

  const tzAbbr = new Intl.DateTimeFormat('en-US', {
    timeZone: userTz, timeZoneName: 'short',
  }).formatToParts(date).find(p => p.type === 'timeZoneName')?.value ?? '';

  return {
    line1: `${day} ${dayNum} ${month}`,
    time,
    tzAbbr,
  };
}

function isToday(utcStr: string, userTz: string): boolean {
  const match = new Date(utcStr).toLocaleDateString('en-US', { timeZone: userTz });
  const today = new Date().toLocaleDateString('en-US', { timeZone: userTz });
  return match === today;
}

/* ── Match card ── */
function MatchCard({ m, userTz, onClick }: { m: WCMatch; userTz: string; onClick: () => void }) {
  const fmt = formatMatchTime(m.utc, userTz);
  const today = isToday(m.utc, userTz);
  const isDone = m.status === 'final';

  return (
    <div onClick={onClick} style={{
      padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
      background: today ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
      border: today ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(255,255,255,0.05)',
      transition: 'background 0.15s, border-color 0.15s',
    }}
    onMouseEnter={e => { const d = e.currentTarget; d.style.background = 'rgba(93,76,255,0.08)'; d.style.borderColor = 'rgba(93,76,255,0.2)'; }}
    onMouseLeave={e => { const d = e.currentTarget; d.style.background = today ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)'; d.style.borderColor = today ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)'; }}>
      {/* Date/time row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '5px' }}>
        <span style={{ fontSize: '10px', color: today ? 'var(--green2)' : 'var(--text3)', fontWeight: today ? '700' : '400' }}>
          {fmt.line1} · {fmt.time} {fmt.tzAbbr}
        </span>
        <span style={{ marginLeft: 'auto', fontSize: '9px', color: 'var(--text3)', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', padding: '1px 5px' }}>
          {m.venueName}, {m.venueCity}
        </span>
      </div>
      {/* Teams + score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '16px' }}>{m.f1}</span>
        <span style={{ fontSize: '12px', fontWeight: '600', color: isDone && (m.s1! > m.s2!) ? '#fff' : 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.t1}</span>
        {isDone ? (
          <span style={{ fontSize: '14px', fontWeight: '800', fontFamily: 'Poppins', color: '#fff', flexShrink: 0 }}>
            {m.s1} – {m.s2}
          </span>
        ) : (
          <span style={{ fontSize: '12px', color: 'var(--text3)', flexShrink: 0 }}>vs</span>
        )}
        <span style={{ fontSize: '12px', fontWeight: '600', color: isDone && (m.s2! > m.s1!) ? '#fff' : 'var(--text2)', flex: 1, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.t2}</span>
        <span style={{ fontSize: '16px' }}>{m.f2}</span>
      </div>
    </div>
  );
}

/* ── Match detail popup ── */
function MatchDetail({ m, userTz, onClose }: { m: WCMatch; userTz: string; onClose: () => void }) {
  const fmt = formatMatchTime(m.utc, userTz);
  const isDone = m.status === 'final';
  const groupTeams = GROUPS[m.group];
  const t1data = groupTeams.find(t => t.name === m.t1);
  const t2data = groupTeams.find(t => t.name === m.t2);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '380px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'wDetailIn 0.2s ease', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text3)', fontSize: '13px' }}>✕</button>

        {/* Group badge */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '16px', alignItems: 'center' }}>
          <span style={{ fontSize: '10px', fontWeight: '700', color: 'var(--green2)', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: '6px', padding: '2px 8px', letterSpacing: '1px' }}>
            GROUP {m.group}
          </span>
          <span style={{ fontSize: '10px', color: 'var(--text3)', background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '2px 8px' }}>
            Matchday {m.matchday}
          </span>
          {isDone && (
            <span style={{ fontSize: '10px', color: '#fff', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', padding: '2px 8px' }}>Final</span>
          )}
        </div>

        {/* Teams + score */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          {/* Team 1 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', lineHeight: 1 }}>{m.f1}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{m.t1}</div>
            {t1data && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{t1data.pts} pts</div>}
          </div>
          {/* Score / VS */}
          <div style={{ textAlign: 'center', flexShrink: 0 }}>
            {isDone ? (
              <div style={{ fontFamily: 'Poppins', fontSize: '32px', fontWeight: '900', color: '#fff', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {m.s1} – {m.s2}
              </div>
            ) : (
              <>
                <div style={{ fontFamily: 'Poppins', fontSize: '22px', fontWeight: '700', color: 'var(--text3)' }}>vs</div>
                <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '2px' }}>⚽ WC 2026</div>
              </>
            )}
          </div>
          {/* Team 2 */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '40px', lineHeight: 1 }}>{m.f2}</div>
            <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff', marginTop: '4px' }}>{m.t2}</div>
            {t2data && <div style={{ fontSize: '10px', color: 'var(--text3)', marginTop: '1px' }}>{t2data.pts} pts</div>}
          </div>
        </div>

        {/* Date, time, venue */}
        <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px' }}>📅</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{fmt.line1}</div>
              <div style={{ fontSize: '12px', color: 'var(--purple3)', fontWeight: '700' }}>
                {fmt.time} {fmt.tzAbbr}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ fontSize: '14px' }}>🏟️</span>
            <div>
              <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff' }}>{m.venueName}</div>
              <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{m.venueCity}</div>
            </div>
          </div>
        </div>

        <style>{`@keyframes wDetailIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}`}</style>
      </div>
    </div>
  );
}

/* ── Group table ── */
function GroupTable({ letter, teams }: { letter: string; teams: WCTeam[] }) {
  const sorted = [...teams].sort((a, b) => b.pts - a.pts || (b.gf - b.ga) - (a.gf - a.ga));
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
      <div style={{ background: 'rgba(255,255,255,0.04)', padding: '5px 10px', fontSize: '11px', fontWeight: '700', color: 'var(--green2)', letterSpacing: '1px' }}>GROUP {letter}</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 22px 22px 22px 22px 22px 28px', gap: '2px', padding: '3px 8px', fontSize: '9px', color: 'var(--text3)' }}>
        <div>Team</div><div style={{textAlign:'center'}}>P</div><div style={{textAlign:'center'}}>V</div><div style={{textAlign:'center'}}>R</div><div style={{textAlign:'center'}}>P</div><div style={{textAlign:'center'}}>GD</div><div style={{textAlign:'center'}}>B</div>
      </div>
      {sorted.map((t, i) => (
        <div key={t.name} style={{ display: 'grid', gridTemplateColumns: '1fr 22px 22px 22px 22px 22px 28px', gap: '2px', padding: '5px 8px', borderTop: '1px solid rgba(255,255,255,0.04)', background: i < 2 ? 'rgba(34,197,94,0.05)' : 'transparent', borderLeft: i < 2 ? '2px solid rgba(34,197,94,0.4)' : '2px solid transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
            <span style={{ fontSize: '12px' }}>{t.flag}</span>
            <span style={{ fontSize: '11px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
          </div>
          {[t.p, t.w, t.d, t.l].map((v, vi) => (
            <div key={vi} style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text2)' }}>{v}</div>
          ))}
          <div style={{ textAlign: 'center', fontSize: '11px', color: t.gf-t.ga > 0 ? 'var(--green2)' : 'var(--text2)' }}>{t.gf-t.ga > 0 ? `+${t.gf-t.ga}` : t.gf-t.ga}</div>
          <div style={{ textAlign: 'center', fontSize: '12px', fontWeight: '700', color: '#fff' }}>{t.pts}</div>
        </div>
      ))}
    </div>
  );
}

/* ── Bracket ── */
const R16: BracketMatch[] = [
  { t1:'USA',f1:'🇺🇸',s1:2,t2:'Germany',f2:'🇩🇪',s2:1,done:true },
  { t1:'Brazil',f1:'🇧🇷',s1:3,t2:'Mexico',f2:'🇲🇽',s2:0,done:true },
  { t1:'France',f1:'🇫🇷',s1:2,t2:'England',f2:'🏴󠁧󠁢󠁥󠁮󠁧󠁿',s2:1,done:true },
  { t1:'Spain',f1:'🇪🇸',s1:2,t2:'Argentina',f2:'🇦🇷',s2:2,done:false },
  { t1:'Netherlands',f1:'🇳🇱',s1:1,t2:'South Korea',f2:'🇰🇷',s2:0,done:true },
  { t1:'Portugal',f1:'🇵🇹',s1:2,t2:'Belgium',f2:'🇧🇪',s2:1,done:true },
  { t1:'Canada',f1:'🇨🇦',s1:1,t2:'Ukraine',f2:'🇺🇦',s2:0,done:true },
  { t1:'Morocco',f1:'🇲🇦',s1:1,t2:'Colombia',f2:'🇨🇴',s2:0,done:true },
];
const QF: BracketMatch[] = [
  { t1:'USA',f1:'🇺🇸',t2:'Brazil',f2:'🇧🇷' },
  { t1:'France',f1:'🇫🇷',t2:'Spain',f2:'🇪🇸' },
  { t1:'Netherlands',f1:'🇳🇱',t2:'Portugal',f2:'🇵🇹' },
  { t1:'Canada',f1:'🇨🇦',t2:'Morocco',f2:'🇲🇦' },
];
const SF: BracketMatch[]  = [{ t1:'TBD',f1:'?',t2:'TBD',f2:'?' },{ t1:'TBD',f1:'?',t2:'TBD',f2:'?' }];
const FINAL: BracketMatch = { t1:'TBD',f1:'?',t2:'TBD',f2:'?' };

function BracketRow({ m }: { m: BracketMatch }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'8px',padding:'6px 10px',display:'flex',alignItems:'center',gap:'4px' }}>
      <span style={{ fontSize:'14px' }}>{m.f1}</span>
      <span style={{ fontSize:'12px',fontWeight:'600',color:m.done&&m.s1!>m.s2!?'#fff':'var(--text3)',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.t1}</span>
      {m.done ? <span style={{ fontSize:'13px',fontWeight:'700',color:'#fff',fontFamily:'Poppins',fontVariantNumeric:'tabular-nums',flexShrink:0 }}>{m.s1}–{m.s2}</span>
              : <span style={{ fontSize:'11px',color:'var(--text3)',flexShrink:0 }}>vs</span>}
      <span style={{ fontSize:'12px',fontWeight:'600',color:m.done&&m.s2!>m.s1!?'#fff':'var(--text3)',flex:1,textAlign:'right',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{m.t2}</span>
      <span style={{ fontSize:'14px' }}>{m.f2}</span>
    </div>
  );
}

/* ── Main component ── */
export default function WC2026() {
  const [view, setView]   = useState<'matches' | 'groups' | 'bracket'>('matches');
  const [filterGroup, setFilterGroup] = useState<string>('All');
  const [filterMD, setFilterMD]       = useState<number>(0); // 0 = all
  const [selected, setSelected]       = useState<WCMatch | null>(null);
  const [userTz, setUserTz]           = useState('Europe/Prague');

  useEffect(() => {
    try {
      setUserTz(Intl.DateTimeFormat().resolvedOptions().timeZone);
    } catch {}
  }, []);

  const filtered = useMemo(() => {
    return ALL_MATCHES.filter(m =>
      (filterGroup === 'All' || m.group === filterGroup) &&
      (filterMD === 0 || m.matchday === filterMD)
    );
  }, [filterGroup, filterMD]);

  // Group matches by date for display
  const byDate = useMemo(() => {
    const map = new Map<string, WCMatch[]>();
    filtered.forEach(m => {
      const date = new Date(m.utc).toLocaleDateString('en-US', { timeZone: userTz, year: 'numeric', month: '2-digit', day: '2-digit' });
      if (!map.has(date)) map.set(date, []);
      map.get(date)!.push(m);
    });
    return map;
  }, [filtered, userTz]);

  const viewBtn = (v: typeof view): React.CSSProperties => ({
    flex: 1, padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer',
    fontSize: '11px', fontWeight: '600',
    background: view === v ? 'linear-gradient(135deg, #16a34a, #15803d)' : 'rgba(255,255,255,0.06)',
    color: view === v ? '#fff' : 'var(--text2)',
  });

  const filterBtn = (active: boolean): React.CSSProperties => ({
    padding: '3px 8px', borderRadius: '6px', border: 'none', cursor: 'pointer',
    fontSize: '11px', fontWeight: active ? '700' : '400',
    background: active ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.04)',
    color: active ? 'var(--green2)' : 'var(--text3)',
    outline: active ? '1px solid rgba(34,197,94,0.35)' : 'none',
  });

  return (
    <div>
      {/* View toggle */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
        <button style={viewBtn('matches')} onClick={() => setView('matches')}>📅 Matches</button>
        <button style={viewBtn('groups')}  onClick={() => setView('groups')}>📊 Groups</button>
        <button style={viewBtn('bracket')} onClick={() => setView('bracket')}>🏆 Bracket</button>
      </div>

      {/* MATCHES view */}
      {view === 'matches' && (
        <>
          {/* Filters */}
          <div style={{ marginBottom: '8px' }}>
            {/* Group filter */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '5px' }}>
              {['All','A','B','C','D','E','F','G','H'].map(g => (
                <button key={g} style={filterBtn(filterGroup === g)} onClick={() => setFilterGroup(g)}>
                  {g === 'All' ? 'All' : `Group ${g}`}
                </button>
              ))}
            </div>
            {/* Matchday filter */}
            <div style={{ display: 'flex', gap: '4px' }}>
              {[0,1,2,3].map(md => (
                <button key={md} style={filterBtn(filterMD === md)} onClick={() => setFilterMD(md)}>
                  {md === 0 ? 'All' : `Round ${md}`}
                </button>
              ))}
            </div>
          </div>

          {/* Timezone info */}
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '8px' }}>
            🕐 Your timezone: <span style={{ color: 'var(--purple3)' }}>{userTz.replace('_',' ')}</span>
          </div>

          {/* Match list grouped by date */}
          <div style={{ maxHeight: '440px', overflowY: 'auto', paddingRight: '2px' }}>
            {Array.from(byDate.entries()).map(([dateKey, dayMatches]) => {
              const firstDate = new Date(dayMatches[0].utc);
              const inTz = new Date(firstDate.toLocaleString('en-US', { timeZone: userTz }));
              const czDay = EN_DAYS[inTz.getDay()];
              const czMonth = EN_MONTHS[inTz.getMonth()];
              const dayNum = inTz.getDate();
              const todayStr = new Date().toLocaleDateString('en-US', { timeZone: userTz });
              const isToday_ = dateKey === todayStr;
              return (
                <div key={dateKey} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: isToday_ ? 'var(--green2)' : 'var(--text3)', marginBottom: '5px', letterSpacing: '0.3px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isToday_ && <span style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '4px', padding: '1px 5px', fontSize: '9px' }}>TODAY</span>}
                    {czDay} {dayNum} {czMonth}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {dayMatches.map(m => (
                      <MatchCard key={m.id} m={m} userTz={userTz} onClick={() => setSelected(m)} />
                    ))}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ textAlign:'center',padding:'2rem',color:'var(--text3)',fontSize:'13px' }}>
                No matches for the selected filter
              </div>
            )}
          </div>
          <div style={{ fontSize:'10px',color:'var(--text3)',textAlign:'center',marginTop:'6px' }}>
            {ALL_MATCHES.length} group stage matches · {ALL_MATCHES.filter(m => m.status === 'final').length} played
          </div>
        </>
      )}

      {/* GROUPS view */}
      {view === 'groups' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          {Object.entries(GROUPS).map(([letter, teams]) => <GroupTable key={letter} letter={letter} teams={teams} />)}
        </div>
      )}

      {/* BRACKET view */}
      {view === 'bracket' && (
        <div>
          <div style={{ fontSize:'11px',color:'rgba(34,197,94,0.8)',background:'rgba(34,197,94,0.06)',border:'1px solid rgba(34,197,94,0.15)',borderRadius:'8px',padding:'5px 10px',marginBottom:'10px',textAlign:'center' }}>
            ✓ R16 results in · QF not started
          </div>
          {[{ label:'ROUND OF 16',matches:R16 },{ label:'QUARTER-FINALS',matches:QF },{ label:'SEMI-FINALS',matches:SF }].map(r => (
            <div key={r.label} style={{ marginBottom:'10px' }}>
              <div style={{ fontSize:'10px',color:'var(--text3)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px' }}>{r.label}</div>
              <div style={{ display:'flex',flexDirection:'column',gap:'3px' }}>{r.matches.map((m,i) => <BracketRow key={i} m={m} />)}</div>
            </div>
          ))}
          <div style={{ marginBottom:'10px' }}>
            <div style={{ fontSize:'10px',color:'var(--amber)',letterSpacing:'1px',textTransform:'uppercase',marginBottom:'4px' }}>🏆 FINAL</div>
            <BracketRow m={FINAL} />
          </div>
        </div>
      )}

      {/* Match detail popup */}
      {selected && <MatchDetail m={selected} userTz={userTz} onClose={() => setSelected(null)} />}
    </div>
  );
}
