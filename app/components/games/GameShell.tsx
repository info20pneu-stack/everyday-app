'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../../../lib/LanguageContext';
import { getDisplayState, recordGameCompleted, STREAK_UPDATED_EVENT } from '../../../lib/streak';
import {
  formatLeaderboardValue, gameText, getCatalogGame, getLeaderboardConfig,
} from '../../../lib/gamesCatalog';
import { LeaderboardPanel, type LBEntry } from '../Leaderboard';
import { BEST_EVENT, parseBest, readBestRaw, saveBest, type StoredBest } from '../../../lib/personalBest';
import BossKey, { BossKeyModePicker, BossKeyPills } from './BossKey';
import { GameBanner, GameFrame, GameTopBar } from './GameFrame';
import ScoreSubmitModal from './ScoreSubmitModal';
import { ensureGameSession } from '../../../lib/gameSession';

/* ─────────────────────────── game-over API ───────────────────────────
   Inside <GameShell>, a game calls:
     const { onGameOver } = useGameShell();
     onGameOver(score);                      // points game: the score; time game: the time in ms
     onGameOver({ score, timeMs, moves });   // or the full result
   GameShell then counts the game for the streak, updates the personal record
   and opens the shared "save to leaderboard" window. */

export interface GameResult {
  score?: number;
  /** Time in ms. Defaults to the time since the round started (see startRound). */
  timeMs?: number;
  moves?: number;
  diff?: string;
  /** Moves of a daily game with a fixed solution (the server recomputes the result from them). */
  proof?: unknown;
}

export interface GameShellApi {
  /** Report a finished round. Returns whether it beat the personal record. */
  onGameOver: (result: number | GameResult) => { newRecord: boolean };
  /** Restart the round timer used when a result has no timeMs (called automatically after each game over). */
  startRound: () => void;
  /** Personal record for this leaderboard, or null. */
  best: StoredBest | null;
  /** Opens the leaderboard window (no-op when the game has no leaderboard). */
  openLeaderboard: () => void;
}


const GameShellContext = createContext<GameShellApi | null>(null);

/** Access the game-over API of the surrounding <GameShell>. */
export function useGameShell(): GameShellApi {
  const api = useContext(GameShellContext);
  if (!api) throw new Error('useGameShell must be used inside <GameShell>');
  return api;
}

/** Milliseconds since a performance.now() timestamp (only called from game-over handlers). */
function elapsedSince(start: number): number {
  return Math.round(performance.now() - start);
}

function subscribeBest(onChange: () => void) {
  window.addEventListener(BEST_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(BEST_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function subscribeStreak(onChange: () => void) {
  window.addEventListener(STREAK_UPDATED_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(STREAK_UPDATED_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Current day streak (all games together); null on the server. */
function useDayStreak(): number | null {
  return useSyncExternalStore(subscribeStreak, () => getDisplayState().currentStreak, () => null);
}

interface GameShellProps {
  /** Catalog id from lib/gamesCatalog.ts (e.g. 'sky-tower'). */
  gameId: string;
  /** Leaderboard id when it differs from the catalog one, e.g. a variant like 'connectfour_cz'. */
  leaderboardId?: string;
  /** Personal best shown in the header. When omitted, GameShell keeps its own record from onGameOver. */
  best?: StoredBest | null;
  /** Extra pills on the right side of the header. */
  headerExtra?: ReactNode;
  /** Banner title / description / icon / colour when they differ from the catalog. */
  title?: ReactNode;
  desc?: ReactNode;
  icon?: ReactNode;
  color?: string;
  /** Show the boss key: floating buttons on PC, header pills below 768 px, plus "Quick escape". */
  bossKey?: boolean;
  /** Pause the game — called when the boss key covers the screen. */
  onHide?: () => void;
  /** Called when the player returns from the boss key screen. */
  onShow?: () => void;
  children: ReactNode;
}

const ACCENT = '#8475FF';

/** Common frame for every game: back link, record / streak / leaderboard pills, banner, boss key
 *  and the shared "save to leaderboard" flow. The look itself lives in GameFrame. */
export default function GameShell({
  gameId, leaderboardId, best, headerExtra, title, desc, icon, color, bossKey = true, onHide, onShow, children,
}: GameShellProps) {
  const { t, lang, rtl } = useLang();
  const game = getCatalogGame(gameId);
  const lbId = leaderboardId ?? game?.leaderboard;
  const lbConfig = lbId ? getLeaderboardConfig(lbId) : null;
  const [lbOpen, setLbOpen] = useState(false);
  const [submit, setSubmit] = useState<(GameResult & { timeMs: number }) | null>(null);

  // Personal record kept by GameShell (localStorage), used when the game doesn't pass `best`
  const storedRaw = useSyncExternalStore(subscribeBest, () => readBestRaw(lbId), () => null);
  const storedBest = useMemo(() => parseBest(storedRaw), [storedRaw]);
  const shownBest = best !== undefined ? best : storedBest;
  const streak = useDayStreak();

  const roundStart = useRef(0);
  const startRound = useCallback(() => { roundStart.current = performance.now(); }, []);
  useEffect(() => { startRound(); }, [startRound]);
  // Anti-cheat session token for this board, fetched as the game opens (lib/gameSession.ts)
  useEffect(() => { if (lbConfig) ensureGameSession(lbId); }, [lbId, lbConfig]);

  function onGameOver(input: number | GameResult) {
    const isTime = lbConfig?.scoreType === 'time';
    const result: GameResult = typeof input === 'number'
      ? (isTime ? { timeMs: input } : { score: input })
      : input;
    const timeMs = Math.max(1, result.timeMs ?? elapsedSince(roundStart.current));
    const final = { ...result, timeMs };
    recordGameCompleted();
    startRound();

    let newRecord = false;
    if (lbId && lbConfig) {
      newRecord = saveBest(lbId, timeMs, final.score);
      setSubmit(final);
    }
    return { newRecord };
  }

  const api: GameShellApi = { onGameOver, startRound, best: shownBest, openLeaderboard: () => setLbOpen(true) };

  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLbOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbOpen]);

  const name = game ? gameText(t, game.nameKey) : gameId;
  const bestText = shownBest && lbConfig ? formatLeaderboardValue(lbConfig, shownBest, lang) : null;

  return (
    <GameFrame color={color ?? game?.color}>
      <GameTopBar>
        {headerExtra}
        {lbConfig
          ? (
            <span className="gx-pill" title={t.games.record}>
              <span aria-hidden="true">🏅</span>
              <span className="gs-pill-label">{t.games.record}</span>
              <b>{bestText ?? '—'}</b>
            </span>
          )
          : (
            <span className="gx-pill" title={t.wordle.streak}>
              <span aria-hidden="true">🔥</span>
              <span className="gs-pill-label">{t.wordle.streak}</span>
              <b>{streak ?? '—'}</b>
            </span>
          )}
        {lbId && lbConfig && (
          <button type="button" className="gx-pill gx-gold" onClick={() => setLbOpen(true)}>
            <span aria-hidden="true">🏆</span> {t.games.leaderboard}
          </button>
        )}
        {bossKey && <BossKeyPills />}
      </GameTopBar>

      <GameBanner
        title={title ?? name}
        desc={desc ?? (game ? gameText(t, game.descKey) : undefined)}
        icon={icon ?? game?.icon}
      />

      <GameShellContext.Provider value={api}>
        <div className="gs-body">{children}</div>
      </GameShellContext.Provider>

      {bossKey && <details className="gs-boss">
        <summary><span aria-hidden="true" className="gs-boss-mark">!</span> {t.gamesHub.bossEscape}</summary>
        <BossKeyModePicker />
      </details>}

      {bossKey && <BossKey onHide={onHide} onShow={onShow} />}

      {submit && lbId && (
        <ScoreSubmitModal
          game={lbId}
          timeMs={submit.timeMs} score={submit.score} moves={submit.moves} diff={submit.diff} proof={submit.proof}
          title={`${game?.icon ?? '🎮'} ${name} ${t.games.completed}`}
          onClose={() => setSubmit(null)}
          onShowLeaderboard={() => setLbOpen(true)}
        />
      )}

      {lbOpen && lbId && lbConfig && createPortal(
        <div className="gs-overlay" dir={rtl ? 'rtl' : 'ltr'} onClick={e => { if (e.target === e.currentTarget) setLbOpen(false); }}>
          <div className="gs-modal" role="dialog" aria-modal="true" aria-label={`${t.games.leaderboard} – ${name}`}>
            <div className="gs-modal-head">
              <span>🏆 {t.games.leaderboard} · {name}</span>
              <button type="button" className="gs-close" onClick={() => setLbOpen(false)} aria-label={t.games.close}>✕</button>
            </div>
            <LeaderboardPanel
              game={lbId}
              accentColor={ACCENT}
              renderValue={(e: LBEntry) => formatLeaderboardValue(lbConfig, e, lang)}
              daily={lbConfig.daily}
            />
          </div>
        </div>,
        document.body,
      )}

      <GameShellStyles />
    </GameFrame>
  );
}

function GameShellStyles() {
  return (
    <style>{`
      .gs-body { min-height: 120px; }
      .gs-boss { margin-top: 4px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
      .gs-boss summary {
        cursor: pointer; font-size: 12px; font-weight: 600; color: #8E8E9E;
        list-style: none; display: inline-flex; align-items: center; gap: 6px; min-height: 32px;
      }
      .gs-boss summary::-webkit-details-marker { display: none; }
      .gs-boss-mark {
        width: 20px; height: 20px; border-radius: 50%; display: grid; place-items: center;
        border: 1.5px solid #FF5470; color: #FF5470; font-weight: 800; font-size: 12px;
      }
      .gs-boss[open] summary { margin-bottom: 8px; }

      .gs-overlay {
        position: fixed; inset: 0; z-index: 1000; padding: 16px;
        background: rgba(0,0,0,0.72); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
      }
      .gs-modal {
        width: 100%; max-width: 420px; max-height: calc(100dvh - 32px); overflow-y: auto;
        background: rgba(12,16,36,0.98); border: 1px solid rgba(93,76,255,0.35);
        border-radius: 18px; padding: 18px 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.7);
        animation: gsModalIn 0.22s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes gsModalIn { from { opacity: 0; transform: scale(0.94) translateY(8px); } to { opacity: 1; transform: none; } }
      .gs-modal-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font: 700 15px 'Poppins', sans-serif; }
      .gs-close {
        width: 36px; height: 36px; border-radius: 10px; flex-shrink: 0; cursor: pointer;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #AAAAB8; font-size: 14px;
      }

      @media (max-width: 400px) {
        .gs-pill-label { display: none; }
      }
    `}</style>
  );
}
