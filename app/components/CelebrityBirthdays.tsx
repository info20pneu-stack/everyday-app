'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BirthdayCeleb, Category } from '../api/birthdays/route';

/* ── Helpers ── */
function getLocaleCountry(): string {
  if (typeof navigator === 'undefined') return '';
  const parts = navigator.language.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : '';
}

const LOCALE_COUNTRY_KEYWORDS: Record<string, string[]> = {
  CZ: ['Czech Rep.', 'Czechoslovakia'], SK: ['Slovakia'], DE: ['Germany', 'Bavaria'],
  AT: ['Austria'], FR: ['France'], ES: ['Spain'], IT: ['Italy'], PL: ['Poland'],
  RU: ['Russia'], US: ['USA'], GB: ['UK', 'England', 'Scotland', 'Wales'],
  JP: ['Japan'], CN: ['China'], KR: ['South Korea'], BR: ['Brazil'], IN: ['India'],
  AU: ['Australia'], CA: ['Canada'], NL: ['Netherlands'], SE: ['Sweden'],
  NO: ['Norway'], DK: ['Denmark'], FI: ['Finland'], PT: ['Portugal'],
  GR: ['Greece'], TR: ['Turkey'], UA: ['Ukraine'], HU: ['Hungary'],
  RO: ['Romania'], HR: ['Croatia'], RS: ['Serbia'], BE: ['Belgium'],
  CH: ['Switzerland'], MX: ['Mexico'], AR: ['Argentina'], CO: ['Colombia'],
  ZA: ['South Africa'], NG: ['Nigeria'], EG: ['Egypt'], IL: ['Israel'],
};

function matchesLocale(celeb: BirthdayCeleb, countryCode: string): boolean {
  if (!celeb.country || !countryCode) return false;
  const keywords = LOCALE_COUNTRY_KEYWORDS[countryCode] ?? [];
  return keywords.some(k => celeb.country!.includes(k));
}

const CATEGORY_META: Record<Category | 'all', { label: string; emoji: string; color: string }> = {
  all:   { label: 'Vše',      emoji: '🌟', color: '#8475FF' },
  film:  { label: 'Film & TV', emoji: '🎬', color: '#EF4444' },
  music: { label: 'Hudba',    emoji: '🎵', color: '#F59E0B' },
  sport: { label: 'Sport',    emoji: '⚽', color: '#22C55E' },
  other: { label: 'Ostatní',  emoji: '🌍', color: '#60A5FA' },
};

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
      twitter:   `https://twitter.com/intent/tweet?text=${enc}`,
      whatsapp:  `https://wa.me/?text=${enc}`,
      facebook:  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(celeb.url)}&quote=${enc}`,
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
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: 'rgba(12,16,36,0.98)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '20px', padding: '24px 20px', width: '100%', maxWidth: '360px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.7)',
        animation: 'cbPopIn 0.22s cubic-bezier(.34,1.56,.64,1)',
      }}>
        {/* Close */}
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer', color: 'var(--text3)', fontSize: '14px' }}>✕</button>

        {/* Photo + name */}
        <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', marginBottom: '14px' }}>
          {celeb.thumbnail ? (
            <img src={celeb.thumbnail} alt={celeb.name} style={{ width: 72, height: 72, borderRadius: '12px', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.12)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
          ) : (
            <div style={{ width: 72, height: 72, borderRadius: '12px', background: `${meta.color}22`, border: `1px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', flexShrink: 0 }}>🎂</div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: 'Poppins', fontSize: '17px', fontWeight: '800', color: '#fff', marginBottom: '4px', lineHeight: 1.2 }}>{celeb.name}</div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {/* Age badge */}
              <span style={{ fontSize: '12px', fontWeight: '700', background: 'rgba(255,255,255,0.08)', borderRadius: '6px', padding: '2px 8px', color: '#fff' }}>
                🎂 {celeb.age} let ({celeb.year})
              </span>
              {/* Category badge */}
              <span style={{ fontSize: '11px', fontWeight: '600', background: `${meta.color}22`, border: `1px solid ${meta.color}44`, borderRadius: '6px', padding: '2px 8px', color: meta.color }}>
                {meta.emoji} {celeb.profession}
              </span>
            </div>
            {celeb.country && (
              <div style={{ fontSize: '12px', color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '14px' }}>{celeb.countryFlag}</span>
                <span>{celeb.country}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div style={{ fontSize: '13px', color: 'var(--text2)', lineHeight: '1.6', marginBottom: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px 12px' }}>
          {celeb.description.slice(0, 220)}{celeb.description.length > 220 ? '…' : ''}
        </div>

        {/* Share section */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text3)', marginBottom: '6px', letterSpacing: '0.8px', textTransform: 'uppercase' }}>Sdílet</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={nativeShare} style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '7px 4px', cursor: 'pointer' }}>
              📤 Sdílet
            </button>
            <button onClick={() => shareVia('twitter')} style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '8px', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '7px 4px', cursor: 'pointer' }}>
              𝕏 Twitter
            </button>
            <button onClick={() => shareVia('whatsapp')} style={{ flex: 1, background: 'rgba(37,211,102,0.12)', border: '1px solid rgba(37,211,102,0.25)', borderRadius: '8px', color: '#25D366', fontSize: '11px', fontWeight: '600', padding: '7px 4px', cursor: 'pointer' }}>
              💬 WhatsApp
            </button>
            <button onClick={copyText} style={{ flex: 1, background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)', border: copied ? '1px solid rgba(34,197,94,0.3)' : '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: copied ? 'var(--green2)' : '#fff', fontSize: '11px', fontWeight: '600', padding: '7px 4px', cursor: 'pointer', transition: 'all 0.2s' }}>
              {copied ? '✓ OK' : '📋 Kopírovat'}
            </button>
          </div>
        </div>

        {/* Wikipedia link */}
        <a href={celeb.url} target="_blank" rel="noopener noreferrer" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.25)',
          borderRadius: '10px', color: 'var(--purple3)', fontSize: '12px', fontWeight: '600',
          padding: '9px', textDecoration: 'none',
        }}>
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
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 10px', borderRadius: '10px',
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'background 0.15s, border-color 0.15s, transform 0.1s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => { const d = e.currentTarget; d.style.background = 'rgba(93,76,255,0.08)'; d.style.borderColor = 'rgba(93,76,255,0.2)'; d.style.transform = 'translateX(2px)'; }}
      onMouseLeave={e => { const d = e.currentTarget; d.style.background = 'rgba(255,255,255,0.02)'; d.style.borderColor = 'rgba(255,255,255,0.05)'; d.style.transform = 'translateX(0)'; }}
    >
      {/* Rank */}
      <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: '6px', background: rank <= 3 ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', color: rank <= 3 ? '#FFB300' : 'var(--text3)' }}>
        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
      </div>

      {/* Photo */}
      {celeb.thumbnail ? (
        <img src={celeb.thumbnail} alt={celeb.name} style={{ width: 42, height: 42, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }} onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
      ) : (
        <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: `${meta.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>{meta.emoji}</div>
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{celeb.name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
          <span style={{ fontSize: '9px', background: `${meta.color}22`, color: meta.color, borderRadius: '4px', padding: '1px 5px', whiteSpace: 'nowrap' }}>{celeb.profession}</span>
          {celeb.countryFlag && <span style={{ fontSize: '11px' }}>{celeb.countryFlag}</span>}
        </div>
      </div>

      {/* Age */}
      <div style={{ flexShrink: 0, textAlign: 'right' }}>
        <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--purple3)', fontFamily: 'Poppins', lineHeight: 1 }}>{celeb.age}</div>
        <div style={{ fontSize: '9px', color: 'var(--text3)', marginTop: '2px' }}>{celeb.year}</div>
      </div>
    </div>
  );
}

/* ── Skeleton ── */
function Skeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} style={{ height: '60px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: `cbShimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
      ))}
      <style>{`@keyframes cbShimmer{0%,100%{opacity:0.4}50%{opacity:0.8}}`}</style>
    </div>
  );
}

/* ── Main component ── */
export default function CelebrityBirthdays() {
  const [celebs,   setCelebs]   = useState<BirthdayCeleb[]>([]);
  const [state,    setState]    = useState<'loading' | 'ok' | 'error'>('loading');
  const [tab,      setTab]      = useState<Category | 'all'>('all');
  const [selected, setSelected] = useState<BirthdayCeleb | null>(null);
  const [locale,   setLocale]   = useState('');
  const [today,    setToday]    = useState('');

  useEffect(() => {
    setLocale(getLocaleCountry());
    const now = new Date();
    setToday(`${now.getDate()}. ${now.toLocaleString('default', { month: 'long' })}`);

    fetch('/api/birthdays')
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then((data: BirthdayCeleb[]) => { setCelebs(data); setState('ok'); })
      .catch(() => setState('error'));
  }, []);

  const filtered = tab === 'all' ? celebs : celebs.filter(c => c.category === tab);
  const localFiltered = filtered.filter(c => matchesLocale(c, locale));

  const tabs: (Category | 'all')[] = ['all', 'film', 'music', 'sport', 'other'];

  const close = useCallback(() => setSelected(null), []);

  return (
    <div className="card" style={{ background: 'rgba(15,20,40,0.92)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--card-radius)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎂</span>
          <div>
            <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', lineHeight: 1.2 }}>Celebrity Birthdays</h2>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>{today}</div>
          </div>
        </div>
        {state === 'ok' && (
          <span style={{ fontSize: '11px', color: 'var(--green2)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '2px 8px' }}>
            {filtered.length} celeb
          </span>
        )}
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '12px', flexWrap: 'wrap' }}>
        {tabs.map(t => {
          const m = CATEGORY_META[t];
          const isActive = tab === t;
          const count = t === 'all' ? celebs.length : celebs.filter(c => c.category === t).length;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '5px 9px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontSize: '11px', fontWeight: isActive ? '700' : '400',
              background: isActive ? `${m.color}22` : 'rgba(255,255,255,0.04)',
              color: isActive ? m.color : 'var(--text3)',
              outline: isActive ? `1px solid ${m.color}55` : 'none',
              display: 'flex', alignItems: 'center', gap: '3px',
              transition: 'all 0.15s',
            }}>
              <span>{m.emoji}</span>
              <span>{m.label}</span>
              {state === 'ok' && <span style={{ fontSize: '9px', opacity: 0.7 }}>({count})</span>}
            </button>
          );
        })}
      </div>

      {state === 'loading' && <Skeleton />}

      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
          <div style={{ fontSize: '13px' }}>Nepodařilo se načíst data</div>
        </div>
      )}

      {state === 'ok' && (
        <>
          {/* From your region */}
          {localFiltered.length > 0 && (
            <div style={{ marginBottom: '14px' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>
                📍 Z vaší oblasti
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(93,76,255,0.05)', border: '1px solid rgba(93,76,255,0.12)', borderRadius: '12px', padding: '7px' }}>
                {localFiltered.slice(0, 5).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
              </div>
            </div>
          )}

          {/* Global list */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '5px' }}>
              🌍 Globální top {Math.min(filtered.length, 15)}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {filtered.slice(0, 15).map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} onClick={() => setSelected(c)} />)}
            </div>
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text3)', fontSize: '13px' }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{CATEGORY_META[tab].emoji}</div>
              Žádné celebrity v této kategorii
            </div>
          )}

          <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
            Zdroj: Wikipedia{process.env.NEXT_PUBLIC_TMDB_KEY ? ' + TMDB' : ''} · {today}
          </div>
        </>
      )}

      {/* Profile popup */}
      {selected && <ProfilePopup celeb={selected} onClose={close} />}

      <style>{`
        @keyframes cbPopIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
