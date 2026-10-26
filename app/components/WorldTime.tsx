'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDeviceDetect } from '../../lib/hooks/useDeviceDetect';
import { useLang } from '../../lib/LanguageContext';
import FlagText from './FlagText';
import { fmtNumber, fmtUnit } from '../../lib/formatNumber';
import { localizedCity } from '../../lib/cityNames';
import { countryNameFromFlag } from '../../lib/flags';
import { myDaySet, useMyDayRaw } from '../../lib/myDay';
import { useIsClient } from '../../lib/games/useIsClient';
import { toolStrings } from '../../lib/toolsI18n';
import ToolFrame, { ToolButton, ToolHero } from './tools/ToolFrame';

export type City = {
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

export const ALL_CITIES: City[] = [...CITIES, ...SEARCH_EXTRA];
export const WORLDTIME_FAVORITES_KEY = 'worldtime_favorites_v2';

/* ── Time helpers ── */
function getTime(tz: string, lang = 'en-GB'): string {
  return new Date().toLocaleTimeString(lang, {
    timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit',
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

function minutesToHHMM(totalMin: number): string {
  const m = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function formatRelDiff(diffMin: number, you: string, lang: string): { label: string; color: string } {
  if (diffMin === 0) return { label: you, color: 'var(--text3)' };
  const sign = diffMin > 0 ? '+' : '−';
  const abs = Math.abs(diffMin);
  const h = Math.floor(abs / 60);
  const m = abs % 60;
  const label = m === 0
    ? `${sign}${fmtUnit(h, 'hour', lang, 'narrow')}`
    : `${sign}${fmtUnit(h, 'hour', lang, 'narrow')} ${fmtUnit(m, 'minute', lang, 'narrow')}`;
  const color = diffMin > 0 ? '#4ade80' : '#f87171';
  return { label, color };
}

function isDay(tz: string): boolean {
  const h = parseInt(new Date().toLocaleTimeString('en-US', {
    timeZone: tz, hour12: false, hour: '2-digit',
  }));
  return h >= 6 && h < 20;
}

const CONTINENTS = ['All', 'Americas', 'Europe', 'Asia', 'Pacific', 'Africa'] as const;
const CONTINENT_KEY = { Americas: 'contAmericas', Europe: 'contEurope', Asia: 'contAsia', Pacific: 'contPacific', Africa: 'contAfrica' } as const;
/** Capital first letter only (not every word). */
function capFirst(s: string, lang: string): string {
  return s.charAt(0).toLocaleUpperCase(lang) + s.slice(1);
}

const MAX_FAV = 3;
const LS_KEY  = WORLDTIME_FAVORITES_KEY;

export default function WorldTime() {
  const { listLimit, isMobile } = useDeviceDetect();
  const { t, lang } = useLang();
  const st = toolStrings(lang);
  const w = t.worldTime;

  const [times,        setTimes]        = useState<Record<string, string>>({});
  const [search,       setSearch]       = useState('');
  const [continent,    setContinent]    = useState<string>('All');
  const [sort,         setSort]         = useState('offset');
  const [showAll,      setShowAll]      = useState(false);
  const [suggestions,  setSuggestions]  = useState<City[]>([]);
  const [showSugg,     setShowSugg]     = useState(false);
  const [userOffMin,   setUserOffMin]   = useState(0);
  const [heroName,     setHeroName]     = useState<string | null>(null);
  const [plannerMin,   setPlannerMin]   = useState(() => {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  });
  const favRaw = useMyDayRaw(LS_KEY);
  const favorites = useMemo<string[]>(() => { try { return favRaw ? JSON.parse(favRaw) : []; } catch { return []; } }, [favRaw]);

  const searchWrap = useRef<HTMLDivElement>(null);

  /* User offset + the city of the user's own time zone on mount */
  useEffect(() => {
    setUserOffMin(-new Date().getTimezoneOffset());
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    setHeroName((ALL_CITIES.find(c => c.tz === tz) ?? ALL_CITIES.find(c => c.name === 'London'))!.name);
  }, []);

  /* 1-second tick */
  useEffect(() => {
    const tick = () => {
      const next: Record<string, string> = {};
      ALL_CITIES.forEach(c => { next[c.name] = getTime(c.tz, lang); });
      setTimes(next);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lang]);

  /* Close dropdown on outside click */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchWrap.current && !searchWrap.current.contains(e.target as Node)) setShowSugg(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleFavorite = useCallback((name: string) => {
    const next = favorites.includes(name)
      ? favorites.filter(f => f !== name)
      : favorites.length < MAX_FAV ? [...favorites, name] : favorites;
    myDaySet(LS_KEY, next);
  }, [favorites]);

  const cityName = (c: City) => localizedCity(c.name, lang);
  // Intl names differ between Node's and the browser's ICU, so they appear after hydration
  const isClient = useIsClient();
  const countryName = (c: City) => isClient ? countryNameFromFlag(c.flag, c.country, lang) : c.country;
  const contName = (c: string) => c === 'All' ? w.allContinents : st[CONTINENT_KEY[c as keyof typeof CONTINENT_KEY]];
  const matches = (c: City, q: string) => {
    const lo = q.toLocaleLowerCase(lang);
    return [c.name, c.country, cityName(c), countryName(c)].some(x => x.toLocaleLowerCase(lang).includes(lo));
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    if (val.length >= 1) {
      const sugg = ALL_CITIES.filter(c => matches(c, val)).slice(0, 8);
      setSuggestions(sugg);
      setShowSugg(sugg.length > 0);
    } else {
      setSuggestions([]);
      setShowSugg(false);
    }
  };

  const selectSuggestion = (city: City) => {
    setSearch('');
    setShowSugg(false);
    setHeroName(city.name);
  };

  /* Derived lists */
  const favCities = favorites
    .map(n => ALL_CITIES.find(c => c.name === n))
    .filter((c): c is City => !!c);

  const source = search ? ALL_CITIES : CITIES;
  const filtered = source
    .filter(c => (continent === 'All' || c.continent === continent) && (!search || matches(c, search)))
    .sort((a, b) => {
      if (sort === 'name')      return cityName(a).localeCompare(cityName(b), lang);
      if (sort === 'offset')    return getUTCOffsetMin(a.tz) - getUTCOffsetMin(b.tz);
      if (sort === 'continent') return a.continent.localeCompare(b.continent);
      return 0;
    });

  const displayList = isMobile && !showAll && !search && continent === 'All'
    ? filtered.slice(0, listLimit)
    : filtered;

  const hero = heroName ? ALL_CITIES.find(c => c.name === heroName) ?? null : null;
  const heroSaved = !!hero && favorites.includes(hero.name);
  const heroFull = favorites.length >= MAX_FAV && !heroSaved;

  /* City row renderer */
  const renderRow = (city: City, keyPrefix = '') => {
    const isFav = favorites.includes(city.name);
    const atMax = favorites.length >= MAX_FAV && !isFav;
    const diffMin = getUTCOffsetMin(city.tz) - userOffMin;
    const { label: diffLabel, color: diffColor } = formatRelDiff(diffMin, w.youLabel, lang);

    return (
      <div key={`${keyPrefix}${city.name}`} className={`wt-row${city.name === heroName ? ' is-hero' : ''}`}>
        <button type="button" className="wt-star" onClick={() => toggleFavorite(city.name)} disabled={atMax}
          aria-pressed={isFav}
          title={isFav ? w.removeFavorite : atMax ? w.maxFavorites.replace('{n}', String(MAX_FAV)) : w.addFavorite}
          style={{ opacity: atMax ? 0.25 : isFav ? 1 : 0.4, filter: isFav ? 'none' : 'grayscale(1)' }}>⭐</button>
        <button type="button" className="wt-pick" onClick={() => setHeroName(city.name)}>
          <span className="wt-flag"><FlagText text={city.flag} size={22} /></span>
          <span className="wt-names">
            <span className="wt-city">{cityName(city)}<i style={{ background: isDay(city.tz) ? '#FFB300' : '#5D4CFF' }} /></span>
            <span className="wt-country">{countryName(city)} · {contName(city.continent)}</span>
          </span>
        </button>
        <span className="wt-time">
          <b dir="ltr">{times[city.name] || '--:--:--'}</b>
          <span><span dir="ltr">{getOffsetLabel(city.tz)}</span> <span style={{ color: diffColor }} dir="ltr">{diffLabel}</span></span>
        </span>
      </div>
    );
  };

  return (
    <ToolFrame
      toolId="cas"
      myDay={hero && !heroFull ? { saved: heroSaved, onSave: () => toggleFavorite(hero.name) } : undefined}
    >
      {hero ? (
        <ToolHero
          label={<span className="wt-hero-label"><FlagText text={hero.flag} size={18} /> {cityName(hero)} · {countryName(hero)}</span>}
          value={<span dir="ltr">{times[hero.name] || getTime(hero.tz, lang)}</span>}
          sub={<>
            <span>{capFirst(new Date().toLocaleDateString(lang, { timeZone: hero.tz, weekday: 'long', day: 'numeric', month: 'long' }), lang)}</span>
            {' · '}<span dir="ltr">{getOffsetLabel(hero.tz)}</span>
          </>}
        />
      ) : <div className="wt-skel" />}

      {favCities.length > 0 && (
        <div className="tf-panel">
          <div className="tf-label">⭐ {w.myCities}</div>
          {favCities.map(c => renderRow(c, 'fav-'))}

          <div className="tf-label" style={{ marginTop: 6 }}>{w.meetingPlanner}</div>
          <div className="wt-planner-top">
            <span>{w.myTime}</span>
            <b dir="ltr">{minutesToHHMM(plannerMin)}</b>
          </div>
          <input type="range" min={0} max={1439} step={15} value={plannerMin}
            onChange={e => setPlannerMin(Number(e.target.value))} className="wt-range" aria-label={w.myTime} />
          {favCities.map(c => {
            const total = plannerMin + getUTCOffsetMin(c.tz) - userOffMin;
            const dayOffset = Math.floor(total / 1440);
            return (
              <div key={c.name} className="wt-plan-row">
                <FlagText text={c.flag} size={16} />
                <span style={{ flex: 1 }}>{cityName(c)}</span>
                <b dir="ltr">{minutesToHHMM(total)}</b>
                {dayOffset !== 0 && <span className="wt-dayoff" dir="ltr">{dayOffset > 0 ? '+' : '−'}{fmtUnit(1, 'day', lang, 'narrow')}</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="tf-panel">
        <div ref={searchWrap} style={{ position: 'relative' }}>
          <input type="search" className="tf-input" placeholder={w.searchPlaceholder} value={search}
            onChange={e => handleSearchChange(e.target.value)}
            onFocus={() => search && suggestions.length > 0 && setShowSugg(true)} />
          {showSugg && (
            <div className="wt-sugg">
              {suggestions.map(city => (
                <button key={city.name} type="button" onMouseDown={() => selectSuggestion(city)}>
                  <FlagText text={city.flag} size={20} />
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span className="wt-city">{cityName(city)}</span>
                    <span className="wt-country">{countryName(city)} · {contName(city.continent)}</span>
                  </span>
                  <span className="wt-sugg-time" dir="ltr">{times[city.name] || getTime(city.tz, lang)}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tf-chips">
          {CONTINENTS.map(c => (
            <button key={c} type="button" className={`tf-chip${continent === c ? ' is-on' : ''}`} aria-pressed={continent === c} onClick={() => setContinent(c)}>{contName(c)}</button>
          ))}
        </div>
        <div className="tf-chips" style={{ alignItems: 'center' }}>
          <span className="tf-label">{w.sort}</span>
          {([['name', w.sortAZ], ['offset', w.sortOffset], ['continent', w.sortContinent]] as const).map(([v, l]) => (
            <button key={v} type="button" className={`tf-chip${sort === v ? ' is-on' : ''}`} aria-pressed={sort === v} onClick={() => setSort(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="tf-panel">
        <div className="tf-label">🌍 {fmtNumber(filtered.length, lang)} {w.cities}</div>
        {isMobile && !showAll && !search && continent === 'All' && filtered.length > listLimit && (
          <div className="tf-note">{w.showingOf.replace('{n}', fmtNumber(listLimit, lang)).replace('{total}', fmtNumber(filtered.length, lang))}</div>
        )}
        {displayList.map(city => renderRow(city))}
      </div>

      {isMobile && !search && continent === 'All' && filtered.length > listLimit && (
        <ToolButton ghost onClick={() => setShowAll(v => !v)}>
          {showAll ? w.showLess : w.showAll.replace('{n}', fmtNumber(filtered.length, lang))}
        </ToolButton>
      )}

      <style>{`
        .wt-skel { height: 170px; border-radius: 22px; background: rgba(255,255,255,0.04); }
        .wt-hero-label { display: inline-flex; align-items: center; gap: 8px; }
        .wt-row { display: flex; align-items: center; gap: 6px; padding: 8px 6px; border-radius: 12px; border-bottom: 1px solid rgba(255,255,255,.04); }
        .wt-row.is-hero { background: color-mix(in srgb, var(--tc) 14%, transparent); }
        .wt-star { background: none; border: 0; padding: 0 2px; cursor: pointer; font-size: 14px; flex-shrink: 0; }
        .wt-star:disabled { cursor: not-allowed; }
        .wt-pick { flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; background: none; border: 0; padding: 0; color: inherit; font: inherit; text-align: start; cursor: pointer; }
        .wt-flag { display: inline-flex; flex-shrink: 0; }
        .wt-names { min-width: 0; display: flex; flex-direction: column; }
        .wt-city { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wt-city i { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
        .wt-country { display: block; font-size: 12px; color: var(--tf-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .wt-time { flex-shrink: 0; text-align: end; display: flex; flex-direction: column; align-items: flex-end; }
        .wt-time b { font-size: 15px; color: #A5B4FC; font-variant-numeric: tabular-nums; }
        .wt-time > span { font-size: 11px; color: var(--tf-dim); }
        .wt-planner-top { display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--tf-dim); }
        .wt-planner-top b { font-size: 18px; color: #fff; font-variant-numeric: tabular-nums; }
        .wt-range { width: 100%; accent-color: var(--tc); }
        .wt-plan-row { display: flex; align-items: center; gap: 8px; font-size: 13px; }
        .wt-plan-row b { color: #C7D2FE; font-variant-numeric: tabular-nums; }
        .wt-dayoff { font-size: 11px; color: var(--tf-dim); }
        .wt-sugg {
          position: absolute; top: calc(100% + 4px); inset-inline: 0; z-index: 50; max-height: 260px; overflow-y: auto;
          border-radius: 12px; background: #121640; border: 1px solid rgba(139,92,246,.35); box-shadow: 0 16px 40px rgba(0,0,0,.5);
        }
        .wt-sugg button { display: flex; align-items: center; gap: 8px; width: 100%; padding: 9px 12px; background: none; border: 0; border-bottom: 1px solid rgba(255,255,255,.04); color: inherit; font: inherit; text-align: start; cursor: pointer; }
        .wt-sugg button:hover { background: rgba(139,92,246,.16); }
        .wt-sugg-time { font-size: 12px; color: #A5B4FC; font-variant-numeric: tabular-nums; }
      `}</style>
    </ToolFrame>
  );
}
