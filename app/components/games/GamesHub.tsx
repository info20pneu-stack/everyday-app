'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLang } from '../../../lib/LanguageContext';
import type { Translations } from '../../../lib/i18n';
import {
  GAMES_CATALOG, GAME_DURATIONS, GAME_SECTIONS, gameText,
  type CatalogGame, type GameDuration, type GameSection,
} from '../../../lib/gamesCatalog';

const SECTION_META: Record<GameSection, { icon: string; color: string; label: (t: Translations) => string }> = {
  relax:   { icon: '🌿', color: '#34D399', label: t => t.gamesHub.sectionRelax },
  mini:    { icon: '🎮', color: '#8475FF', label: t => t.gamesHub.sectionMini },
  quiz:    { icon: '❓', color: '#60A5FA', label: t => t.gamesHub.sectionQuiz },
  curious: { icon: '✨', color: '#FFB300', label: t => t.gamesHub.sectionCurious },
};

function durationLabel(t: Translations, d: GameDuration) {
  return t.gamesHub.minutes.replace('{n}', d);
}

export default function GamesHub() {
  const { t } = useLang();
  const [section, setSection] = useState<GameSection | 'all'>('all');
  const [duration, setDuration] = useState<GameDuration | 'all'>('all');

  const groups = useMemo(() => {
    const visible = GAMES_CATALOG.filter(g =>
      (section === 'all' || g.section === section) && (duration === 'all' || g.duration === duration));
    return GAME_SECTIONS
      .map(s => ({
        section: s,
        // playable games first, "soon" placeholders after them
        games: visible.filter(g => g.section === s).sort((a, b) => Number(!!a.soon) - Number(!!b.soon)),
      }))
      .filter(g => g.games.length > 0);
  }, [section, duration]);

  return (
    <div className="gh">
      <header className="gh-head">
        <h1>🎮 {t.gamesHub.title}</h1>
        <p>{t.gamesHub.subtitle}</p>
      </header>

      <div className="gh-filters">
        <div className="gh-filter" role="group" aria-label={t.gamesHub.filterSection}>
          <span className="gh-filter-label">{t.gamesHub.filterSection}</span>
          <div className="gh-chips">
            <Chip active={section === 'all'} onClick={() => setSection('all')}>{t.gamesHub.all}</Chip>
            {GAME_SECTIONS.map(s => (
              <Chip key={s} active={section === s} onClick={() => setSection(s)}>
                <span aria-hidden="true">{SECTION_META[s].icon}</span> {SECTION_META[s].label(t)}
              </Chip>
            ))}
          </div>
        </div>
        <div className="gh-filter" role="group" aria-label={t.gamesHub.filterTime}>
          <span className="gh-filter-label">{t.gamesHub.filterTime}</span>
          <div className="gh-chips">
            <Chip active={duration === 'all'} onClick={() => setDuration('all')}>{t.gamesHub.all}</Chip>
            {GAME_DURATIONS.map(d => (
              <Chip key={d} active={duration === d} onClick={() => setDuration(d)}>
                <span aria-hidden="true">⏱</span> {durationLabel(t, d)}
              </Chip>
            ))}
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="gh-empty">{t.gamesHub.noResults}</p>
      ) : groups.map(({ section: s, games }) => (
        <section key={s} className="gh-section" style={{ '--sec': SECTION_META[s].color } as React.CSSProperties}>
          <h2><span aria-hidden="true">{SECTION_META[s].icon}</span> {SECTION_META[s].label(t)}</h2>
          <div className="gh-grid">
            {games.map(g => <GameCard key={g.id} game={g} t={t} />)}
          </div>
        </section>
      ))}

      <GamesHubStyles />
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="gh-chip" aria-pressed={active} onClick={onClick}>{children}</button>
  );
}

function GameCard({ game, t }: { game: CatalogGame; t: Translations }) {
  const body = (
    <>
      <div className="gh-card-top">
        <span className="gh-card-icon" aria-hidden="true">{game.icon}</span>
        <span className="gh-time"><span aria-hidden="true">⏱</span> {durationLabel(t, game.duration)}</span>
      </div>
      <div className="gh-card-name">{gameText(t, game.nameKey)}</div>
      <div className="gh-card-desc">{gameText(t, game.descKey)}</div>
      <div className="gh-card-foot">
        {game.leaderboard && <span className="gh-lb" title={t.games.leaderboard} aria-label={t.games.leaderboard}>🏆</span>}
        {game.soon
          ? <span className="gh-soon">{t.gamesHub.comingSoon}</span>
          : <span className="gh-play">{t.gamesHub.play} <span aria-hidden="true" className="gh-arrow">›</span></span>}
      </div>
    </>
  );

  if (game.soon) {
    return <div className="gh-card gh-card-soon" aria-disabled="true">{body}</div>;
  }
  return <Link href={game.route} className="gh-card">{body}</Link>;
}

function GamesHubStyles() {
  return (
    <style>{`
      .gh {
        color: #fff; padding: 1.25rem;
        background: rgba(15,20,40,0.92);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: var(--card-radius);
        box-shadow: var(--card-shadow);
      }
      @media (max-width: 480px) { .gh { padding: 1rem; } }
      .gh-head h1 { margin: 0; font: 800 22px 'Poppins', sans-serif; }
      .gh-head p { margin: 6px 0 0; font-size: 13px; color: #AAAAB8; line-height: 1.5; }

      .gh-filters {
        margin: 16px 0 6px; padding: 12px; display: flex; flex-direction: column; gap: 10px;
        background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px;
      }
      .gh-filter { display: flex; align-items: flex-start; gap: 10px; min-width: 0; }
      .gh-filter-label {
        flex-shrink: 0; width: 64px; padding-top: 10px; font-size: 11px; font-weight: 700; letter-spacing: .6px;
        text-transform: uppercase; color: #8E8E9E;
      }
      .gh-chips { display: flex; flex-wrap: wrap; gap: 6px; min-width: 0; padding: 2px 0; }
      .gh-chip {
        flex-shrink: 0; min-height: 34px; padding: 0 12px; border-radius: 999px; cursor: pointer; white-space: nowrap;
        font: 600 12px 'Inter', 'Poppins', sans-serif; color: #AAAAB8;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        transition: background .15s, border-color .15s, color .15s;
      }
      .gh-chip:hover { border-color: rgba(93,76,255,0.5); color: #fff; }
      .gh-chip[aria-pressed="true"] {
        background: linear-gradient(135deg, #5D4CFF, #7A3FFF); border-color: transparent; color: #fff;
        box-shadow: 0 0 14px rgba(93,76,255,0.45);
      }
      .gh-chip:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }

      .gh-section { margin-top: 22px; }
      .gh-section h2 {
        margin: 0 0 10px; font: 700 13px 'Poppins', sans-serif; letter-spacing: .8px; text-transform: uppercase;
        color: var(--sec);
      }
      .gh-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      @media (max-width: 420px) { .gh-grid { grid-template-columns: 1fr; } }

      .gh-card {
        display: flex; flex-direction: column; gap: 6px; padding: 14px; min-height: 150px;
        border-radius: 16px; text-decoration: none; color: #fff;
        background: linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02));
        border: 1px solid rgba(255,255,255,0.08);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        transition: transform .18s ease, border-color .18s, box-shadow .18s;
      }
      a.gh-card:hover, a.gh-card:focus-visible {
        transform: translateY(-3px); border-color: color-mix(in srgb, var(--sec) 60%, transparent);
        box-shadow: 0 10px 30px rgba(0,0,0,0.35), 0 0 22px color-mix(in srgb, var(--sec) 30%, transparent);
        outline: none;
      }
      .gh-card-soon { opacity: .62; cursor: default; }
      .gh-card-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
      .gh-card-icon {
        width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; font-size: 21px;
        background: color-mix(in srgb, var(--sec) 18%, transparent);
        border: 1px solid color-mix(in srgb, var(--sec) 40%, transparent);
      }
      .gh-time {
        font-size: 11px; font-weight: 700; padding: 4px 8px; border-radius: 999px; white-space: nowrap;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: #AAAAB8;
      }
      .gh-card-name { font: 700 14px 'Poppins', sans-serif; margin-top: 4px; }
      .gh-card-desc { font-size: 12px; line-height: 1.45; color: #AAAAB8; flex: 1; }
      .gh-card-foot { display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-top: 4px; }
      .gh-lb { font-size: 13px; margin-inline-end: auto; opacity: .85; }
      .gh-play { font-size: 12px; font-weight: 700; color: var(--sec); }
      [dir="rtl"] .gh-arrow { display: inline-block; transform: scaleX(-1); }
      .gh-soon {
        font-size: 11px; font-weight: 700; letter-spacing: .4px; text-transform: uppercase;
        padding: 3px 8px; border-radius: 6px; color: #C4BAFF;
        background: rgba(93,76,255,0.16); border: 1px solid rgba(93,76,255,0.35);
      }
      .gh-empty { margin-top: 24px; text-align: center; font-size: 13px; color: #8E8E9E; }

      @media (prefers-reduced-motion: reduce) { .gh-card, .gh-chip { transition: none; } }
    `}</style>
  );
}
