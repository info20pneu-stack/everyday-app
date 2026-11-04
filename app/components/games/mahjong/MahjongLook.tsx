'use client';

import { fillText, type MahjongTexts } from '../../../../lib/games/mahjongI18n';
import { poolFor, SETS, type SetId } from '../../../../lib/games/mahjongSymbols';
import { Back } from './icons';
import { Mini } from './MahjongHome';
import type { MjSettings } from './settings';
import { SKIN_IDS, TABLE_IDS } from './theme';

/* Look: symbol set (or a custom mix), tile style, table and dimming of blocked tiles. */

export default function MahjongLook({ s, tx, update, onDone }: {
  s: MjSettings; tx: MahjongTexts;
  update: (patch: Partial<MjSettings>) => void;
  onDone: () => void;
}) {
  const mixOn = s.set === 'mix';
  const demo = poolFor(s.set, s.mix).prev;

  function toggleMix(id: SetId) {
    const mix = s.mix.includes(id) ? s.mix.filter(x => x !== id) : [...s.mix, id];
    update({ mix, set: s.set === 'mix' && mix.length < 2 ? 'mahjong' : s.set });
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="mj-row">
        <button type="button" className="mj-icon-btn" aria-label={tx.back} onClick={onDone}><Back /></button>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <b style={{ fontSize: 22, fontWeight: 800 }}>{tx.look}</b>
          <span className="mj-note">{tx.lookSub}</span>
        </div>
      </div>

      <h3 className="mj-sec">{tx.setsTitle}</h3>
      <div className="mj-grid2">
        {SETS.map(set => (
          <button key={set.id} type="button" className="mj-pick" aria-pressed={s.set === set.id} onClick={() => update({ set: set.id })}>
            <span className="mj-minis">{set.prev.map(sym => <Mini key={sym.key} sym={sym} />)}</span>
            <b>{tx.sets[set.id]}</b>
            <span className="meta">
              {[1, 2, 3].map(i => <i key={i} className={`mj-dot${i <= set.lvl ? ' on' : ''}`} />)}
              {tx.difficulty[set.lvl - 1]} · {fillText(tx.mult, { m: set.mult.toLocaleString() })}
            </span>
          </button>
        ))}
      </div>

      <div className={`mj-mixbox mj-glass${mixOn ? ' on' : ''}`}>
        <div className="mj-spread"><b>{tx.mix}</b><span className="mj-note">{fillText(tx.mixSelected, { n: s.mix.length })}</span></div>
        <span className="mj-note">{tx.mixNote}</span>
        <div className="mj-chips">
          {SETS.map(set => (
            <button key={set.id} type="button" className="mj-chip" aria-pressed={s.mix.includes(set.id)} onClick={() => toggleMix(set.id)}>{tx.sets[set.id]}</button>
          ))}
        </div>
        <button type="button" className={`mj-btn${mixOn ? ' gold' : ''}`} disabled={s.mix.length < 2} onClick={() => update({ set: 'mix' })}>
          {mixOn ? tx.mixOn : tx.mixPlay}
        </button>
      </div>

      <h3 className="mj-sec">{tx.skinsTitle}</h3>
      <div className="mj-grid2">
        {SKIN_IDS.map(id => (
          <button key={id} type="button" className="mj-pick" aria-pressed={s.skin === id} onClick={() => update({ skin: id })}>
            <span className="mj-minis" data-skin={id}>{demo.map(sym => <Mini key={sym.key} sym={sym} />)}</span>
            <b>{tx.skins[id][0]}</b>
            <span className="meta">{tx.skins[id][1]}</span>
          </button>
        ))}
      </div>

      <h3 className="mj-sec">{tx.tablesTitle}</h3>
      <div className="mj-grid2">
        {TABLE_IDS.map(id => (
          <button key={id} type="button" className="mj-pick" aria-pressed={s.table === id} onClick={() => update({ table: id })}>
            <span className="mj-swatch mj-surface" data-table={id}>{demo.slice(0, 2).map(sym => <Mini key={sym.key} sym={sym} />)}</span>
            <b>{tx.tables[id]}</b>
          </button>
        ))}
      </div>

      <button type="button" className="mj-toggle mj-glass" aria-pressed={s.dim} onClick={() => update({ dim: !s.dim })}>
        <span style={{ display: 'flex', flexDirection: 'column', gap: 2 }}><b>{tx.dimTitle}</b><span className="mj-note">{tx.dimNote}</span></span>
        <span className="sw" aria-hidden="true" />
      </button>
      <button type="button" className="mj-btn gold" onClick={onDone}>{tx.done}</button>
    </div>
  );
}
