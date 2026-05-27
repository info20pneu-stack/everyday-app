'use client';

import { useState, useEffect } from 'react';

type IPData = {
  ip: string;
  city: string;
  region: string;
  country_name: string;
  country_code: string;
  postal: string;
  latitude: number;
  longitude: number;
  org: string;
  timezone: string;
  utc_offset: string;
  asn: string;
};

type State = 'loading' | 'ok' | 'error';

const card: React.CSSProperties = {
  background: 'rgba(15,20,40,0.92)',
  border: '1px solid rgba(255,255,255,0.05)',
  borderRadius: 'var(--card-radius)',
  boxShadow: 'var(--card-shadow)',
  padding: '1.25rem',
  display: 'flex',
  flexDirection: 'column',
  gap: '1.25rem',
};

const label: React.CSSProperties = {
  color: 'var(--text3)',
  fontSize: '0.7rem',
  textTransform: 'uppercase',
  letterSpacing: '1px',
  marginBottom: '2px',
};

const value: React.CSSProperties = {
  color: 'var(--text1)',
  fontSize: '0.95rem',
  fontWeight: 500,
};

function Row({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        background: 'rgba(93,76,255,0.12)',
        border: '1px solid rgba(93,76,255,0.2)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1rem',
      }}>
        {icon}
      </div>
      <div>
        <div style={label}>{title}</div>
        <div style={value}>{children}</div>
      </div>
    </div>
  );
}

function flagEmoji(countryCode: string): string {
  return countryCode.toUpperCase().split('').map(c =>
    String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}

function parseOrg(org: string): { isp: string; asn: string } {
  const m = org.match(/^(AS\d+)\s+(.+)$/);
  if (m) return { asn: m[1], isp: m[2] };
  return { asn: '—', isp: org };
}

function utcLabel(offset: string): string {
  if (!offset) return '';
  const sign = offset.startsWith('-') ? '-' : '+';
  const abs = offset.replace(/[+-]/, '');
  const h = abs.slice(0, 2);
  const m = abs.slice(2);
  return `UTC${sign}${parseInt(h)}${m !== '00' ? ':' + m : ''}`;
}

export default function IPAddress() {
  const [state, setState] = useState<State>('loading');
  const [data, setData] = useState<IPData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then((d: IPData) => { setData(d); setState('ok'); })
      .catch(() => setState('error'));
  }, []);

  function copyIP() {
    if (!data) return;
    navigator.clipboard.writeText(data.ip).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  return (
    <div className="card" style={card}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>🌐</span>
          <span style={{ color: 'var(--text1)', fontWeight: 600, fontSize: '1rem' }}>IP Adresa</span>
        </div>
        {state === 'ok' && data && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            background: 'rgba(93,76,255,0.08)',
            border: '1px solid rgba(93,76,255,0.18)',
            borderRadius: 8, padding: '0.25rem 0.6rem',
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%',
              background: 'var(--green)', display: 'inline-block',
              boxShadow: '0 0 6px var(--green)',
            }} />
            <span style={{ color: 'var(--text2)', fontSize: '0.75rem' }}>Online</span>
          </div>
        )}
      </div>

      {/* Loading */}
      {state === 'loading' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[100, 70, 85, 60].map((w, i) => (
            <div key={i} style={{
              height: 36, borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              width: w + '%',
              animation: 'shimmer 1.4s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Error */}
      {state === 'error' && (
        <div style={{
          textAlign: 'center', color: 'var(--text3)', fontSize: '0.9rem',
          padding: '1rem 0',
        }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚠️</div>
          Nepodařilo se načíst IP data.<br />
          <span style={{ fontSize: '0.8rem' }}>Zkontrolujte připojení k internetu.</span>
        </div>
      )}

      {/* Data */}
      {state === 'ok' && data && (() => {
        const { isp, asn } = parseOrg(data.org);
        return (
          <>
            {/* Big IP */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(93,76,255,0.12), rgba(93,76,255,0.04))',
              border: '1px solid rgba(93,76,255,0.2)',
              borderRadius: 14,
              padding: '1rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
            }}>
              <div>
                <div style={label}>Vaše IP adresa</div>
                <div style={{
                  fontFamily: 'monospace',
                  fontSize: '1.4rem',
                  fontWeight: 700,
                  color: 'var(--purple3)',
                  letterSpacing: '1px',
                }}>
                  {data.ip}
                </div>
              </div>
              <button
                onClick={copyIP}
                title="Kopírovat"
                style={{
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(93,76,255,0.15)',
                  border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : 'rgba(93,76,255,0.3)'}`,
                  borderRadius: 8,
                  color: copied ? 'var(--green)' : 'var(--purple3)',
                  cursor: 'pointer',
                  padding: '0.4rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 500,
                  transition: 'all 0.2s',
                  whiteSpace: 'nowrap',
                }}
              >
                {copied ? '✓ Zkopírováno' : '⎘ Kopírovat'}
              </button>
            </div>

            {/* Location */}
            <Row icon="📍" title="Lokace">
              {flagEmoji(data.country_code)}{' '}
              {[data.city, data.region, data.country_name].filter(Boolean).join(', ')}
              {data.postal && (
                <span style={{ color: 'var(--text3)', fontSize: '0.85rem' }}> · PSČ {data.postal}</span>
              )}
            </Row>

            {/* ISP */}
            <Row icon="🏢" title="Poskytovatel (ISP)">
              {isp}
              <span style={{ color: 'var(--text3)', fontSize: '0.8rem', marginLeft: '0.5rem' }}>{asn}</span>
            </Row>

            {/* Timezone */}
            <Row icon="🕐" title="Časové pásmo">
              {data.timezone}
              <span style={{
                marginLeft: '0.5rem',
                background: 'rgba(93,76,255,0.12)',
                border: '1px solid rgba(93,76,255,0.2)',
                borderRadius: 5,
                padding: '1px 6px',
                fontSize: '0.78rem',
                color: 'var(--purple3)',
              }}>
                {utcLabel(data.utc_offset)}
              </span>
            </Row>

            {/* Coordinates */}
            <Row icon="🗺️" title="Souřadnice">
              <span style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>
                {data.latitude.toFixed(4)}° N, {data.longitude.toFixed(4)}° E
              </span>
            </Row>
          </>
        );
      })()}
    </div>
  );
}
