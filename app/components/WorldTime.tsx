'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';

type City = {
  name: string;
  country: string;
  tz: string;
  flag: string;
  continent: string;
};

/* ── Default visible cities ── */
const CITIES: City[] = [
  // Americas – USA
  { name: 'New York',     country: 'USA',       tz: 'America/New_York',                    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Los Angeles',  country: 'USA',       tz: 'America/Los_Angeles',                 flag: '🇺🇸', continent: 'Americas' },
  { name: 'Chicago',      country: 'USA',       tz: 'America/Chicago',                     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Miami',        country: 'USA',       tz: 'America/New_York',                    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Atlanta',      country: 'USA',       tz: 'America/New_York',                    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Boston',       country: 'USA',       tz: 'America/New_York',                    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Detroit',      country: 'USA',       tz: 'America/Detroit',                     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Denver',       country: 'USA',       tz: 'America/Denver',                      flag: '🇺🇸', continent: 'Americas' },
  { name: 'Phoenix',      country: 'USA',       tz: 'America/Phoenix',                     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Las Vegas',    country: 'USA',       tz: 'America/Los_Angeles',                 flag: '🇺🇸', continent: 'Americas' },
  { name: 'Seattle',      country: 'USA',       tz: 'America/Los_Angeles',                 flag: '🇺🇸', continent: 'Americas' },
  { name: 'Portland',     country: 'USA',       tz: 'America/Los_Angeles',                 flag: '🇺🇸', continent: 'Americas' },
  { name: 'Honolulu',     country: 'USA',       tz: 'Pacific/Honolulu',                    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Anchorage',    country: 'USA',       tz: 'America/Anchorage',                   flag: '🇺🇸', continent: 'Americas' },
  // Americas – rest
  { name: 'Toronto',      country: 'Canada',    tz: 'America/Toronto',                     flag: '🇨🇦', continent: 'Americas' },
  { name: 'Mexico City',  country: 'Mexico',    tz: 'America/Mexico_City',                 flag: '🇲🇽', continent: 'Americas' },
  { name: 'São Paulo',    country: 'Brazil',    tz: 'America/Sao_Paulo',                   flag: '🇧🇷', continent: 'Americas' },
  { name: 'Buenos Aires', country: 'Argentina', tz: 'America/Argentina/Buenos_Aires',      flag: '🇦🇷', continent: 'Americas' },
  // Europe
  { name: 'London',       country: 'UK',         tz: 'Europe/London',                      flag: '🇬🇧', continent: 'Europe' },
  { name: 'Paris',        country: 'France',     tz: 'Europe/Paris',                       flag: '🇫🇷', continent: 'Europe' },
  { name: 'Berlin',       country: 'Germany',    tz: 'Europe/Berlin',                      flag: '🇩🇪', continent: 'Europe' },
  { name: 'Prague',       country: 'Czech Rep.', tz: 'Europe/Prague',                      flag: '🇨🇿', continent: 'Europe' },
  { name: 'Madrid',       country: 'Spain',      tz: 'Europe/Madrid',                      flag: '🇪🇸', continent: 'Europe' },
  { name: 'Rome',         country: 'Italy',      tz: 'Europe/Rome',                        flag: '🇮🇹', continent: 'Europe' },
  { name: 'Amsterdam',    country: 'Netherlands',tz: 'Europe/Amsterdam',                   flag: '🇳🇱', continent: 'Europe' },
  { name: 'Warsaw',       country: 'Poland',     tz: 'Europe/Warsaw',                      flag: '🇵🇱', continent: 'Europe' },
  { name: 'Stockholm',    country: 'Sweden',     tz: 'Europe/Stockholm',                   flag: '🇸🇪', continent: 'Europe' },
  { name: 'Athens',       country: 'Greece',     tz: 'Europe/Athens',                      flag: '🇬🇷', continent: 'Europe' },
  { name: 'Moscow',       country: 'Russia',     tz: 'Europe/Moscow',                      flag: '🇷🇺', continent: 'Europe' },
  { name: 'Istanbul',     country: 'Turkey',     tz: 'Europe/Istanbul',                    flag: '🇹🇷', continent: 'Europe' },
  { name: 'Reykjavik',    country: 'Iceland',    tz: 'Atlantic/Reykjavik',                 flag: '🇮🇸', continent: 'Europe' },
  // Asia
  { name: 'Tokyo',        country: 'Japan',      tz: 'Asia/Tokyo',                         flag: '🇯🇵', continent: 'Asia' },
  { name: 'Osaka',        country: 'Japan',      tz: 'Asia/Tokyo',                         flag: '🇯🇵', continent: 'Asia' },
  { name: 'Beijing',      country: 'China',      tz: 'Asia/Shanghai',                      flag: '🇨🇳', continent: 'Asia' },
  { name: 'Seoul',        country: 'South Korea',tz: 'Asia/Seoul',                         flag: '🇰🇷', continent: 'Asia' },
  { name: 'Singapore',    country: 'Singapore',  tz: 'Asia/Singapore',                     flag: '🇸🇬', continent: 'Asia' },
  { name: 'Hong Kong',    country: 'HK',         tz: 'Asia/Hong_Kong',                     flag: '🇭🇰', continent: 'Asia' },
  { name: 'Taipei',       country: 'Taiwan',     tz: 'Asia/Taipei',                        flag: '🇹🇼', continent: 'Asia' },
  { name: 'Bangkok',      country: 'Thailand',   tz: 'Asia/Bangkok',                       flag: '🇹🇭', continent: 'Asia' },
  { name: 'Hanoi',        country: 'Vietnam',    tz: 'Asia/Ho_Chi_Minh',                   flag: '🇻🇳', continent: 'Asia' },
  { name: 'Dubai',        country: 'UAE',        tz: 'Asia/Dubai',                         flag: '🇦🇪', continent: 'Asia' },
  { name: 'Mumbai',       country: 'India',      tz: 'Asia/Kolkata',                       flag: '🇮🇳', continent: 'Asia' },
  { name: 'Dhaka',        country: 'Bangladesh', tz: 'Asia/Dhaka',                         flag: '🇧🇩', continent: 'Asia' },
  { name: 'Kathmandu',    country: 'Nepal',      tz: 'Asia/Kathmandu',                     flag: '🇳🇵', continent: 'Asia' },
  { name: 'Colombo',      country: 'Sri Lanka',  tz: 'Asia/Colombo',                       flag: '🇱🇰', continent: 'Asia' },
  { name: 'Tashkent',     country: 'Uzbekistan', tz: 'Asia/Tashkent',                      flag: '🇺🇿', continent: 'Asia' },
  { name: 'Riyadh',       country: 'Saudi Arabia',tz: 'Asia/Riyadh',                       flag: '🇸🇦', continent: 'Asia' },
  { name: 'Kuala Lumpur', country: 'Malaysia',   tz: 'Asia/Kuala_Lumpur',                  flag: '🇲🇾', continent: 'Asia' },
  { name: 'Jakarta',      country: 'Indonesia',  tz: 'Asia/Jakarta',                       flag: '🇮🇩', continent: 'Asia' },
  // Pacific
  { name: 'Sydney',       country: 'Australia',  tz: 'Australia/Sydney',                   flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Melbourne',    country: 'Australia',  tz: 'Australia/Melbourne',                flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Auckland',     country: 'NZ',         tz: 'Pacific/Auckland',                   flag: '🇳🇿', continent: 'Pacific' },
  { name: 'Fiji',         country: 'Fiji',       tz: 'Pacific/Fiji',                       flag: '🇫🇯', continent: 'Pacific' },
  { name: 'Guam',         country: 'Guam',       tz: 'Pacific/Guam',                       flag: '🇬🇺', continent: 'Pacific' },
  { name: 'Apia',         country: 'Samoa',      tz: 'Pacific/Apia',                       flag: '🇼🇸', continent: 'Pacific' },
  // Africa
  { name: 'Johannesburg', country: 'S. Africa',  tz: 'Africa/Johannesburg',                flag: '🇿🇦', continent: 'Africa' },
  { name: 'Cairo',        country: 'Egypt',      tz: 'Africa/Cairo',                       flag: '🇪🇬', continent: 'Africa' },
  { name: 'Lagos',        country: 'Nigeria',    tz: 'Africa/Lagos',                       flag: '🇳🇬', continent: 'Africa' },
  { name: 'Nairobi',      country: 'Kenya',      tz: 'Africa/Nairobi',                     flag: '🇰🇪', continent: 'Africa' },
  { name: 'Dakar',        country: 'Senegal',    tz: 'Africa/Dakar',                       flag: '🇸🇳', continent: 'Africa' },
  { name: 'Casablanca',   country: 'Morocco',    tz: 'Africa/Casablanca',                  flag: '🇲🇦', continent: 'Africa' },
  { name: 'Tunis',        country: 'Tunisia',    tz: 'Africa/Tunis',                       flag: '🇹🇳', continent: 'Africa' },
  { name: 'Accra',        country: 'Ghana',      tz: 'Africa/Accra',                       flag: '🇬🇭', continent: 'Africa' },
  { name: 'Dar es Salaam',country: 'Tanzania',   tz: 'Africa/Dar_es_Salaam',               flag: '🇹🇿', continent: 'Africa' },
];

/* ── Extra cities available only through search/autocomplete ── */
const SEARCH_EXTRA: City[] = [
  { name: 'San Francisco', country: 'USA',        tz: 'America/Los_Angeles', flag: '🇺🇸', continent: 'Americas' },
  { name: 'Washington DC', country: 'USA',        tz: 'America/New_York',    flag: '🇺🇸', continent: 'Americas' },
  { name: 'Dallas',        country: 'USA',        tz: 'America/Chicago',     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Houston',       country: 'USA',        tz: 'America/Chicago',     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Minneapolis',   country: 'USA',        tz: 'America/Chicago',     flag: '🇺🇸', continent: 'Americas' },
  { name: 'Vancouver',     country: 'Canada',     tz: 'America/Vancouver',   flag: '🇨🇦', continent: 'Americas' },
  { name: 'Montreal',      country: 'Canada',     tz: 'America/Toronto',     flag: '🇨🇦', continent: 'Americas' },
  { name: 'Calgary',       country: 'Canada',     tz: 'America/Edmonton',    flag: '🇨🇦', continent: 'Americas' },
  { name: 'Lima',          country: 'Peru',       tz: 'America/Lima',        flag: '🇵🇪', continent: 'Americas' },
  { name: 'Bogotá',        country: 'Colombia',   tz: 'America/Bogota',      flag: '🇨🇴', continent: 'Americas' },
  { name: 'Santiago',      country: 'Chile',      tz: 'America/Santiago',    flag: '🇨🇱', continent: 'Americas' },
  { name: 'Caracas',       country: 'Venezuela',  tz: 'America/Caracas',     flag: '🇻🇪', continent: 'Americas' },
  { name: 'Vienna',        country: 'Austria',    tz: 'Europe/Vienna',       flag: '🇦🇹', continent: 'Europe' },
  { name: 'Zurich',        country: 'Switzerland',tz: 'Europe/Zurich',       flag: '🇨🇭', continent: 'Europe' },
  { name: 'Brussels',      country: 'Belgium',    tz: 'Europe/Brussels',     flag: '🇧🇪', continent: 'Europe' },
  { name: 'Lisbon',        country: 'Portugal',   tz: 'Europe/Lisbon',       flag: '🇵🇹', continent: 'Europe' },
  { name: 'Copenhagen',    country: 'Denmark',    tz: 'Europe/Copenhagen',   flag: '🇩🇰', continent: 'Europe' },
  { name: 'Helsinki',      country: 'Finland',    tz: 'Europe/Helsinki',     flag: '🇫🇮', continent: 'Europe' },
  { name: 'Oslo',          country: 'Norway',     tz: 'Europe/Oslo',         flag: '🇳🇴', continent: 'Europe' },
  { name: 'Kyiv',          country: 'Ukraine',    tz: 'Europe/Kyiv',         flag: '🇺🇦', continent: 'Europe' },
  { name: 'Bucharest',     country: 'Romania',    tz: 'Europe/Bucharest',    flag: '🇷🇴', continent: 'Europe' },
  { name: 'Budapest',      country: 'Hungary',    tz: 'Europe/Budapest',     flag: '🇭🇺', continent: 'Europe' },
  { name: 'Delhi',         country: 'India',      tz: 'Asia/Kolkata',        flag: '🇮🇳', continent: 'Asia' },
  { name: 'Karachi',       country: 'Pakistan',   tz: 'Asia/Karachi',        flag: '🇵🇰', continent: 'Asia' },
  { name: 'Tehran',        country: 'Iran',       tz: 'Asia/Tehran',         flag: '🇮🇷', continent: 'Asia' },
  { name: 'Baghdad',       country: 'Iraq',       tz: 'Asia/Baghdad',        flag: '🇮🇶', continent: 'Asia' },
  { name: 'Kabul',         country: 'Afghanistan',tz: 'Asia/Kabul',          flag: '🇦🇫', continent: 'Asia' },
  { name: 'Manila',        country: 'Philippines',tz: 'Asia/Manila',         flag: '🇵🇭', continent: 'Asia' },
  { name: 'Ho Chi Minh',   country: 'Vietnam',    tz: 'Asia/Ho_Chi_Minh',    flag: '🇻🇳', continent: 'Asia' },
  { name: 'Yangon',        country: 'Myanmar',    tz: 'Asia/Rangoon',        flag: '🇲🇲', continent: 'Asia' },
  { name: 'Addis Ababa',   country: 'Ethiopia',   tz: 'Africa/Addis_Ababa',  flag: '🇪🇹', continent: 'Africa' },
  { name: 'Khartoum',      country: 'Sudan',      tz: 'Africa/Khartoum',     flag: '🇸🇩', continent: 'Africa' },
  { name: 'Kampala',       country: 'Uganda',     tz: 'Africa/Kampala',      flag: '🇺🇬', continent: 'Africa' },
  { name: 'Perth',         country: 'Australia',  tz: 'Australia/Perth',     flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Brisbane',      country: 'Australia',  tz: 'Australia/Brisbane',  flag: '🇦🇺', continent: 'Pacific' },
  { name: 'Port Moresby',  country: 'Papua NG',   tz: 'Pacific/Port_Moresby',flag: '🇵🇬', continent: 'Pacific' },
];

const ALL_CITIES: City[] = [...CITIES, ...SEARCH_EXTRA];

/* ── Time helpers ── */
function getTime(tz: string): string {
  return new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour12: false,
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function getUTCOffsetMin(tz: string): number {
  const now = new Date();
  const utc = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const loc = new Date(now.toLocaleString('en-US', { timeZone: tz }));
  return (loc.getTime() - utc.getTime()) / 60000;
}

function getOffsetLabel(tz: string): string {
  const m = getUTCOffsetMin(tz);
  const sign = m >= 0 ? '+' : '-';
  const absH = Math.floor(Math.abs(m) / 60);
  const absM = Math.abs(m) % 60;
  return `UTC${sign}${absH}${absM ? ':' + String(absM).padStart(2, '0') : ''}`;
}

function formatRelDiff(diffMin: number): { label: string; color: string } {
  if (diffMin === 0) return { label: 'you', color: 'var(--text3)' };
  const sign = diffMin > 0 ? '+' : '-';
  const abs = Math.abs(diffMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const label = m === 0 ? `${sign}${h}h` : `${sign}${h}:${String(m).padStart(2, '0')}h`;
  const color = diffMin > 0 ? '#4ade80' : '#f87171';
  return { label, color };
}

function isDay(tz: string): boolean {
  const h = parseInt(new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour12: false, hour: '2-digit',
  }));
  return h >= 6 && h < 20;
}

const CONTINENTS = ['All', 'Americas', 'Europe', 'Asia', 'Pacific', 'Africa'];
const SORTS = [
  { label: 'A–Z',       value: 'name' },
  { label: 'UTC offset',value: 'offset' },
  { label: 'Continent', value: 'continent' },
];
const MAX_FAV = 3;
const LS_KEY  = 'worldtime_favorites_v2';

export default function WorldTime() {
  const { listLimit, isMobile } = useDeviceDetect();

  const [times,        setTimes]        = useState<Record<string, string>>({});
  const [search,       setSearch]       = useState('');
  const [continent,    setContinent]    = useState('All');
  const [sort,         setSort]         = useState('offset');
  const [showAll,      setShowAll]      = useState(false);
  const [favorites,    setFavorites]    = useState<string[]>([]);
  const [suggestions,  setSuggestions]  = useState<City[]>([]);
  const [showSugg,     setShowSugg]     = useState(false);
  const [userOffMin,   setUserOffMin]   = useState(0);

  const searchWrap = useRef<HTMLDivElement>(null);

  /* Load favorites + user offset on mount */
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved) setFavorites(JSON.parse(saved));
    } catch {}
    setUserOffMin(-new Date().getTimezoneOffset());
  }, []);

  /* 1-second tick */
  useEffect(() => {
    const tick = () => {
      const t: Record<string, string> = {};
      ALL_CITIES.forEach(c => { t[c.name] = getTime(c.tz); });
      setTimes(t);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) {
        setShowSugg(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFavorite = useCallback((name: string) => {
    setFavorites(prev => {
      const next = prev.includes(name)
        ? prev.filter(f => f !== name)
        : prev.length < MAX_FAV ? [...prev, name] : prev;
      try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.length >= 1) {
      const lo = val.toLowerCase();
      const sugg = ALL_CITIES
        .filter(c => c.name.toLowerCase().includes(lo) || c.country.toLowerCase().includes(lo))
        .slice(0, 8);
      setSuggestions(sugg);
      setShowSugg(sugg.length > 0);
    } else {
      setSuggestions([]);
      setShowSugg(false);
    }
  };

  const selectSuggestion = (city: City) => {
    setSearch(city.name);
    setShowSugg(false);
  };

  /* Derived lists */
  const favCities = favorites
    .map(n => ALL_CITIES.find(c => c.name === n))
    .filter((c): c is City => !!c);

  const source = search ? ALL_CITIES : CITIES;
  const filtered = source
    .filter(c =>
      (continent === 'All' || c.continent === continent) &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.country.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      if (sort === 'name')      return a.name.localeCompare(b.name);
      if (sort === 'offset')    return getUTCOffsetMin(a.tz) - getUTCOffsetMin(b.tz);
      if (sort === 'continent') return a.continent.localeCompare(b.continent);
      return 0;
    });

  const displayList = isMobile && !showAll && !search && continent === 'All'
    ? filtered.slice(0, listLimit)
    : filtered;

  /* Style helpers */
  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'linear-gradient(135deg, var(--purple), #7A3FFF)' : 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '4px 12px',
    fontSize: '11px',
    color: active ? '#fff' : 'var(--text3)',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  });

  /* City row renderer */
  const renderRow = (city: City, keyPrefix = '') => {
    const isFav = favorites.includes(city.name);
    const atMax = favorites.length >= MAX_FAV && !isFav;
    const diffMin = getUTCOffsetMin(city.tz) - userOffMin;
    const { label: diffLabel, color: diffColor } = formatRelDiff(diffMin);

    return (
      <div key={`${keyPrefix}${city.name}`} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
      }}>
        {/* Left side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <button
            onClick={() => toggleFavorite(city.name)}
            title={isFav ? 'Remove from My Cities' : atMax ? `Max ${MAX_FAV} favorites` : 'Add to My Cities'}
            style={{
              background: 'none', border: 'none', padding: '0 2px',
              cursor: atMax ? 'not-allowed' : 'pointer',
              fontSize: '13px', flexShrink: 0,
              opacity: atMax ? 0.25 : isFav ? 1 : 0.35,
              filter: isFav ? 'none' : 'grayscale(1)',
              transition: 'opacity 0.15s',
            }}
          >⭐</button>
          <span style={{ fontSize: '18px', flexShrink: 0 }}>{city.flag}</span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '13px', fontWeight: '500', color: '#fff', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{city.name}</span>
              <span style={{
                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                background: isDay(city.tz) ? '#FFB300' : '#5D4CFF',
                display: 'inline-block',
              }} />
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {city.country} · {city.continent}
            </div>
          </div>
        </div>

        {/* Right side */}
        <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--blue2)', fontVariantNumeric: 'tabular-nums' }}>
            {times[city.name] || '--:--:--'}
          </div>
          <div style={{ display: 'flex', gap: '5px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <span style={{ fontSize: '9px', color: 'var(--text3)' }}>{getOffsetLabel(city.tz)}</span>
            <span style={{ fontSize: '10px', fontWeight: '600', color: diffColor }}>{diffLabel}</span>
          </div>
        </div>
      </div>
    );
  };

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
        <h2 style={{ fontSize: '15px', fontFamily: 'Poppins', color: '#fff' }}>🕐 World Time</h2>
        <span style={{ fontSize: '11px', color: 'var(--text3)' }}>{filtered.length} cities</span>
      </div>

      {/* My Cities */}
      {favCities.length > 0 && (
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '10px', color: 'var(--text3)', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            ⭐ My Cities
          </div>
          <div style={{
            background: 'rgba(93,76,255,0.06)',
            border: '1px solid rgba(93,76,255,0.15)',
            borderRadius: '12px', padding: '0 10px',
          }}>
            {favCities.map(c => renderRow(c, 'fav-'))}
          </div>
        </div>
      )}

      {/* Search with autocomplete */}
      <div ref={searchWrap} style={{ position: 'relative', marginBottom: '.75rem' }}>
        <input
          type="text"
          placeholder="🔍 Search city or country..."
          value={search}
          onChange={e => handleSearchChange(e.target.value)}
          onFocus={() => search && suggestions.length > 0 && setShowSugg(true)}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: showSugg ? '10px 10px 0 0' : '10px',
            padding: '8px 14px', color: '#fff', fontSize: '13px', outline: 'none',
          }}
        />
        {showSugg && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50,
            background: 'rgba(18,22,48,0.98)',
            border: '1px solid rgba(255,255,255,0.1)', borderTop: 'none',
            borderRadius: '0 0 10px 10px',
            maxHeight: '240px', overflowY: 'auto',
          }}>
            {suggestions.map(city => (
              <div
                key={city.name}
                onMouseDown={() => selectSuggestion(city)}
                style={{
                  padding: '8px 14px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(93,76,255,0.12)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ fontSize: '16px' }}>{city.flag}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', color: '#fff' }}>{city.name}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text3)' }}>{city.country} · {city.continent}</div>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--blue2)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                  {times[city.name] || getTime(city.tz)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Continent filter */}
      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '.5rem' }}>
        {CONTINENTS.map(c => (
          <button key={c} onClick={() => setContinent(c)} style={btnStyle(continent === c)}>{c}</button>
        ))}
      </div>

      {/* Sort */}
      <div style={{ display: 'flex', gap: '5px', marginBottom: '1rem', alignItems: 'center' }}>
        <span style={{ fontSize: '11px', color: 'var(--text3)', marginRight: '4px' }}>Sort:</span>
        {SORTS.map(s => (
          <button key={s.value} onClick={() => setSort(s.value)} style={btnStyle(sort === s.value)}>{s.label}</button>
        ))}
      </div>

      {isMobile && !showAll && !search && continent === 'All' && filtered.length > listLimit && (
        <div style={{ marginBottom: '.5rem', fontSize: '11px', color: 'var(--text3)', textAlign: 'center' }}>
          Showing {listLimit} of {filtered.length} cities
        </div>
      )}

      {/* City list */}
      <div>
        {displayList.map(city => renderRow(city))}
      </div>

      {isMobile && !search && continent === 'All' && filtered.length > listLimit && (
        <button
          onClick={() => setShowAll(v => !v)}
          style={{
            marginTop: '.75rem', width: '100%',
            background: 'rgba(93,76,255,0.12)', border: '1px solid rgba(93,76,255,0.3)',
            borderRadius: '10px', color: 'var(--purple3)',
            fontSize: '12px', fontWeight: '600', padding: '8px', cursor: 'pointer',
          }}
        >
          {showAll ? 'Show less ↑' : `Show all cities (${filtered.length}) ↓`}
        </button>
      )}
    </div>
  );
}
