'use client';

import { useState, useEffect } from 'react';
import { useLang } from '../../lib/LanguageContext';
import Flag from './Flag';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolCard, ToolCards, ToolHero } from './tools/ToolFrame';

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

// The Row icon box already shows the emoji, so strip the translation's own
// leading emoji (all t.ipAddress row titles follow "<emoji> Text").
function stripLeadingEmoji(s: string): string {
  return s.slice(s.indexOf(' ') + 1);
}

/** Country name in the UI language. */
function countryName(code: string, lang: string, fallback: string): string {
  try { return new Intl.DisplayNames([lang], { type: 'region' }).of(code.toUpperCase()) ?? fallback; } catch { return fallback; }
}

/** Time zone name in the UI language ("středoevropský čas"), else the IANA id. */
function zoneName(tz: string, lang: string): string {
  try {
    return new Intl.DateTimeFormat(lang, { timeZone: tz, timeZoneName: 'longGeneric' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? tz;
  } catch { return tz; }
}

export default function IPAddress() {
  const { t, lang } = useLang();
  const s = toolStrings(lang);
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

  const coord = (n: number) => `${new Intl.NumberFormat(lang, { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(n)}°`;

  return (
    <ToolFrame toolId="ip">
      {state === 'loading' && <div className="ip-skeleton" />}

      {state === 'error' && (
        <div className="tf-panel" style={{ alignItems: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 32 }}>⚠️</div>
          <div>{t.ipAddress.failedToLoad}</div>
          <div className="tf-note">{t.ipAddress.checkConnection}</div>
        </div>
      )}

      {state === 'ok' && data && (() => {
        const { isp, asn } = parseOrg(data.org);
        return (
          <>
            <ToolHero
              label={t.ipAddress.yourIP}
              value={<span className="ip-addr" dir="ltr" translate="no">{data.ip}</span>}
              sub={<span className="ip-online"><i />{t.ipAddress.online}</span>}
            />

            <ToolCards>
              <ToolCard wide icon="📍" color="#0EA5E9" label={stripLeadingEmoji(t.ipAddress.location)}
                value={
                  <span className="ip-loc">
                    {data.country_code && <Flag code={data.country_code} size={20} />}
                    {[data.city, data.region, data.country_code ? countryName(data.country_code, lang, data.country_name) : data.country_name].filter(Boolean).join(', ')}
                  </span>
                }
                sub={data.postal ? `${s.postal} ${data.postal}` : undefined}
              />
              <ToolCard icon="🏢" color="#8B5CF6" label={stripLeadingEmoji(t.ipAddress.isp)} value={isp}
                sub={<span dir="ltr">{asn}</span>} />
              <ToolCard icon="🕐" color="#F59E0B" label={stripLeadingEmoji(t.ipAddress.timezone)}
                value={zoneName(data.timezone, lang)} sub={<span dir="ltr">{data.timezone} · {utcLabel(data.utc_offset)}</span>} />
              <ToolCard wide icon="🗺️" color="#22C55E" label={stripLeadingEmoji(t.ipAddress.coordinates)}
                value={<span dir="ltr">{coord(data.latitude)}, {coord(data.longitude)}</span>} />
            </ToolCards>

            <ToolButton onClick={copyIP}>{copied ? t.ipAddress.copied : t.ipAddress.copy}</ToolButton>
          </>
        );
      })()}

      <style>{`
        .ip-addr { display: block; font: 800 clamp(28px, 9vw, 44px)/1.15 ui-monospace, Menlo, monospace; letter-spacing: .02em; word-break: break-all; }
        .ip-online { display: inline-flex; align-items: center; gap: 6px; color: #86EFAC; }
        .ip-online i { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 8px #22C55E; }
        .ip-loc { display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap; }
        .ip-skeleton { height: 160px; border-radius: 22px; background: rgba(255,255,255,0.04); animation: shimmer 1.4s ease-in-out infinite; }
        @keyframes shimmer { 0%, 100% { opacity: .6; } 50% { opacity: 1; } }
      `}</style>
    </ToolFrame>
  );
}
