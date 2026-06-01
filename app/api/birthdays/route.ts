import { NextResponse } from 'next/server';

export const revalidate = 3600; // cache for 1 hour

export type Category = 'film' | 'music' | 'sport' | 'other';

export interface BirthdayCeleb {
  name: string;
  year: number;
  age: number;
  description: string;
  thumbnail?: string;
  url: string;
  category: Category;
  profession: string;
  country?: string;
  countryFlag?: string;
}

/* ── Nationality → country + flag mapping ── */
const NATIONALITIES: { adj: string; country: string; flag: string }[] = [
  { adj: 'american',       country: 'USA',          flag: '🇺🇸' },
  { adj: 'british',        country: 'UK',            flag: '🇬🇧' },
  { adj: 'english',        country: 'England',       flag: '🇬🇧' },
  { adj: 'scottish',       country: 'Scotland',      flag: '🏴󠁧󠁢󠁳󠁣󠁴󠁿' },
  { adj: 'welsh',          country: 'Wales',         flag: '🏴󠁧󠁢󠁷󠁬󠁳󠁿' },
  { adj: 'irish',          country: 'Ireland',       flag: '🇮🇪' },
  { adj: 'french',         country: 'France',        flag: '🇫🇷' },
  { adj: 'german',         country: 'Germany',       flag: '🇩🇪' },
  { adj: 'austrian',       country: 'Austria',       flag: '🇦🇹' },
  { adj: 'swiss',          country: 'Switzerland',   flag: '🇨🇭' },
  { adj: 'italian',        country: 'Italy',         flag: '🇮🇹' },
  { adj: 'spanish',        country: 'Spain',         flag: '🇪🇸' },
  { adj: 'portuguese',     country: 'Portugal',      flag: '🇵🇹' },
  { adj: 'dutch',          country: 'Netherlands',   flag: '🇳🇱' },
  { adj: 'belgian',        country: 'Belgium',       flag: '🇧🇪' },
  { adj: 'swedish',        country: 'Sweden',        flag: '🇸🇪' },
  { adj: 'norwegian',      country: 'Norway',        flag: '🇳🇴' },
  { adj: 'danish',         country: 'Denmark',       flag: '🇩🇰' },
  { adj: 'finnish',        country: 'Finland',       flag: '🇫🇮' },
  { adj: 'greek',          country: 'Greece',        flag: '🇬🇷' },
  { adj: 'polish',         country: 'Poland',        flag: '🇵🇱' },
  { adj: 'czech',          country: 'Czech Rep.',    flag: '🇨🇿' },
  { adj: 'slovak',         country: 'Slovakia',      flag: '🇸🇰' },
  { adj: 'hungarian',      country: 'Hungary',       flag: '🇭🇺' },
  { adj: 'romanian',       country: 'Romania',       flag: '🇷🇴' },
  { adj: 'bulgarian',      country: 'Bulgaria',      flag: '🇧🇬' },
  { adj: 'ukrainian',      country: 'Ukraine',       flag: '🇺🇦' },
  { adj: 'russian',        country: 'Russia',        flag: '🇷🇺' },
  { adj: 'turkish',        country: 'Turkey',        flag: '🇹🇷' },
  { adj: 'canadian',       country: 'Canada',        flag: '🇨🇦' },
  { adj: 'australian',     country: 'Australia',     flag: '🇦🇺' },
  { adj: 'new zealand',    country: 'New Zealand',   flag: '🇳🇿' },
  { adj: 'japanese',       country: 'Japan',         flag: '🇯🇵' },
  { adj: 'chinese',        country: 'China',         flag: '🇨🇳' },
  { adj: 'korean',         country: 'South Korea',   flag: '🇰🇷' },
  { adj: 'indian',         country: 'India',         flag: '🇮🇳' },
  { adj: 'pakistani',      country: 'Pakistan',      flag: '🇵🇰' },
  { adj: 'indonesian',     country: 'Indonesia',     flag: '🇮🇩' },
  { adj: 'thai',           country: 'Thailand',      flag: '🇹🇭' },
  { adj: 'vietnamese',     country: 'Vietnam',       flag: '🇻🇳' },
  { adj: 'philippine',     country: 'Philippines',   flag: '🇵🇭' },
  { adj: 'brazilian',      country: 'Brazil',        flag: '🇧🇷' },
  { adj: 'argentinian',    country: 'Argentina',     flag: '🇦🇷' },
  { adj: 'argentinean',    country: 'Argentina',     flag: '🇦🇷' },
  { adj: 'colombian',      country: 'Colombia',      flag: '🇨🇴' },
  { adj: 'mexican',        country: 'Mexico',        flag: '🇲🇽' },
  { adj: 'chilean',        country: 'Chile',         flag: '🇨🇱' },
  { adj: 'venezuelan',     country: 'Venezuela',     flag: '🇻🇪' },
  { adj: 'cuban',          country: 'Cuba',          flag: '🇨🇺' },
  { adj: 'jamaican',       country: 'Jamaica',       flag: '🇯🇲' },
  { adj: 'nigerian',       country: 'Nigeria',       flag: '🇳🇬' },
  { adj: 'south african',  country: 'South Africa',  flag: '🇿🇦' },
  { adj: 'egyptian',       country: 'Egypt',         flag: '🇪🇬' },
  { adj: 'moroccan',       country: 'Morocco',       flag: '🇲🇦' },
  { adj: 'iranian',        country: 'Iran',          flag: '🇮🇷' },
  { adj: 'israeli',        country: 'Israel',        flag: '🇮🇱' },
  { adj: 'saudi',          country: 'Saudi Arabia',  flag: '🇸🇦' },
  { adj: 'croatian',       country: 'Croatia',       flag: '🇭🇷' },
  { adj: 'serbian',        country: 'Serbia',        flag: '🇷🇸' },
  { adj: 'albanian',       country: 'Albania',       flag: '🇦🇱' },
];

function detectCountry(text: string): { country: string; flag: string } | null {
  const lo = text.toLowerCase();
  for (const n of NATIONALITIES) {
    if (lo.includes(n.adj)) return { country: n.country, flag: n.flag };
  }
  return null;
}

function detectCategory(text: string): Category {
  const lo = text.toLowerCase();
  if (/\b(actor|actress|film director|filmmaker|producer|screenwriter|television|tv show|comedy|comedian|entertainer|movie|cinema|host|presenter|celebrity|reality)\b/.test(lo)) return 'film';
  if (/\b(singer|musician|composer|guitarist|drummer|bassist|rapper|vocalist|songwriter|album|pop star|rock|jazz|classical music|dj|producer)\b/.test(lo)) return 'music';
  if (/\b(footballer|soccer|basketball|tennis|swimmer|athlete|boxer|golfer|cyclist|cricketer|rugby|olympic|sprinter|racing driver|jockey|wrestler|martial artist|nfl|nba|nhl)\b/.test(lo)) return 'sport';
  return 'other';
}

function detectProfession(text: string): string {
  const lo = text.toLowerCase();
  if (lo.includes('actress'))                    return 'Actress';
  if (lo.includes('actor'))                      return 'Actor';
  if (lo.includes('film director') || lo.includes('filmmaker')) return 'Director';
  if (lo.includes('singer'))                     return 'Singer';
  if (lo.includes('rapper'))                     return 'Rapper';
  if (lo.includes('musician'))                   return 'Musician';
  if (lo.includes('composer'))                   return 'Composer';
  if (lo.includes('songwriter'))                 return 'Songwriter';
  if (lo.includes('footballer') || lo.includes('soccer player')) return 'Footballer';
  if (lo.includes('basketball player'))          return 'Basketball Player';
  if (lo.includes('tennis player'))              return 'Tennis Player';
  if (lo.includes('boxer'))                      return 'Boxer';
  if (lo.includes('swimmer'))                    return 'Swimmer';
  if (lo.includes('golfer'))                     return 'Golfer';
  if (lo.includes('cyclist'))                    return 'Cyclist';
  if (lo.includes('racing driver'))              return 'Racing Driver';
  if (lo.includes('athlete'))                    return 'Athlete';
  if (lo.includes('comedian'))                   return 'Comedian';
  if (lo.includes('model'))                      return 'Model';
  if (lo.includes('producer'))                   return 'Producer';
  if (lo.includes('screenwriter'))               return 'Screenwriter';
  if (lo.includes('author') || lo.includes('novelist') || lo.includes('writer')) return 'Author';
  if (lo.includes('politician') || lo.includes('president') || lo.includes('prime minister')) return 'Politician';
  if (lo.includes('scientist') || lo.includes('physicist') || lo.includes('chemist')) return 'Scientist';
  if (lo.includes('chef'))                       return 'Chef';
  if (lo.includes('painter') || lo.includes('artist')) return 'Artist';
  if (lo.includes('architect'))                  return 'Architect';
  return 'Personality';
}

/* ── TMDB enrichment (optional) ── */
const TMDB_KEY  = process.env.TMDB_API_KEY ?? '';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_IMG  = 'https://image.tmdb.org/t/p/w185';

interface TmdbPerson { profile_path?: string | null; known_for_department?: string; }

async function fetchTmdbPhoto(name: string): Promise<TmdbPerson | null> {
  if (!TMDB_KEY) return null;
  try {
    const url = `${TMDB_BASE}/search/person?api_key=${TMDB_KEY}&query=${encodeURIComponent(name)}&language=en-US&page=1`;
    const res = await fetch(url, { next: { revalidate: 86400 } });
    if (!res.ok) return null;
    const data = await res.json() as { results?: TmdbPerson[] };
    return data.results?.[0] ?? null;
  } catch { return null; }
}

/* ── Wikipedia fetch ── */
interface WikiBirth {
  year: number;
  text: string;
  pages?: Array<{
    title: string;
    extract?: string;
    thumbnail?: { source: string };
    content_urls?: { desktop?: { page: string } };
  }>;
}

export async function GET() {
  const now = new Date();
  const mm  = String(now.getMonth() + 1).padStart(2, '0');
  const dd  = String(now.getDate()).padStart(2, '0');
  const today = now.getFullYear();

  try {
    const wikiRes = await fetch(
      `https://en.wikipedia.org/api/rest_v1/feed/onthisday/births/${mm}/${dd}`,
      {
        next: { revalidate: 3600 },
        headers: { 'Api-User-Agent': 'EverydayApp/1.0 (everyday1234567.com)' },
      }
    );
    if (!wikiRes.ok) throw new Error(`Wikipedia ${wikiRes.status}`);
    const wikiData = await wikiRes.json() as { births?: WikiBirth[] };

    const births = (wikiData.births ?? [])
      .filter(b => b.pages && b.pages.length > 0 && b.year >= 1920)
      .sort((a, b) => b.year - a.year);   // newest first

    const top30 = births.slice(0, 30);

    // Enrich with TMDB in parallel (only if API key set)
    const tmdbResults = TMDB_KEY
      ? await Promise.all(top30.map(b => fetchTmdbPhoto(b.pages![0].title)))
      : top30.map(() => null);

    const celebs: BirthdayCeleb[] = top30.map((b, i) => {
      const page  = b.pages![0];
      const text  = b.text || page.extract || '';
      const tmdb  = tmdbResults[i];
      const loc   = detectCountry(text);
      const cat   = detectCategory(text);

      // Override category from TMDB department
      let category = cat;
      if (tmdb?.known_for_department === 'Acting')   category = 'film';
      if (tmdb?.known_for_department === 'Directing') category = 'film';
      if (tmdb?.known_for_department === 'Sound')    category = 'music';

      return {
        name:        page.title,
        year:        b.year,
        age:         today - b.year,
        description: text.slice(0, 200),
        thumbnail:   tmdb?.profile_path
          ? `${TMDB_IMG}${tmdb.profile_path}`
          : page.thumbnail?.source,
        url:         page.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
        category,
        profession:  detectProfession(text),
        country:     loc?.country,
        countryFlag: loc?.flag,
      };
    });

    return NextResponse.json(celebs);
  } catch (err) {
    console.error('[birthdays] Error:', err);
    return NextResponse.json([], { status: 500 });
  }
}
