'use client';

import type { CSSProperties, ReactNode } from 'react';
import Link from 'next/link';
import { useLang } from '../../../lib/LanguageContext';

/* ─────────────────────────── shared game look ───────────────────────────
   Building blocks of the "game style" used by every game:
     <GameFrame color>   centred column (max 520 px) with a soft glow in the game colour at the top
     <GameTopBar>        "‹ Games" on the left, pills (record, streak, leaderboard) on the right
     <GameBanner>        rounded gradient banner: name, short description, big glowing icon
   plus global classes for the controls inside a game:
     .gx-tile (+ .is-on)             3D tile / choice button, selected = purple glow, lifted 2 px
     .gx-btn.gx-primary / .gx-ghost  main (filled) and secondary (outlined) buttons
     .gx-pill (+ .gx-gold)           small rounded header pills
   GameShell uses all of them; games without GameShell use them directly. */

export const DEFAULT_GAME_COLOR = '#8B5CF6';

export function GameFrame({ color = DEFAULT_GAME_COLOR, className, children }: {
  color?: string; className?: string; children: ReactNode;
}) {
  return (
    <div className={`gx-page${className ? ` ${className}` : ''}`} style={{ '--gx': color } as CSSProperties}>
      <div className="gx-glow" aria-hidden="true" />
      {children}
      <GameUiStyles />
    </div>
  );
}

type BackTarget = { href?: string; onClick?: () => void; label?: string };

export function GameTopBar({ back, children }: { back?: BackTarget; children?: ReactNode }) {
  const { t } = useLang();
  const label = back?.label ?? t.gamesHub.backToGames;
  const inner = <><span aria-hidden="true" className="gx-back-arrow">‹</span> {label}</>;
  return (
    <header className="gx-top">
      {back?.onClick
        ? <button type="button" className="gx-back" onClick={back.onClick}>{inner}</button>
        : <Link href={back?.href ?? '/games'} className="gx-back">{inner}</Link>}
      {children && <div className="gx-pills">{children}</div>}
    </header>
  );
}

export function GameBanner({ title, desc, icon, extra }: {
  title: ReactNode; desc?: ReactNode; icon?: ReactNode; extra?: ReactNode;
}) {
  return (
    <section className="gx-banner">
      <div className="gx-banner-text">
        <h1 className="gx-banner-title">{title}</h1>
        {desc && <p className="gx-banner-desc">{desc}</p>}
        {extra}
      </div>
      {icon && <span className="gx-banner-icon" aria-hidden="true">{icon}</span>}
    </section>
  );
}

/** Global styles of the game look. React hoists and dedupes this <style> by its href. */
export function GameUiStyles() {
  return (
    <style href="everyday-game-ui" precedence="medium">{`
      .gx-page {
        --gx-tile-a: #1C2258; --gx-tile-b: #121640; --gx-ink: #F2F3FF; --gx-dim: #9AA0D0;
        --gx-sel-a: #9B7BFF; --gx-sel-b: #6D4CFF;
        position: relative; z-index: 1; isolation: isolate;
        width: 100%; max-width: 520px; margin: 0 auto;
        display: flex; flex-direction: column; gap: 14px;
        color: var(--gx-ink);
      }
      .gx-glow {
        position: absolute; z-index: -1; pointer-events: none;
        top: -120px; left: 50%; width: 100vw; height: 640px; transform: translateX(-50%);
        background:
          radial-gradient(42% 60% at 50% 0%, color-mix(in srgb, var(--gx) 30%, transparent), transparent 72%),
          radial-gradient(70% 45% at 50% 0%, color-mix(in srgb, var(--gx) 12%, transparent), transparent 80%);
      }
      /* Light and retro themes: the game keeps its dark "console" so the colours stay readable */
      [data-theme="light"] .gx-page, [data-theme="xp"] .gx-page,
      [data-theme="win98"] .gx-page, [data-theme="win2000"] .gx-page {
        background: linear-gradient(170deg, #121845, #0A0E2A 60%);
        border-radius: 24px; padding: 14px;
        box-shadow: 0 10px 40px rgba(16,20,60,.18), 0 0 0 1px rgba(16,20,60,.08);
      }
      [data-theme="light"] .gx-glow { opacity: .55; }

      /* header */
      .gx-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
      .gx-back {
        display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 14px 0 10px;
        border-radius: 999px; text-decoration: none; cursor: pointer; white-space: nowrap;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
        color: #DCD6FF; font: 700 13px 'Poppins', system-ui, sans-serif;
      }
      .gx-back:hover { background: rgba(255,255,255,0.1); }
      .gx-back-arrow { font-size: 18px; line-height: 1; margin-top: -2px; }
      [dir="rtl"] .gx-back-arrow { transform: scaleX(-1); }
      .gx-pills { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; margin-inline-start: auto; }
      .gx-pill {
        display: inline-flex; align-items: center; gap: 5px; min-height: 34px; padding: 0 12px;
        border-radius: 999px; white-space: nowrap; font: 600 12px 'Poppins', system-ui, sans-serif; text-decoration: none;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #C9CCEB;
      }
      .gx-pill b { color: #fff; font-weight: 800; font-variant-numeric: tabular-nums; }
      button.gx-pill { cursor: pointer; }
      .gx-pill.gx-icon { width: 34px; padding: 0; justify-content: center; }
      .gx-pill.gx-gold {
        background: linear-gradient(160deg, #FFD976, #F5A524); border-color: rgba(255,226,140,.8);
        color: #2B1A00; font-weight: 800; box-shadow: 0 0 18px rgba(255,190,60,.35), inset 0 1px 0 rgba(255,255,255,.5);
      }
      .gx-pill.gx-gold:hover { filter: brightness(1.06); }

      /* banner */
      .gx-banner {
        position: relative; overflow: hidden;
        display: flex; align-items: center; gap: 14px; padding: 18px 18px 18px 20px;
        border-radius: 18px;
        background:
          radial-gradient(120% 140% at 100% 0%, color-mix(in srgb, var(--gx) 45%, transparent), transparent 60%),
          linear-gradient(135deg, color-mix(in srgb, var(--gx) 34%, #141A4A), color-mix(in srgb, var(--gx) 10%, #0C1030));
        border: 1px solid color-mix(in srgb, var(--gx) 45%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 10px 30px color-mix(in srgb, var(--gx) 22%, transparent);
      }
      .gx-banner-text { flex: 1; min-width: 0; }
      .gx-banner-title {
        margin: 0; font: 800 26px/1.15 'Poppins', system-ui, sans-serif; color: #fff; letter-spacing: -0.01em;
        overflow-wrap: anywhere;
      }
      .gx-banner-desc { margin: 6px 0 0; font-size: 13px; line-height: 1.45; color: rgba(236,238,255,.8); }
      .gx-banner-icon {
        flex-shrink: 0; font-size: 56px; line-height: 1;
        filter: drop-shadow(0 4px 14px var(--gx)) drop-shadow(0 0 22px color-mix(in srgb, var(--gx) 60%, transparent));
      }

      /* 3D tiles */
      .gx-tile {
        position: relative; font: inherit; color: var(--gx-ink); cursor: pointer;
        border: 1px solid rgba(255,255,255,0.07); border-radius: 14px;
        background: linear-gradient(160deg, var(--gx-tile-a), var(--gx-tile-b));
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 3px 0 rgba(4,6,24,0.7), 0 8px 18px rgba(0,0,0,0.28);
        transition: transform .14s ease, box-shadow .16s ease, background .16s ease, filter .16s;
        -webkit-tap-highlight-color: transparent;
      }
      .gx-tile:hover:not(:disabled) { filter: brightness(1.12); }
      .gx-tile:active:not(:disabled) { transform: translateY(1px); }
      .gx-tile.is-on, .gx-tile[aria-pressed="true"], .gx-tile[aria-selected="true"] {
        background: linear-gradient(160deg, var(--gx-sel-a), var(--gx-sel-b));
        border-color: rgba(200,185,255,0.55); color: #fff;
        transform: translateY(-2px);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 3px 0 #3A2596, 0 0 24px rgba(139,92,246,0.6);
      }
      .gx-tile:disabled { cursor: default; }
      .gx-tile:focus-visible, .gx-btn:focus-visible, .gx-back:focus-visible, .gx-pill:focus-visible {
        outline: 3px solid #fff; outline-offset: 2px;
      }

      /* buttons */
      .gx-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px;
        min-height: 48px; padding: 0 20px; border-radius: 999px; cursor: pointer; white-space: nowrap;
        font: 800 15px 'Poppins', system-ui, sans-serif; color: #fff; text-decoration: none;
        transition: transform .14s ease, filter .16s, box-shadow .16s, opacity .16s;
      }
      .gx-btn.gx-primary {
        border: 1px solid rgba(210,195,255,0.55);
        background: linear-gradient(160deg, #A07CFF, #6A45F5 55%, #5536E0);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 0 #3A2596, 0 0 26px rgba(139,92,246,0.55);
      }
      .gx-btn.gx-primary:hover:not(:disabled) { filter: brightness(1.08); }
      .gx-btn.gx-ghost {
        border: 1.5px solid rgba(155,123,255,0.6); background: rgba(139,92,246,0.06); color: #E2DBFF;
      }
      .gx-btn.gx-ghost:hover:not(:disabled) { background: rgba(139,92,246,0.16); }
      .gx-btn.gx-gold-btn {
        border: 1px solid rgba(255,226,140,.8); color: #2B1A00;
        background: linear-gradient(160deg, #FFD976, #F5A524);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.5), 0 4px 0 #A8680A, 0 0 22px rgba(255,190,60,.4);
      }
      .gx-btn:active:not(:disabled) { transform: translateY(2px); }
      .gx-btn:disabled { opacity: .42; cursor: default; box-shadow: none; }
      .gx-btn.gx-sm { min-height: 40px; padding: 0 14px; font-size: 13px; }

      @media (max-width: 400px) {
        /* back link + record + leaderboard + two boss-key pills fit on one row at 360 px */
        .gx-top { gap: 4px; }
        .gx-pills { gap: 4px; }
        .gx-back { padding: 0 10px 0 8px; }
        .gx-pill { padding: 0 8px; gap: 4px; font-size: 11px; }
        .gx-back { font-size: 12px; }
        .gx-pill.gx-icon { width: 32px; padding: 0; }
        .gx-banner { padding: 14px 14px 14px 16px; }
        .gx-banner-icon { font-size: 46px; }
        .gx-btn { padding: 0 14px; font-size: 14px; }
      }
      @media (prefers-reduced-motion: reduce) {
        .gx-tile, .gx-btn { transition: none; }
      }
    `}</style>
  );
}
