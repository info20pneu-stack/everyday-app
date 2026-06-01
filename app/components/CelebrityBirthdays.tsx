'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { BirthdayCeleb, Category, HistoricalEvent, BirthdaysResponse } from '../api/birthdays/route';

/* ── Helpers ── */
function getLocaleCountry(): string {
  if (typeof navigator === 'undefined') return '';
  const parts = navigator.language.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : '';
}

const LOCALE_KEYWORDS: Record<string, string[]> = {
  CZ:['Czech Rep.'], SK:['Slovakia'], DE:['Germany'], AT:['Austria'], FR:['France'],
  ES:['Spain'], IT:['Italy'], PL:['Poland'], RU:['Russia'], US:['USA'],
  GB:['UK','England','Scotland','Wales'], JP:['Japan'], CN:['China'], KR:['South Korea'],
  BR:['Brazil'], IN:['India'], AU:['Australia'], CA:['Canada'], NL:['Netherlands'],
  SE:['Sweden'], NO:['Norway'], DK:['Denmark'], FI:['Finland'], PT:['Portugal'],
  GR:['Greece'], TR:['Turkey'], UA:['Ukraine'], HU:['Hungary'], RO:['Romania'],
  HR:['Croatia'], RS:['Serbia'], BE:['Belgium'], CH:['Switzerland'], MX:['Mexico'],
  AR:['Argentina'], CO:['Colombia'], ZA:['South Africa'], NG:['Nigeria'], EG:['Egypt'],
};

function matchesLocale(celeb: BirthdayCeleb, cc: string): boolean {
  if (!celeb.country || !cc) return false;
  return (LOCALE_KEYWORDS[cc] ?? []).some(k => celeb.country!.includes(k));
}

const CATEGORY_META: Record<Category | 'all', { label: string; emoji: string; color: string }> = {
  all:   { label: 'Vše',       emoji: '🌟', color: '#8475FF' },
  film:  { label: 'Film & TV', emoji: '🎬', color: '#EF4444' },
  music: { label: 'Hudba',     emoji: '🎵', color: '#F59E0B' },
  sport: { label: 'Sport',     emoji: '⚽', color: '#22C55E' },
  other: { label: 'Ostatní',   emoji: '🌍', color: '#60A5FA' },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const MONTH_NAMES_CZ = ['Ledna','Února','Března','Dubna','Května','Června','Července','Srpna','Září','Října','Listopadu','Prosince'];

function daysInMonth(month: number): number {
  return new Date(2000, month, 0).getDate();
}

function toMMDD(month: number, day: number): string {
  return `${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
}

/* ── Event color by era ── */
function eraColor(year: number): string {
  if (year >= 2000) return '#60a5fa';
  if (year >= 1950) return '#4ade80';
  if (year >= 1900) return '#f59e0b';
  if (year >= 1800) return '#c084fc';
  return '#94a3b8';
}

/* ── Profile popup ── */
function ProfilePopup({ celeb, onClose }: { celeb: BirthdayCeleb; onClose: () => void }) {
  const meta = CATEGORY_META[celeb.category];
  const [copied, setCopied] = useState(false);

  const shareText = `🎂 Dnes slaví narozeniny: ${celeb.name} (${celeb.age} let)!\n${celeb.profession}${celeb.country ? ` ${celeb.countryFlag} ${celeb.country}` : ''}\n\n${celeb.description.slice(0, 100)}...\n\n${celeb.url}`;

  async function copyText() {
    try { await navigator.clipboard.writeText(shareText); } catch {}
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  function shareVia(platform: 'twitter' | 'whatsapp' | 'facebook') {
    const enc = encodeURIComponent(shareText);
    const urls = {
      twitter:  `https://twitter.com/intent/tweet?text=${enc}`,
      whatsapp: `https://wa.me/?text=${enc}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(celeb.url)}&quote=${enc}`,
    };
    window.open(urls[platform], '_blank', 'noopener,width=600,height=500');
  }

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try { await navigator.share({ title: celeb.name, text: shareText, url: celeb.url }); return; } catch {}
    }
    copyText();
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'cbPopIn 0.22s cubic-bezier(.34,1.56,.64,1)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text3)', fontSize: '13px' }}>✕</button>

        {/* Photo + header */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {celeb.thumbnail ? (
            <img src={celeb.thumbnail} alt={celeb.name} style={{ width: 76, height: 76, borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 76, height: 76, borderRadius: '12px', background: `${meta.color}22`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0 }}>{meta.emoji}</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: '800', color: '#fff', lineHeight: 1.2, marginBottom: '6px' }}>{celeb.name}</div>
            <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 8px', color: '#fff' }}>🎂 {celeb.age} let</span>
              <span style={{ fontSize: '11px', fontWeight: '600', background: `${meta.color}22`, border: `1px solid ${meta.color}44`, borderRadius: '6px', padding: '2px 8px', color: meta.color }}>{meta.emoji} {celeb.profession}</span>
            </div>
            {celeb.country && (
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                <span style={{ marginRight: '4px' }}>{celeb.countryFlag}</span>{celeb.country} · nar. {celeb.year}
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
          {celeb.description.slice(0, 240)}{celeb.description.length > 240 ? '…' : ''}
        </div>

        {/* Share */}
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', marginBottom: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Sdílet</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { label: '📤 Sdílet', action: nativeShare, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', color: '#fff' },
              { label: '𝕏 X', action: () => shareVia('twitter'), bg: 'rgba(0,0,0,0.3)', border: 'rgba(255,255,255,0.08)', color: '#fff' },
              { label: '💬 WA', action: () => shareVia('whatsapp'), bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.25)', color: '#25D366' },
              { label: copied ? '✓ OK' : '📋 Copy', action: copyText, bg: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)', color: copied ? 'var(--green2)' : '#fff' },
            ].map(({ label, action, bg, border, color }) => (
              <button key={label} onClick={action} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: '8px', color, fontSize: '10px', fontWeight: '600', padding: '7px 2px', cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
            ))}
          </div>
        </div>

        <a href={celeb.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.25)', borderRadius: '10px', color: 'var(--purple3)', fontSize: '12px', fontWeight: '600', padding: '9px', textDecoration: 'none' }}>
          📚 Wikipedia ↗
        </a>
      </div>
    </div>
  );
}

/* ── Celebrity card ── */
function CelebCard({ celeb, rank, onClick }: { celeb: BirthdayCeleb; rank: number; onClick: () => void }) {
  const meta = CATEGORY_META[celeb.category];
  return (
    <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 9px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'background 0.15s, border-color 0.15s, transform 0.1s' }}
      onMouseEnter={e => { const d = e.currentTarget; d.style.background = 'rgba(93,76,255,0.08)'; d.style.borderColor = 'rgba(93,76,255,0.2)'; d.style.transform = 'translateX(2px)'; }}
      onMouseLeave={e => { const d = e.currentTarget; d.style.background = 'rgba(255,255,255,0.02)'; d.style.borderColor = 'rgba(255,255,255,0.05)'; d.style.transform = 'translateX(0)'; }}>
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '6px', background: rank <= 3 ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: rank <= 3 ? '#FFB300' : 'var(--text3)' }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </div>
      {celeb.thumbnail ? (
        <img src={celeb.thumbnail} alt={celeb.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>{meta.emoji}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{celeb.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span style={{ fontSize: '9px', background: `${meta.color}22`, color: meta.color, borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>{celeb.profession}</span>
          {celeb.countryFlag && <span style={{ fontSize: '11px' }}>{celeb.countryFlag}</span>}
          <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{celeb.year}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--purple3)', fontFamily: 'Poppins', lineHeight: 1 }}>{celeb.age}</div>
        <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '1px' }}>let</div>
      </div>
    </div>
  );
}

/* ── Historical events section ── */
function EventsSection({ events, dateLabel }: { events: HistoricalEvent[]; dateLabel: string }) {
  if (!events.length) return null;
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: '11px', color: 'var(--text3)', fontWeight: '600', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          📅 V tento den v historii
        </span>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '7px 10px', borderRadius: '9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Year badge */}
            <div style={{ flexShrink: 0, background: `${eraColor(ev.year)}18`, border: `1px solid ${eraColor(ev.year)}40`, borderRadius: '6px', padding: '2px 7px', fontSize: '12px', fontWeight: '700', color: eraColor(ev.year), fontVariantNumeric: 'tabular-nums', lineHeight: 1.4 }}>
              {ev.year}
            </div>
            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {ev.url ? (
                <a href={ev.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.text}</span>
                </a>
              ) : (
                <span style={{ fontSize: '12px', color: 'var(--text2)', lineHeight: '1.5', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{ev.text}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} style={{ height: '58px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: `cbShimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
    </div>
  );
}

/* ── Date picker ── */
function DatePicker({
  month, day, onChange, isToday, onReset,
}: {
  month: number; day: number;
  onChange: (m: number, d: number) => void;
  isToday: boolean; onReset: () => void;
}) {
  function prevDay() {
    if (day > 1) { onChange(month, day - 1); return; }
    const pm = month === 1 ? 12 : month - 1;
    onChange(pm, daysInMonth(pm));
  }
  function nextDay() {
    const maxD = daysInMonth(month);
    if (day < maxD) { onChange(month, day + 1); return; }
    onChange(month === 12 ? 1 : month + 1, 1);
  }

  const selectStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px', color: '#fff', padding: '5px 6px', fontSize: '12px',
    outline: 'none', cursor: 'pointer',
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '10px', padding: '5px 8px', flexWrap: 'wrap' }}>
      {/* Prev */}
      <button onClick={prevDay} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: 'var(--text2)', fontSize: '13px', width: '26px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>‹</button>

      {/* Month */}
      <select value={month} onChange={e => onChange(Number(e.target.value), Math.min(day, daysInMonth(Number(e.target.value))))} style={selectStyle}>
        {MONTH_NAMES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
      </select>

      {/* Day */}
      <select value={day} onChange={e => onChange(month, Number(e.target.value))} style={selectStyle}>
        {Array.from({ length: daysInMonth(month) }, (_, i) => (
          <option key={i + 1} value={i + 1}>{i + 1}</option>
        ))}
      </select>

      {/* Next */}
      <button onClick={nextDay} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: '6px', color: 'var(--text2)', fontSize: '13px', width: '26px', height: '26px', cursor: 'pointer', flexShrink: 0 }}>›</button>

      {/* Today */}
      {!isToday && (
        <button onClick={onReset} style={{ background: 'rgba(93,76,255,0.15)', border: '1px solid rgba(93,76,255,0.35)', borderRadius: '6px', color: 'var(--purple3)', fontSize: '10px', fontWeight: '700', padding: '4px 8px', cursor: 'pointer', flexShrink: 0 }}>
          Dnes
        </button>
      )}
    </div>
  );
}

/* ── Main component ── */
export default function CelebrityBirthdays() {
  const now = new Date();
  const todayM = now.getMonth() + 1;
  const todayD = now.getDate();

  const [selMonth, setSelMonth] = useState(todayM);
  const [selDay,   setSelDay]   = useState(todayD);
  const [data,     setData]     = useState<BirthdaysResponse | null>(null);
  const [state,    setState]    = useState<'loading' | 'ok' | 'error'>('loading');
  const [tab,      setTab]      = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<BirthdayCeleb | null>(null);
  const [locale,   setLocale]   = useState('');

  useEffect(() => { setLocale(getLocaleCountry()); }, []);

  const isToday = selMonth === todayM && selDay === todayD;

  const loadData = useCallback((month: number, day: number) => {
    setState('loading');
    const param = toMMDD(month, day);
    fetch(`/api/birthdays?date=${param}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((d: BirthdaysResponse) => { setData(d); setState('ok'); })
      .catch(() => setState('error'));
  }, []);

  useEffect(() => { loadData(selMonth, selDay); }, [selMonth, selDay, loadData]);

  const handleDateChange = useCallback((m: number, d: number) => {
    setSelMonth(m); setSelDay(d); setTab('all');
  }, []);

  const celebs   = data?.celebs ?? [];
  const events   = data?.events ?? [];
  const filtered = tab === 'all' ? celebs : celebs.filter(c => c.category === tab);
  const localFiltered = filtered.filter(c => matchesLocale(c, locale));

  const tabs: (Category | 'all')[] = ['all', 'film', 'music', 'sport', 'other'];
  const tabCounts = useMemo(() => Object.fromEntries(
    tabs.map(t => [t, t === 'all' ? celebs.length : celebs.filter(c => c.category === t).length])
  ), [celebs]);

  const close = useCallback(() => setSelected(null), []);

  return (
    <div className="card" style={{ background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--card-radius)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎂</span>
          <div>
            <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', lineHeight: 1.2 }}>Celebrity Birthdays</h2>
            <div style={{ fontSize: '11px', color: isToday ? 'var(--green2)' : 'var(--text3)' }}>
              {isToday ? '✦ Dnes' : data?.dateLabel ?? ''}
            </div>
          </div>
        </div>
        {state === 'ok' && (
          <span style={{ fontSize: '11px', color: 'var(--green2)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '2px 8px' }}>
            {filtered.length} celeb
          </span>
        )}
      </div>

      {/* Date picker */}
      <div style={{ marginBottom: '10px' }}>
        <DatePicker month={selMonth} day={selDay} onChange={handleDateChange} isToday={isToday} onReset={() => handleDateChange(todayM, todayD)} />
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '10px', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const m = CATEGORY_META[t];
          const isActive = tab === t;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '4px 8px', borderRadius: '7px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: isActive ? '700' : '400', background: isActive ? `${m.color}22` : 'rgba(255,255,255,0.04)', color: isActive ? m.color : 'var(--text3)', outline: isActive ? `1px solid ${m.color}55` : 'none', display: 'flex', alignItems: 'center', gap: '3px', transition: 'all 0.15s' }}>
              <span>{m.emoji}</span>
              <span>{m.label}</span>
              {state === 'ok' && <span style={{ fontSize: '9px', opacity: 0.6 }}>({tabCounts[t]})</span>}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {state === 'loading' && <Skeleton />}

      {/* Error */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
          <div style={{ fontSize: '13px' }}>Nepodařilo se načíst data</div>
          <button onClick={() => loadData(selMonth, selDay)} style={{ marginTop: '10px', background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.25)', borderRadius: '8px', color: 'var(--purple3)', fontSize: '12px', padding: '6px 14px', cursor: 'pointer' }}>↺ Zkusit znovu</button>
        </div>
      )}

      {/* Content */}
      {state === 'ok' && (
        <>
          {/* From your region */}
          {localFiltered.length > 0 && (
            <div style={{ marginBottom: '12px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>📍 Z vaší oblasti</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(93,76,255,0.05)', border: '1px solid rgba(93,76,255,0.12)', borderRadius: '12px', padding: '6px' }}>
                {localFiltered.slice(0, 5).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
              </div>
            </div>
          )}

          {/* Global list */}
          {filtered.length > 0 ? (
            <div>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                🌍 Top {Math.min(filtered.length, 15)} · podle popularity
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {filtered.slice(0, 15).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--text3)', fontSize: '13px' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{CATEGORY_META[tab].emoji}</div>
              Žádné celebrity v této kategorii pro tento den
            </div>
          )}

          {/* Historical events */}
          <EventsSection events={events} dateLabel={data?.dateLabel ?? ''} />

          <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
            Zdroj: Wikipedia · seřazeno podle popularity
          </div>
        </>
      )}

      {/* Profile popup */}
      {selected && <ProfilePopup celeb={selected} onClose={close} />}

      <style>{`
        @keyframes cbPopIn { from{opacity:0;transform:scale(0.9) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cbShimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
    </div>
  );
}
