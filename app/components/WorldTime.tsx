'use client';

import { useState, useEffect } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';

const CITIES = [
  { name: 'New York', country: 'USA', tz: 'America/New_York', flag: '🇺🇸', continent: 'Americas' },
  { name: 'Los Angeles', country: 'USA', tz: 'America/Los_Angeles', flag: '🇺🇸', continent: 'Americas' },
  { name: 'Chicago', country: 'USA', tz: 'America/Chicago', flag: '🇺🇸', continent: 'Americas' },
  { name: 'Miami', country: 'USA', tz: 'America/New_York', flag: '🇺🇸', continent: 'Americas' },
  { name: 'Toronto', country: 'Canada', tz: 'America/Toronto', flag: '🇨🇦', continent: 'Americas' },
  { name: 'Mexico City', country: 'Mexico', tz: 'America/Mexico_City', flag: '🇲🇽', continent: 'Americas' },
  { name: 'São Paulo', country: 'Brazil', tz: 'America/Sao_Paulo', flag: '🇧🇷', continent: 'Americas' },
  { name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires', flag: '🇦🇷', continent: 'Americas' },
  { name: 'London', country: 'UK', tz: 'Europe/London', flag: '🇬🇧', continent: 'Europe' },
  { name: 'Paris', country: 'France', tz: 'Europe/Paris', flag: '🇫🇷', continent: 'Europe' },
  { name: 'Berlin', country: 'Germany', tz: 'Europe/Berlin', flag: '🇩🇪', continent: 'Europe' },
  { name: 'Prague', country: 'Czech Rep.', tz: 'Europe/Prague', flag: '🇨🇿', continent: 'Europe' },
  { name: 'Madrid', country: 'Spain', tz: 'Europe/Madrid', flag: '🇪🇸', continent: 'Europe' },
  { name: 'Rome', country: 'Italy', tz: 'Europe/Rome', flag: '🇮🇹', continent: 'Europe' },
  { name: 'Amsterdam', country: 'Netherlands', tz: 'Europe/Amsterdam', flag: '🇳🇱', continent: 'Europe' },
  { name: 'Warsaw', country: 'Poland', tz: 'Europe/Warsaw', flag: '🇵🇱', continent: 'Europe' },
  { name: 'Stockholm', country: 'Sweden', tz: 'Europe/Stockholm', flag: '🇸🇪', continent: 'Europe' },
  { name: 'Athens', country: 'Greece', tz: 'Europe/Athens', flag: '🇬🇷', continent: 'Europe' },
  { name: 'Moscow', country: 'Russia', tz: 'Europe/Moscow', flag: '🇷🇺', continent: 'Europe' },
  { name: 'Istanbul', country: 'Turkey', tz: 'Europe/Istanbul', flag: '🇹🇷', continent: 'Europe' },
  { name: 'Reykjavik', country: 'Iceland', tz: 'Atlantic/Reykjavik', flag: '🇮🇸', continent: 'Europe' },
  { name: 'Tokyo', country: 'Japan', tz: 'Asia/Tokyo', flag: '🇯🇵', continent: 'Asia' },
  { name: 'Beijing', country: 'China', tz: 'Asia/Shanghai', flag: '🇨🇳', continent: 'Asia' },
  { name: 'Seoul', country: 'South Korea', tz: 'Asia/Seoul', flag: '🇰🇷', continent: 'Asia' },
  { name: 'Singapore', country: 'Singapore', tz: 'Asia/Singapore', flag: '🇸🇬', continent: 'Asia' },
  { name: 'Hong Kong', country: 'HK', tz: 'Asia/Hong_Kong', flag: '🇭🇰', continent: 'Asia' },
  { name: 'Bangkok', country: 'Thailand', tz: 'Asia/Bangkok', flag: '🇹🇭', continent: 'Asia' },
  { name: 'Dubai', country: 'UAE', tz: 'Asia/Dubai', flag: '🇦🇪', continent: 'Asia' },
  { name: 'Mumbai', country: 'India', tz: 'Asia/Kolkata', flag: '🇮🇳', continent: 'Asia' },
  { name: 'Riyadh', country: 'Saudi Arabia', tz: 'Asia/Riyadh', flag: '🇸🇦', continent: 'Asia' },
  { name: 'Kuala Lumpur', country: 'Malaysia', tz: 'Asia/Kuala_Lumpur', flag: '🇲🇾', continent: 'Asia' },
  { name: 'Jakarta', country: 'Indonesia', tz: 'Asia/Jakarta', flag: '🇮🇩', continent: 'Asia' },
  { name: 'Taipei', country: 'Taiwan', tz: 'Asia/Taipei', flag: '🇹🇼', continent: 'Asia' },
  { name: 'Sydney', country: 'Australia', tz: 'Australia/Sydney', flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Melbourne', country: 'Australia', tz: 'Australia/Melbourne', flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Auckland', country: 'NZ', tz: 'Pacific/Auckland', flag: '🇳🇿', continent: 'Pacific' },
  { name: 'Johannesburg', country: 'S. Africa', tz: 'Africa/Johannesburg', flag: '🇿🇦', continent: 'Africa' },
  { name: 'Cairo', country: 'Egypt', tz: 'Africa/Cairo', flag: '🇪🇬', continent: 'Africa' },
  { name: 'Lagos', country: 'Nigeria', tz: 'Africa/Lagos', flag: '🇳🇬', continent: 'Africa' },
  { name: 'Nairobi', country: 'Kenya', tz: 'Africa/Nairobi', flag: '🇰🇪', continent: 'Africa' },
];

function getTime(tz: string) {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function getOffsetNum(tz: string) {
  const utc = new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' }));
  const local = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
  return Math.round((local.getTime() - utc.getTime()) / 3600000);
}

function getOffsetLabel(tz: string) {
  const diff = getOffsetNum(tz);
  return (diff >= 0 ? '+' : '') + diff;
}

function isDay(tz: string) {
  const h = parseInt(new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour12: false, hour: '2-digit'
  }));
  return h >= 6 && h < 20;
}

const CONTINENTS = ['All', 'Americas', 'Europe', 'Asia', 'Pacific', 'Africa'];
const SORTS = [
  { label: 'A–Z', value: 'name' },
  { label: 'UTC offset', value: 'offset' },
  { label: 'Continent', value: 'continent' },
];

export default function WorldTime() {
  const { listLimit, isMobile } = useDeviceDetect();
  const [times, setTimes] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('All');
  const [sort, setSort] = useState('offset');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const tick = () => {
      const t: Record<string, string> = {};
      CITIES.forEach(c => { t[c.name] = getTime(c.tz); });
      setTimes(t);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const filtered = CITIES
    .filter(c =>
      (continent === 'All' || c.continent === continent) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'offset') return getOffsetNum(a.tz) - getOffsetNum(b.tz);
      if (sort === 'continent') return a.continent.localeCompare(b.continent);
      return 0;
    });

  const btnStyle = (active: boolean) => ({
    background: active ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    color: active ? '#fff' : 'var(--text3)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div className="card" style={{
      background: 'rgba(15,20,40,0.92)',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 'var(--card-radius)',
      padding: '1.25rem',
      boxShadow: 'var(--card-shadow)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>
          🕐 World Time
        </h2>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{filtered.length} cities</span>
      </div>

      <input
        type="text"
        placeholder="🔍 Search city or country..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          width: '100%',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '10px',
          padding: '8px 14px',
          color: '#fff',
          fontSize: '13px',
          marginBottom: '.75rem',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '.5rem' }}>
        {CONTINENTS.map(c => (
          <button key={c} onClick={() => setContinent(c)} style={btnStyle(continent === c)}>{c}</button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '5px', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '4px' }}>Sort:</span>
        {SORTS.map(s => (
          <button key={s.value} onClick={() => setSort(s.value)} style={btnStyle(sort === s.value)}>{s.label}</button>
        ))}
      </div>

      {/* Collapsed city list on mobile — show all toggle */}
      {isMobile && !showAll && !search && continent === 'All' && filtered.length > listLimit && (
        <div style={{ marginBottom: '.5rem', fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
          Zobrazeno {listLimit} z {filtered.length} měst
        </div>
      )}

      <div>
        {(isMobile && !showAll && !search && continent === 'All'
          ? filtered.slice(0, listLimit)
          : filtered
        ).map(city => (
          <div key={city.name} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 0',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>{city.flag}</span>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {city.name}
                  <span style={{
                    width: '7px', height: '7px', borderRadius: '50%',
                    background: isDay(city.tz) ? '#FFB300' : '#5D4CFF',
                    display: 'inline-block',
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text3)' }}>
                  {city.country} · {city.continent}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--blue2)', fontVariantNumeric: 'tabular-nums' }}>
                {times[city.name] || '--:--:--'}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--text3)' }}>
                UTC{getOffsetLabel(city.tz)}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show all / Show less toggle — mobile only */}
      {isMobile && !search && continent === 'All' && filtered.length > listLimit && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            marginTop: '.75rem',
            width: '100%',
            background: 'rgba(93,76,255,0.12)',
            border: '1px solid rgba(93,76,255,0.3)',
            borderRadius: '10px',
            color: 'var(--purple3)',
            fontSize: '12px',
            fontWeight: '600',
            padding: '8px',
            cursor: 'pointer',
          }}
        >
          {showAll
            ? `Zobrazit méně ↑`
            : `Zobrazit všechna města (${filtered.length}) ↓`}
        </button>
      )}
    </div>
  );
}