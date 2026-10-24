'use client';

import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode,
} from 'react';
import Link from 'next/link';
import { createPortal } from 'react-dom';
import { useLang } from '../../../lib/LanguageContext';
import { recordGameCompleted } from '../../../lib/streak';
import {
  formatLeaderboardValue, gameText, getCatalogGame, getLeaderboardConfig, toSortValue,
} from '../../../lib/gamesCatalog';
import { LeaderboardPanel, type LBEntry } from '../Leaderboard';
import BossKey, { BossKeyModePicker } from './BossKey';
import ScoreSubmitModal from './ScoreSubmitModal';

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
}

export interface GameShellApi {
  /** Report a finished round. Returns whether it beat the personal record. */
  onGameOver: (result: number | GameResult) => { newRecord: boolean };
  /** Restart the round timer used when a result has no timeMs (called automatically after each game over). */
  startRound: () => void;
  /** Personal record for this leaderboard, or null. */
  best: StoredBest | null;
}

type StoredBest = { timeMs: number; score?: number };

const GameShellContext = createContext<GameShellApi | null>(null);

/** Access the game-over API of the surrounding <GameShell>. */
export function useGameShell(): GameShellApi {
  const api = useContext(GameShellContext);
  if (!api) throw new Error('useGameShell must be used inside <GameShell>');
  return api;
}

const BEST_EVENT = 'everyday-best-change';

/** Milliseconds since a performance.now() timestamp (only called from game-over handlers). */
function elapsedSince(start: number): number {
  return Math.round(performance.now() - start);
}
const bestKey = (lbId: string) => `everyday-best-${lbId}`;

function subscribeBest(onChange: () => void) {
  window.addEventListener(BEST_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(BEST_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readBestRaw(lbId: string | undefined): string | null {
  if (!lbId) return null;
  try { return localStorage.getItem(bestKey(lbId)); } catch { return null; }
}

function parseBest(raw: string | null): StoredBest | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as StoredBest;
    return typeof v?.timeMs === 'number' ? v : null;
  } catch { return null; }
}

interface GameShellProps {
  /** Catalog id from lib/gamesCatalog.ts (e.g. 'sky-tower'). */
  gameId: string;
  /** Leaderboard id when it differs from the catalog one, e.g. a variant like 'connectfour_cz'. */
  leaderboardId?: string;
  /** Personal best shown in the header. When omitted, GameShell keeps its own record from onGameOver. */
  best?: StoredBest | null;
  /** Extra controls on the right side of the header (difficulty, region…). */
  headerExtra?: ReactNode;
  /** Pause the game — called when the boss key covers the screen. */
  onHide?: () => void;
  /** Called when the player returns from the boss key screen. */
  onShow?: () => void;
  children: ReactNode;
}

const ACCENT = '#8475FF';

/** Common frame for every new game: header, back link, record, leaderboard and boss key. */
export default function GameShell({ gameId, leaderboardId, best, headerExtra, onHide, onShow, children }: GameShellProps) {
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

  const roundStart = useRef(0);
  const startRound = useCallback(() => { roundStart.current = performance.now(); }, []);
  useEffect(() => { startRound(); }, [startRound]);

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
      const prev = parseBest(readBestRaw(lbId));
      newRecord = !prev || toSortValue(lbConfig, timeMs, final.score) < toSortValue(lbConfig, prev.timeMs, prev.score);
      if (newRecord) {
        try { localStorage.setItem(bestKey(lbId), JSON.stringify({ timeMs, score: final.score })); } catch {}
        window.dispatchEvent(new Event(BEST_EVENT));
      }
      setSubmit(final);
    }
    return { newRecord };
  }

  const api: GameShellApi = { onGameOver, startRound, best: shownBest };

  useEffect(() => {
    if (!lbOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setLbOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lbOpen]);

  const name = game ? gameText(t, game.nameKey) : gameId;
  const bestText = shownBest && lbConfig ? formatLeaderboardValue(lbConfig, shownBest, lang) : null;

  return (
    <div className="gs-card">
      <header className="gs-head">
        <Link href="/games" className="gs-back">
          <span aria-hidden="true" className="gs-back-arrow">‹</span> {t.gamesHub.backToGames}
        </Link>
        <div className="gs-title">
          {game && <span className="gs-icon" aria-hidden="true">{game.icon}</span>}
          <h1>{name}</h1>
        </div>
        <div className="gs-actions">
          {headerExtra}
          {lbConfig && (
            <span className="gs-best" title={t.games.record}>
              <span aria-hidden="true">🏅</span>
              <span className="gs-best-label">{t.games.record}</span>
              <b className="tabular-nums">{bestText ?? '—'}</b>
            </span>
          )}
          {lbId && lbConfig && (
            <button type="button" className="gs-lb-btn" onClick={() => setLbOpen(true)}>
              <span aria-hidden="true">🏆</span> {t.games.leaderboard}
            </button>
          )}
        </div>
      </header>

      <GameShellContext.Provider value={api}>
        <div className="gs-body">{children}</div>
      </GameShellContext.Provider>

      <details className="gs-boss">
        <summary><span aria-hidden="true" className="gs-boss-mark">!</span> {t.gamesHub.bossEscape}</summary>
        <BossKeyModePicker />
      </details>

      <BossKey onHide={onHide} onShow={onShow} />

      {submit && lbId && (
        <ScoreSubmitModal
          game={lbId}
          timeMs={submit.timeMs} score={submit.score} moves={submit.moves} diff={submit.diff}
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
    </div>
  );
}

function GameShellStyles() {
  return (
    <style>{`
      .gs-card {
        background: rgba(15,20,40,0.92);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: var(--card-radius);
        box-shadow: var(--card-shadow);
        padding: 1rem;
        color: #fff;
      }
      .gs-head {
        display: grid;
        grid-template-columns: auto 1fr auto;
        align-items: center;
        gap: 10px;
        margin-bottom: 14px;
      }
      .gs-back {
        display: inline-flex; align-items: center; gap: 4px; min-height: 36px;
        padding: 0 12px; border-radius: 10px; text-decoration: none;
        background: rgba(93,76,255,0.14); border: 1px solid rgba(93,76,255,0.35);
        color: #C4BAFF; font: 600 12px 'Inter', 'Poppins', sans-serif; white-space: nowrap;
      }
      .gs-back-arrow { font-size: 16px; line-height: 1; }
      [dir="rtl"] .gs-back-arrow { transform: scaleX(-1); }
      .gs-title { display: flex; align-items: center; gap: 8px; min-width: 0; }
      .gs-title h1 {
        margin: 0; font: 800 16px 'Poppins', sans-serif; color: #fff;
        overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      .gs-icon {
        width: 32px; height: 32px; flex-shrink: 0; border-radius: 9px; display: grid; place-items: center; font-size: 17px;
        background: linear-gradient(135deg, rgba(93,76,255,0.35), rgba(93,76,255,0.12));
        border: 1px solid rgba(93,76,255,0.4);
      }
      .gs-actions { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
      .gs-best {
        display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 0 10px;
        border-radius: 10px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08);
        font-size: 12px; color: #AAAAB8; white-space: nowrap;
      }
      .gs-best b { color: #FFB300; font-family: 'Poppins', sans-serif; }
      .gs-lb-btn {
        display: inline-flex; align-items: center; gap: 5px; min-height: 36px; padding: 0 12px;
        border-radius: 10px; cursor: pointer; white-space: nowrap;
        background: rgba(255,179,0,0.12); border: 1px solid rgba(255,179,0,0.3); color: #FFB300;
        font: 600 12px 'Inter', 'Poppins', sans-serif;
      }
      .gs-body { min-height: 120px; }
      .gs-boss { margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.06); }
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

      @media (max-width: 560px) {
        .gs-head { grid-template-columns: auto 1fr; }
        .gs-actions { grid-column: 1 / -1; justify-content: flex-start; }
        .gs-best-label { display: none; }
      }
    `}</style>
  );
}
