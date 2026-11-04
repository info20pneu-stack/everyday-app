/* Styles of Mahjong (ported from games-reference/mahjong, every class prefixed with mj-).
   Tables and tile skins are CSS variables switched by data-table / data-skin. */

const CSS = `
.mj {
  --jade:#0F3B33; --panel:#134A40; --line:#2C6457; --muted:#A9C2B8; --deep:#0A2A24;
  --board-base: radial-gradient(ellipse at 50% 38%, #145244 0%, #0B3029 75%);
  --board-pattern: linear-gradient(transparent, transparent);
  --board-line:#1D5146; --orn:#9FD8C0; --orn-op:.10; --rim:rgba(255,255,255,.10);
  --ivory:#F4EEDC; --gold:#E3B45C; --gold-hi:#F2CD82; --gold-ink:#2A1D05;
  --tile-a:#FFFFFF; --tile-b:#ECEFEA; --tile-edge1:#DCE1DA; --tile-edge2:#1E7A4E; --tile-line:#E3E7E1;
  --bevel: inset 1.5px 1.5px 0 rgba(255,255,255,.95), inset -1px -1px 0 rgba(0,0,0,.07);
  --glass: linear-gradient(180deg, rgba(255,255,255,.075), rgba(255,255,255,.03));
  --glass-line: rgba(255,255,255,.10);
  --f-han: "Noto Serif SC", "Songti SC", "SimSun", "Hiragino Mincho ProN", serif;
  position: relative; display: flex; flex-direction: column; gap: 14px; padding: 14px; border-radius: 22px;
  background: var(--jade); color: var(--ivory); border: 1px solid var(--line); transition: background-color .35s;
  -webkit-tap-highlight-color: transparent;
}
.mj [data-skin], .mj[data-skin] { --tile-edge2-dk: color-mix(in srgb, var(--tile-edge2) 70%, #000); }
.mj { --tile-edge2-dk: color-mix(in srgb, var(--tile-edge2) 70%, #000); }
.mj[data-table="nefrit"], .mj [data-table="nefrit"] {--jade:#0E3530;--panel:#134A40;--line:#2C6457;--muted:#A9C2B8;--deep:#08241F;--board-line:#2A6B5B;--orn:#A8E0C8;--orn-op:.12;--rim:rgba(168,224,200,.18);--board-base: radial-gradient(ellipse at 50% 38%, #17604F 0%, #0C3A31 62%, #082A23 100%)}
.mj[data-table="platno"], .mj [data-table="platno"] {--jade:#092A18;--panel:#103C27;--line:#2A6A47;--muted:#A8C9B4;--deep:#061F11;--board-line:#2B8A52;--orn:#D7F0CF;--orn-op:.07;--rim:rgba(215,240,207,.14);--board-base: radial-gradient(ellipse at 50% 38%, #1A9A50 0%, #0E6B34 62%, #094A24 100%)}
.mj[data-table="more"], .mj [data-table="more"] {--jade:#0A2140;--panel:#12335C;--line:#2A5285;--muted:#AFC4DE;--deep:#06172E;--board-line:#3A8BDA;--orn:#FFFFFF;--orn-op:.13;--rim:rgba(255,255,255,.16);--board-base: radial-gradient(ellipse at 50% 38%, #2A9CEB 0%, #1270C2 60%, #0B4F94 100%)}
.mj[data-table="chram"], .mj [data-table="chram"] {--jade:#291906;--panel:#3B270B;--line:#6B4A17;--muted:#D9C49B;--deep:#1C1103;--board-line:#E2B04A;--orn:#FFF0C4;--orn-op:.55;--rim:rgba(255,236,180,.45);--board-base: radial-gradient(ellipse at 50% 42%, #F8D774 0%, #DDA62A 55%, #A9730C 100%)}
.mj[data-table="zahrada"], .mj [data-table="zahrada"] {--jade:#22102C;--panel:#341843;--line:#5A2E70;--muted:#CDB3DD;--deep:#170A1F;--board-line:#9150B8;--orn:#F2DCFF;--orn-op:.14;--rim:rgba(242,220,255,.18);--board-base: radial-gradient(ellipse at 50% 38%, #9440BC 0%, #651E88 60%, #43105E 100%)}
.mj[data-table="ruze"], .mj [data-table="ruze"] {--jade:#2B0D1D;--panel:#42152C;--line:#6E2A4C;--muted:#E3B9CC;--deep:#1E0813;--board-line:#DB6A95;--orn:#FFE3EE;--orn-op:.15;--rim:rgba(255,227,238,.2);--board-base: radial-gradient(ellipse at 50% 40%, #E86A9A 0%, #B83570 58%, #84204D 100%)}
.mj[data-table="noc"], .mj [data-table="noc"] {--jade:#0A112D;--panel:#141D45;--line:#2B3A78;--muted:#B3BDE3;--deep:#060B1F;--board-line:#3F4F9A;--orn:#E3B45C;--orn-op:.30;--rim:rgba(227,180,92,.30);--board-base: radial-gradient(ellipse at 50% 34%, #2C3C8C 0%, #16205A 55%, #090F2E 100%)}
.mj[data-skin="porcelan"], .mj [data-skin="porcelan"] {--tile-a:#FFFFFF;--tile-b:#ECEFEA;--tile-edge1:#DCE1DA;--tile-edge2:#1E7A4E;--tile-line:#E3E7E1}
.mj[data-skin="slonovina"], .mj [data-skin="slonovina"] {--tile-a:#FFFDF6;--tile-b:#EFE4C8;--tile-edge1:#E2D2AA;--tile-edge2:#A08A55;--tile-line:#E6D9B8}
.mj[data-skin="med"], .mj [data-skin="med"] {--tile-a:#FFF8E2;--tile-b:#FBE0A0;--tile-edge1:#F3B649;--tile-edge2:#3E8E2E;--tile-line:#F3D38A}
.mj[data-skin="nefrit"], .mj [data-skin="nefrit"] {--tile-a:#FCFCF8;--tile-b:#ECEFE8;--tile-edge1:#D5E6DC;--tile-edge2:#0F6E5A;--tile-line:#E2E8E2}
.mj[data-skin="kral"], .mj [data-skin="kral"] {--tile-a:#FFFFFF;--tile-b:#F0EEE6;--tile-edge1:#E8BE6A;--tile-edge2:#1B2A5C;--tile-line:#EAE4D4}
.mj[data-skin="noc"], .mj [data-skin="noc"] {--tile-a:#FFFFFF;--tile-b:#EDEDF4;--tile-edge1:#D2D5E8;--tile-edge2:#5B2A86;--tile-line:#E3E4EE}

.mj button { font-family: inherit; color: inherit; }
.mj button:focus-visible { outline: 3px solid var(--gold); outline-offset: 2px; }
.mj-eyebrow { font-size: 11.5px; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); font-weight: 800; }
.mj-glass { background: var(--glass); border: 1px solid var(--glass-line); box-shadow: 0 12px 30px rgba(0,0,0,.22), inset 0 1px 0 rgba(255,255,255,.06); }
.mj-icon-btn { width: 44px; height: 44px; flex: none; border-radius: 14px; display: flex; align-items: center; justify-content: center; cursor: pointer; background: var(--glass); border: 1px solid var(--glass-line); }
.mj-icon-btn svg { width: 20px; height: 20px; }
.mj-pill { display: inline-flex; align-items: center; gap: 6px; border-radius: 999px; padding: 7px 12px; font-weight: 800; font-size: 13px; background: rgba(0,0,0,.22); border: 1px solid var(--glass-line); font-variant-numeric: tabular-nums; }
.mj-pill svg { width: 15px; height: 15px; }
.mj-btn { min-height: 52px; border-radius: 16px; border: 1px solid var(--glass-line); background: var(--glass); font-weight: 800; font-size: 15px; cursor: pointer; padding: 0 18px; transition: transform .12s, filter .12s; }
.mj-btn:active { transform: translateY(1px); }
.mj-btn.gold { background: linear-gradient(180deg,#F0C873,#D9A440); color: var(--gold-ink); border-color: rgba(255,230,170,.6); box-shadow: 0 8px 22px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.45); }
.mj-btn.dark { background: linear-gradient(180deg,#3A2A0E,#2A1D05); color: #F8E7BF; border-color: #2A1D05; }
.mj-btn:disabled { opacity: .45; cursor: default; }
.mj-row { display: flex; align-items: center; gap: 12px; }
.mj-spread { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.mj-note { font-size: 12.5px; color: var(--muted); line-height: 1.5; margin: 0; }
.mj-sec { margin: 8px 0 0; font-size: 13px; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; color: var(--muted); }

.mj-surface { position: relative; background: var(--board-pattern), var(--board-base); border: 1px solid var(--board-line); overflow: hidden; isolation: isolate; }
.mj-surface::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 2; border-radius: inherit;
  background: radial-gradient(ellipse 80% 70% at 50% 38%, rgba(255,255,255,.10) 0%, transparent 45%, rgba(0,0,0,.18) 75%, rgba(0,0,0,.42) 100%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,.06), inset 0 18px 50px rgba(0,0,0,.18); }
.mj-surface::before { content: ""; position: absolute; inset: 9px; border: 1px solid var(--rim); border-radius: inherit; pointer-events: none; z-index: 2; }
.mj-ornament { position: absolute; left: 50%; top: 50%; transform: translate(-50%,-50%); color: var(--orn); opacity: var(--orn-op); pointer-events: none; z-index: 0; }

/* home */
.mj-hero { border-radius: 26px; padding: 20px; display: flex; flex-direction: column; gap: 14px; min-height: 300px; box-sizing: border-box; }
.mj-hero > * { position: relative; z-index: 3; }
.mj-hero > .mj-orn-wrap { position: absolute; inset: 0; z-index: 0; }
.mj-hero .mj-ornament { width: min(560px, 130%); aspect-ratio: 1; top: 46%; }
.mj-hero h2 { margin: 0; font-family: var(--f-han); font-weight: 900; font-size: 46px; line-height: 1; text-shadow: 0 2px 14px rgba(0,0,0,.35); }
.mj-hero p { margin: 0; max-width: 30ch; line-height: 1.5; font-size: 14px; color: rgba(255,255,255,.86); text-shadow: 0 1px 8px rgba(0,0,0,.35); }
.mj-hero-tiles { display: flex; justify-content: center; align-items: flex-end; height: 96px; margin: 2px 0 4px; }
.mj-htile { --tw: 58px; --th: 76px; width: var(--tw); height: var(--th); box-sizing: border-box; border-radius: 9px; border: 1px solid var(--tile-line); background: linear-gradient(150deg,var(--tile-a) 0%,var(--tile-a) 40%,var(--tile-b) 100%); display: flex; align-items: center; justify-content: center; margin: 0 -4px;
  box-shadow: var(--bevel),1.4px 1.6px 0 var(--tile-edge1),2.8px 3.2px 0 var(--tile-edge1),4.2px 4.8px 0 var(--tile-edge2),5.6px 6.4px 0 var(--tile-edge2-dk),8px 12px 18px rgba(0,0,0,.35); }
.mj-htile:nth-child(1) { transform: rotate(-9deg) translateY(6px); }
.mj-htile:nth-child(2) { transform: translateY(-6px); z-index: 2; }
.mj-htile:nth-child(3) { transform: rotate(9deg) translateY(6px); }
.mj-daily { border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 12px; color: var(--gold-ink); position: relative; overflow: hidden;
  background: radial-gradient(circle at 92% 8%, rgba(255,255,255,.35), transparent 40%), linear-gradient(160deg,#F3CF7E 0%,#DFA944 60%,#C88E28 100%); box-shadow: 0 14px 34px rgba(0,0,0,.28), inset 0 1px 0 rgba(255,255,255,.5); }
.mj-daily .mj-eyebrow { color: rgba(42,29,5,.75); }
.mj-daily h3 { margin: 0; font-size: 21px; font-weight: 800; text-wrap: balance; }
.mj-daily .mj-pill { background: var(--gold-ink); color: #F3CF7E; border: 0; white-space: nowrap; }
.mj-week { display: grid; grid-template-columns: repeat(7, minmax(0,1fr)); gap: 6px; }
.mj-week span { height: 36px; border-radius: 11px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 800; background: rgba(42,29,5,.10); overflow: hidden; }
.mj-week span.done { background: var(--gold-ink); color: #F3CF7E; }
.mj-week span.today { box-shadow: 0 0 0 2px var(--gold-ink); background: rgba(255,255,255,.55); }
.mj-week span.today.done { background: var(--gold-ink); color: #F3CF7E; }
.mj-setbar { display: flex; align-items: center; gap: 14px; border-radius: 20px; padding: 12px 14px; cursor: pointer; text-align: start; width: 100%; }
.mj-setbar .txt { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.mj-setbar .txt b { font-size: 15px; }
.mj-setbar .txt span { font-size: 12px; color: var(--muted); }
.mj-minis { display: flex; gap: 6px; }
.mj-mini { --tw: 30px; width: 30px; height: 39px; box-sizing: border-box; border-radius: 5px; border: 1px solid var(--tile-line); background: linear-gradient(150deg,var(--tile-a) 0%,var(--tile-a) 40%,var(--tile-b)); box-shadow: inset 1px 1px 0 #fff,1px 1.3px 0 var(--tile-edge1),2px 2.6px 0 var(--tile-edge2),3px 5px 6px rgba(0,0,0,.3); display: flex; align-items: center; justify-content: center; flex: none; }
.mj-chapter { display: flex; flex-direction: column; gap: 12px; border-radius: 22px; padding: 16px; }
.mj-chapter h3 { margin: 0; font-size: 16px; font-weight: 800; }
.mj-chapter .count { font-size: 13px; color: var(--muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.mj-chbar { height: 4px; border-radius: 999px; background: rgba(0,0,0,.25); overflow: hidden; }
.mj-chbar i { display: block; height: 100%; background: var(--gold); border-radius: 999px; }
.mj-levels { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 10px; }
.mj-lv { display: flex; flex-direction: column; align-items: center; gap: 5px; background: none; border: 0; padding: 0; cursor: pointer; min-width: 0; }
.mj-lv .t { width: 100%; max-width: 56px; aspect-ratio: .78; box-sizing: border-box; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-family: var(--f-han); font-weight: 900; font-size: 19px; color: #1F2A44; background: linear-gradient(150deg,var(--tile-a) 0%,var(--tile-a) 40%,var(--tile-b)); border: 1px solid var(--tile-line); box-shadow: inset 1px 1px 0 #fff,1.5px 2px 0 var(--tile-edge1),3px 4px 0 var(--tile-edge2),5px 8px 10px rgba(0,0,0,.3); transition: transform .15s; }
.mj-lv:not(.lock):hover .t { transform: translateY(-2px); }
.mj-lv.cur .t { color: #B3261E; box-shadow: 0 0 0 3px var(--gold),0 0 18px 4px rgba(227,180,92,.5),1.5px 2px 0 var(--tile-edge1),3px 4px 0 var(--tile-edge2); }
.mj-lv.lock { cursor: default; }
.mj-lv.lock .t { background: rgba(0,0,0,.22); border: 1px dashed var(--line); box-shadow: none; color: var(--muted); }
.mj-lv .st { font-size: 11px; letter-spacing: 1px; color: var(--gold); height: 14px; }
.mj-lv .nm { font-size: 10px; color: var(--muted); font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }

/* look */
.mj-grid2 { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
.mj-pick { text-align: start; cursor: pointer; border-radius: 18px; padding: 12px; display: flex; flex-direction: column; gap: 9px; min-width: 0; background: var(--glass); border: 1px solid var(--glass-line); }
.mj-pick[aria-pressed="true"] { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold), 0 10px 26px rgba(0,0,0,.25); }
.mj-pick b { font-size: 14px; }
.mj-pick .meta { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--muted); font-weight: 700; flex-wrap: wrap; }
.mj-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--line); }
.mj-dot.on { background: var(--gold); }
.mj-swatch { height: 76px; border-radius: 12px; display: flex; align-items: center; justify-content: center; gap: 5px; }
.mj-swatch .mj-mini { position: relative; z-index: 3; }
.mj-mixbox { border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 10px; }
.mj-mixbox.on { border-color: var(--gold); box-shadow: 0 0 0 2px var(--gold); }
.mj-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.mj-chip { min-height: 38px; padding: 0 13px; border-radius: 999px; font-size: 13px; font-weight: 700; cursor: pointer; background: transparent; border: 1px solid var(--line); }
.mj-chip[aria-pressed="true"] { background: var(--gold); color: var(--gold-ink); border-color: var(--gold); }
.mj-toggle { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-radius: 20px; padding: 14px; cursor: pointer; text-align: start; width: 100%; }
.mj-toggle .sw { width: 46px; height: 28px; border-radius: 999px; background: rgba(0,0,0,.3); border: 1px solid var(--line); position: relative; flex: none; }
.mj-toggle .sw::after { content: ""; position: absolute; top: 3px; inset-inline-start: 3px; width: 20px; height: 20px; border-radius: 50%; background: var(--muted); transition: inset-inline-start .15s; }
.mj-toggle[aria-pressed="true"] .sw { background: var(--gold); border-color: var(--gold); }
.mj-toggle[aria-pressed="true"] .sw::after { inset-inline-start: 21px; background: var(--gold-ink); }

/* game */
.mj-topbar .ttl { display: flex; flex-direction: column; align-items: center; gap: 3px; min-width: 0; text-align: center; }
.mj-topbar .ttl b { font-size: 17px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; }
.mj-scorebar { border-radius: 20px; padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 12px; }
.mj-cells { display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); }
.mj-cell { display: flex; flex-direction: column; gap: 2px; padding: 0 10px; border-inline-start: 1px solid var(--glass-line); position: relative; min-width: 0; }
.mj-cell:first-child { border-inline-start: 0; padding-inline-start: 2px; }
.mj-cell span { font-size: 10.5px; color: var(--muted); font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
.mj-cell b { font-size: 21px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1.1; }
.mj-cell.combo b { transition: color .2s, transform .2s; }
.mj-cell.combo.on b { color: var(--gold); transform: scale(1.08); transform-origin: left center; }
.mj-combo-bar { height: 3px; border-radius: 999px; background: var(--gold); width: 0; margin-top: 4px; }
.mj-progress { position: relative; height: 8px; border-radius: 999px; background: rgba(0,0,0,.3); margin: 4px 9px 0; box-shadow: inset 0 1px 2px rgba(0,0,0,.35); direction: ltr; }
.mj-progress .fill { position: absolute; left: 0; top: 0; bottom: 0; border-radius: 999px; background: linear-gradient(90deg,#C88E28,#F2CD82); transition: width .35s; }
.mj-progress svg { position: absolute; top: -5px; width: 18px; height: 18px; margin-left: -9px; }
.mj-subline { font-size: 12.5px; color: var(--muted); display: flex; justify-content: space-between; align-items: center; gap: 8px; padding: 0 4px; flex-wrap: wrap; }
.mj-subline b { color: var(--ivory); }
.mj-zoom-wrap { position: relative; height: clamp(320px, calc(100dvh - 330px), 640px); border-radius: 24px; display: flex; }
.mj-zoom-wrap .mj-ornament { width: min(96%, 96vh); aspect-ratio: 1; }
.mj-board-wrap { position: relative; z-index: 3; flex: 1; min-height: 0; display: flex; overflow: auto; overscroll-behavior: contain; scrollbar-width: none; direction: ltr; }
.mj-board-wrap::-webkit-scrollbar { display: none; }
.mj-board { position: relative; margin: auto; flex: none; }
.mj-zoom { position: absolute; right: 14px; bottom: 14px; display: flex; gap: 6px; z-index: 5; }
.mj-zoom button { width: 44px; height: 44px; border-radius: 14px; font-size: 22px; font-weight: 800; cursor: pointer; color: var(--ivory); background: rgba(0,0,0,.35); border: 1px solid rgba(255,255,255,.18); }
.mj-zoom button:disabled { opacity: .4; cursor: default; }
.mj-tile { position: absolute; box-sizing: border-box; padding: 0; width: var(--tw); height: var(--th); border-radius: calc(var(--tw) * .13); border: 1px solid var(--tile-line);
  background: linear-gradient(150deg,var(--tile-a) 0%,var(--tile-a) 40%,var(--tile-b) 100%);
  box-shadow: var(--bevel), var(--tile-shadow); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform .14s ease, box-shadow .14s ease;
  touch-action: manipulation; contain: style; }
.mj-tile::after { content: ""; position: absolute; inset: -1px; border-radius: inherit; background: rgba(8,20,30,.3); opacity: 0; pointer-events: none; transition: opacity .2s; }
.mj-board.dim .mj-tile.blocked::after { opacity: 1; }
.mj-tile.blocked { cursor: default; }
@media (hover: hover) { .mj-tile:not(.blocked):hover { transform: translate(-1px,-2px); } }
.mj-tile.sel { transform: translate(-2px,-6px); box-shadow: 0 0 0 3px var(--gold),0 0 22px 6px rgba(227,180,92,.55), var(--bevel), var(--tile-shadow); }
.mj-tile.hint { animation: mjHint 1s ease-in-out 2; }
.mj-tile.nope { animation: mjNope .28s; }
.mj-tile.deal { animation: mjDeal .5s cubic-bezier(.2,.8,.3,1) backwards; }
.mj-tile.gone { animation: mjGone .4s ease-in forwards; pointer-events: none; }
/* Moving tiles, sparks and floats get their own layers, so an animation doesn't repaint the table */
.mj-tile.gone, .mj-tile.sel, .mj-tile.hint, .mj-tile.nope, .mj-tile.deal, .mj-float, .mj-spark { will-change: transform, opacity; }
.mj-zoom-wrap .mj-orn-wrap { will-change: transform; }
.mj-board { isolation: isolate; }
@keyframes mjDeal { from { opacity: 0; transform: translate(0,-22px) scale(.9); } }
@keyframes mjHint { 50% { box-shadow: 0 0 0 3px var(--gold-hi),0 0 24px 8px rgba(242,205,130,.85), var(--bevel), var(--tile-shadow); } }
@keyframes mjNope { 25% { transform: translateX(-3px); } 75% { transform: translateX(3px); } }
@keyframes mjGone { 55% { transform: translate(var(--gx),var(--gy)) scale(1.08); opacity: 1; } 100% { transform: translate(var(--gx),var(--gy)) scale(.35); opacity: 0; } }
.mj-face { display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1; font-size: calc(var(--tw) * .5); pointer-events: none; }
.mj-face .han { font-family: var(--f-han); font-weight: 900; display: flex; flex-direction: column; align-items: center; }
.mj-face .han small { display: block; font-size: .55em; font-weight: 900; margin-top: .08em; }
.mj-face .han.top small { order: -1; margin: 0 0 .06em; font-size: .48em; }
.mj-face .card { font-weight: 800; font-size: .8em; display: flex; flex-direction: column; align-items: center; gap: .05em; }
.mj-face .card i { font-style: normal; font-size: 1.05em; }
.mj-face .num { font-weight: 800; font-size: .95em; font-variant-numeric: tabular-nums; }
.mj-face svg { width: calc(var(--tw) * .74); height: auto; display: block; }
.mj-face svg.mjs { width: calc(var(--tw) * .72); }
.mj-face svg.flag { border-radius: 2px; box-shadow: 0 0 0 1px rgba(0,0,0,.18); }
.mj-face svg.shape { width: calc(var(--tw) * .62); }
.mj-float { position: absolute; pointer-events: none; font-weight: 800; font-size: 14px; background: linear-gradient(180deg,#F0C873,#D9A440); color: var(--gold-ink); padding: 6px 11px; border-radius: 999px; white-space: nowrap; transform: translate(-50%,-50%); animation: mjFloat 1.05s ease-out forwards; z-index: 9999; box-shadow: 0 8px 20px rgba(0,0,0,.35); }
.mj-float.layer { background: #FFF8E6; }
@keyframes mjFloat { 0% { opacity: 0; transform: translate(-50%,-30%) scale(.8); } 15% { opacity: 1; transform: translate(-50%,-50%) scale(1); } 100% { opacity: 0; transform: translate(-50%,-170%); } }
.mj-spark { position: absolute; width: 5px; height: 5px; border-radius: 50%; background: var(--gold-hi); box-shadow: 0 0 8px var(--gold-hi); pointer-events: none; z-index: 9998; animation: mjSpark .65s ease-out forwards; }
@keyframes mjSpark { to { transform: translate(var(--sx),var(--sy)) scale(.2); opacity: 0; } }
.mj-tools { border-radius: 20px; display: grid; grid-template-columns: repeat(3, minmax(0,1fr)); padding: 6px; }
.mj-tool { position: relative; height: 56px; border-radius: 14px; border: 0; background: transparent; font-weight: 700; font-size: 13px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; cursor: pointer; }
.mj-tool + .mj-tool::before { content: ""; position: absolute; inset-inline-start: 0; top: 12px; bottom: 12px; width: 1px; background: var(--glass-line); }
.mj-tool:hover:not(:disabled) { background: rgba(255,255,255,.06); }
.mj-tool svg { width: 20px; height: 20px; }
.mj-tool:disabled { opacity: .4; cursor: default; }
.mj-tool .badge { position: absolute; top: 4px; right: calc(50% - 30px); min-width: 20px; height: 20px; padding: 0 5px; box-sizing: border-box; border-radius: 999px; background: var(--gold); color: var(--gold-ink); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
.mj-tool .cost { font-size: 10px; color: var(--muted); font-weight: 700; }

/* sheets (portalled to <body>; .mj-portal only carries the colour variables) */
.mj.mj-portal { display: block; padding: 0; border: 0; border-radius: 0; background: transparent; position: static; }
.mj-overlay { position: fixed; inset: 0; background: rgba(4,8,12,.62); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); display: flex; align-items: flex-end; justify-content: center; z-index: 900; padding: 0 16px calc(16px + env(safe-area-inset-bottom, 0px)); }
@media (min-width: 700px) { .mj-overlay { align-items: center; } }
.mj-sheet { width: 100%; max-width: 420px; max-height: calc(100% - 32px); overflow-y: auto; background: linear-gradient(180deg, color-mix(in srgb, var(--panel) 92%, #fff), var(--jade)); border: 1px solid var(--glass-line); border-radius: 28px; padding: 26px 20px 20px; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 16px; animation: mjSheet .34s cubic-bezier(.2,.8,.3,1); box-shadow: 0 30px 80px rgba(0,0,0,.5); color: var(--ivory); }
@keyframes mjSheet { from { transform: translateY(30px) scale(.98); opacity: 0; } }
.mj-sheet h2 { margin: 0; font-size: 22px; font-weight: 800; text-align: center; text-wrap: balance; }
.mj-sheet p { margin: 0; color: var(--muted); text-align: center; line-height: 1.5; }
.mj-bigstars { display: flex; gap: 8px; align-items: flex-end; }
.mj-bigstars svg { width: 58px; height: 58px; filter: drop-shadow(0 6px 12px rgba(0,0,0,.35)); }
.mj-bigstars svg:nth-child(2) { width: 80px; height: 80px; }
.mj-bigstars svg.on { animation: mjPop .5s cubic-bezier(.3,1.6,.5,1) both; }
.mj-bigstars svg:nth-child(2).on { animation-delay: .18s; }
.mj-bigstars svg:nth-child(3).on { animation-delay: .36s; }
@keyframes mjPop { from { transform: scale(0) rotate(-30deg); } }
.mj-total { font-size: 46px; font-weight: 800; line-height: 1; font-variant-numeric: tabular-nums; }
.mj-breakdown { width: 100%; border-radius: 18px; padding: 4px 16px; box-sizing: border-box; background: rgba(0,0,0,.18); border: 1px solid var(--glass-line); }
.mj-breakdown div { display: flex; justify-content: space-between; gap: 12px; padding: 11px 0; border-bottom: 1px solid var(--glass-line); font-size: 14px; }
.mj-breakdown div:last-child { border-bottom: 0; }
.mj-breakdown span { color: var(--muted); }
.mj-breakdown b { font-variant-numeric: tabular-nums; white-space: nowrap; }
.mj-actions { width: 100%; display: flex; flex-direction: column; gap: 10px; }
.mj-actions .two { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
.mj-record { color: var(--gold); font-weight: 800; font-size: 14px; }
.mj-confetti { position: fixed; inset: 0; pointer-events: none; z-index: 901; }
@media (max-width: 400px) { .mj { padding: 10px; } .mj-hero h2 { font-size: 38px; } .mj-cell b { font-size: 18px; } }
@media (prefers-reduced-motion: reduce) { .mj *, .mj *::before, .mj *::after { animation-duration: .01ms !important; animation-iteration-count: 1 !important; transition-duration: .01ms !important; } }
`;

export default function MahjongStyles() {
  return <style>{CSS}</style>;
}
