'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLang } from '../../lib/LanguageContext';
import type { BirthdayCeleb, Category, HistoricalEvent, BirthdaysResponse } from '../api/birthdays/route';
import FlagText from './FlagText';
import { countryNameFromFlag } from '../../lib/flags';
import { professionName } from '../../lib/professionsI18n';
import { fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolHero } from './tools/ToolFrame';

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
  all:   { label: 'All',       emoji: '🌟', color: '#8475FF' },
  film:  { label: 'Film & TV', emoji: '🎬', color: '#EF4444' },
  music: { label: 'Music',     emoji: '🎵', color: '#F59E0B' },
  sport: { label: 'Sport',     emoji: '⚽', color: '#22C55E' },
  other: { label: 'Other',     emoji: '🌍', color: '#60A5FA' },
};

/** Month names in the UI language (stand-alone form: "říjen", "October"). */
function monthNames(lang: string): string[] {
  const f = new Intl.DateTimeFormat(lang, { month: 'long', timeZone: 'UTC' });
  return Array.from({ length: 12 }, (_, i) => f.format(new Date(Date.UTC(2000, i, 15))));
}

/** "26. října" / "October 26" for a month and day, in the UI language. */
function dayLabel(month: number, day: number, lang: string): string {
  return new Date(Date.UTC(2000, month - 1, day)).toLocaleDateString(lang, { day: 'numeric', month: 'long', timeZone: 'UTC' });
}

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
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const country = countryNameFromFlag(celeb.countryFlag, celeb.country, lang);
  const meta = CATEGORY_META[celeb.category];
  const [copied, setCopied] = useState(false);

  const shareText = `${st.celebShare.replace('{name}', celeb.name).replace('{age}', fmtUnit(celeb.age, 'year', lang, 'long'))}\n${professionName(celeb.profession, lang)}${country ? ` ${celeb.countryFlag ?? ''} ${country}` : ''}\n\n${celeb.description.slice(0, 100)}…\n\n${celeb.url}`;

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
      <div className="modal-box" style={{ background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '360px', boxShadow: '0 24px 64px rgba(0,0,0,0.7)', animation: 'cbPopIn 0.22s cubic-bezier(.34,1.56,.64,1)', position: 'relative' }}>
        <button onClick={onClose} aria-label={t.games.close} className="modal-close" style={{ position: 'absolute', top: '14px', right: '14px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text3)', fontSize: '13px' }}>✕</button>

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
              <span style={{ fontSize: '12px', fontWeight: '700', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 8px', color: '#fff' }}>🎂 {fmtUnit(celeb.age, 'year', lang)}</span>
              <span style={{ fontSize: '12px', fontWeight: '600', background: `${meta.color}22`, border: `1px solid ${meta.color}44`, borderRadius: '6px', padding: '2px 8px', color: meta.color }}>{meta.emoji} {professionName(celeb.profession, lang)}</span>
            </div>
            {celeb.country && (
              <div style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
                <span style={{ marginRight: '4px', display: 'inline-flex', verticalAlign: 'middle' }}><FlagText text={celeb.countryFlag} size={16} /></span>{country} · {st.born.replace('{year}', String(celeb.year))}
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
          <div style={{ fontSize: '12px', color: 'var(--text3)', marginBottom: '5px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{st.share}</div>
          <div style={{ display: 'flex', gap: '5px' }}>
            {[
              { label: `📤 ${st.share}`, action: nativeShare, bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.1)', color: '#fff' },
              { label: t.celebrity.shareTweet, action: () => shareVia('twitter'), bg: 'rgba(0,0,0,0.3)', border: 'rgba(255,255,255,0.08)', color: '#fff' },
              { label: t.celebrity.shareWhatsapp, action: () => shareVia('whatsapp'), bg: 'rgba(37,211,102,0.1)', border: 'rgba(37,211,102,0.25)', color: '#25D366' },
              { label: copied ? '✓' : t.celebrity.shareCopy, action: copyText, bg: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: copied ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.1)', color: copied ? 'var(--green2)' : '#fff' },
            ].map(({ label, action, bg, border, color }) => (
              <button key={label} onClick={action} style={{ flex: 1, background: bg, border: `1px solid ${border}`, borderRadius: '8px', color, fontSize: '12px', fontWeight: '600', padding: '7px 2px', cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
            ))}
          </div>
        </div>

        <a href={celeb.url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.25)', borderRadius: '10px', color: 'var(--purple3)', fontSize: '12px', fontWeight: '600', padding: '9px', textDecoration: 'none' }}>
          {t.celebrity.wikipedia}
        </a>
      </div>
    </div>
  );
}

/* ── Celebrity card ── */
function CelebCard({ celeb, rank, onClick }: { celeb: BirthdayCeleb; rank: number; onClick: () => void }) {
  const { lang } = useLang();
  const meta = CATEGORY_META[celeb.category];
  const ageParts = new Intl.NumberFormat(lang, { style: 'unit', unit: 'year', unitDisplay: 'short' }).formatToParts(celeb.age);
  return (
    <button type="button" onClick={onClick} className="cb-row">
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '6px', background: rank <= 3 ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: rank <= 3 ? '#FFB300' : 'var(--text3)' }}>
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
          <span style={{ fontSize: '12px', background: `${meta.color}22`, color: meta.color, borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>{professionName(celeb.profession, lang)}</span>
          {celeb.countryFlag && <span style={{ display: 'inline-flex' }}><FlagText text={celeb.countryFlag} size={16} /></span>}
          <span style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Intl.NumberFormat(lang, { useGrouping: false }).format(celeb.year)}</span>
        </div>
      </div>
      <div style={{ flexShrink: 0, textAlign: 'end' }}>
        <div className="cb-age">{ageParts.filter(p => p.type === 'integer').map(p => p.value).join('')}</div>
        <div style={{ fontSize: '11px', color: 'var(--text3)', marginTop: '1px' }}>{ageParts.filter(p => p.type === 'unit').map(p => p.value).join('')}</div>
      </div>
    </button>
  );
}

/* ── Historical events section ── */
function EventsSection({ events }: { events: HistoricalEvent[] }) {
  const { t, lang } = useLang();
  if (!events.length) return null;
  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
        <span style={{ fontSize: '12px', color: 'var(--text3)', fontWeight: '600', letterSpacing: '0.5px', whiteSpace: 'nowrap' }}>
          {t.celebrity.historicalEvents}
        </span>
        <div style={{ height: '1px', flex: 1, background: 'rgba(255,255,255,0.07)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
        {events.map((ev, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '7px 10px', borderRadius: '9px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
            {/* Year badge */}
            <div style={{ flexShrink: 0, background: `${eraColor(ev.year)}18`, border: `1px solid ${eraColor(ev.year)}40`, borderRadius: '6px', padding: '2px 7px', fontSize: '12px', fontWeight: '700', color: eraColor(ev.year), fontVariantNumeric: 'tabular-nums', lineHeight: 1.4 }}>
              {new Intl.NumberFormat(lang, { useGrouping: false }).format(ev.year)}
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
  const { t, lang } = useLang();
  const st = toolStrings(lang);
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
  return (
    <div className="tf-panel">
      <div className="tf-row" style={{ alignItems: 'center' }}>
        <button type="button" className="tf-chip cb-step" onClick={prevDay} aria-label="‹">‹</button>
        <select className="tf-input" style={{ flex: 1 }} value={day} onChange={e => onChange(month, Number(e.target.value))} aria-label={t.celebrity.selectDate}>
          {Array.from({ length: daysInMonth(month) }, (_, i) => <option key={i + 1} value={i + 1}>{fmtNumber(i + 1, lang)}</option>)}
        </select>
        <select className="tf-input" style={{ flex: 2 }} value={month} onChange={e => onChange(Number(e.target.value), Math.min(day, daysInMonth(Number(e.target.value))))} aria-label={t.celebrity.selectDate}>
          {monthNames(lang).map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <button type="button" className="tf-chip cb-step" onClick={nextDay} aria-label="›">›</button>
      </div>
      {!isToday && <button type="button" className="tf-chip" style={{ alignSelf: 'flex-start' }} onClick={onReset}>📅 {st.today}</button>}
    </div>
  );
}

/* ── Main component ── */
export default function CelebrityBirthdays() {
  const { t, lang } = useLang();
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
    tabs.map(cat => [cat, cat === 'all' ? celebs.length : celebs.filter(c => c.category === cat).length])
  ), [celebs]);
  const tabLabels: Record<Category | 'all', string> = {
    all: t.celebrity.tab_all, film: t.celebrity.tab_film, music: t.celebrity.tab_music,
    sport: t.celebrity.tab_sport, other: t.celebrity.tab_other,
  };

  const close = useCallback(() => setSelected(null), []);
  const st = toolStrings(lang);

  return (
    <ToolFrame toolId="narozeniny">
      <DatePicker month={selMonth} day={selDay} onChange={handleDateChange} isToday={isToday} onReset={() => handleDateChange(todayM, todayD)} />

      <ToolHero
        label={`${isToday ? `${st.today} · ` : ''}${dayLabel(selMonth, selDay, lang)}`}
        value={state === 'ok' ? fmtNumber(filtered.length, lang) : '—'}
        sub={st.celebsCount}
      />

      <div className="tf-chips">
        {tabs.map(cat => {
          return (
            <button key={cat} type="button" className={`tf-chip${tab === cat ? ' is-on' : ''}`} aria-pressed={tab === cat} onClick={() => setTab(cat)}>
              {tabLabels[cat]}{state === 'ok' && <span style={{ opacity: 0.7 }}> ({fmtNumber(tabCounts[cat], lang)})</span>}
            </button>
          );
        })}
      </div>

      {state === 'loading' && <Skeleton />}

      {state === 'error' && (
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 28 }}>📡</div>
          <div>{t.celebrity.failedToLoad}</div>
          <ToolButton onClick={() => loadData(selMonth, selDay)}>{t.celebrity.tryAgain}</ToolButton>
        </div>
      )}

      {state === 'ok' && (
        <>
          {localFiltered.length > 0 && (
            <div className="tf-panel">
              <div className="tf-label">{t.celebrity.fromYourRegion}</div>
              {localFiltered.slice(0, 5).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
            </div>
          )}

          {filtered.length > 0 ? (
            <div className="tf-panel">
              <div className="tf-label">{t.celebrity.topByPopularity.replace('{count}', fmtNumber(Math.min(filtered.length, 15), lang))}</div>
              {filtered.slice(0, 15).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
            </div>
          ) : (
            <div className="tf-note" style={{ padding: '1.5rem 0' }}>
              <div style={{ fontSize: 24, marginBottom: 6 }}>{CATEGORY_META[tab].emoji}</div>
              {t.celebrity.noCelebrities}
            </div>
          )}

          <EventsSection events={events} />

          <div className="tf-note">{t.celebrity.source}</div>
        </>
      )}

      {selected && <ProfilePopup celeb={selected} onClose={close} />}

      <style>{`
        .cb-step { min-width: 44px; padding: 0; font-size: 18px; flex: 0 0 auto !important; }
        .cb-row {
          display: flex; align-items: center; gap: 10px; width: 100%; padding: 8px 10px; text-align: start; font: inherit; color: inherit;
          border-radius: 14px; cursor: pointer; border: 1px solid rgba(255,255,255,.06);
          background: linear-gradient(160deg, rgba(28,34,88,.7), rgba(18,22,64,.7));
          transition: border-color .15s, transform .1s;
        }
        .cb-row:hover { border-color: color-mix(in srgb, var(--tc) 50%, transparent); transform: translateX(2px); }
        [dir="rtl"] .cb-row:hover { transform: translateX(-2px); }
        .cb-age { font: 800 17px/1 'Poppins', sans-serif; color: color-mix(in srgb, var(--tc) 55%, #fff); }
        @keyframes cbPopIn { from{opacity:0;transform:scale(0.9) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes cbShimmer { 0%,100%{opacity:0.4} 50%{opacity:0.8} }
      `}</style>
    </ToolFrame>
  );
}
