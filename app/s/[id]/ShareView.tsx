'use client';

import Link from 'next/link';
import { useLang } from '../../../lib/LanguageContext';
import { utcDayKey } from '../../../lib/gamesCatalog';
import { prepareChallenge } from '../../../lib/share/client';
import { boardDay, challengeHref, formatShareValue, shareGame } from '../../../lib/share/games';
import { GRID_COLOR, type GridCell } from '../../../lib/share/grid';
import { fill, shareTexts } from '../../../lib/share/i18n';
import type { PublicShare } from '../../../lib/share/store';
import type { TopEntry } from '../../../lib/share/top';
import { GameBanner, GameFrame, GameTopBar } from '../../components/games/GameFrame';
import Flag from '../../components/Flag';
import { useIsClient } from '../../../lib/games/useIsClient';

/* The /s/<id> page in the viewer's language: the shared result, "accept the challenge"
   (same game; daily games the same set, other games with a random set the same seed) and
   today's top 3 of the game. */

const MEDALS = ['🥇', '🥈', '🥉'];

export default function ShareView({ share, top }: {
  share: PublicShare | null;
  top: { board: string; entries: TopEntry[] } | null;
}) {
  const { t, lang } = useLang();
  // The page language comes from the browser (localStorage), so render on the client only
  const isClient = useIsClient();
  const s = shareTexts(lang);
  if (!isClient) return <div style={{ minHeight: 480 }} />;

  if (!share) {
    return (
      <GameFrame>
        <GameTopBar />
        <div className="sv-card sv-missing">
          <div className="sv-missing-icon" aria-hidden="true">🔗</div>
          <p>{s.notFound}</p>
          <Link href="/games" className="gx-btn gx-primary">{s.moreGames}</Link>
        </div>
        <ShareViewStyles />
      </GameFrame>
    );
  }

  const game = shareGame(share.board);
  const gameName = game ? game.name(t) : 'EVERY DAY';
  const value = formatShareValue(share.board, share, lang);
  const day = boardDay(share.board);
  const otherDay = day !== null && day !== utcDayKey();
  const dateText = new Date(day ? `${day}T12:00:00Z` : share.at)
    .toLocaleDateString(lang, { day: 'numeric', month: 'long', year: 'numeric', ...(day ? { timeZone: 'UTC' } : {}) });

  return (
    <GameFrame color={game?.color}>
      <GameTopBar />
      <GameBanner
        title={fill(share.vs ? s.rematchTitle : s.invites, { name: share.name })}
        desc={gameName}
        icon={game?.icon ?? '🎮'}
      />

      <section className="sv-card sv-result">
        <div className="sv-meta">
          <span>{share.name}</span>
          <span aria-hidden="true">·</span>
          <span>{dateText}</span>
        </div>
        <div className="sv-value" dir="ltr">{value}</div>
        {share.grid && share.grid.length > 0 && (
          <div className="sv-grid" aria-hidden="true">
            {share.grid.map((row, i) => (
              <div key={i} className="sv-row">
                {[...row].map((c, j) => <span key={j} style={{ background: GRID_COLOR[c as GridCell] ?? GRID_COLOR.x }} />)}
              </div>
            ))}
          </div>
        )}
        {share.vs && (
          <div className="sv-vs">
            <span><b>{share.name}</b> <span dir="ltr">{value}</span></span>
            <span className="sv-vs-sep">vs</span>
            <span><b>{share.vs.name}</b> <span dir="ltr">{formatShareValue(share.board, share.vs, lang)}</span></span>
          </div>
        )}
        <div className="sv-verified">✓ {s.verified}</div>
      </section>

      {otherDay && <p className="sv-note">{fill(s.otherDay, { date: dateText })}</p>}

      <a className="gx-btn gx-primary sv-accept" href={challengeHref(share.board, share.id)} onClick={() => prepareChallenge(share)}>
        ⚔️ {s.accept}
      </a>
      <p className="sv-cta">{s.canYouBeat}</p>

      <section className="sv-card">
        <h2 className="sv-h2">🏆 {s.todayTop}</h2>
        {top && top.entries.length > 0 ? (
          <ol className="sv-top">
            {top.entries.map((e, i) => (
              <li key={i}>
                <span className="sv-medal" aria-hidden="true">{MEDALS[i]}</span>
                {e.country && <Flag code={e.country} size={18} />}
                <span className="sv-top-name">{e.name}</span>
                <b dir="ltr">{formatShareValue(top.board, e, lang)}</b>
              </li>
            ))}
          </ol>
        ) : (
          <p className="sv-empty">{s.noneToday}</p>
        )}
      </section>

      <Link href="/games" className="gx-btn gx-ghost sv-more">{s.moreGames}</Link>
      <ShareViewStyles />
    </GameFrame>
  );
}

function ShareViewStyles() {
  return (
    <style>{`
      .sv-card {
        border-radius: 18px; padding: 18px; background: linear-gradient(160deg, #1C2258, #121640);
        border: 1px solid rgba(255,255,255,0.08); box-shadow: inset 0 1px 0 rgba(255,255,255,0.1);
      }
      .sv-result { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
      .sv-meta { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; font-size: 13px; color: #AAB0E0; font-weight: 600; }
      .sv-value {
        font: 900 clamp(44px, 14vw, 72px)/1 'Poppins', system-ui, sans-serif; color: #fff;
        text-shadow: 0 0 36px color-mix(in srgb, var(--gx) 70%, transparent); overflow-wrap: anywhere;
      }
      .sv-grid { display: flex; flex-direction: column; gap: 5px; }
      .sv-row { display: flex; gap: 5px; justify-content: center; }
      .sv-row span { width: 26px; height: 26px; border-radius: 6px; box-shadow: inset 0 -3px 0 rgba(0,0,0,.18); }
      .sv-vs { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: center; font-size: 14px; color: #DCD6FF; }
      .sv-vs b { color: #fff; }
      .sv-vs-sep { font-size: 12px; color: #8E8E9E; }
      .sv-verified { font-size: 12px; font-weight: 700; color: #4ADE80; }
      .sv-note { margin: 0; font-size: 13px; color: #FFD27A; text-align: center; line-height: 1.45; }
      .sv-accept { display: flex; justify-content: center; text-decoration: none; min-height: 52px; font-size: 16px; }
      .sv-cta { margin: -4px 0 0; text-align: center; font-size: 13px; color: #AAB0E0; }
      .sv-h2 { margin: 0 0 10px; font: 800 15px 'Poppins', system-ui, sans-serif; color: #FFD27A; }
      .sv-top { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
      .sv-top li {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px;
        background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); font-size: 14px;
      }
      .sv-medal { font-size: 20px; line-height: 1; }
      .sv-top-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #fff; font-weight: 600; }
      .sv-top b { color: #fff; font-variant-numeric: tabular-nums; }
      .sv-empty { margin: 0; font-size: 13px; color: #AAB0E0; }
      .sv-more { display: flex; justify-content: center; text-decoration: none; }
      .sv-missing { display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center; }
      .sv-missing p { margin: 0; color: #C9CCEB; line-height: 1.5; }
      .sv-missing a { text-decoration: none; }
      .sv-missing-icon { font-size: 40px; }
    `}</style>
  );
}
