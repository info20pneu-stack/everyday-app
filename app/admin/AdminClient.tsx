'use client';

import { useState, useEffect, useCallback } from 'react';
import Flag from '../components/Flag';
import ModerationPanel from './ModerationPanel';

/* ═══════════════════════ Types ═══════════════════════ */

type Stats = {
  today: number;
  week: number;
  month: number;
  activeUsers: number;
  topPages: { key: string; count: number }[];
  topCountries: { key: string; count: number }[];
  series: { date: string; visits: number }[];
};

type LBSummary = {
  games: { game: string; players: number }[];
  totalPlayers: number;
  mostPlayed: { game: string; players: number } | null;
};

type SuggestionStatus = 'Navrženo' | 'Zvažujeme' | 'Plánováno' | 'V vývoji' | 'Hotovo' | 'Zamítnuto';

type Suggestion = {
  id: string;
  title: string;
  description: string;
  email?: string;
  status: SuggestionStatus;
  votes: number;
  createdAt: number;
};

type Tab = 'overview' | 'leaderboard' | 'moderation' | 'suggestions';

/* ═══════════════════════ Shared styles ═══════════════════════ */

const card: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  boxShadow: 'var(--card-shadow)',
  padding: '1.25rem',
};

const cardTitle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text3)',
  letterSpacing: '1px',
  textTransform: 'uppercase',
  marginBottom: '0.85rem',
  fontFamily: 'Poppins, sans-serif',
};

const STATUS_COLORS: Record<SuggestionStatus, string> = {
  'Navrženo': '#8E8E9E',
  'Zvažujeme': '#60A5FA',
  'Plánováno': '#8475FF',
  'V vývoji': '#FFB300',
  'Hotovo': '#4ADE80',
  'Zamítnuto': '#F87171',
};


function fmtDate(d: string): string {
  const [, m, day] = d.split('-');
  return `${day}.${m}.`;
}

function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return String(n);
}

/* ═══════════════════════ Stat tile ═══════════════════════ */

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ ...card, textAlign: 'center', padding: '1rem 0.75rem' }}>
      <div style={{
        fontFamily: 'Poppins', fontSize: '26px', fontWeight: '800', color: '#fff',
        lineHeight: 1.1,
      }}>
        {fmtCompact(value)}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '4px' }}>{label}</div>
    </div>
  );
}

/* ═══════════════════════ 30-day visits chart ═══════════════════════ */

function VisitsChart({ series }: { series: { date: string; visits: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...series.map(d => d.visits), 1);
  const H = 130, PT = 8, PB = 20;
  const CH = H - PT - PB;
  const gap = 2;
  const n = series.length || 1;

  return (
    <div>
      <svg width="100%" viewBox={`0 0 300 ${H}`} preserveAspectRatio="none" style={{ display: 'block', overflow: 'visible' }}>
        {/* Gridlines: 0 and max */}
        <line x1={0} y1={PT + CH} x2={300} y2={PT + CH} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1={0} y1={PT} x2={300} y2={PT} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

        {series.map((d, i) => {
          const barW = 300 / n - gap;
          const x = i * (300 / n) + gap / 2;
          const h = Math.max(1, (d.visits / max) * CH);
          const y = PT + CH - h;
          const isHover = hover === i;
          return (
            <rect
              key={d.date}
              x={x} y={y} width={Math.max(barW, 0.5)} height={h}
              rx={Math.min(2, barW / 2)} ry={2}
              fill={isHover ? 'var(--purple3)' : 'var(--purple)'}
              style={{ transition: 'fill 0.1s', cursor: 'pointer' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(h => (h === i ? null : h))}
              tabIndex={0}
              onFocus={() => setHover(i)}
              onBlur={() => setHover(h => (h === i ? null : h))}
            />
          );
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>
        <span>{series[0] ? fmtDate(series[0].date) : ''}</span>
        <span>{series[Math.floor(series.length / 2)] ? fmtDate(series[Math.floor(series.length / 2)].date) : ''}</span>
        <span>{series[series.length - 1] ? fmtDate(series[series.length - 1].date) : ''}</span>
      </div>
      <div style={{
        marginTop: '8px', fontSize: '12px', color: 'var(--text2)', textAlign: 'center',
        minHeight: '18px',
      }}>
        {hover !== null && series[hover]
          ? <>
              <strong style={{ color: '#fff' }}>{series[hover].visits.toLocaleString('en-US')}</strong>
              {' '}návštěv · {series[hover].date}
            </>
          : <span style={{ color: 'var(--text3)' }}>Najetím na sloupec zobrazíte detail</span>}
      </div>
    </div>
  );
}

/* ═══════════════════════ Login screen ═══════════════════════ */

function LoginScreen({ onLogin, error, busy }: {
  onLogin: (password: string) => void;
  error: string;
  busy: boolean;
}) {
  const [password, setPassword] = useState('');
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg1)', padding: '1.25rem',
    }}>
      <form
        onSubmit={e => { e.preventDefault(); if (password.trim()) onLogin(password); }}
        style={{ ...card, width: '100%', maxWidth: '340px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{ fontSize: '32px', marginBottom: '0.5rem' }}>🔒</div>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '17px', color: '#fff', fontWeight: '700' }}>Admin přístup</h1>
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Heslo"
          style={{
            width: '100%', background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px',
            color: '#fff', fontSize: '14px', padding: '10px 14px',
            marginBottom: '0.75rem', outline: 'none', boxSizing: 'border-box',
          }}
        />
        {error && (
          <div style={{ color: '#F87171', fontSize: '12px', marginBottom: '0.75rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={busy || !password.trim()}
          style={{
            width: '100%',
            background: busy ? 'rgba(255,255,255,0.06)' : 'linear-gradient(135deg, var(--purple), var(--purple2))',
            border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: '600',
            padding: '10px', cursor: busy ? 'not-allowed' : 'pointer',
          }}
        >
          {busy ? 'Přihlašuji…' : 'Přihlásit se'}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════════════ Main client ═══════════════════════ */

export default function AdminClient() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [loginError, setLoginError] = useState('');
  const [loginBusy, setLoginBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [lb, setLb] = useState<LBSummary | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, lbRes, sugRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/leaderboard-summary'),
        fetch('/api/suggestions'),
      ]);
      if (statsRes.status === 401 || lbRes.status === 401) {
        setAuthed(false);
        return;
      }
      setAuthed(true);
      if (statsRes.ok) setStats(await statsRes.json());
      if (lbRes.ok) setLb(await lbRes.json());
      if (sugRes.ok) setSuggestions(await sugRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function handleLogin(password: string) {
    setLoginBusy(true);
    setLoginError('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setLoginError(d.error || 'Nesprávné heslo');
        return;
      }
      await loadAll();
    } finally {
      setLoginBusy(false);
    }
  }

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthed(false);
    setStats(null);
    setLb(null);
    setSuggestions([]);
  }

  async function updateStatus(id: string, status: SuggestionStatus) {
    setActionBusyId(id);
    try {
      const res = await fetch(`/api/suggestions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setSuggestions(prev => prev.map(s => (s.id === id ? updated : s)));
      }
    } finally {
      setActionBusyId(null);
    }
  }

  if (authed === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg1)', color: 'var(--text3)' }}>
        Načítám…
      </div>
    );
  }

  if (authed === false) {
    return <LoginScreen onLogin={handleLogin} error={loginError} busy={loginBusy} />;
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg1)' }}>
      <div className="adm-wrap">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h1 style={{ fontFamily: 'Poppins', fontSize: '18px', fontWeight: '800', color: '#fff' }}>
            ⚙️ Admin
          </h1>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={loadAll}
              disabled={refreshing}
              style={{
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px', color: 'var(--text2)', fontSize: '12px', padding: '6px 12px',
                cursor: refreshing ? 'default' : 'pointer',
              }}
            >
              {refreshing ? '⏳' : '↺'} Obnovit
            </button>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '8px', color: '#F87171', fontSize: '12px', padding: '6px 12px', cursor: 'pointer',
              }}
            >
              Odhlásit
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="adm-tabs" style={{ display: 'flex', gap: '6px', marginBottom: '1.25rem' }}>
          {([
            ['overview', '📊 Přehled'],
            ['leaderboard', '🏆 Žebříčky'],
            ['moderation', '🛡️ Moderace'],
            ['suggestions', '💡 Návrhy'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                flex: 1,
                background: tab === id ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.04)',
                border: tab === id ? 'none' : '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px', color: tab === id ? '#fff' : 'var(--text3)',
                fontSize: '12px', fontWeight: '600', padding: '9px 6px', cursor: 'pointer',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === 'overview' && stats && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="adm-stat-grid">
              <StatTile label="Dnes" value={stats.today} />
              <StatTile label="Týden" value={stats.week} />
              <StatTile label="Měsíc" value={stats.month} />
              <StatTile label="Aktivní teď" value={stats.activeUsers} />
            </div>

            <div style={card}>
              <div style={cardTitle}>Návštěvnost — posledních 30 dní</div>
              <VisitsChart series={stats.series} />
            </div>

            <div className="adm-two-col">
              <div style={card}>
                <div style={cardTitle}>Top 10 stránek</div>
                {stats.topPages.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>Zatím žádná data</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.topPages.map((p, i) => (
                      <div key={p.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text3)', width: '16px' }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: '12px', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.key}
                        </span>
                        <span style={{ fontSize: '12px', color: 'var(--purple3)', fontWeight: '600' }}>{p.count.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div style={card}>
                <div style={cardTitle}>Top 10 zemí</div>
                {stats.topCountries.length === 0 ? (
                  <div style={{ color: 'var(--text3)', fontSize: '13px', textAlign: 'center', padding: '1rem 0' }}>Zatím žádná data</div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {stats.topCountries.map((c, i) => (
                      <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text3)', width: '16px' }}>{i + 1}</span>
                        <span style={{ display: 'inline-flex', width: '20px' }}>{c.key && c.key !== 'XX' ? <Flag code={c.key} size={18} /> : '🏳️'}</span>
                        <span style={{ flex: 1, fontSize: '12px', color: '#fff' }}>{c.key}</span>
                        <span style={{ fontSize: '12px', color: 'var(--purple3)', fontWeight: '600' }}>{c.count.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard */}
        {tab === 'leaderboard' && lb && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="adm-stat-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <StatTile label="Celkem hráčů" value={lb.totalPlayers} />
              <div style={{ ...card, textAlign: 'center', padding: '1rem 0.75rem' }}>
                <div style={{ fontSize: '20px', marginBottom: '2px' }}>🏆</div>
                <div style={{ fontFamily: 'Poppins', fontSize: '14px', fontWeight: '700', color: '#fff' }}>
                  {lb.mostPlayed?.game ?? '—'}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text3)', marginTop: '2px' }}>Nejhranější hra</div>
              </div>
            </div>

            <div style={card}>
              <div style={cardTitle}>Hry podle počtu hráčů</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {lb.games.map(g => {
                  const maxPlayers = lb.games[0]?.players ?? 0;
                  const pct = maxPlayers > 0 ? (g.players / maxPlayers) * 100 : 0;
                  return (
                    <div key={g.game}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '3px' }}>
                        <span style={{ color: '#fff' }}>{g.game}</span>
                        <span style={{ color: 'var(--text3)' }}>{g.players}</span>
                      </div>
                      <div style={{ height: '6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--purple), var(--purple3))', borderRadius: '4px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Suggestions */}
        {tab === 'moderation' && <ModerationPanel />}

        {tab === 'suggestions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {suggestions.length === 0 ? (
              <div style={{ ...card, textAlign: 'center', color: 'var(--text3)', fontSize: '13px' }}>Zatím žádné návrhy</div>
            ) : suggestions.map(s => (
              <div key={s.id} style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{s.title}</div>
                  <span style={{
                    fontSize: '12px', fontWeight: '700', whiteSpace: 'nowrap',
                    color: STATUS_COLORS[s.status], background: `${STATUS_COLORS[s.status]}1a`,
                    border: `1px solid ${STATUS_COLORS[s.status]}44`, borderRadius: '6px', padding: '2px 8px',
                  }}>
                    {s.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '8px', lineHeight: 1.4 }}>
                  {s.description}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
                    👍 {s.votes} · {new Date(s.createdAt).toLocaleDateString('cs-CZ')}
                    {s.email && <> · {s.email}</>}
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => updateStatus(s.id, 'Plánováno')}
                      disabled={actionBusyId === s.id}
                      style={{
                        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                        borderRadius: '7px', color: '#4ADE80', fontSize: '12px', fontWeight: '600',
                        padding: '5px 10px', cursor: 'pointer',
                      }}
                    >
                      ✓ Schválit
                    </button>
                    <button
                      onClick={() => updateStatus(s.id, 'Zamítnuto')}
                      disabled={actionBusyId === s.id}
                      style={{
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
                        borderRadius: '7px', color: '#F87171', fontSize: '12px', fontWeight: '600',
                        padding: '5px 10px', cursor: 'pointer',
                      }}
                    >
                      ✕ Zamítnout
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .adm-wrap {
          max-width: 900px;
          margin: 0 auto;
          padding: 1.25rem;
        }
        .adm-stat-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .adm-two-col {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 640px) {
          .adm-stat-grid { grid-template-columns: repeat(4, 1fr); }
          .adm-two-col { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
    </div>
  );
}
