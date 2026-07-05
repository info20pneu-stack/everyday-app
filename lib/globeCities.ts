export type GlobeCity = {
  name: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  tz: string;
};

export const GLOBE_CITIES: GlobeCity[] = [
  { name: 'New York',      country: 'USA',           flag: '🇺🇸', lat: 40.7128,  lng: -74.0060,  tz: 'America/New_York' },
  { name: 'Los Angeles',   country: 'USA',           flag: '🇺🇸', lat: 34.0522,  lng: -118.2437, tz: 'America/Los_Angeles' },
  { name: 'Toronto',       country: 'Canada',        flag: '🇨🇦', lat: 43.6532,  lng: -79.3832,  tz: 'America/Toronto' },
  { name: 'Mexico City',   country: 'Mexico',        flag: '🇲🇽', lat: 19.4326,  lng: -99.1332,  tz: 'America/Mexico_City' },
  { name: 'São Paulo',     country: 'Brazil',        flag: '🇧🇷', lat: -23.5505, lng: -46.6333,  tz: 'America/Sao_Paulo' },
  { name: 'London',        country: 'UK',            flag: '🇬🇧', lat: 51.5074,  lng: -0.1278,   tz: 'Europe/London' },
  { name: 'Paris',         country: 'France',        flag: '🇫🇷', lat: 48.8566,  lng: 2.3522,    tz: 'Europe/Paris' },
  { name: 'Berlin',        country: 'Germany',       flag: '🇩🇪', lat: 52.5200,  lng: 13.4050,   tz: 'Europe/Berlin' },
  { name: 'Moscow',        country: 'Russia',        flag: '🇷🇺', lat: 55.7558,  lng: 37.6173,   tz: 'Europe/Moscow' },
  { name: 'Cairo',         country: 'Egypt',         flag: '🇪🇬', lat: 30.0444,  lng: 31.2357,   tz: 'Africa/Cairo' },
  { name: 'Johannesburg',  country: 'South Africa',  flag: '🇿🇦', lat: -26.2041, lng: 28.0473,   tz: 'Africa/Johannesburg' },
  { name: 'Dubai',         country: 'UAE',           flag: '🇦🇪', lat: 25.2048,  lng: 55.2708,   tz: 'Asia/Dubai' },
  { name: 'Mumbai',        country: 'India',         flag: '🇮🇳', lat: 19.0760,  lng: 72.8777,   tz: 'Asia/Kolkata' },
  { name: 'Beijing',       country: 'China',         flag: '🇨🇳', lat: 39.9042,  lng: 116.4074,  tz: 'Asia/Shanghai' },
  { name: 'Seoul',         country: 'South Korea',   flag: '🇰🇷', lat: 37.5665,  lng: 126.9780,  tz: 'Asia/Seoul' },
  { name: 'Tokyo',         country: 'Japan',         flag: '🇯🇵', lat: 35.6762,  lng: 139.6503,  tz: 'Asia/Tokyo' },
  { name: 'Singapore',     country: 'Singapore',     flag: '🇸🇬', lat: 1.3521,   lng: 103.8198,  tz: 'Asia/Singapore' },
  { name: 'Sydney',        country: 'Australia',     flag: '🇦🇺', lat: -33.8688, lng: 151.2093,  tz: 'Australia/Sydney' },
];

// Curated pairs (not a full mesh — a loose round-the-world network reads
// cleaner than every-city-to-every-city clutter).
export const GLOBE_ARCS: [string, string][] = [
  ['New York', 'London'],
  ['London', 'Paris'],
  ['Paris', 'Berlin'],
  ['Berlin', 'Moscow'],
  ['Moscow', 'Beijing'],
  ['Beijing', 'Tokyo'],
  ['Tokyo', 'Seoul'],
  ['Seoul', 'Singapore'],
  ['Singapore', 'Sydney'],
  ['Sydney', 'Dubai'],
  ['Dubai', 'Mumbai'],
  ['Mumbai', 'Singapore'],
  ['Cairo', 'Dubai'],
  ['Cairo', 'Johannesburg'],
  ['Johannesburg', 'São Paulo'],
  ['São Paulo', 'Mexico City'],
  ['Mexico City', 'Los Angeles'],
  ['Los Angeles', 'Toronto'],
  ['Toronto', 'New York'],
  ['New York', 'São Paulo'],
  ['London', 'Dubai'],
];
