'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { useLang } from '../../../lib/LanguageContext';
import { TOOLS } from '../../../lib/toolsCatalog';
import { toolStrings } from '../../../lib/toolsI18n';

/* ─────────────────────────── shared tool look ───────────────────────────
   The tool pages use the same style as the games:
     <ToolFrame toolId>   centred column (max 560 px), soft glow in the tool colour, "‹ Tools" link,
                          optional "⭐ Save to My Day" pill and a banner with the card illustration
     <ToolField>          12 px label above an input; inputs / selects take the .tf-input class
     <ToolHero>           big result card: label in capitals, value 56–72 px with a glow
     <ToolCards>/<ToolCard>   coloured info cards with an icon in a ring (like the My Day widgets)
     <ToolTiles>          compact grid of number tiles
     <ToolButton>         filled action button in the tool colour
   Colours come from lib/toolsCatalog.ts. */

export interface MyDaySave {
  saved: boolean;
  onSave: () => void;
}

export default function ToolFrame({ toolId, myDay, children, wide }: {
  /** Id from lib/toolsCatalog.ts — also the banner image public/images/cards/<id>.webp */
  toolId: string;
  /** Shows "⭐ Save to My Day" in the header (tools whose result fits a My Day widget). */
  myDay?: MyDaySave;
  /** Wider column (720 px) for list-type tools such as news or sports. */
  wide?: boolean;
  children: ReactNode;
}) {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
  const tool = TOOLS.find(x => x.id === toolId);
  const color = tool?.color ?? '#8B5CF6';
  const title = tool ? t.dashboard[tool.labelKey] : '';
  const desc = tool ? t.dashboard[tool.descKey] : '';

  return (
    <div className={`tf-page${wide ? ' tf-wide' : ''}`} style={{ '--tc': color } as CSSProperties}>
      <div className="tf-glow" aria-hidden="true" />
      <header className="tf-top">
        <Link href="/tools" className="tf-back">
          <span aria-hidden="true" className="tf-back-arrow">‹</span> {t.dashboard.toolsTitle}
        </Link>
        {myDay && (
          <button
            type="button" className={`tf-pill${myDay.saved ? ' is-saved' : ''}`}
            onClick={myDay.onSave} aria-pressed={myDay.saved}
          >
            <span aria-hidden="true">{myDay.saved ? '✓' : '⭐'}</span> {myDay.saved ? s.savedMyDay : s.saveMyDay}
          </button>
        )}
      </header>

      <section className="tf-banner">
        <div className="tf-banner-img" style={{ backgroundImage: `url(/images/cards/${toolId}.webp)` }} aria-hidden="true" />
        <div className="tf-banner-text">
          <h1 className="tf-title">{title}</h1>
          {desc && <p className="tf-desc">{desc}</p>}
        </div>
      </section>

      {children}
      <ToolStyles />
    </div>
  );
}

/** Drop a translation's leading emoji ("🌅 Východ slunce" → "Východ slunce") where the card shows its own icon. */
export function plain(label: string): string {
  return label.replace(/^(?:\p{Extended_Pictographic}|\p{Regional_Indicator})\uFE0F?\s*/u, '');
}

export function ToolField({ label, htmlFor, children, hint }: {
  label: ReactNode; htmlFor?: string; children: ReactNode; hint?: ReactNode;
}) {
  return (
    <div className="tf-field">
      <label className="tf-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <div className="tf-hint">{hint}</div>}
    </div>
  );
}

export function ToolHero({ label, value, unit, sub, children }: {
  label: ReactNode; value: ReactNode; unit?: ReactNode; sub?: ReactNode; children?: ReactNode;
}) {
  return (
    <section className="tf-hero">
      <div className="tf-hero-label">{label}</div>
      <div className="tf-hero-value">
        <span className="tf-hero-num">{value}</span>
        {unit && <span className="tf-hero-unit">{unit}</span>}
      </div>
      {sub && <div className="tf-hero-sub">{sub}</div>}
      {children}
    </section>
  );
}

export function ToolCards({ children }: { children: ReactNode }) {
  return <div className="tf-cards">{children}</div>;
}

export function ToolCard({ icon, label, value, sub, color, wide }: {
  icon: ReactNode; label: ReactNode; value: ReactNode; sub?: ReactNode; color?: string; wide?: boolean;
}) {
  return (
    <div className={`tf-card${wide ? ' tf-card-wide' : ''}`} style={color ? { '--cc': color } as CSSProperties : undefined}>
      <span className="tf-card-icon" aria-hidden="true">{icon}</span>
      <div className="tf-card-body">
        <div className="tf-card-label">{label}</div>
        <div className="tf-card-value">{value}</div>
        {sub && <div className="tf-card-sub">{sub}</div>}
      </div>
    </div>
  );
}

export function ToolTiles({ items }: { items: { label: ReactNode; value: ReactNode; accent?: boolean }[] }) {
  return (
    <dl className="tf-tiles">
      {items.map((it, i) => (
        <div key={i} className={`tf-tile${it.accent ? ' tf-accent' : ''}`}>
          <dd>{it.value}</dd>
          <dt>{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}

export function ToolButton({ children, onClick, ghost, disabled, type = 'button' }: {
  children: ReactNode; onClick?: () => void; ghost?: boolean; disabled?: boolean; type?: 'button' | 'submit';
}) {
  return (
    <button type={type} className={`tf-btn${ghost ? ' tf-ghost' : ''}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

/** Share a text (system share sheet on phones, else the clipboard). `done` is true for 2 s after copying. */
export function useShare(): { share: (text: string) => Promise<void>; done: boolean } {
  const [done, setDone] = useState(false);
  async function share(text: string) {
    if (typeof navigator !== 'undefined' && navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try { await navigator.share({ text }); return; } catch (e) { if ((e as Error)?.name === 'AbortError') return; }
    }
    try { await navigator.clipboard.writeText(text); } catch {}
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  }
  return { share, done };
}

export function ToolStyles() {
  return (
    <style href="everyday-tool-ui" precedence="medium">{`
      .tf-page {
        --tf-ink: #F2F3FF; --tf-dim: #9AA0D0; --tf-line: rgba(139,92,246,0.28);
        position: relative; z-index: 1; isolation: isolate;
        width: 100%; max-width: 560px; margin: 0 auto;
        display: flex; flex-direction: column; gap: 14px;
        color: var(--tf-ink);
      }
      .tf-page.tf-wide { max-width: 720px; }
      .tf-glow {
        position: absolute; z-index: -1; pointer-events: none;
        top: -120px; left: 50%; width: 100vw; height: 640px; transform: translateX(-50%);
        background:
          radial-gradient(42% 60% at 50% 0%, color-mix(in srgb, var(--tc) 28%, transparent), transparent 72%),
          radial-gradient(70% 45% at 50% 0%, color-mix(in srgb, var(--tc) 10%, transparent), transparent 80%);
      }
      /* Light and retro themes: the tool keeps its dark panel so its colours stay readable */
      [data-theme="light"] .tf-page, [data-theme="xp"] .tf-page,
      [data-theme="win98"] .tf-page, [data-theme="win2000"] .tf-page {
        background: linear-gradient(170deg, #121845, #0A0E2A 60%);
        border-radius: 24px; padding: 14px;
        box-shadow: 0 10px 40px rgba(16,20,60,.18), 0 0 0 1px rgba(16,20,60,.08);
      }
      [data-theme="light"] .tf-glow { opacity: .5; }

      .tf-top { display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
      .tf-back {
        display: inline-flex; align-items: center; gap: 4px; min-height: 36px; padding: 0 14px 0 10px;
        border-radius: 999px; text-decoration: none; white-space: nowrap;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12);
        color: #DCD6FF; font: 700 13px 'Poppins', system-ui, sans-serif;
      }
      .tf-back:hover { background: rgba(255,255,255,0.1); }
      .tf-back-arrow { font-size: 18px; line-height: 1; margin-top: -2px; }
      [dir="rtl"] .tf-back-arrow { transform: scaleX(-1); }
      .tf-pill {
        display: inline-flex; align-items: center; gap: 6px; min-height: 36px; padding: 0 14px; margin-inline-start: auto;
        border-radius: 999px; cursor: pointer; white-space: nowrap; font: 700 12px 'Poppins', system-ui, sans-serif;
        color: #2B1A00; border: 1px solid rgba(255,226,140,.8);
        background: linear-gradient(160deg, #FFD976, #F5A524);
        box-shadow: 0 0 18px rgba(255,190,60,.3), inset 0 1px 0 rgba(255,255,255,.5);
      }
      .tf-pill.is-saved { color: #04261A; border-color: rgba(120,255,200,.7); background: linear-gradient(160deg, #4CF0AE, #17B978); box-shadow: 0 0 16px rgba(47,227,154,.35); }

      /* banner */
      .tf-banner {
        position: relative; overflow: hidden; min-height: 120px; border-radius: 18px;
        display: flex; align-items: center;
        background: linear-gradient(135deg, color-mix(in srgb, var(--tc) 26%, #141A4A), #0C1030 70%);
        border: 1px solid color-mix(in srgb, var(--tc) 55%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.12), 0 0 26px color-mix(in srgb, var(--tc) 28%, transparent);
      }
      .tf-banner-img {
        position: absolute; inset-block: 0; inset-inline-end: 0; width: 60%;
        background-size: cover; background-position: center;
        -webkit-mask-image: linear-gradient(to left, #000 45%, transparent);
                mask-image: linear-gradient(to left, #000 45%, transparent);
      }
      [dir="rtl"] .tf-banner-img {
        -webkit-mask-image: linear-gradient(to right, #000 45%, transparent);
                mask-image: linear-gradient(to right, #000 45%, transparent);
      }
      .tf-banner-text { position: relative; padding: 16px 18px; max-width: 64%; }
      .tf-title {
        margin: 0; font: 800 24px/1.1 'Poppins', system-ui, sans-serif; color: #fff;
        text-transform: uppercase; letter-spacing: .02em; overflow-wrap: anywhere;
        text-shadow: 0 2px 12px rgba(0,0,0,.5);
      }
      .tf-desc { margin: 6px 0 0; font-size: 13px; line-height: 1.4; color: rgba(236,238,255,.85); text-shadow: 0 1px 8px rgba(0,0,0,.6); }

      /* inputs */
      .tf-panel {
        display: flex; flex-direction: column; gap: 12px; padding: 14px; border-radius: 18px;
        background: linear-gradient(160deg, rgba(28,34,88,.75), rgba(18,22,64,.75));
        border: 1px solid rgba(255,255,255,0.07); box-shadow: inset 0 1px 0 rgba(255,255,255,.08);
      }
      .tf-row { display: flex; gap: 8px; align-items: flex-end; }
      .tf-row > * { flex: 1; min-width: 0; }
      .tf-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
      .tf-label { font-size: 12px; font-weight: 600; color: var(--tf-dim); }
      .tf-hint { font-size: 12px; color: #FFC94D; }
      .tf-input {
        width: 100%; min-width: 0; box-sizing: border-box; min-height: 46px; padding: 12px; border-radius: 12px;
        font: 600 15px 'Poppins', system-ui, sans-serif; color: #fff; outline: none;
        background: rgba(10,14,42,0.75); border: 1px solid var(--tf-line);
        transition: border-color .15s, box-shadow .15s;
      }
      .tf-input:focus { border-color: color-mix(in srgb, var(--tc) 80%, #fff); box-shadow: 0 0 0 3px color-mix(in srgb, var(--tc) 25%, transparent); }
      select.tf-input { cursor: pointer; }
      select.tf-input option { background: #121640; color: #fff; }
      .tf-input::placeholder { color: rgba(154,160,208,.7); }

      /* hero result */
      .tf-hero {
        position: relative; overflow: hidden; text-align: center; padding: 22px 16px 20px; border-radius: 22px;
        background:
          radial-gradient(80% 90% at 50% 0%, color-mix(in srgb, var(--tc) 38%, transparent), transparent 70%),
          linear-gradient(160deg, #1A2060, #0E1238);
        border: 1px solid color-mix(in srgb, var(--tc) 45%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 12px 32px rgba(0,0,0,.3);
      }
      .tf-hero-label { font-size: 12px; font-weight: 700; letter-spacing: .16em; text-transform: uppercase; color: rgba(236,238,255,.8); }
      .tf-hero-value { display: flex; justify-content: center; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-top: 6px; }
      .tf-hero-num {
        font: 800 clamp(56px, 17vw, 72px)/1 'Poppins', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums;
        text-shadow: 0 0 24px color-mix(in srgb, var(--tc) 80%, transparent), 0 0 48px color-mix(in srgb, var(--tc) 45%, transparent);
        overflow-wrap: anywhere;
      }
      .tf-hero-unit { font: 800 22px 'Poppins', system-ui, sans-serif; color: color-mix(in srgb, var(--tc) 55%, #fff); }
      .tf-hero-sub { margin-top: 10px; font-size: 14px; font-weight: 600; color: rgba(236,238,255,.85); }

      /* info cards */
      .tf-cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
      .tf-card {
        --cc: var(--tc);
        display: flex; align-items: center; gap: 12px; padding: 12px 14px; border-radius: 16px; min-width: 0;
        background: linear-gradient(160deg, color-mix(in srgb, var(--cc) 18%, #161B4E), #10143A);
        border: 1px solid color-mix(in srgb, var(--cc) 40%, transparent);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
      }
      .tf-card-wide { grid-column: 1 / -1; }
      .tf-card-icon {
        flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%; display: grid; place-items: center; font-size: 20px;
        background: color-mix(in srgb, var(--cc) 22%, transparent);
        border: 2px solid color-mix(in srgb, var(--cc) 70%, transparent);
        box-shadow: 0 0 14px color-mix(in srgb, var(--cc) 40%, transparent);
      }
      .tf-card-body { min-width: 0; flex: 1; }
      .tf-card-label { font-size: 11px; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; color: var(--tf-dim); }
      .tf-card-value { font: 800 16px/1.25 'Poppins', system-ui, sans-serif; color: #fff; overflow-wrap: anywhere; }
      .tf-card-sub { font-size: 12px; color: color-mix(in srgb, var(--cc) 60%, #fff); margin-top: 1px; }

      /* number tiles */
      .tf-tiles { margin: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      @media (min-width: 480px) { .tf-tiles { grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); } }
      .tf-tile {
        display: flex; flex-direction: column-reverse; gap: 2px; padding: 10px 12px; border-radius: 14px; min-width: 0;
        background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,.07);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
      }
      .tf-tile dt { font-size: 11px; color: var(--tf-dim); text-transform: uppercase; letter-spacing: .05em; }
      .tf-tile dd { margin: 0; font: 800 18px 'Poppins', system-ui, sans-serif; color: #fff; font-variant-numeric: tabular-nums; overflow-wrap: anywhere; }
      .tf-tile.tf-accent dd { color: color-mix(in srgb, var(--tc) 60%, #fff); text-shadow: 0 0 14px color-mix(in srgb, var(--tc) 60%, transparent); }

      /* buttons */
      .tf-actions { display: flex; gap: 10px; }
      .tf-actions > * { flex: 1; }
      .tf-btn {
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        min-height: 50px; padding: 0 20px; border-radius: 999px; cursor: pointer; white-space: nowrap;
        font: 800 15px 'Poppins', system-ui, sans-serif; color: #fff; text-decoration: none;
        border: 1px solid color-mix(in srgb, var(--tc) 60%, #fff);
        background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 75%, #fff), var(--tc) 50%, color-mix(in srgb, var(--tc) 70%, #000));
        box-shadow: inset 0 1px 0 rgba(255,255,255,.4), 0 4px 0 color-mix(in srgb, var(--tc) 45%, #000), 0 0 24px color-mix(in srgb, var(--tc) 45%, transparent);
        text-shadow: 0 1px 2px rgba(0,0,0,.35);
        transition: transform .14s, filter .16s;
      }
      .tf-btn:hover:not(:disabled) { filter: brightness(1.07); }
      .tf-btn:active:not(:disabled) { transform: translateY(2px); }
      .tf-btn:disabled { opacity: .45; cursor: default; }
      .tf-btn.tf-ghost { background: rgba(255,255,255,0.04); border: 1.5px solid color-mix(in srgb, var(--tc) 60%, transparent); box-shadow: none; text-shadow: none; }
      .tf-btn:focus-visible, .tf-back:focus-visible, .tf-pill:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

      /* chips (segmented choices) */
      .tf-chips { display: flex; gap: 6px; flex-wrap: wrap; }
      .tf-chip {
        min-height: 38px; padding: 0 14px; border-radius: 999px; cursor: pointer; white-space: nowrap;
        font: 700 13px 'Poppins', system-ui, sans-serif; color: #DCD6FF;
        background: linear-gradient(160deg, #1C2258, #121640); border: 1px solid rgba(255,255,255,.08);
        box-shadow: inset 0 1px 0 rgba(255,255,255,.1);
      }
      .tf-chip.is-on, .tf-chip[aria-pressed="true"] {
        color: #fff; border-color: color-mix(in srgb, var(--tc) 70%, #fff);
        background: linear-gradient(160deg, color-mix(in srgb, var(--tc) 70%, #fff), color-mix(in srgb, var(--tc) 80%, #000));
        box-shadow: 0 0 16px color-mix(in srgb, var(--tc) 45%, transparent);
      }
      /* units and codes keep their case (m ≠ M) */
      .tf-keep { text-transform: none; letter-spacing: .02em; }
      .tf-note { font-size: 12px; color: var(--tf-dim); text-align: center; }

      @media (max-width: 400px) {
        .tf-banner-text { max-width: 72%; padding: 14px; }
        .tf-cards { gap: 8px; }
        .tf-card { padding: 10px; gap: 9px; }
        .tf-card-icon { width: 36px; height: 36px; font-size: 17px; }
        .tf-card-value { font-size: 14px; }
      }
    `}</style>
  );
}
