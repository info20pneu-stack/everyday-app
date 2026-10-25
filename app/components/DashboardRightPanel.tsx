'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import { useTheme } from '../../lib/ThemeContext';
import { useReveal } from '../../lib/useReveal';

type League = 'nhl' | 'nba' | 'nfl';
type GameStatus = 'live' | 'final' | 'upcoming';

type MiniGame = {
  id: string;
  league: League;
  homeAbbr: string;
  awayAbbr: string;
  homeColor: string;
  awayColor: string;
  homeScore?: number;
  awayScore?: number;
  status: GameStatus;
  clock?: string;
  /** Start time (ISO) */
  date?: string;
};

type MiniCoin = {
  id: string;
  symbol: string;
  image: string;
  price: number;
  changePct: number;
};

const LEAGUES: League[] = ['nhl', 'nba', 'nfl'];
const LEAGUE_EMOJI: Record<League, string> = { nhl: '🏒', nba: '🏀', nfl: '🏈' };

function parseStatus(status: any): GameStatus {
  const name: string = status?.type?.name ?? '';
  if (name.startsWith('STATUS_FINAL') || name === 'STATUS_FULL_TIME') return 'final';
  if (name === 'STATUS_SCHEDULED') return 'upcoming';
  return 'live';
}

function teamColor(team: any): string {
  return team?.color ? '#' + team.color : '#445566';
}

async function fetchLeague(league: League): Promise<MiniGame[]> {
  const res = await fetch(`/api/sports/${league}`);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.events ?? []).flatMap((event: any): MiniGame[] => {
    const comp = event.competitions?.[0];
    const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
    const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
    if (!home || !away) return [];
    return [{
      id: event.id,
      league,
      homeAbbr: home.team?.abbreviation ?? '?',
      awayAbbr: away.team?.abbreviation ?? '?',
      homeColor: teamColor(home.team),
      awayColor: teamColor(away.team),
      homeScore: home.score != null ? Math.round(parseFloat(home.score)) : undefined,
      awayScore: away.score != null ? Math.round(parseFloat(away.score)) : undefined,
      status: parseStatus(comp?.status),
      clock: comp?.status?.displayClock,
      date: event.date ?? comp?.date,
    }];
  });
}

const COINGECKO_URL =
  'https://api.coingecko.com/api/v3/coins/markets' +
  '?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false&price_change_percentage=24h';

async function fetchTopCoins(): Promise<MiniCoin[]> {
  const res = await fetch(COINGECKO_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return data.map((c: any) => ({
    id: c.id,
    symbol: c.symbol,
    image: c.image,
    price: c.current_price,
    changePct: c.price_change_percentage_24h ?? 0,
  }));
}

function formatPrice(price: number): string {
  if (price >= 1) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
  return price.toPrecision(3);
}

/** Kick-off in the visitor's time zone: time + "today" / "tomorrow" / short weekday and date. */
function startLabel(iso: string | undefined, lang: string): { time: string; day: string } | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const time = d.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(d) - startOf(new Date())) / 86400000);
  const day = diff === 0 || diff === 1
    ? new Intl.RelativeTimeFormat(lang, { numeric: 'auto' }).format(diff, 'day')
    : d.toLocaleDateString(lang, { weekday: 'short', day: 'numeric', month: 'numeric' });
  return { time, day };
}

const STATUS_PRIORITY: Record<GameStatus, number> = { live: 0, upcoming: 1, final: 2 };

export default function DashboardRightPanel() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const panelRef = useReveal<HTMLElement>();
  const [gamesByLeague, setGamesByLeague] = useState<Record<League, MiniGame[]>>({ nhl: [], nba: [], nfl: [] });
  const [activeLeague, setActiveLeague] = useState<League>('nhl');
  const [coins, setCoins] = useState<MiniCoin[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);
  const [coinsLoading, setCoinsLoading] = useState(true);
  const isRetro = theme === 'xp' || theme === 'win98' || theme === 'win2000';

  useEffect(() => {
    if (isRetro) return;
    let cancelled = false;
    async function loadGames() {
      try {
        const [nhl, nba, nfl] = await Promise.all([fetchLeague('nhl'), fetchLeague('nba'), fetchLeague('nfl')]);
        if (cancelled) return;
        setGamesByLeague({ nhl, nba, nfl });
      } catch { /* keep previous games on failure */ }
      finally { if (!cancelled) setGamesLoading(false); }
    }
    loadGames();
    const iv = setInterval(loadGames, 60000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [isRetro]);

  useEffect(() => {
    if (isRetro) return;
    let cancelled = false;
    async function loadCoins() {
      try {
        const top = await fetchTopCoins();
        if (!cancelled) setCoins(top);
      } catch { /* keep previous coins on failure */ }
      finally { if (!cancelled) setCoinsLoading(false); }
    }
    loadCoins();
    const iv = setInterval(loadCoins, 45000);
    return () => { cancelled = true; clearInterval(iv); };
  }, [isRetro]);

  if (isRetro) return null;

  const games = [...gamesByLeague[activeLeague]]
    .sort((a, b) => STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status])
    .slice(0, 4);

  return (
    <aside ref={panelRef} className="dashboard-right-panel reveal">
      <section className="right-panel-section">
        <h3 className="right-panel-title">🏆 {t.dashboard.label_sports}</h3>

        <div className="rp-league-tabs">
          {LEAGUES.map(lg => (
            <button
              key={lg}
              type="button"
              className={`rp-league-tab${activeLeague === lg ? ' rp-league-tab-active' : ''}`}
              onClick={() => setActiveLeague(lg)}
            >
              {LEAGUE_EMOJI[lg]} {lg.toUpperCase()}
            </button>
          ))}
        </div>

        {gamesLoading && games.length === 0 && <div className="right-panel-empty">{t.general.loading}</div>}
        {!gamesLoading && games.length === 0 && <div className="right-panel-empty">{t.sports.noGames}</div>}

        {games.map(g => {
          const start = g.status === 'upcoming' ? startLabel(g.date, lang) : null;
          return (
            <div key={g.id} className="rp-game">
              <span className="rp-team-badge" style={{ background: g.awayColor }}>{g.awayAbbr}</span>
              <div className="rp-game-center">
                <div className="rp-game-score tabular-nums">
                  {g.status === 'upcoming'
                    ? (start ? <time dateTime={g.date}>{start.time}</time> : '–')
                    : `${g.awayScore ?? 0} : ${g.homeScore ?? 0}`}
                </div>
                <div className={`rp-game-status rp-status-${g.status}`}>
                  {g.status === 'live' && <>● {t.currency.liveBadge} {g.clock ?? ''}</>}
                  {g.status === 'final' && t.sports.sectionFinal}
                  {g.status === 'upcoming' && (start?.day ?? t.sports.sectionUpcoming)}
                </div>
              </div>
              <span className="rp-team-badge" style={{ background: g.homeColor }}>{g.homeAbbr}</span>
            </div>
          );
        })}

        <div className="rp-actions">
          <Link href="/sports" className="rp-action-btn">{t.sports.standings}</Link>
          <Link href="/sports" className="rp-action-btn rp-action-btn-primary">{t.buttons.viewAll}</Link>
        </div>
      </section>

      <section className="right-panel-section">
        <h3 className="right-panel-title">₿ {t.dashboard.label_crypto}</h3>
        {coinsLoading && coins.length === 0 && <div className="right-panel-empty">{t.general.loading}</div>}
        {coins.map(c => {
          const up = c.changePct >= 0;
          return (
            <div key={c.id} className="right-panel-row">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.image} alt="" width={20} height={20} className="right-panel-row-icon-img" />
              <div className="right-panel-row-main">
                <div className="right-panel-row-label">{c.symbol.toUpperCase()}</div>
              </div>
              <div className="right-panel-row-value-block">
                <div className="right-panel-row-value tabular-nums">${formatPrice(c.price)}</div>
                <div className={`right-panel-row-change tabular-nums ${up ? 'right-panel-up' : 'right-panel-down'}`}>
                  {up ? '▲' : '▼'} {Math.abs(c.changePct).toFixed(2)}%
                </div>
              </div>
            </div>
          );
        })}
      </section>
    </aside>
  );
}
