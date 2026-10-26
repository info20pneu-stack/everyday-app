'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../../../lib/LanguageContext';
import { useIsClient } from '../../../lib/games/useIsClient';
import { muteGameAudio, unmuteGameAudio } from '../../../lib/games/gameAudio';
import { OFFICE_TEXTS, pickOfficeLang, type OfficeLang, type OfficeTexts } from '../../../lib/games/bossKeyTexts';

/* Boss key, ported from games-reference/daily-blocks:
   "!" button / F2  → fake spreadsheet or document (choice remembered in localStorage)
   lock button / F4 → lock screen with a live clock and a landscape photo
   Return with the same key/button or a double-click. */

export type BossMode = 'sheet' | 'doc';
type Screen = 'none' | 'office' | 'lock';

const MODE_KEY = 'everyday-boss-mode';
const MODE_EVENT = 'everyday-boss-mode-change';

const LOCK_IMAGES: [landscape: string, portrait: string][] = [
  ['/images/lock/hory-l.webp', '/images/lock/hory-p.webp'],
  ['/images/lock/zima-l.webp', '/images/lock/zima-p.webp'],
  ['/images/lock/vyhlidka-l.webp', '/images/lock/vyhlidka-p.webp'],
];

function readMode(): BossMode {
  try { return localStorage.getItem(MODE_KEY) === 'doc' ? 'doc' : 'sheet'; } catch { return 'sheet'; }
}

function subscribeMode(onChange: () => void) {
  window.addEventListener(MODE_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(MODE_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

function setBossMode(m: BossMode) {
  try { localStorage.setItem(MODE_KEY, m); } catch {}
  window.dispatchEvent(new Event(MODE_EVENT));
}

/** Current boss-key mode, kept in sync across components on the page. */
export function useBossMode(): [BossMode, (m: BossMode) => void] {
  const mode = useSyncExternalStore(subscribeMode, readMode, () => 'sheet' as const);
  return [mode, setBossMode];
}

/** "Quick escape shows: [Spreadsheet] [Document]" + key hint. */
export function BossKeyModePicker() {
  const { t } = useLang();
  const [mode, setMode] = useBossMode();
  return (
    <div className="bk-picker">
      <div className="bk-picker-row">
        <span>{t.gamesHub.bossShows}</span>
        {(['sheet', 'doc'] as const).map(m => (
          <button key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}>
            {m === 'sheet' ? t.gamesHub.bossSheet : t.gamesHub.bossDoc}
          </button>
        ))}
      </div>
      <p className="bk-picker-hint">{t.gamesHub.bossHint}</p>
    </div>
  );
}

function cap(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }

function enterFullscreen() {
  try {
    const el = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void };
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else el.webkitRequestFullscreen?.();
  } catch {}
}

function exitFullscreen() {
  try {
    const doc = document as Document & { webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else if (doc.webkitFullscreenElement) doc.webkitExitFullscreen?.();
  } catch {}
}

/** Header buttons (phones / tablets) open the cover screens through this event. */
const BOSS_EVENT = 'everyday-boss-key';
type BossEventDetail = 'lock' | 'office';

/** Lock and quick-escape as small icon pills for the game header; shown below 768 px only,
 *  where they replace the floating buttons. */
export function BossKeyPills() {
  const { t } = useLang();
  const fire = (kind: BossEventDetail) => window.dispatchEvent(new CustomEvent<BossEventDetail>(BOSS_EVENT, { detail: kind }));
  return (
    <span className="bk-pills">
      <button type="button" className="gx-pill gx-icon bk-pill-lock" aria-label={t.gamesHub.bossLock} title={t.gamesHub.bossLock} onClick={() => fire('lock')}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </button>
      <button type="button" className="gx-pill gx-icon bk-pill-escape" aria-label={t.gamesHub.bossEscape} title={t.gamesHub.bossEscape} onClick={() => fire('office')}>!</button>
    </span>
  );
}

interface BossKeyProps {
  /** Called when a cover screen opens — pause the game here. */
  onHide?: () => void;
  /** Called when the player comes back. */
  onShow?: () => void;
}

export default function BossKey({ onHide, onShow }: BossKeyProps) {
  const { t, lang, rtl } = useLang();
  const [mode] = useBossMode();
  const isClient = useIsClient();
  const [screen, setScreen] = useState<Screen>('none');

  const screenRef = useRef<Screen>('none');
  const savedTitle = useRef('');
  const callbacks = useRef({ onHide, onShow });
  useEffect(() => { callbacks.current = { onHide, onShow }; });

  // Only read once a cover screen opens (client side), so navigator is always available there
  const officeLang: OfficeLang = pickOfficeLang(lang, typeof navigator === 'undefined' ? '' : navigator.language);
  const texts = OFFICE_TEXTS[officeLang];
  // Lock screen mimics the OS, so it follows the app language (or Slovak where the office does)
  const clockLocale = officeLang === 'sk' ? 'sk' : lang;

  const open = useCallback((next: Exclude<Screen, 'none'>) => {
    const prev = screenRef.current;
    if (prev === next) return;
    if (prev === 'none') {
      savedTitle.current = document.title;
      callbacks.current.onHide?.();
      muteGameAudio();
      enterFullscreen();
    }
    screenRef.current = next;
    setScreen(next);
    document.title = next === 'lock' ? ' ' : (mode === 'doc' ? texts.doc : texts.book);
  }, [mode, texts]);

  const close = useCallback(() => {
    if (screenRef.current === 'none') return;
    screenRef.current = 'none';
    setScreen('none');
    document.title = savedTitle.current;
    unmuteGameAudio();
    exitFullscreen();
    callbacks.current.onShow?.();
  }, []);

  const toggle = useCallback((kind: Exclude<Screen, 'none'>) => {
    if (screenRef.current === kind) close(); else open(kind);
  }, [open, close]);

  // Header pills (BossKeyPills)
  useEffect(() => {
    const onPill = (e: Event) => {
      const kind = (e as CustomEvent<BossEventDetail>).detail;
      if (kind === 'lock' || kind === 'office') toggle(kind);
    };
    window.addEventListener(BOSS_EVENT, onPill);
    return () => window.removeEventListener(BOSS_EVENT, onPill);
  }, [toggle]);

  // F2 / F4 in the capture phase so games never see them; while covered, keys don't reach the game
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const current = screenRef.current;
      if (e.key === 'F4') { e.preventDefault(); e.stopImmediatePropagation(); toggle('lock'); return; }
      if (e.key === 'F2' && current !== 'lock') { e.preventDefault(); e.stopImmediatePropagation(); toggle('office'); return; }
      if (current === 'lock') { e.preventDefault(); e.stopImmediatePropagation(); return; }
      // Office: let typing into the fake document happen, but keep it from the game
      if (current === 'office') e.stopImmediatePropagation();
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [toggle]);

  // Leaving the page while covered: restore title and sound
  useEffect(() => () => {
    if (screenRef.current !== 'none') {
      document.title = savedTitle.current;
      unmuteGameAudio();
      exitFullscreen();
    }
  }, []);

  // Rendered into <body> so no ancestor with transform/filter can trap the fixed buttons
  const fabs = (
    <div dir={rtl ? 'rtl' : 'ltr'}>
      <button
        type="button"
        className="bk-fab bk-fab-escape"
        aria-label={t.gamesHub.bossEscape}
        title={`${t.gamesHub.bossEscape} (F2)`}
        onClick={e => { e.stopPropagation(); toggle('office'); }}
        onPointerDown={e => e.stopPropagation()}
      >!</button>
      <button
        type="button"
        className="bk-fab bk-fab-lock"
        aria-label={t.gamesHub.bossLock}
        title={`${t.gamesHub.bossLock} (F4)`}
        onClick={e => { e.stopPropagation(); toggle('lock'); }}
        onPointerDown={e => e.stopPropagation()}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
          <rect x="5" y="11" width="14" height="10" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
      </button>
    </div>
  );

  return (
    <>
      {isClient && createPortal(fabs, document.body)}

      {screen === 'office' && createPortal(
        <div className="bk-office" lang={officeLang}>
          {mode === 'doc'
            ? <FakeDocument texts={texts} locale={officeLang} onExit={close} />
            : <FakeSheet texts={texts} locale={officeLang} onExit={close} />}
        </div>,
        document.body,
      )}
      {screen === 'lock' && createPortal(
        <LockScreen locale={clockLocale} onExit={close} />,
        document.body,
      )}

      <BossKeyStyles />
    </>
  );
}

/* ─────────────────────────── fake office ─────────────────────────── */

const WIN_BUTTONS = <div className="bk-win" aria-hidden="true"><span>—</span><span>☐</span><span>✕</span></div>;

function Menu({ items }: { items: string[] }) {
  return (
    <div className="bk-menu">
      {items.map((m, i) => i === 1 ? <b key={m}>{m}</b> : <span key={m}>{m}</span>)}
    </div>
  );
}

const SHEET_COLS = 'ABCDEFGHIJKLMNOP'.split('');
const SHEET_ROWS = Array.from({ length: 45 }, (_, i) => i + 1);

function FakeSheet({ texts: T, locale, onExit }: { texts: OfficeTexts; locale: string; onExit: () => void }) {
  const [cell, setCell] = useState('B5');
  const [fx, setFx] = useState('');
  const startRef = useRef<HTMLTableCellElement>(null);

  useEffect(() => { startRef.current?.focus(); }, []);

  const months = (() => {
    const f = new Intl.DateTimeFormat(locale, { month: 'long' });
    const y = new Date().getFullYear();
    return [9, 10, 11].map(m => cap(f.format(new Date(y, m, 1))));
  })();
  const data: Record<string, [string, boolean?]> = {
    A1: [T.title, true], A3: [T.item, true], B3: [months[0], true], C3: [months[1], true], D3: [months[2], true], E3: [T.total, true],
    A4: [T.rows[0]], B4: [(12400).toLocaleString(locale)], A5: [T.rows[1]], A6: [T.rows[2]], A8: [T.note], B8: [T.noteT],
  };
  const decimals = (0).toLocaleString(locale, { minimumFractionDigits: 2 }).slice(1);

  return (
    <>
      <div className="bk-title" onDoubleClick={onExit}>{T.book} – {T.app}{WIN_BUTTONS}</div>
      <Menu items={T.menuS} />
      <div className="bk-tools">
        <span>{T.paste}</span><span className="sep" /><span style={{ minWidth: 90 }}>Calibri</span><span>11</span>
        <span><b>B</b></span><span><i>I</i></span><span><u>U</u></span><span className="sep" />
        <span>≡</span><span>%</span><span>{decimals}</span><span className="sep" /><span>Σ</span><span>{T.sort}</span>
      </div>
      <div className="bk-fx">
        <div className="nm">{cell}</div><div className="f">fx</div>
        <input aria-label="fx" value={fx} onChange={e => setFx(e.target.value)} />
      </div>
      <div className="bk-grid">
        <table>
          <thead>
            <tr><th className="rh" />{SHEET_COLS.map(c => <th key={c}>{c}</th>)}</tr>
          </thead>
          <tbody>
            {SHEET_ROWS.map(r => (
              <tr key={r}>
                <th className="rh">{r}</th>
                {SHEET_COLS.map(c => {
                  const id = `${c}${r}`;
                  const d = data[id];
                  return (
                    <td
                      key={id}
                      ref={id === 'B5' ? startRef : undefined}
                      className={d?.[1] ? 'b' : undefined}
                      contentEditable
                      suppressContentEditableWarning
                      tabIndex={0}
                      onFocus={e => { setCell(id); setFx(e.currentTarget.textContent ?? ''); }}
                    >{d?.[0] ?? ''}</td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="bk-tabs">
        <span className="on" onDoubleClick={onExit}>{T.sheet}1</span><span>{T.sheet}2</span><span>+</span>
      </div>
      <div className="bk-status"><span>{T.ready}</span><span>100 %</span></div>
    </>
  );
}

function FakeDocument({ texts: T, locale, onExit }: { texts: OfficeTexts; locale: string; onExit: () => void }) {
  const pageRef = useRef<HTMLDivElement>(null);
  const today = new Date().toLocaleDateString(locale);
  const words = `${T.meet} ${T.date} ${T.who} ${T.agenda}`.split(/\s+/).length + 2;

  // Caret at the end, where the "work" continues
  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;
    page.focus();
    const range = document.createRange();
    range.selectNodeContents(page);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, []);

  return (
    <>
      <div className="bk-title" onDoubleClick={onExit}>{T.doc} – {T.dapp}{WIN_BUTTONS}</div>
      <Menu items={T.menuD} />
      <div className="bk-tools">
        <span style={{ minWidth: 90 }}>Calibri</span><span>11</span><span><b>B</b></span><span><i>I</i></span><span><u>U</u></span>
        <span className="sep" /><span>≡</span><span>☰</span><span className="sep" />
        {T.styles.map(s => <span key={s}>{s}</span>)}
      </div>
      <div className="bk-doc">
        <div className="bk-page" ref={pageRef} contentEditable suppressContentEditableWarning>
          <h1>{T.meet}</h1>
          <p>{T.date}: {today}</p>
          <p>{T.who}: </p>
          <p><b>{T.agenda}</b></p>
          <p>1. </p>
        </div>
      </div>
      <div className="bk-status"><span>{T.status(words)}</span><span>100 %</span></div>
    </>
  );
}

/* ─────────────────────────── lock screen ─────────────────────────── */

function LockScreen({ locale, onExit }: { locale: string; onExit: () => void }) {
  const [now, setNow] = useState(() => new Date());
  const [dim, setDim] = useState(false);
  const [image] = useState(() => {
    const pair = LOCK_IMAGES[Math.floor(Date.now() / 864e5) % LOCK_IMAGES.length];
    return window.innerWidth / window.innerHeight < 1 ? pair[1] : pair[0];
  });

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    // A single click only dims, like a real lock screen; double-click (or F4) unlocks
    <div className={`bk-lock${dim ? ' dim' : ''}`} onClick={() => setDim(d => !d)} onDoubleClick={onExit}>
      <div className="bk-lock-img" style={{ backgroundImage: `url(${image})` }} />
      <div className="bk-lock-shade" />
      <div className="bk-lock-clock">
        <b>{now.toLocaleTimeString(locale, { hour: 'numeric', minute: '2-digit' })}</b>
        <span>{cap(now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' }))}</span>
      </div>
      <div className="bk-lock-tray" aria-hidden="true">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10 10 0 0 1 14 0M8.5 16a5 5 0 0 1 7 0" />
          <circle cx="12" cy="19.5" r="1" fill="#fff" />
        </svg>
        <svg width="26" height="22" viewBox="0 0 28 24" fill="none" stroke="#fff" strokeWidth="2">
          <rect x="2" y="6" width="21" height="12" rx="2.5" />
          <rect x="5" y="9" width="12" height="6" rx="1" fill="#fff" stroke="none" />
          <path d="M25.5 10v4" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

/* ─────────────────────────── styles ─────────────────────────── */

function BossKeyStyles() {
  return (
    <style>{`
      .bk-fab {
        position: fixed; z-index: 150;
        right: max(14px, env(safe-area-inset-right, 0px));
        width: 46px; height: 46px; border-radius: 50%;
        display: grid; place-items: center; cursor: pointer;
        font: 800 22px 'Poppins', sans-serif;
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        transition: transform .15s;
      }
      .bk-fab:hover { transform: scale(1.06); }
      .bk-fab:focus-visible { outline: 2px solid #fff; outline-offset: 2px; }
      .bk-fab-escape {
        bottom: calc(env(safe-area-inset-bottom, 0px) + 24px);
        border: 2px solid #FF5470; background: rgba(255,84,112,.15); color: #FF5470;
        box-shadow: 0 0 18px rgba(255,84,112,.35);
      }
      .bk-fab-lock {
        bottom: calc(env(safe-area-inset-bottom, 0px) + 80px);
        border: 2px solid #9B8CFF; background: rgba(93,76,255,.15); color: #C4BAFF;
        box-shadow: 0 0 18px rgba(93,76,255,.35);
      }
      [dir="rtl"] .bk-fab { right: auto; left: max(14px, env(safe-area-inset-left, 0px)); }
      /* Phones and tablets: no floating buttons, the same two actions sit in the game header */
      .bk-pills { display: none; }
      @media (max-width: 767px) {
        .bk-fab { display: none; }
        .bk-pills { display: inline-flex; gap: inherit; }
      }
      .bk-pill-lock { color: #C4BAFF; border-color: rgba(155,140,255,.55); background: rgba(93,76,255,.16); }
      .bk-pill-escape { color: #FF6B83; border-color: rgba(255,84,112,.6); background: rgba(255,84,112,.14); font-size: 15px; font-weight: 800; }

      .bk-picker { font-size: 12px; color: #8E8E9E; }
      .bk-picker-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
      .bk-picker-row button {
        font: 600 12px 'Inter', 'Poppins', sans-serif; cursor: pointer;
        border: 1px solid rgba(255,255,255,0.14); background: transparent; color: #fff;
        border-radius: 8px; padding: 5px 10px; min-height: 30px;
      }
      .bk-picker-row button[aria-pressed="true"] { background: #5D4CFF; border-color: #5D4CFF; }
      .bk-picker-hint { margin: 6px 0 0; line-height: 1.5; }

      .bk-office {
        position: fixed; inset: 0; z-index: 10000; background: #fff; color: #1f1f1f;
        font: 13px "Segoe UI", Calibri, Arial, sans-serif; display: flex; flex-direction: column;
        user-select: text; -webkit-user-select: text; touch-action: auto; color-scheme: light; direction: ltr; text-align: left;
      }
      .bk-title { height: 32px; flex-shrink: 0; background: #f3f3f3; border-bottom: 1px solid #dcdcdc; display: flex; align-items: center; justify-content: center; font-size: 12px; color: #444; position: relative; user-select: none; }
      .bk-win { position: absolute; right: 0; top: 0; display: flex; }
      .bk-win span { width: 44px; height: 32px; display: grid; place-items: center; color: #555; }
      .bk-menu { display: flex; gap: 18px; padding: 6px 14px; background: #fafafa; border-bottom: 1px solid #e3e3e3; font-size: 13px; color: #333; overflow: hidden; white-space: nowrap; flex-shrink: 0; }
      .bk-menu b { font-weight: 600; color: #1a5fb4; border-bottom: 2px solid #1a5fb4; padding-bottom: 3px; }
      .bk-tools { display: flex; gap: 6px; padding: 6px 10px; border-bottom: 1px solid #e3e3e3; background: #fff; overflow: hidden; align-items: center; flex-shrink: 0; }
      .bk-tools span { height: 26px; min-width: 26px; padding: 0 6px; border: 1px solid #e1e1e1; border-radius: 3px; display: grid; place-items: center; font-size: 12px; color: #444; background: #fdfdfd; white-space: nowrap; }
      .bk-tools .sep { border: 0; width: 1px; min-width: 1px; padding: 0; background: #ddd; height: 22px; margin: 0 4px; }
      .bk-fx { display: flex; align-items: center; border-bottom: 1px solid #dcdcdc; height: 26px; flex-shrink: 0; }
      .bk-fx .nm { width: 80px; border-right: 1px solid #dcdcdc; height: 100%; display: flex; align-items: center; padding-left: 6px; font-size: 12px; }
      .bk-fx .f { padding: 0 8px; color: #777; font-style: italic; border-right: 1px solid #dcdcdc; height: 100%; display: flex; align-items: center; }
      .bk-fx input { flex: 1; border: 0; height: 100%; padding: 0 8px; font: inherit; outline: none; min-width: 0; background: #fff; color: #1f1f1f; }
      .bk-grid { flex: 1; overflow: auto; background: #fff; }
      .bk-grid table { border-collapse: collapse; table-layout: fixed; }
      .bk-grid th { background: #f3f3f3; color: #555; font-weight: 400; font-size: 12px; border: 1px solid #d6d6d6; height: 20px; position: sticky; top: 0; z-index: 1; }
      .bk-grid th.rh { position: sticky; left: 0; width: 40px; z-index: 2; }
      .bk-grid td { border: 1px solid #e2e2e2; width: 84px; min-width: 84px; height: 20px; padding: 0 4px; white-space: nowrap; overflow: hidden; outline: none; }
      .bk-grid td:focus { box-shadow: inset 0 0 0 2px #1a7f37; }
      .bk-grid td.b { font-weight: 700; }
      .bk-tabs { height: 30px; flex-shrink: 0; border-top: 1px solid #dcdcdc; background: #f3f3f3; display: flex; align-items: stretch; font-size: 12px; user-select: none; }
      .bk-tabs span { padding: 0 16px; display: flex; align-items: center; border-right: 1px solid #dcdcdc; color: #555; }
      .bk-tabs span.on { background: #fff; color: #1a7f37; font-weight: 600; border-bottom: 2px solid #1a7f37; cursor: default; }
      .bk-status { height: 22px; flex-shrink: 0; background: #f3f3f3; border-top: 1px solid #e1e1e1; display: flex; align-items: center; justify-content: space-between; padding: 0 12px; font-size: 11px; color: #666; }
      .bk-doc { flex: 1; overflow: auto; background: #e9e9e9; padding: 24px 12px; }
      .bk-page { max-width: 794px; min-height: 1000px; margin: 0 auto; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.18); padding: 72px 80px; box-sizing: border-box; font: 15px/1.6 Calibri, "Segoe UI", Arial, sans-serif; outline: none; color: #1f1f1f; }
      .bk-page h1 { font: 600 24px Calibri, "Segoe UI", Arial, sans-serif; color: #1f3864; margin: 0 0 14px; }
      .bk-page p { margin: 0 0 10px; }
      @media (max-width: 600px) { .bk-page { padding: 36px 22px; } }

      .bk-lock {
        position: fixed; inset: 0; z-index: 10001; background: #0d1530; color: #fff;
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif; overflow: hidden; cursor: default;
        user-select: none; -webkit-user-select: none; direction: ltr;
      }
      .bk-lock-img { position: absolute; inset: -4%; background: center/cover no-repeat; animation: bkKenBurns 60s ease-in-out infinite alternate; }
      @keyframes bkKenBurns { from { transform: scale(1); } to { transform: scale(1.08) translate(-1.5%, -1%); } }
      .bk-lock-shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.05) 0%, rgba(0,0,0,0) 40%, rgba(0,0,0,.35) 100%); }
      .bk-lock-clock { position: absolute; left: 0; right: 0; top: 12%; text-align: center; text-shadow: 0 2px 18px rgba(0,0,0,.35); }
      .bk-lock-clock b { display: block; font-weight: 600; font-size: clamp(84px, 18vw, 148px); line-height: 1; letter-spacing: -.02em; font-variant-numeric: tabular-nums; }
      .bk-lock-clock span { display: block; margin-top: 10px; font-size: clamp(18px, 3.6vw, 26px); font-weight: 500; }
      .bk-lock-tray { position: absolute; right: max(24px, env(safe-area-inset-right, 0px)); bottom: calc(env(safe-area-inset-bottom, 0px) + 22px); display: flex; gap: 18px; opacity: .9; }
      .bk-lock.dim .bk-lock-img { filter: brightness(.6) blur(2px); transition: filter .4s; }
      @media (prefers-reduced-motion: reduce) { .bk-lock-img { animation: none; } }
    `}</style>
  );
}
