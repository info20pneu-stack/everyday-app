'use client';

import { ALL_LEVELS, CHAPTERS } from '../../../../lib/games/mahjong';
import { fillText, type MahjongTexts } from '../../../../lib/games/mahjongI18n';
import { faceOf, poolFor, type Sym } from '../../../../lib/games/mahjongSymbols';
import { utcDayKey } from '../../../../lib/gamesCatalog';
import { Chevron, Flame, SoundIcon, StarSmall } from './icons';
import { fmtClock, levelUnlocked, totalStars, type MjSettings } from './settings';
import { ORNAMENT } from './theme';

/* Level map: hero with "continue", the daily challenge with this week's days, the look bar and
   four chapters of five levels (1–3 stars each, a level opens after the previous one). */

export function FaceHtml({ sym }: { sym: Sym }) {
  // Static markup from lib/games/mahjongSymbols.ts (no user input)
  return <span className="mj-face" dangerouslySetInnerHTML={{ __html: faceOf(sym).html }} />;
}

export function Mini({ sym }: { sym: Sym }) {
  return <span className="mj-mini"><FaceHtml sym={sym} /></span>;
}

function prevDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() - 1);
  return utcDayKey(d);
}

export function liveStreak(s: MjSettings, today: string): number {
  return s.lastDaily === today || s.lastDaily === prevDay(today) ? s.streak : 0;
}

export default function MahjongHome({ s, tx, lang, onLevel, onDaily, onLook, onSound }: {
  s: MjSettings; tx: MahjongTexts; lang: string;
  onLevel: (n: number) => void; onDaily: () => void; onLook: () => void; onSound: () => void;
}) {
  const today = utcDayKey();
  const now = new Date(`${today}T12:00:00Z`);
  let dateTxt = now.toLocaleDateString(lang, { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
  dateTxt = dateTxt.charAt(0).toUpperCase() + dateTxt.slice(1);
  const monday = new Date(now); monday.setUTCDate(now.getUTCDate() - ((now.getUTCDay() + 6) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday); d.setUTCDate(monday.getUTCDate() + i);
    const k = utcDayKey(d);
    return { k, label: d.toLocaleDateString(lang, { weekday: 'short', timeZone: 'UTC' }).replace('.', ''), done: !!s.daily[k], today: k === today };
  });
  const pool = poolFor(s.set, s.mix);
  const ls = liveStreak(s, today);
  let next = ALL_LEVELS.length;
  for (let i = 1; i <= ALL_LEVELS.length; i++) if (levelUnlocked(s, i) && !s.levels[i]?.stars) { next = i; break; }
  const nextLevel = ALL_LEVELS[next - 1];
  const doneToday = s.daily[today];

  return (
    <div className="mj-home" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="mj-hero mj-surface">
        <div className="mj-orn-wrap" dangerouslySetInnerHTML={{ __html: ORNAMENT }} />
        <div className="mj-spread">
          <span className="mj-eyebrow" style={{ color: 'rgba(255,255,255,.8)' }}>Everyday</span>
          <div className="mj-row" style={{ gap: 8 }}>
            <span className="mj-pill"><StarSmall />{totalStars(s)} / {ALL_LEVELS.length * 3}</span>
            <button type="button" className="mj-icon-btn" aria-label={s.sound ? tx.soundOn : tx.soundOff} onClick={onSound}><SoundIcon on={s.sound} /></button>
          </div>
        </div>
        <div className="mj-hero-tiles">
          {pool.prev.map(sym => <span key={sym.key} className="mj-htile"><FaceHtml sym={sym} /></span>)}
        </div>
        <h2>Mahjong</h2>
        <p>{tx.heroText}</p>
        <button type="button" className="mj-btn gold" onClick={() => onLevel(next)}>
          {fillText(tx.continue, { n: next, name: tx.layouts[nextLevel.layout] })}
        </button>
      </div>

      <div className="mj-daily">
        <div className="mj-spread" style={{ alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span className="mj-eyebrow">{tx.dailyEyebrow}</span>
            <h3>{dateTxt}</h3>
          </div>
          <span className="mj-pill"><Flame />{fillText(tx.dayStreak, { n: ls })}</span>
        </div>
        <div className="mj-week">
          {week.map(d => <span key={d.k} className={`${d.done ? 'done ' : ''}${d.today ? 'today' : ''}`}>{d.label}</span>)}
        </div>
        <button type="button" className="mj-btn dark" onClick={onDaily}>
          {doneToday ? fillText(tx.dailyDoneBest, { t: fmtClock(doneToday.ms) }) : tx.dailyPlay}
        </button>
      </div>

      <button type="button" className="mj-setbar mj-glass" onClick={onLook}>
        <span className="mj-minis">{pool.prev.map(sym => <Mini key={sym.key} sym={sym} />)}</span>
        <span className="txt">
          <span>{tx.look}</span>
          <b>{pool.mix ? tx.mix : tx.sets[pool.setId as keyof MahjongTexts['sets']]} · {tx.skins[s.skin][0]}</b>
          <span>{fillText(tx.tableIs, { name: tx.tables[s.table] })}</span>
        </span>
        <Chevron />
      </button>

      {CHAPTERS.map((_, ci) => {
        const lvls = ALL_LEVELS.filter(l => l.ch === ci);
        const got = lvls.reduce((a, l) => a + (s.levels[l.n]?.stars ?? 0), 0);
        return (
          <div key={ci} className="mj-chapter mj-glass">
            <div className="mj-spread">
              <h3>{fillText(tx.chapter, { n: ci + 1, name: tx.chapterNames[ci] })}</h3>
              <span className="count">{got} / 15 ★</span>
            </div>
            <div className="mj-chbar"><i style={{ width: `${got / 15 * 100}%` }} /></div>
            <div className="mj-levels">
              {lvls.map(l => {
                const rec = s.levels[l.n], unl = levelUnlocked(s, l.n), cur = unl && !rec?.stars;
                const st = rec?.stars ? '★★★'.slice(0, rec.stars) + '☆☆☆'.slice(0, 3 - rec.stars) : '';
                const aria = [`Level ${l.n}`, tx.layouts[l.layout], unl ? '' : tx.locked, rec?.stars ? fillText(tx.starsN, { n: rec.stars }) : ''].filter(Boolean).join(', ');
                return (
                  <button key={l.n} type="button" className={`mj-lv${unl ? '' : ' lock'}${cur ? ' cur' : ''}`} disabled={!unl} aria-label={aria}
                    onClick={() => { if (unl) onLevel(l.n); }}>
                    <span className="t">{l.n}</span>
                    <span className="nm">{tx.layouts[l.layout]}</span>
                    <span className="st">{st}</span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      <p className="mj-note" style={{ textAlign: 'center' }}>{tx.progressNote}</p>
    </div>
  );
}
