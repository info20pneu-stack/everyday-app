'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useLang } from '../../../lib/LanguageContext';
import { lbErrorText } from '../../../lib/leaderboardI18n';
import { FACEBOOK_APP_ID } from '../../../lib/siteConfig';
import { createShareLink, prefersNativeShare, shareUrl, useIncomingChallenge } from '../../../lib/share/client';
import { compareResults, formatShareValue, isTimeBoard, shareGame, shortTime } from '../../../lib/share/games';
import { gridToEmoji } from '../../../lib/share/grid';
import { fill, shareTexts } from '../../../lib/share/i18n';
import type { PublicShare } from '../../../lib/share/store';

/* "Challenge a friend" for a finished round, used by the result window of every game.
   - Creates a /s/<id> link on the server from the round's session token (the server takes the
     numbers from the verified round, see app/api/share).
   - Phones: the system share sheet (link + text). Computers: a window with the link to copy,
     WhatsApp / Messenger / Telegram / X / e-mail and a QR code to open it on the phone.
   - "Copy as text" keeps the old text share with the coloured squares.
   - When the player came from a friend's challenge (?ch=<id>), it shows "You vs. <nick>" and
     the button sends a rematch. */

export interface ShareableResult {
  timeMs: number;
  score?: number;
  moves?: number;
  diff?: string;
  proof?: unknown;
  /** Seed of a game with a random set, so the friend plays the same one. */
  seed?: number;
}

interface Props {
  /** Leaderboard id of the round. */
  board: string;
  result: ShareableResult;
  /** The round's session token (shared with the leaderboard save). */
  getToken: () => Promise<string | null>;
  /** Nick typed in the surrounding form; otherwise the saved one, otherwise asked for. */
  nick?: string;
  /** The game's own text with squares (without a link), for "Copy as text". */
  textShare?: string;
  /** Start sharing as soon as it shows (opened from the game's own "Share" button). */
  autoStart?: boolean;
}

function savedNick(): string {
  try {
    const raw = localStorage.getItem('lb_nick') ?? '';
    try { const v = JSON.parse(raw); return typeof v === 'string' ? v : raw; } catch { return raw; }
  } catch { return ''; }
}

async function copy(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
}

const enc = encodeURIComponent;

export default function ChallengeShare({ board, result, getToken, nick, textShare, autoStart }: Props) {
  const { t, lang, rtl } = useLang();
  const s = shareTexts(lang);
  const incoming = useIncomingChallenge(board);
  const game = shareGame(board);
  const gameName = game ? game.name(t) : 'EVERY DAY';

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [dialog, setDialog] = useState<null | 'nick' | 'link'>(null);
  const [link, setLink] = useState<{ id: string; share: PublicShare } | null>(null);
  const [nickInput, setNickInput] = useState('');
  const [note, setNote] = useState('');
  const [qr, setQr] = useState('');
  const started = useRef(false);

  const url = link ? shareUrl(link.id) : '';
  const valueOf = (v: { timeMs: number; score?: number; moves?: number }) => formatShareValue(board, v, lang);
  const message = (sh: PublicShare) => {
    const head = `${game?.icon ?? '🎮'} ${fill(s.shareText, { game: gameName, value: valueOf(sh) })}`;
    const grid = gridToEmoji(sh.grid);
    return grid ? `${head}\n${grid}` : head;
  };

  async function deliver(l: { id: string; share: PublicShare }) {
    if (prefersNativeShare()) {
      try {
        await navigator.share({ title: 'EVERY DAY', text: message(l.share), url: shareUrl(l.id) });
        return;
      } catch (e) {
        if ((e as Error)?.name === 'AbortError') return;
        // e.g. NotAllowedError: the tap expired while the link was created → the window has a share button
      }
    }
    setDialog('link');
  }

  async function start(typed?: string) {
    if (busy) return;
    if (link) { await deliver(link); return; }
    const name = (typed ?? nick ?? savedNick()).trim();
    if (!name) { setNickInput(''); setDialog('nick'); return; }
    setBusy(true); setErr('');
    const ans = await createShareLink({
      board, name, token: await getToken(), lang,
      timeMs: result.timeMs, score: result.score, moves: result.moves, diff: result.diff,
      proof: result.proof, seed: result.seed, vs: incoming?.id,
    });
    setBusy(false);
    if (!ans.ok) {
      setErr(ans.code === 'connection' ? t.games.connectionError : lbErrorText(ans.code, lang, s.error));
      if (ans.code.startsWith('nick')) { setNickInput(name); setDialog('nick'); }
      return;
    }
    try { localStorage.setItem('lb_nick', JSON.stringify(name)); } catch {}
    const l = { id: ans.id, share: ans.share };
    setLink(l);
    if (dialog === 'nick') setDialog(null);
    await deliver(l);
  }

  useEffect(() => {
    if (autoStart && !started.current) { started.current = true; void start(); }
  });

  // QR code of the link (generated in the browser)
  useEffect(() => {
    if (dialog !== 'link' || !url) return;
    let alive = true;
    import('qrcode')
      .then(QR => QR.toDataURL(url, { width: 220, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#0B1020', light: '#FFFFFF' } }))
      .then(d => { if (alive) setQr(d); })
      .catch(() => {});
    return () => { alive = false; };
  }, [dialog, url]);

  useEffect(() => {
    if (!dialog) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setDialog(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dialog]);

  function flash(text: string) {
    setNote(text);
    setTimeout(() => setNote(n => (n === text ? '' : n)), 2600);
  }

  async function copyLink() { if (await copy(url)) flash(s.copied); }
  async function copyAsText() {
    if (!link) return;
    const body = textShare ?? message(link.share);
    if (await copy(`${body}\n${url}`)) flash(s.textCopied);
  }
  async function messenger() {
    if (FACEBOOK_APP_ID) {
      window.open(`https://www.facebook.com/dialog/send?app_id=${FACEBOOK_APP_ID}&link=${enc(url)}&redirect_uri=${enc(url)}`, '_blank', 'noopener');
    } else if (window.matchMedia('(pointer: coarse)').matches) {
      window.location.href = `fb-messenger://share/?link=${enc(url)}`;
    } else {
      await copy(url);
      flash(s.messengerCopied);
      window.open('https://www.messenger.com/', '_blank', 'noopener');
    }
  }

  const text = link ? message(link.share) : '';
  const apps = link ? [
    { id: 'wa', label: 'WhatsApp', icon: '🟢', href: `https://wa.me/?text=${enc(`${text}\n${url}`)}` },
    { id: 'ms', label: 'Messenger', icon: '💬', onClick: messenger },
    { id: 'tg', label: 'Telegram', icon: '✈️', href: `https://t.me/share/url?url=${enc(url)}&text=${enc(text)}` },
    { id: 'x', label: 'X (Twitter)', icon: '', href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}` },
    { id: 'em', label: s.email, icon: '✉️', href: `mailto:?subject=${enc(fill(link.share.vs ? s.rematchTitle : s.invites, { name: link.share.name }))}&body=${enc(`${text}\n\n${url}`)}` },
  ] : [];

  // "You vs. <nick>" after playing a friend's challenge
  let vs: React.ReactNode = null;
  if (incoming) {
    const cmp = compareResults(board, result, incoming);
    const verdict = cmp < 0 ? s.won : cmp > 0 ? s.lost : s.tie;
    const tone = cmp < 0 ? 'win' : cmp > 0 ? 'loss' : 'tie';
    // Same score shown, but the time decided (as on the leaderboard) → show both times
    const byTime = cmp !== 0 && !isTimeBoard(board) && valueOf(result) === valueOf(incoming);
    vs = (
      <div className={`cs-vs cs-${tone}`}>
        <div className="cs-vs-head">{fill(s.youVs, { name: incoming.name })}</div>
        <div className="cs-vs-row">
          <span className="cs-vs-me" dir="ltr">{valueOf(result)}</span>
          <span className="cs-vs-sep">vs</span>
          <span className="cs-vs-them" dir="ltr">{valueOf(incoming)}</span>
        </div>
        {byTime && <div className="cs-vs-time" dir="ltr">⏱ {shortTime(result.timeMs)} vs {shortTime(incoming.timeMs)}</div>}
        <div className="cs-vs-verdict">{verdict}</div>
      </div>
    );
  }

  return (
    <div className="cs-root">
      {vs}
      <button type="button" className="cs-main" onClick={() => void start()} disabled={busy}>
        {busy ? s.creating : incoming ? s.rematch : s.challenge}
      </button>
      {err && dialog !== 'nick' && <div className="cs-err" role="alert">{err}</div>}

      {dialog && createPortal(
        <div className="cs-overlay" dir={rtl ? 'rtl' : 'ltr'} onClick={e => { if (e.target === e.currentTarget) setDialog(null); }}>
          <div className="cs-modal" role="dialog" aria-modal="true" aria-label={s.dialogTitle}>
            <div className="cs-head">
              <span>{incoming ? s.rematch : s.challenge}</span>
              <button type="button" className="cs-close" onClick={() => setDialog(null)} aria-label={t.games.close}>✕</button>
            </div>

            {dialog === 'nick' && (
              <form className="cs-nick" onSubmit={e => { e.preventDefault(); if (nickInput.trim()) void start(nickInput); }}>
                <p>{s.nickHint}</p>
                <input
                  type="text" value={nickInput} maxLength={16} autoFocus placeholder={t.games.nickPlaceholder}
                  onChange={e => setNickInput(e.target.value.slice(0, 16))}
                />
                {err && <div className="cs-err" role="alert">{err}</div>}
                <button type="submit" className="cs-main" disabled={!nickInput.trim() || busy}>{busy ? s.creating : s.createLink}</button>
              </form>
            )}

            {dialog === 'link' && link && (
              <>
                {/* What the friend will see in the chat */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="cs-preview" src={`/api/og?id=${link.id}&lang=${lang}`} alt="" width={1200} height={630} />

                <div className="cs-link">
                  <input type="text" readOnly value={url} dir="ltr" onFocus={e => e.currentTarget.select()} aria-label="URL" />
                  <button type="button" onClick={copyLink}>{s.copy}</button>
                </div>

                {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                  <button type="button" className="cs-main cs-native" onClick={() => void navigator.share({ title: 'EVERY DAY', text, url }).catch(() => {})}>
                    📤 {s.shareNative}
                  </button>
                )}

                <div className="cs-label">{s.shareVia}</div>
                <div className="cs-apps">
                  {apps.map(a => a.href
                    ? <a key={a.id} className={`cs-app cs-app-${a.id}`} href={a.href} target={a.id === 'em' ? undefined : '_blank'} rel="noopener noreferrer">{a.icon && <span aria-hidden="true">{a.icon}</span>}{a.label}</a>
                    : <button key={a.id} type="button" className={`cs-app cs-app-${a.id}`} onClick={a.onClick}>{a.icon && <span aria-hidden="true">{a.icon}</span>}{a.label}</button>)}
                </div>

                <div className="cs-qr">
                  {qr
                    // eslint-disable-next-line @next/next/no-img-element
                    ? <img src={qr} alt="QR" width={150} height={150} />
                    : <div className="cs-qr-empty" />}
                  <span>📱 {s.qr}</span>
                </div>

                <button type="button" className="cs-ghost" onClick={copyAsText}>{s.copyText}</button>
              </>
            )}

            <div className="cs-note" aria-live="polite">{note}</div>
          </div>
        </div>,
        document.body,
      )}
      <ChallengeShareStyles />
    </div>
  );
}

function ChallengeShareStyles() {
  return (
    <style>{`
      .cs-root { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
      .cs-main {
        width: 100%; min-height: 44px; border: none; border-radius: 11px; cursor: pointer;
        background: linear-gradient(135deg, #22C55E, #0EA5E9); color: #fff;
        font: 700 14px 'Poppins', system-ui, sans-serif; box-shadow: 0 6px 20px rgba(14,165,233,.28);
      }
      .cs-main:disabled { opacity: .6; cursor: default; }
      .cs-ghost {
        width: 100%; min-height: 40px; border-radius: 10px; cursor: pointer;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14); color: #DCD6FF;
        font: 600 13px 'Poppins', system-ui, sans-serif;
      }
      .cs-err { font-size: 12px; color: #F87171; text-align: center; }

      .cs-vs { border-radius: 12px; padding: 12px; text-align: center; border: 1px solid rgba(255,255,255,0.12); background: rgba(255,255,255,0.04); }
      .cs-vs.cs-win { border-color: rgba(74,222,128,.45); background: rgba(74,222,128,.08); }
      .cs-vs.cs-loss { border-color: rgba(248,113,113,.4); background: rgba(248,113,113,.07); }
      .cs-vs.cs-tie { border-color: rgba(255,179,0,.4); background: rgba(255,179,0,.07); }
      .cs-vs-head { font-size: 12px; letter-spacing: .5px; text-transform: uppercase; color: #9AA0C8; margin-bottom: 6px; }
      .cs-vs-row { display: flex; justify-content: center; align-items: baseline; gap: 12px; font: 800 22px 'Poppins', system-ui, sans-serif; }
      .cs-vs-me { color: #fff; }
      .cs-vs-them { color: #AAAAB8; }
      .cs-vs-sep { font-size: 12px; color: #8E8E9E; font-weight: 600; }
      .cs-vs-time { margin-top: 4px; font-size: 12px; color: #AAB0E0; font-variant-numeric: tabular-nums; }
      .cs-vs-verdict { margin-top: 6px; font-weight: 800; font-size: 14px; }
      .cs-win .cs-vs-verdict { color: #4ADE80; }
      .cs-loss .cs-vs-verdict { color: #F87171; }
      .cs-tie .cs-vs-verdict { color: #FFB300; }

      .cs-overlay {
        position: fixed; inset: 0; z-index: 1100; padding: 16px;
        background: rgba(0,0,0,0.72); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px);
        display: flex; align-items: center; justify-content: center;
      }
      .cs-modal {
        width: 100%; max-width: 440px; max-height: calc(100dvh - 32px); overflow-y: auto;
        background: rgba(12,16,36,0.99); border: 1px solid rgba(93,76,255,0.4); border-radius: 18px;
        padding: 16px; box-shadow: 0 24px 64px rgba(0,0,0,0.7); color: #fff;
        display: flex; flex-direction: column; gap: 12px;
        animation: csIn .22s cubic-bezier(.34,1.56,.64,1);
      }
      @keyframes csIn { from { opacity: 0; transform: scale(.94) translateY(8px); } to { opacity: 1; transform: none; } }
      .cs-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; font: 700 16px 'Poppins', system-ui, sans-serif; }
      .cs-close {
        width: 36px; height: 36px; flex-shrink: 0; border-radius: 10px; cursor: pointer;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); color: #AAAAB8; font-size: 14px;
      }
      .cs-nick { display: flex; flex-direction: column; gap: 10px; }
      .cs-nick p { margin: 0; font-size: 13px; color: #AAAAB8; line-height: 1.45; }
      .cs-nick input, .cs-link input {
        width: 100%; min-width: 0; box-sizing: border-box; background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.15); border-radius: 9px; color: #fff; font-size: 14px; padding: 10px 12px; outline: none;
      }
      .cs-preview { width: 100%; height: auto; aspect-ratio: 1200 / 630; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: #060914; }
      .cs-link { display: flex; gap: 8px; }
      .cs-link input { font-size: 13px; }
      .cs-link button {
        flex-shrink: 0; padding: 0 16px; border-radius: 9px; cursor: pointer; border: none;
        background: #5D4CFF; color: #fff; font: 700 13px 'Poppins', system-ui, sans-serif;
      }
      .cs-label { font-size: 12px; color: #8E8E9E; text-transform: uppercase; letter-spacing: .5px; }
      .cs-apps { display: grid; grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)); gap: 8px; }
      .cs-app {
        display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 40px; padding: 0 10px;
        border-radius: 10px; cursor: pointer; text-decoration: none; color: #fff; border: 1px solid transparent;
        font: 700 13px 'Poppins', system-ui, sans-serif;
      }
      .cs-app-wa { background: #1DA851; }
      .cs-app-ms { background: linear-gradient(135deg, #0084FF, #A033FF); }
      .cs-app-tg { background: #229ED9; }
      .cs-app-x { background: #000; border-color: rgba(255,255,255,.25); }
      .cs-app-em { background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,.18); }
      .cs-app:hover { filter: brightness(1.1); }
      .cs-qr { display: flex; align-items: center; gap: 14px; padding: 10px; border-radius: 12px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); }
      .cs-qr img, .cs-qr-empty { width: 150px; height: 150px; border-radius: 8px; background: #fff; flex-shrink: 0; }
      .cs-qr span { font-size: 13px; color: #C9CCEB; line-height: 1.4; }
      .cs-note { min-height: 18px; font-size: 12px; color: #4ADE80; text-align: center; }
      /* The QR code is for opening the link on a phone next to the computer */
      @media (pointer: coarse), (max-width: 560px) { .cs-qr { display: none; } }
      @media (pointer: fine) and (min-width: 561px) { .cs-native { display: none; } }
    `}</style>
  );
}
