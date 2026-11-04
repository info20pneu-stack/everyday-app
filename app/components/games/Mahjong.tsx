'use client';

import { useEffect, useRef, useState } from 'react';
import { useLang } from '../../../lib/LanguageContext';
import { useIsClient } from '../../../lib/games/useIsClient';
import { dailyLeaderboardId, utcDayKey } from '../../../lib/gamesCatalog';
import { mahjongTexts } from '../../../lib/games/mahjongI18n';
import { useIncomingChallenge } from '../../../lib/share/client';
import GameShell from './GameShell';
import MahjongHome from './mahjong/MahjongHome';
import MahjongLook from './mahjong/MahjongLook';
import MahjongGame, { type GameOpts } from './mahjong/MahjongGame';
import MahjongStyles from './mahjong/styles';
import { loadSettings, saveSettings, type MjSettings } from './mahjong/settings';
import { installTextures } from './mahjong/theme';

/* Mahjong solitaire — port of games-reference/mahjong.
   Screens: the level map (4 chapters × 5 levels with 1–3 stars), the look (symbol sets, tile
   styles, tables) and the game. Progress and looks stay in localStorage.
   Only the daily challenge (same table for everybody, by UTC date) has a leaderboard:
   mahjong_daily_<yyyymmdd>, by time, first attempt only, moves replayed on the server.
   Logic: lib/games/mahjong.ts · symbols: lib/games/mahjongSymbols.ts · texts: lib/games/mahjongI18n.ts */

export default function Mahjong() {
  const isClient = useIsClient();
  const [today] = useState(utcDayKey);
  const pauseRef = useRef<(() => void) | null>(null);
  return (
    <GameShell gameId="mahjong" leaderboardId={dailyLeaderboardId('mahjong_daily', today)} onHide={() => pauseRef.current?.()}>
      {isClient ? <MahjongApp today={today} pauseRef={pauseRef} /> : <div style={{ minHeight: 720 }} />}
      <MahjongStyles />
    </GameShell>
  );
}

type Screen = 'home' | 'look' | 'game';

function MahjongApp({ today, pauseRef }: { today: string; pauseRef: React.RefObject<(() => void) | null> }) {
  const { lang } = useLang();
  const tx = mahjongTexts(lang);
  const [s, setS] = useState<MjSettings>(loadSettings);
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState<{ opts: GameOpts; seed: number; key: number } | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const incoming = useIncomingChallenge('mahjong_daily');
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => { installTextures(); }, []);
  useEffect(() => { saveSettings(s); }, [s]);

  function start(opts: GameOpts) {
    setGame(g => ({ opts, seed: Math.floor(Math.random() * 2 ** 31), key: (g?.key ?? 0) + 1 }));
    setScreen('game');
    requestAnimationFrame(() => rootRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }));
  }
  const startDaily = () => start({ daily: true, day: today });

  // ?mode=daily or a friend's challenge opens today's daily challenge
  const wantsDaily = incoming ? 'challenge' : (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('mode') === 'daily' ? 'url' : null);
  if (wantsDaily && opened !== wantsDaily) {
    setOpened(wantsDaily);
    setGame(g => ({ opts: { daily: true, day: today }, seed: 0, key: (g?.key ?? 0) + 1 }));
    setScreen('game');
  }

  const update = (fn: (s: MjSettings) => MjSettings) => setS(fn);
  const patch = (p: Partial<MjSettings>) => setS(cur => ({ ...cur, ...p }));

  return (
    <div className="mj" ref={rootRef} data-table={s.table} data-skin={s.skin} style={{ scrollMarginTop: 80 }}>
      {screen === 'home' && (
        <MahjongHome s={s} tx={tx} lang={lang} onLevel={n => start({ daily: false, level: n })} onDaily={startDaily}
          onLook={() => setScreen('look')} onSound={() => patch({ sound: !s.sound })} />
      )}
      {screen === 'look' && <MahjongLook s={s} tx={tx} update={patch} onDone={() => setScreen('home')} />}
      {screen === 'game' && game && (
        <MahjongGame
          key={game.key} opts={game.opts} seed={game.seed} s={s} tx={tx} lang={lang} update={update} pauseRef={pauseRef}
          onMap={() => { setScreen('home'); setGame(null); }}
          onRestart={() => start(game.opts)}
          onNext={n => start({ daily: false, level: n })}
        />
      )}
    </div>
  );
}
