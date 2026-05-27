import type { Metadata } from 'next';
import PageShell from '../../components/PageShell';
import WorldTime from '../../components/WorldTime';

const CITY_META: Record<string, { display: string; country: string; tz: string }> = {
  'new-york':      { display: 'New York',       country: 'USA',           tz: 'America/New_York' },
  'los-angeles':   { display: 'Los Angeles',    country: 'USA',           tz: 'America/Los_Angeles' },
  'chicago':       { display: 'Chicago',        country: 'USA',           tz: 'America/Chicago' },
  'toronto':       { display: 'Toronto',        country: 'Canada',        tz: 'America/Toronto' },
  'sao-paulo':     { display: 'São Paulo',      country: 'Brazil',        tz: 'America/Sao_Paulo' },
  'mexico-city':   { display: 'Mexico City',    country: 'Mexico',        tz: 'America/Mexico_City' },
  'buenos-aires':  { display: 'Buenos Aires',   country: 'Argentina',     tz: 'America/Argentina/Buenos_Aires' },
  'london':        { display: 'London',         country: 'UK',            tz: 'Europe/London' },
  'paris':         { display: 'Paris',          country: 'France',        tz: 'Europe/Paris' },
  'berlin':        { display: 'Berlin',         country: 'Germany',       tz: 'Europe/Berlin' },
  'prague':        { display: 'Prague',         country: 'Czech Rep.',    tz: 'Europe/Prague' },
  'madrid':        { display: 'Madrid',         country: 'Spain',         tz: 'Europe/Madrid' },
  'rome':          { display: 'Rome',           country: 'Italy',         tz: 'Europe/Rome' },
  'amsterdam':     { display: 'Amsterdam',      country: 'Netherlands',   tz: 'Europe/Amsterdam' },
  'stockholm':     { display: 'Stockholm',      country: 'Sweden',        tz: 'Europe/Stockholm' },
  'moscow':        { display: 'Moscow',         country: 'Russia',        tz: 'Europe/Moscow' },
  'istanbul':      { display: 'Istanbul',       country: 'Turkey',        tz: 'Europe/Istanbul' },
  'warsaw':        { display: 'Warsaw',         country: 'Poland',        tz: 'Europe/Warsaw' },
  'vienna':        { display: 'Vienna',         country: 'Austria',       tz: 'Europe/Vienna' },
  'budapest':      { display: 'Budapest',       country: 'Hungary',       tz: 'Europe/Budapest' },
  'zurich':        { display: 'Zurich',         country: 'Switzerland',   tz: 'Europe/Zurich' },
  'brussels':      { display: 'Brussels',       country: 'Belgium',       tz: 'Europe/Brussels' },
  'helsinki':      { display: 'Helsinki',       country: 'Finland',       tz: 'Europe/Helsinki' },
  'oslo':          { display: 'Oslo',           country: 'Norway',        tz: 'Europe/Oslo' },
  'copenhagen':    { display: 'Copenhagen',     country: 'Denmark',       tz: 'Europe/Copenhagen' },
  'athens':        { display: 'Athens',         country: 'Greece',        tz: 'Europe/Athens' },
  'lisbon':        { display: 'Lisbon',         country: 'Portugal',      tz: 'Europe/Lisbon' },
  'tokyo':         { display: 'Tokyo',          country: 'Japan',         tz: 'Asia/Tokyo' },
  'beijing':       { display: 'Beijing',        country: 'China',         tz: 'Asia/Shanghai' },
  'seoul':         { display: 'Seoul',          country: 'South Korea',   tz: 'Asia/Seoul' },
  'singapore':     { display: 'Singapore',      country: 'Singapore',     tz: 'Asia/Singapore' },
  'hong-kong':     { display: 'Hong Kong',      country: 'HK',            tz: 'Asia/Hong_Kong' },
  'dubai':         { display: 'Dubai',          country: 'UAE',           tz: 'Asia/Dubai' },
  'mumbai':        { display: 'Mumbai',         country: 'India',         tz: 'Asia/Kolkata' },
  'bangkok':       { display: 'Bangkok',        country: 'Thailand',      tz: 'Asia/Bangkok' },
  'karachi':       { display: 'Karachi',        country: 'Pakistan',      tz: 'Asia/Karachi' },
  'jakarta':       { display: 'Jakarta',        country: 'Indonesia',     tz: 'Asia/Jakarta' },
  'sydney':        { display: 'Sydney',         country: 'Australia',     tz: 'Australia/Sydney' },
  'cairo':         { display: 'Cairo',          country: 'Egypt',         tz: 'Africa/Cairo' },
  'johannesburg':  { display: 'Johannesburg',   country: 'South Africa',  tz: 'Africa/Johannesburg' },
  'lagos':         { display: 'Lagos',          country: 'Nigeria',       tz: 'Africa/Lagos' },
  'nairobi':       { display: 'Nairobi',        country: 'Kenya',         tz: 'Africa/Nairobi' },
};

export function generateStaticParams() {
  return Object.keys(CITY_META).map(city => ({ city }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> }
): Promise<Metadata> {
  const { city } = await params;
  const meta = CITY_META[city];
  if (!meta) {
    return { title: 'World Time | EVERY DAY' };
  }
  const title = `Current Time in ${meta.display} | EVERY DAY`;
  const description = `What time is it in ${meta.display}, ${meta.country} right now? Live local time, timezone and UTC offset.`;
  return {
    title,
    description,
    alternates: { canonical: `/time/${city}` },
    openGraph: {
      title,
      description,
      url: `https://everyday-app.vercel.app/time/${city}`,
      siteName: 'EVERY DAY',
      images: [{ url: '/og-image.png', width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
  };
}

export default async function CityTimePage(
  { params }: { params: Promise<{ city: string }> }
) {
  const { city } = await params;
  const meta = CITY_META[city];

  return (
    <PageShell>
      {meta && (
        <div style={{
          background: 'rgba(15,20,40,0.92)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '16px',
          padding: '1rem 1.25rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ fontSize: '28px' }}>🕐</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: '#fff', fontFamily: 'Poppins' }}>
              {meta.display}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text3)' }}>
              {meta.country} · {meta.tz}
            </div>
          </div>
        </div>
      )}
      <WorldTime />
    </PageShell>
  );
}
