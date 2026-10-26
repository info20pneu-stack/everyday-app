'use client';

import { useState, useSyncExternalStore, type CSSProperties } from 'react';
import Link from 'next/link';
import { useLang } from '../../lib/LanguageContext';
import { homeStrings, formatDays } from '../../lib/homeI18n';
import { utcDayKey } from '../../lib/gamesCatalog';
import {
  readPuzzle, readHigherLower, readBlocks, TRIO_EVENTS, PUZZLE_MAX,
  type PuzzleStatus, type HLStatus, type BlocksStatus,
} from '../../lib/dailyTrio';

type Snapshot = { puzzle: PuzzleStatus; hl: HLStatus; blocks: BlocksStatus };

function subscribe(cb: () => void) {
  TRIO_EVENTS.forEach(e => window.addEventListener(e, cb));
  return () => TRIO_EVENTS.forEach(e => window.removeEventListener(e, cb));
}

/* Snapshot as a string so useSyncExternalStore sees a stable value between reads */
export function useTrioState(): Snapshot | null {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return JSON.stringify({ puzzle: readPuzzle(), hl: readHigherLower(), blocks: readBlocks() });
      } catch { return null; }
    },
    () => null,
  );
  return raw ? (JSON.parse(raw) as Snapshot) : null;
}

const SITE = 'https://www.everyday1234567.com';

async function shareText(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (window.matchMedia('(pointer: coarse)').matches && navigator.share) {
    try { await navigator.share({ text }); return 'shared'; } catch (err) {
      if ((err as Error)?.name === 'AbortError') return 'shared';
    }
  }
  try { await navigator.clipboard.writeText(text); return 'copied'; } catch { return 'failed'; }
}

type CardProps = {
  color: string;
  icon: string;
  href: string;
  badge: string;
  title: string;
  desc: React.ReactNode;
  done: boolean;
  doneLabel: string;
  playLabel: string;
  shareLabel: string;
  copiedLabel: string;
  share: string;
  meta: string | null;
};

function TrioCard({ color, icon, href, badge, title, desc, done, doneLabel, playLabel, shareLabel, copiedLabel, share, meta }: CardProps) {
  const [copied, setCopied] = useState(false);

  async function onShare() {
    const r = await shareText(share);
    if (r === 'copied') { setCopied(true); setTimeout(() => setCopied(false), 2000); }
  }

  return (
    <article className={`trio-card${done ? ' trio-card--done' : ''}`} style={{ '--c': color } as CSSProperties}>
      <span className="trio-card__icon" aria-hidden="true">{icon}</span>
      <span className="trio-card__badge">{done ? `✓ ${doneLabel}` : badge}</span>
      <h3 className="trio-card__title">
        <Link href={href} className="trio-card__link">{title}</Link>
      </h3>
      <div className="trio-card__desc">{desc}</div>
      <div className="trio-card__foot">
        {done ? (
          <button type="button" className="trio-btn trio-btn--outline" onClick={onShare}>
            {copied ? copiedLabel : shareLabel}
          </button>
        ) : (
          <Link href={href} className="trio-btn">{playLabel}</Link>
        )}
        {meta && <span className="trio-card__meta">{meta}</span>}
      </div>
    </article>
  );
}

/** `showAllLink`: the "All games →" link (off on the games page itself). */
export default function DailyTrio({ showAllLink = true }: { showAllLink?: boolean }) {
  const { t, lang } = useLang();
  const h = homeStrings(lang).trio;
  const s = useTrioState();
  const day = utcDayKey();

  /** 🏆 rank today when known, otherwise 🔥 streak */
  const meta = (st: { rank: number | null; streak: number; done: boolean } | undefined) => {
    if (!st) return null;
    if (st.done && st.rank) return `🏆 #${st.rank} ${h.today}`;
    if (st.streak > 0) return `🔥 ${formatDays(st.streak, lang)}`;
    return null;
  };

  const puzzle = s?.puzzle;
  const hl = s?.hl;
  const blocks = s?.blocks;
  const puzzleNum = puzzle?.number;
  const hlName = t.gamesHub.name_higherLower;
  const blocksName = t.gamesHub.name_dailyBlocks;
  const hlGrid = hl?.results.map(r => (r ? '🟩' : '🟥')).join('') ?? '';

  const puzzleShare = puzzle?.done
    ? `🧩 EVERY DAY – ${t.dailyPuzzle.title} #${puzzle.number}\n${puzzle.won ? puzzle.attempts : 'X'}/${PUZZLE_MAX}\n\n${puzzle.grid}\n${SITE}/games/daily-puzzle`
    : '';
  const hlShare = hl?.done
    ? `${t.higherLower.shareText
      .replace('{name}', hlName).replace('{date}', day).replace('{score}', String(hl.score))
      .replace('{grid}', hlGrid).replace('{streak}', String(Math.max(1, hl.streak)))}\n${SITE}/games/higher-lower`
    : '';
  const blocksShare = blocks?.done
    ? `EVERY DAY · ${blocksName} ${day}\n🧱 ${h.score.replace('{n}', blocks.score.toLocaleString(lang))}\n${SITE}/games/daily-blocks`
    : '';

  const common = { doneLabel: h.done, playLabel: h.play, shareLabel: h.share, copiedLabel: h.copied };

  return (
    <section className="trio-section">
      <div className="section-head">
        <div className="section-head__titles">
          <h2 className="section-title">🎯 {h.title}</h2>
          <span className="section-sub">{h.subtitle}</span>
        </div>
        {showAllLink && (
          <Link href="/games" className="section-link">
            {h.allGames} <span className="dir-arrow" aria-hidden="true">→</span>
          </Link>
        )}
      </div>

      <div className="trio-grid">
        <TrioCard
          {...common}
          color="#2FE39A" icon="🧩" href="/games/daily-puzzle"
          badge={`${puzzleNum ? `#${puzzleNum} · ` : ''}${t.gamesHub.minutes.replace('{n}', '2')}`}
          title={t.dailyPuzzle.title}
          done={!!puzzle?.done}
          desc={puzzle?.done
            ? (puzzle.won ? h.solvedIn.replace('{n}', String(puzzle.attempts)) : h.notSolved)
            : h.puzzleDesc}
          share={puzzleShare}
          meta={meta(puzzle)}
        />
        <TrioCard
          {...common}
          color="#8B5CF6" icon="⚖️" href="/games/higher-lower"
          badge={t.gamesHub.minutes.replace('{n}', '2')}
          title={hlName}
          done={!!hl?.done}
          desc={hl?.done
            ? <><span className="trio-grid-emoji" aria-hidden="true">{hlGrid}</span> <b className="tabular-nums">{hl.score}/10</b></>
            : h.hlDesc}
          share={hlShare}
          meta={meta(hl)}
        />
        <TrioCard
          {...common}
          color="#38BDF8" icon="🧱" href="/games/daily-blocks"
          badge={t.gamesHub.minutes.replace('{n}', '10+')}
          title={blocksName}
          done={!!blocks?.done}
          desc={blocks?.done ? h.score.replace('{n}', blocks.score.toLocaleString(lang)) : h.blocksDesc}
          share={blocksShare}
          meta={meta(blocks)}
        />
      </div>
    </section>
  );
}
