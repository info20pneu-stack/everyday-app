'use client';

import { useState, useEffect } from 'react';

interface Celebrity {
  year: number;
  name: string;
  description: string;
  thumbnail?: string;
  url: string;
}

type LoadState = 'loading' | 'ok' | 'error';

/* Detect user's country from locale */
function getLocaleCountry(): string {
  if (typeof navigator === 'undefined') return '';
  const full = navigator.language; // e.g. "cs-CZ", "en-US"
  const parts = full.split('-');
  return parts.length > 1 ? parts[1].toUpperCase() : '';
}

/* Map country code → keywords to match in celebrity descriptions */
const COUNTRY_KEYWORDS: Record<string, string[]> = {
  CZ: ['Czech','Czechoslo','Bohemian','Prague'],
  SK: ['Slovak','Czechoslov'],
  DE: ['German','Bavaria','Berlin','Hamburg'],
  AT: ['Austrian','Vienna','Austria'],
  FR: ['French','France','Paris'],
  ES: ['Spanish','Spain'],
  IT: ['Italian','Italy'],
  PL: ['Polish','Poland'],
  RU: ['Russian','Russia','Soviet'],
  US: ['American','United States'],
  GB: ['British','English','Scottish','Welsh','London'],
  JP: ['Japanese','Japan'],
  CN: ['Chinese','China'],
  KR: ['Korean','Korea'],
  BR: ['Brazilian','Brazil'],
  IN: ['Indian','India'],
};

function matchesCountry(description: string, country: string): boolean {
  const keywords = COUNTRY_KEYWORDS[country] ?? [];
  if (!keywords.length) return false;
  const lower = description.toLowerCase();
  return keywords.some(k => lower.includes(k.toLowerCase()));
}

function CelebCard({ celeb, rank }: { celeb: Celebrity; rank: number }) {
  const age = new Date().getFullYear() - celeb.year;
  return (
    <a href={celeb.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '8px 10px', borderRadius: '10px',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          transition: 'background 0.15s, border-color 0.15s',
          cursor: 'pointer',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(93,76,255,0.08)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(93,76,255,0.2)';
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.02)';
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.05)';
        }}
      >
        {/* Rank */}
        <div style={{
          flexShrink: 0, width: 22, height: 22, borderRadius: '6px',
          background: rank <= 3 ? 'rgba(255,179,0,0.15)' : 'rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: '700',
          color: rank <= 3 ? '#FFB300' : 'var(--text3)',
        }}>
          {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
        </div>

        {/* Photo */}
        {celeb.thumbnail ? (
          <img
            src={celeb.thumbnail} alt={celeb.name}
            style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}
            onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <div style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, background: 'rgba(93,76,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            🎂
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {celeb.name}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {celeb.description}
          </div>
        </div>

        {/* Age */}
        <div style={{ flexShrink: 0, textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--purple3)', fontFamily: 'Poppins' }}>{age}</div>
          <div style={{ fontSize: '9px', color: 'var(--text3)' }}>{celeb.year}</div>
        </div>
      </div>
    </a>
  );
}

export default function CelebrityBirthdays() {
  const [global15,  setGlobal15]  = useState<Celebrity[]>([]);
  const [local5,    setLocal5]    = useState<Celebrity[]>([]);
  const [state,     setState]     = useState<LoadState>('loading');
  const [country,   setCountry]   = useState('');
  const [today,     setToday]     = useState('');

  useEffect(() => {
    const c = getLocaleCountry();
    setCountry(c);

    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    setToday(`${dd}. ${now.toLocaleString('default', { month: 'long' })}`);

    const url = `https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`;

    fetch(url, { headers: { 'Api-User-Agent': 'EverydayApp/1.0 (everyday1234567.com)' } })
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data: { births?: Array<{ year: number; text: string; pages?: Array<{ title: string; extract?: string; thumbnail?: { source: string }; content_urls?: { desktop?: { page: string } } }> }> }) => {
        const births = data.births ?? [];

        const celebs: Celebrity[] = births
          .filter(b => b.pages && b.pages.length > 0)
          .map(b => {
            const page = b.pages![0];
            return {
              year: b.year,
              name: page.title,
              description: (b.text || page.extract || '').slice(0, 100),
              thumbnail: page.thumbnail?.source,
              url: page.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
            };
          })
          .filter(c => c.year >= 1900)  // filter historical
          .sort((a, b) => b.year - a.year); // newest first

        setGlobal15(celebs.slice(0, 15));
        if (c) {
          const filtered = celebs.filter(cel => matchesCountry(cel.description, c));
          setLocal5(filtered.slice(0, 5));
        }
        setState('ok');
      })
      .catch(() => setState('error'));
  }, []);

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🎂</span>
          <div>
            <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff', lineHeight: 1.2 }}>
              Celebrity Birthdays
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--text3)' }}>Today · {today}</div>
          </div>
        </div>
        {state === 'ok' && (
          <span style={{ fontSize: '11px', color: 'var(--green2)', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '2px 8px' }}>
            {global15.length} found
          </span>
        )}
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} style={{ height: '58px', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', animation: `shimmer 1.4s ease-in-out ${i * 0.1}s infinite` }} />
          ))}
          <style>{`@keyframes shimmer{0%,100%{opacity:0.5}50%{opacity:1}}`}</style>
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--text3)' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>📡</div>
          <div style={{ fontSize: '13px' }}>Nepodařilo se načíst data</div>
          <div style={{ fontSize: '11px', marginTop: '4px' }}>Zkontrolujte připojení</div>
        </div>
      )}

      {/* Data */}
      {state === 'ok' && (
        <>
          {/* Local section */}
          {local5.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
                📍 From Your Region
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: 'rgba(93,76,255,0.04)', border: '1px solid rgba(93,76,255,0.1)', borderRadius: '12px', padding: '8px' }}>
                {local5.map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} />)}
              </div>
            </div>
          )}

          {/* Global top 15 */}
          <div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '6px' }}>
              🌍 Global Top {global15.length}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {global15.map((c, i) => <CelebCard key={c.name} celeb={c} rank={i + 1} />)}
            </div>
          </div>

          <div style={{ marginTop: '10px', fontSize: '10px', color: 'var(--text3)', textAlign: 'center' }}>
            Zdroj: Wikipedia · {today}
          </div>
        </>
      )}
    </div>
  );
}
