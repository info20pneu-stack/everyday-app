'use client';

import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import Flag from './Flag';

/* Dropdown with SVG flags — a native <select> can't show images in its options, and flag emoji
   don't render on Windows. Listbox pattern: the button opens the list, ↑ ↓ Home End move,
   Enter / Space pick, Esc / Tab close, typing jumps to the first matching option.
   The list opens upwards when there's no room below (e.g. in the footer). Hover follows real mouse
   movement only (pointermove), so scrolling the list under a resting pointer can't steal the
   keyboard selection. */

export interface FlagOption {
  value: string;
  /** ISO 3166 code, 'world' for a globe, or null for no flag. */
  flag: string | null;
  label: string;
}

interface FlagSelectProps {
  value: string;
  options: FlagOption[];
  onChange: (value: string) => void;
  /** Accessible name of the control. */
  label: string;
  /** Shown when no option matches `value`. */
  placeholder?: string;
  id?: string;
  /** Extra class for the trigger button (each place styles it its own way). */
  className?: string;
  style?: React.CSSProperties;
  flagSize?: number;
}

const LIST_MAX_PX = 280;

export default function FlagSelect({
  value, options, onChange, label, placeholder, id, className, style, flagSize = 18,
}: FlagSelectProps) {
  const autoId = useId();
  const baseId = id ?? `fsel-${autoId}`;
  const listId = `${baseId}-list`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [up, setUp] = useState(false);
  const [alignEnd, setAlignEnd] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const typed = useRef({ text: '', at: 0 });

  const selectedIndex = options.findIndex(o => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  function openList() {
    const r = buttonRef.current?.getBoundingClientRect();
    if (r) {
      const below = window.innerHeight - r.bottom;
      setUp(below < Math.min(LIST_MAX_PX, options.length * 38) + 12 && r.top > below);
    }
    setActive(Math.max(0, selectedIndex));
    setAlignEnd(false);
    setOpen(true);
  }

  function close(focusButton = true) {
    setOpen(false);
    if (focusButton) buttonRef.current?.focus();
  }

  function pick(i: number) {
    const o = options[i];
    if (o) onChange(o.value);
    close();
  }

  // Keep the list inside the viewport: align it to the button's other edge if it would stick out
  useLayoutEffect(() => {
    if (!open || alignEnd) return;
    const r = listRef.current?.getBoundingClientRect();
    if (r && (r.right > window.innerWidth - 8 || r.left < 8)) setAlignEnd(true);
  }, [open, alignEnd]);

  // Focus the list when it opens; close on a click outside
  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  // Keep the active option visible
  useEffect(() => {
    if (!open) return;
    document.getElementById(`${baseId}-opt-${active}`)?.scrollIntoView({ block: 'nearest' });
  }, [open, active, baseId]);

  function onListKey(e: React.KeyboardEvent) {
    const last = options.length - 1;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); setActive(a => Math.min(last, a + 1)); return;
      case 'ArrowUp': e.preventDefault(); setActive(a => Math.max(0, a - 1)); return;
      case 'Home': e.preventDefault(); setActive(0); return;
      case 'End': e.preventDefault(); setActive(last); return;
      case 'PageDown': e.preventDefault(); setActive(a => Math.min(last, a + 8)); return;
      case 'PageUp': e.preventDefault(); setActive(a => Math.max(0, a - 8)); return;
      case 'Enter': case ' ': e.preventDefault(); pick(active); return;
      case 'Escape': e.preventDefault(); e.stopPropagation(); close(); return;
      case 'Tab': close(false); return;
    }
    // Type-ahead: jump to the first option starting with what was typed in the last 0.7 s
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      const now = e.timeStamp;
      typed.current.text = (now - typed.current.at > 700 ? '' : typed.current.text) + e.key.toLocaleLowerCase();
      typed.current.at = now;
      const hit = options.findIndex(o => o.label.toLocaleLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  }

  function onButtonKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') { e.preventDefault(); openList(); }
  }

  return (
    <div ref={wrapRef} className="fsel">
      <button
        ref={buttonRef} id={baseId} type="button" className={`fsel-btn${className ? ` ${className}` : ''}`} style={style}
        aria-haspopup="listbox" aria-expanded={open} aria-controls={open ? listId : undefined} aria-label={label}
        onClick={() => (open ? close() : openList())} onKeyDown={onButtonKey}
      >
        {selected?.flag && <Flag code={selected.flag} size={flagSize} />}
        <span className="fsel-text">{selected ? selected.label : placeholder ?? ''}</span>
        <span className="fsel-arrow" aria-hidden="true">▾</span>
      </button>
      {open && (
        <ul
          ref={listRef} id={listId} role="listbox" tabIndex={-1} aria-label={label}
          aria-activedescendant={`${baseId}-opt-${active}`}
          className={`fsel-list${up ? ' fsel-up' : ''}${alignEnd ? ' fsel-end' : ''}`} onKeyDown={onListKey}
        >
          {options.map((o, i) => (
            <li
              key={o.value} id={`${baseId}-opt-${i}`} role="option" aria-selected={o.value === value}
              className={`fsel-opt${i === active ? ' active' : ''}`}
              onPointerMove={() => { if (i !== active) setActive(i); }} onClick={() => pick(i)}
            >
              {o.flag ? <Flag code={o.flag} size={flagSize} /> : <span className="fsel-noflag" style={{ width: flagSize }} />}
              <span className="fsel-text">{o.label}</span>
              {o.value === value && <span className="fsel-check" aria-hidden="true">✓</span>}
            </li>
          ))}
        </ul>
      )}
      <FlagSelectStyles />
    </div>
  );
}

function FlagSelectStyles() {
  return (
    <style>{`
      .fsel { position: relative; display: inline-flex; min-width: 0; max-width: 100%; }
      .fsel-btn {
        display: inline-flex; align-items: center; gap: 8px; min-width: 0; max-width: 100%; min-height: 36px;
        padding: 0 10px; border-radius: 10px; cursor: pointer; font: inherit; color: inherit; text-align: start;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
      }
      .fsel-btn:focus-visible { outline: 2px solid #8475FF; outline-offset: 2px; }
      .fsel-text { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .fsel-arrow { font-size: 11px; opacity: .7; }
      .fsel-list {
        position: absolute; top: calc(100% + 6px); inset-inline-start: 0; z-index: 1200;
        min-width: 100%; width: max-content; max-width: min(320px, calc(100vw - 32px));
        max-height: ${LIST_MAX_PX}px; overflow-y: auto; overscroll-behavior: contain;
        margin: 0; padding: 4px; list-style: none; border-radius: 12px;
        background: #0F1432; color: #F2F3FF; border: 1px solid rgba(132,117,255,0.35);
        box-shadow: 0 16px 40px rgba(0,0,0,0.55); font-size: 14px; outline: none;
      }
      .fsel-list.fsel-up { top: auto; bottom: calc(100% + 6px); }
      .fsel-list.fsel-end { inset-inline-start: auto; inset-inline-end: 0; }
      .fsel-opt {
        display: flex; align-items: center; gap: 10px; min-height: 36px; padding: 6px 10px;
        border-radius: 8px; cursor: pointer; white-space: nowrap;
      }
      .fsel-opt.active { background: rgba(93,76,255,0.28); }
      .fsel-opt[aria-selected="true"] { font-weight: 700; }
      .fsel-noflag { display: inline-block; flex-shrink: 0; }
      .fsel-check { margin-inline-start: auto; padding-inline-start: 10px; color: #9B8CFF; }
      [data-theme="light"] .fsel-list, [data-theme="xp"] .fsel-list {
        background: #fff; color: #111827; border-color: rgba(0,0,0,0.15); box-shadow: 0 12px 32px rgba(0,0,0,0.18);
      }
      [data-theme="light"] .fsel-opt.active, [data-theme="xp"] .fsel-opt.active { background: rgba(93,76,255,0.12); }
    `}</style>
  );
}
