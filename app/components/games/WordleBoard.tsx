'use client';

export type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'typed';

export const KB_ROWS = [
  ['Q','W','E','R','T','Y','U','I','O','P'],
  ['A','S','D','F','G','H','J','K','L'],
  ['ENTER','Z','X','C','V','B','N','M','⌫'],
];

/* Board + keyboard shared by Today's Puzzle and the Wordle variants, in the game look:
   rounded tiles (10 px), green / yellow with a gradient and glow, grey for wrong letters,
   the current row outlined in purple; full-width 3D keys coloured by letter state. */

export function WordleBoard({ guesses, evals, current, revealed, max, len = 5, playing, shake }: {
  guesses: string[];
  evals: TileState[][];
  current: string;
  /** "row-col" keys of tiles whose colour is already shown (they flip one by one). */
  revealed: Set<string>;
  max: number;
  len?: number;
  playing: boolean;
  shake: boolean;
}) {
  return (
    <div className="wb-board" style={{ '--wb-len': len } as React.CSSProperties}>
      {Array.from({ length: max }, (_, row) => {
        const isCur = playing && row === guesses.length;
        const letters = row < guesses.length
          ? guesses[row].split('')
          : isCur
            ? [...current.split(''), ...Array(len - current.length).fill('')]
            : Array(len).fill('');
        return (
          <div key={row} className={`wb-row${isCur ? ' wb-cur' : ''}${isCur && shake ? ' wb-shake' : ''}`}>
            {letters.map((ch, col) => {
              const done = row < guesses.length;
              const isRev = revealed.has(`${row}-${col}`);
              const state: TileState = done
                ? (isRev ? evals[row]?.[col] ?? 'absent' : 'typed')
                : ch ? 'typed' : 'empty';
              const flip = done && !isRev;
              return (
                <div
                  key={col}
                  className={`wb-tile wb-${state}${flip ? ' wb-flip' : ''}${!done && ch ? ' wb-pop' : ''}`}
                  style={flip ? { animationDelay: `${col * 0.3}s` } : undefined}
                >
                  {ch}
                </div>
              );
            })}
          </div>
        );
      })}
      <WordleStyles />
    </div>
  );
}

export function WordleKeyboard({ keyColors, onKey, enterLabel, backLabel }: {
  keyColors: Record<string, TileState>;
  onKey: (key: string) => void;
  enterLabel: string;
  backLabel: string;
}) {
  return (
    <div className="wb-kb">
      {KB_ROWS.map((row, ri) => (
        <div key={ri} className="wb-kb-row">
          {row.map(key => {
            const wide = key === 'ENTER' || key === '⌫';
            const kc = keyColors[key];
            return (
              <button
                key={key} type="button" onClick={() => onKey(key)}
                className={`wb-key${wide ? ' wb-wide' : ''}${kc ? ` wb-${kc}` : ''}`}
                aria-label={key === '⌫' ? backLabel : undefined}
              >
                {key === 'ENTER' ? enterLabel : key === '⌫' ? '⌫' : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** One strip with four numbers (played, win rate, streak, best streak) and a "Statistics" button. */
export function WordleStatsBar({ items, onOpen, openLabel }: {
  items: { label: string; value: string | number }[];
  onOpen?: () => void;
  openLabel?: string;
}) {
  return (
    <div className="wb-stats">
      <dl className="wb-stats-list">
        {items.map(it => (
          <div key={it.label} className="wb-stat">
            <dd>{it.value}</dd>
            <dt>{it.label}</dt>
          </div>
        ))}
      </dl>
      {onOpen && openLabel && (
        <button type="button" className="gx-btn gx-ghost gx-sm wb-stats-btn" onClick={onOpen}>📊 {openLabel}</button>
      )}
    </div>
  );
}

export function WordleStyles() {
  return (
    <style href="everyday-wordle-board" precedence="medium">{`
      .wb-board {
        --wb-gap: 6px;
        display: flex; flex-direction: column; gap: var(--wb-gap);
        width: 100%; max-width: 330px; margin: 0 auto;
      }
      .wb-row { display: grid; grid-template-columns: repeat(var(--wb-len), minmax(0, 1fr)); gap: var(--wb-gap); }
      .wb-tile {
        aspect-ratio: 1; border-radius: 10px; display: grid; place-items: center;
        font: 800 clamp(20px, 6vw, 26px) 'Poppins', system-ui, sans-serif; color: #fff; text-transform: uppercase;
        background: rgba(18,22,64,0.55); border: 2px solid rgba(255,255,255,0.1);
        transition: border-color .15s;
      }
      .wb-cur .wb-tile { border-color: rgba(139,92,246,0.75); box-shadow: 0 0 12px rgba(139,92,246,0.25); }
      .wb-tile.wb-typed { border-color: rgba(196,181,253,0.95); background: linear-gradient(160deg, #1C2258, #121640); }
      .wb-tile.wb-correct, .wb-tile.wb-present, .wb-tile.wb-absent { border-color: transparent; }
      .wb-tile.wb-correct {
        background: linear-gradient(160deg, #4CF0AE, #17B978); color: #04261A;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 0 18px rgba(47,227,154,.5);
      }
      .wb-tile.wb-present {
        background: linear-gradient(160deg, #FFD978, #E8A817); color: #2B1A00;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.5), 0 0 18px rgba(255,201,77,.45);
      }
      .wb-tile.wb-absent { background: linear-gradient(160deg, #3D4263, #2A2E4A); color: #C9CCE4; }
      .wb-flip { animation: wbFlip .5s ease both; }
      .wb-pop { animation: wbPop .1s ease; }
      .wb-shake { animation: wbShake .4s ease; }
      @keyframes wbFlip { 0% { transform: scaleY(1); } 50% { transform: scaleY(0); } 100% { transform: scaleY(1); } }
      @keyframes wbPop { 50% { transform: scale(1.12); } }
      @keyframes wbShake { 20% { transform: translateX(-8px); } 40% { transform: translateX(8px); } 60% { transform: translateX(-5px); } 80% { transform: translateX(5px); } }

      .wb-kb { display: flex; flex-direction: column; gap: 7px; width: 100%; user-select: none; -webkit-user-select: none; }
      .wb-kb-row { display: flex; gap: 5px; width: 100%; }
      .wb-key {
        flex: 1 1 0; min-width: 0; height: 54px; padding: 0; border-radius: 9px; cursor: pointer;
        font: 700 14px 'Poppins', system-ui, sans-serif; color: #fff; white-space: nowrap; overflow: hidden;
        border: 1px solid rgba(255,255,255,0.08);
        background: linear-gradient(160deg, #2A3070, #1A1F52);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 3px 0 #0A0D2C;
        transition: transform .08s, filter .15s;
        -webkit-tap-highlight-color: transparent;
      }
      .wb-key:hover { filter: brightness(1.12); }
      .wb-key:active { transform: translateY(2px); box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 1px 0 #0A0D2C; }
      .wb-key:focus-visible { outline: 3px solid #fff; outline-offset: 1px; }
      .wb-key.wb-wide { flex: 1.6 1 0; font-size: 12px; }
      .wb-key.wb-correct { background: linear-gradient(160deg, #4CF0AE, #17B978); color: #04261A; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 #0C7A4E; }
      .wb-key.wb-present { background: linear-gradient(160deg, #FFD978, #E8A817); color: #2B1A00; box-shadow: inset 0 1px 0 rgba(255,255,255,.45), 0 3px 0 #9A6A06; }
      .wb-key.wb-absent { background: linear-gradient(160deg, #343852, #262A40); color: #8D91AE; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 3px 0 #11132A; }

      /* message over the top of the board, so it doesn't push the board down */
      .wb-toast { position: relative; height: 0; z-index: 5; }
      .wb-toast span {
        position: absolute; left: 50%; top: 4px; transform: translateX(-50%); white-space: nowrap;
        background: rgba(255,255,255,0.95); color: #111; border-radius: 10px; padding: 8px 16px;
        font-weight: 800; font-size: 13px; box-shadow: 0 8px 24px rgba(0,0,0,.4); animation: wbToast .18s ease;
      }
      @keyframes wbToast { from { opacity: 0; transform: translate(-50%, -6px); } to { opacity: 1; transform: translateX(-50%); } }
      .wb-stats {
        display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 16px;
        background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,0.07);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
      }
      .wb-stats-list { flex: 1; min-width: 0; margin: 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px; }
      .wb-stat { display: flex; flex-direction: column; align-items: center; min-width: 0; text-align: center; }
      .wb-stat dd { margin: 0; font: 800 18px 'Poppins', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums; }
      .wb-stat dt { font-size: 10px; line-height: 1.2; color: #9AA0D0; text-transform: uppercase; letter-spacing: .04em; overflow-wrap: anywhere; }
      .wb-stats-btn { flex-shrink: 0; }

      @media (max-width: 400px) {
        .wb-key { height: 50px; font-size: 13px; border-radius: 8px; }
        .wb-kb-row { gap: 4px; }
        .wb-stats { flex-wrap: wrap; }
        .wb-stats-btn { width: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .wb-flip, .wb-pop, .wb-shake { animation: none; }
      }
    `}</style>
  );
}
