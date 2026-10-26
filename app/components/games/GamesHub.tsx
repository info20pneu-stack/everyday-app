'use client';

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import Link from 'next/link';
import { useLang } from '../../../lib/LanguageContext';
import type { Translations } from '../../../lib/i18n';
import {
  GAMES_CATALOG, GAME_DURATIONS, GAME_SECTIONS, formatTimeMs, gameText, isNewGame,
  type CatalogGame, type GameDuration, type GameSection,
} from '../../../lib/gamesCatalog';
import { getDisplayState, STREAK_UPDATED_EVENT } from '../../../lib/streak';
import { bestRankToday, isDoneToday, readRecord, type GameRecord } from '../../../lib/gamesProgress';
import { formatDays, homeStrings } from '../../../lib/homeI18n';
import { fmtNumber } from '../../../lib/formatNumber';
import { toolStrings } from '../../../lib/toolsI18n';
import { useIsClient } from '../../../lib/games/useIsClient';
import { GameBanner, GameFrame } from './GameFrame';
import DailyTrio, { useTrioState } from '../DailyTrio';

const SECTION_META: Record<GameSection, { icon: string; label: (t: Translations) => string }> = {
  relax:   { icon: '🌿', label: t => t.gamesHub.sectionRelax },
  mini:    { icon: '🎮', label: t => t.gamesHub.sectionMini },
  quiz:    { icon: '❓', label: t => t.gamesHub.sectionQuiz },
  curious: { icon: '✨', label: t => t.gamesHub.sectionCurious },
};

function durationLabel(t: Translations, d: GameDuration) {
  return t.gamesHub.minutes.replace('{n}', d);
}

/** Record in the language's format: points, a time (s / m:ss), milliseconds, moves or WPM. */
function formatRecord(r: GameRecord, t: Translations, lang: string): string {
  switch (r.kind) {
    case 'points': return fmtNumber(r.value, lang);
    case 'moves': return `${t.games.moves}: ${fmtNumber(r.value, lang)}`;
    case 'wpm': return `${fmtNumber(r.value, lang)} WPM`;
    case 'ms': return new Intl.NumberFormat(lang, { style: 'unit', unit: 'millisecond', unitDisplay: 'short' }).format(Math.round(r.ms));
    case 'time':
      return r.ms < 60_000
        ? new Intl.NumberFormat(lang, { style: 'unit', unit: 'second', unitDisplay: 'short', maximumFractionDigits: 2 }).format(r.ms / 1000)
        : formatTimeMs(r.ms).replace(/\.\d+$/, '');
  }
}

/** Re-render when a game saves progress in this or another tab. */
function useProgressVersion(): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    const bump = () => setV(n => n + 1);
    const events = ['storage', 'focus', STREAK_UPDATED_EVENT, 'everyday-best-change', 'everyday-rank-change', 'everyday-hl-change'];
    events.forEach(e => window.addEventListener(e, bump));
    return () => events.forEach(e => window.removeEventListener(e, bump));
  }, []);
  return v;
}

export default function GamesHub() {
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const isClient = useIsClient();
  useProgressVersion();
  const trio = useTrioState();
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

  // Personal overview (browser only — it lives in localStorage)
  const streak = isClient ? getDisplayState().currentStreak : 0;
  const trioDone = trio ? [trio.puzzle.done, trio.hl.done, trio.blocks.done].filter(Boolean).length : 0;
  const rank = isClient ? bestRankToday() : null;

  const pills = isClient && (
    <div className="gh-pills">
      <span className="gx-pill" title={st.ghStreak}><span aria-hidden="true">🔥</span> <b>{formatDays(streak, lang)}</b></span>
      <span className={`gx-pill${trioDone === 3 ? ' gh-pill-done' : ''}`} title={st.ghTrioDone}>
        <span aria-hidden="true">✅</span> {st.today} <b dir="ltr">{fmtNumber(trioDone, lang)}/{fmtNumber(3, lang)}</b>
      </span>
      {rank && (
        <span className="gx-pill gx-gold" title={st.ghBestRank}>
          <span aria-hidden="true">🏆</span> <b dir="ltr">#{fmtNumber(rank, lang)}</b> {homeStrings(lang).trio.today}
        </span>
      )}
    </div>
  );

  const filtersActive = section !== 'all' || duration !== 'all';

  return (
    <GameFrame color="#8B5CF6" className="gh">
      <GameBanner title={t.gamesHub.title} desc={t.gamesHub.subtitle} icon="🎮" extra={pills} />

      <div className="gh-filters" role="toolbar" aria-label={`${t.gamesHub.filterSection} · ${t.gamesHub.filterTime}`}>
        <Chip active={section === 'all' && duration === 'all'} onClick={() => { setSection('all'); setDuration('all'); }}>{t.gamesHub.all}</Chip>
        {GAME_SECTIONS.map(s => (
          <Chip key={s} active={section === s} onClick={() => setSection(section === s ? 'all' : s)}>
            <span aria-hidden="true">{SECTION_META[s].icon}</span> {SECTION_META[s].label(t)}
          </Chip>
        ))}
        <span className="gh-sep" aria-hidden="true" />
        {GAME_DURATIONS.map(d => (
          <Chip key={d} active={duration === d} onClick={() => setDuration(duration === d ? 'all' : d)}>
            <span aria-hidden="true">⏱</span> {durationLabel(t, d)}
          </Chip>
        ))}
      </div>

      {!filtersActive && <DailyTrio showAllLink={false} />}

      {groups.length === 0 ? (
        <p className="gh-empty">{t.gamesHub.noResults}</p>
      ) : groups.map(({ section: s, games }) => (
        <section key={s} className="gh-section">
          <h2><span aria-hidden="true">{SECTION_META[s].icon}</span> {SECTION_META[s].label(t)}</h2>
          <div className="gh-grid">
            {games.map(g => <GameCard key={g.id} game={g} t={t} lang={lang} isClient={isClient} newLabel={st.ghNew} doneLabel={homeStrings(lang).trio.done} />)}
          </div>
        </section>
      ))}

      <GamesHubStyles />
    </GameFrame>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="gh-chip" aria-pressed={active} onClick={onClick}>{children}</button>
  );
}

function GameCard({ game, t, lang, isClient, newLabel, doneLabel }: {
  game: CatalogGame; t: Translations; lang: string; isClient: boolean; newLabel: string; doneLabel: string;
}) {
  // Personal bits read localStorage / today's date, so they appear after hydration
  const record = isClient && !game.soon ? readRecord(game) : null;
  const done = isClient && isDoneToday(game);
  const fresh = isClient && !game.soon && isNewGame(game);

  const body = (
    <>
      <span className="gh-card-icon" aria-hidden="true">{game.icon}</span>
      <div className="gh-tags">
        <span className="gh-tag"><span aria-hidden="true">⏱</span> {durationLabel(t, game.duration)}</span>
        {fresh && <span className="gh-tag gh-tag-new">{newLabel}</span>}
        {done && <span className="gh-tag gh-tag-done">✓ {doneLabel}</span>}
      </div>
      <div className="gh-card-name">{gameText(t, game.nameKey)}</div>
      <div className="gh-card-desc">{gameText(t, game.descKey)}</div>
      <div className="gh-card-foot">
        <span className="gh-record" title={t.games.record}>
          {record && <><span aria-hidden="true">🏅</span> <span dir="ltr">{formatRecord(record, t, lang)}</span></>}
        </span>
        {game.soon
          ? <span className="gh-btn gh-btn-soon">{t.gamesHub.comingSoon}</span>
          : <span className="gh-btn">{t.gamesHub.play}</span>}
      </div>
    </>
  );

  const style = { '--c': game.color } as CSSProperties;
  if (game.soon) {
    return <div className="gh-card gh-card-soon" style={style} aria-disabled="true">{body}</div>;
  }
  return <Link href={game.route} className="gh-card" style={style}>{body}</Link>;
}

function GamesHubStyles() {
  return (
    <style>{`
      .gx-page.gh { max-width: none; }
      .gh .gx-banner-title { font-size: 30px; }
      .gh .gx-banner { padding-top: 22px; padding-bottom: 22px; }
      .gh .gx-banner-icon { font-size: 64px; }
      .gh-pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
      .gh-pills .gx-pill { background: rgba(10,12,40,.35); }
      .gh-pills .gx-pill.gx-gold { background: linear-gradient(160deg, #FFD976, #F5A524); }
      .gh-pill-done { border-color: rgba(74,222,128,.6) !important; color: #BBF7D0 !important; }

      /* one row of filters, scrolls sideways on phones */
      .gh-filters {
        display: flex; align-items: center; gap: 8px; overflow-x: auto; scrollbar-width: none;
        padding: 12px 12px 16px; margin: -8px -12px -6px;
      }
      .gh-filters::-webkit-scrollbar { display: none; }
      .gh-chip {
        flex-shrink: 0; min-height: 38px; padding: 0 14px; border-radius: 999px; cursor: pointer; white-space: nowrap;
        font: 700 13px 'Poppins', system-ui, sans-serif; color: #C9CCEB;
        background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1);
        transition: background .15s, border-color .15s, color .15s, box-shadow .15s;
      }
      .gh-chip:hover { border-color: rgba(139,92,246,0.55); color: #fff; }
      .gh-chip[aria-pressed="true"] {
        color: #fff; border-color: rgba(200,185,255,.55);
        background: linear-gradient(160deg, #A07CFF, #6A45F5 60%, #5536E0);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.35), 0 0 18px rgba(139,92,246,.55);
      }
      .gh-chip:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
      .gh-sep { flex-shrink: 0; width: 1px; height: 24px; background: rgba(255,255,255,.18); margin: 0 4px; }

      .gh .trio-section { margin: 0; }
      /* the game panel stays dark in the light theme, so its headings keep light text */
      .gh .section-title { color: #fff; }
      .gh .section-sub { color: #9AA0D0; }

      .gh-section { margin-top: 6px; }
      .gh-section h2 {
        margin: 0 0 12px; font: 800 13px 'Poppins', system-ui, sans-serif; letter-spacing: .14em; text-transform: uppercase;
        color: #C9CCEB;
      }
      .gh-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
      @media (max-width: 900px) { .gh-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } }

      .gh-card {
        --c: #8B5CF6;
        position: relative; overflow: hidden; display: flex; flex-direction: column; gap: 6px;
        padding: 16px; min-height: 196px; border-radius: 18px; text-decoration: none; color: #fff;
        background:
          radial-gradient(110% 90% at 100% 0%, color-mix(in srgb, var(--c) 32%, transparent), transparent 62%),
          linear-gradient(160deg, #1A1F55, #0F1338);
        border: 1px solid color-mix(in srgb, var(--c) 50%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.1), 0 0 22px color-mix(in srgb, var(--c) 22%, transparent);
        transition: transform .18s ease, box-shadow .18s, border-color .18s;
      }
      a.gh-card:hover, a.gh-card:focus-visible {
        transform: translateY(-3px); outline: none;
        border-color: color-mix(in srgb, var(--c) 80%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 12px 30px rgba(0,0,0,.35), 0 0 30px color-mix(in srgb, var(--c) 40%, transparent);
      }
      a.gh-card:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }
      .gh-card-soon { opacity: .55; cursor: default; }
      .gh-card-icon {
        position: absolute; top: 12px; inset-inline-end: 12px; font-size: 44px; line-height: 1;
        filter: drop-shadow(0 4px 12px var(--c)) drop-shadow(0 0 18px color-mix(in srgb, var(--c) 55%, transparent));
      }
      .gh-tags { display: flex; flex-wrap: wrap; gap: 5px; padding-inline-end: 56px; min-height: 24px; }
      .gh-tag {
        display: inline-flex; align-items: center; gap: 4px; padding: 3px 8px; border-radius: 999px; white-space: nowrap;
        font-size: 11px; font-weight: 700; color: #DCD6FF;
        background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12);
      }
      .gh-tag-new { color: #2B1A00; background: linear-gradient(160deg, #FFD976, #F5A524); border-color: rgba(255,226,140,.8); }
      .gh-tag-done { color: #052E1B; background: linear-gradient(160deg, #4CF0AE, #17B978); border-color: rgba(120,255,200,.7); }
      .gh-card-name {
        margin-top: 10px; padding-inline-end: 8px;
        font: 800 17px/1.2 'Poppins', system-ui, sans-serif; text-transform: uppercase; letter-spacing: .02em;
        overflow-wrap: anywhere;
      }
      .gh-card-desc { font-size: 12.5px; line-height: 1.45; color: rgba(220,224,250,.78); flex: 1; }
      .gh-card-foot { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-top: 6px; }
      .gh-record { min-width: 0; font-size: 12.5px; font-weight: 700; color: #FDE68A; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .gh-btn {
        flex-shrink: 0; display: inline-flex; align-items: center; min-height: 36px; padding: 0 18px; border-radius: 999px;
        font: 800 13px 'Poppins', system-ui, sans-serif; color: #fff; white-space: nowrap; text-shadow: 0 1px 2px rgba(0,0,0,.45);
        border: 1px solid color-mix(in srgb, var(--c) 60%, #fff);
        background: linear-gradient(160deg, color-mix(in srgb, var(--c) 78%, #fff), var(--c) 55%, color-mix(in srgb, var(--c) 72%, #000));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 3px 0 color-mix(in srgb, var(--c) 45%, #000), 0 0 16px color-mix(in srgb, var(--c) 45%, transparent);
      }
      .gh-btn-soon { background: transparent; box-shadow: none; text-shadow: none; color: #DCD6FF; border: 1.5px solid rgba(220,214,255,.5); }
      .gh-empty { margin-top: 24px; text-align: center; font-size: 13px; color: #8E8E9E; }

      @media (max-width: 480px) {
        .gh .gx-banner-title { font-size: 26px; }
        .gh .gx-banner-icon { font-size: 50px; }
        .gh-grid { gap: 10px; }
        .gh-card { padding: 12px; min-height: 176px; border-radius: 16px; }
        .gh-card-icon { font-size: 32px; top: 10px; inset-inline-end: 10px; }
        .gh-tags { padding-inline-end: 40px; }
        .gh-tag { font-size: 10px; padding: 2px 6px; }
        .gh-card-name { font-size: 14px; margin-top: 6px; }
        .gh-card-desc { font-size: 11.5px; }
        .gh-card-foot { flex-wrap: wrap; }
        .gh-btn { min-height: 32px; padding: 0 12px; font-size: 12px; margin-inline-start: auto; }
        .gh-record { font-size: 11.5px; }
      }
      @media (prefers-reduced-motion: reduce) { .gh-card, .gh-chip { transition: none; } }
    `}</style>
  );
}
