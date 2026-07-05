'use client';

import { useEffect, useState } from 'react';
import { useLang } from '../../lib/LanguageContext';
import { useTheme } from '../../lib/ThemeContext';
import { useReveal } from '../../lib/useReveal';

type League = 'nhl' | 'nba' | 'nfl';

type MiniGame = {
  id: string;
  league: League;
  homeAbbr: string;
  awayAbbr: string;
  homeScore?: number;
  awayScore?: number;
  status: 'live' | 'final' | 'upcoming';
  clock?: string;
};

type MiniCoin = {
  id: string;
  symbol: string;
  image: string;
  price: number;
  changePct: number;
};

const LEAGUE_EMOJI: Record<League, string> = { nhl: '🏒', nba: '🏀', nfl: '🏈' };

function parseStatus(status: any): 'live' | 'final' | 'upcoming' {
  const name: string = status?.type?.name ?? '';
  if (name.startsWith('STATUS_FINAL') || name === 'STATUS_FULL_TIME') return 'final';
  if (name === 'STATUS_SCHEDULED') return 'upcoming';
  return 'live';
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
      homeScore: home.score != null ? Math.round(parseFloat(home.score)) : undefined,
      awayScore: away.score != null ? Math.round(parseFloat(away.score)) : undefined,
      status: parseStatus(comp?.status),
      clock: comp?.status?.displayClock,
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

export default function DashboardRightPanel() {
  const { t } = useLang();
  const { theme } = useTheme();
  const panelRef = useReveal<HTMLElement>();
  const [games, setGames] = useState<MiniGame[]>([]);
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
        const all = [...nhl, ...nba, ...nfl];
        const live = all.filter(g => g.status === 'live');
        const upcoming = all.filter(g => g.status === 'upcoming');
        setGames([...live, ...upcoming].slice(0, 4));
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

  return (
    <aside ref={panelRef} className="dashboard-right-panel reveal">
      <section className="right-panel-section">
        <h3 className="right-panel-title">🏆 {t.dashboard.label_sports}</h3>
        {gamesLoading && games.length === 0 && <div className="right-panel-empty">{t.general.loading}</div>}
        {!gamesLoading && games.length === 0 && <div className="right-panel-empty">—</div>}
        {games.map(g => (
          <div key={g.id} className="right-panel-row">
            <span className="right-panel-row-icon">{LEAGUE_EMOJI[g.league]}</span>
            <div className="right-panel-row-main">
              <div className="right-panel-row-label">{g.awayAbbr} @ {g.homeAbbr}</div>
              <div className="right-panel-row-sub">
                {g.status === 'live'
                  ? <span className="right-panel-live">● {t.currency.liveBadge} {g.clock ?? ''}</span>
                  : t.sports.sectionUpcoming}
              </div>
            </div>
            {g.status !== 'upcoming' && (
              <div className="right-panel-row-value tabular-nums">{g.awayScore ?? 0}–{g.homeScore ?? 0}</div>
            )}
          </div>
        ))}
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
