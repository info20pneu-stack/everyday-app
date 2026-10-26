'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import { useTheme } from '../../lib/ThemeContext';
import { useReveal } from '../../lib/useReveal';
import { sportsStrings } from '../../lib/sportsI18n';
import { parseScoreboard, statusLine, type GameStatus, type ScoreGame } from '../../lib/sports/scoreboard';
import type { ProLeague } from '../../lib/sports/types';
import TeamBadge from './sports/TeamBadge';

type League = ProLeague;

type MiniCoin = {
  id: string;
  symbol: string;
  image: string;
  price: number;
  changePct: number;
};

const LEAGUES: League[] = ['nhl', 'nba', 'nfl'];
const LEAGUE_EMOJI: Record<League, string> = { nhl: '🏒', nba: '🏀', nfl: '🏈' };

async function fetchLeague(league: League): Promise<ScoreGame[]> {
  const res = await fetch(`/api/sports/${league}`);
  if (!res.ok) return [];
  return parseScoreboard(await res.json(), league);
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

const STATUS_PRIORITY: Record<GameStatus, number> = { live: 0, upcoming: 1, final: 2, postponed: 3 };

export default function DashboardRightPanel() {
  const { t, lang } = useLang();
  const { theme } = useTheme();
  const panelRef = useReveal<HTMLElement>();
  const ss = sportsStrings(lang);
  const [gamesByLeague, setGamesByLeague] = useState<Record<League, ScoreGame[]>>({ nhl: [], nba: [], nfl: [] });
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
          const line = statusLine(g, ss, t.sports.postponed, lang);
          const showScore = g.status === 'live' || g.status === 'final';
          const side = (team: ScoreGame['home']) => g.status === 'final' ? (team.winner ? ' is-win' : ' is-lose') : '';
          return (
            <div key={g.id} className="rp-game">
              <TeamBadge abbr={g.away.abbr} color={g.away.color} size="sm" />
              <span className={`rp-team-name${side(g.away)}`} title={g.away.name}>{g.away.short}</span>
              <div className="rp-game-center">
                {showScore && (
                  <div className="rp-game-score tabular-nums" dir="ltr">
                    <span className={side(g.away)}>{g.away.score ?? 0}</span>
                    <span className="rp-score-sep">:</span>
                    <span className={side(g.home)}>{g.home.score ?? 0}</span>
                  </div>
                )}
                <div className={`rp-game-status rp-status-${line.kind}`}>
                  {g.status === 'upcoming' ? <time dateTime={g.date}>{line.text}</time> : line.text}
                </div>
              </div>
              <span className={`rp-team-name rp-team-home${side(g.home)}`} title={g.home.name}>{g.home.short}</span>
              <TeamBadge abbr={g.home.abbr} color={g.home.color} size="sm" />
            </div>
          );
        })}

        <div className="rp-actions">
          <Link href={`/sports?league=${activeLeague}&view=standings`} className="rp-action-btn">{t.sports.standings}</Link>
          <Link href={`/sports?league=${activeLeague}`} className="rp-action-btn rp-action-btn-primary">{ss.allGames}</Link>
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
