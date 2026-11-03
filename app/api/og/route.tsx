import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { NextRequest } from 'next/server';
import translations, { type Lang } from '../../../lib/i18n';
import { getShare, type ShareRecord } from '../../../lib/share/store';
import { boardDay, formatShareValue, isTimeBoard, shareGame } from '../../../lib/share/games';
import { GRID_COLOR, type GridCell } from '../../../lib/share/grid';
import { fill, shareTexts } from '../../../lib/share/i18n';

/* GET /api/og?id=<share id>[&lang=cs] → 1200×630 PNG preview of a shared result.
   Only the stored share (verified on the server) is drawn — nothing about the result is read from
   the URL. Without a valid id it draws the generic EVERY DAY games card.
   Poppins (with latin-ext, so "Přijmout výzvu" keeps its accents) is bundled in assets/fonts;
   scripts Poppins lacks (Cyrillic, CJK, Arabic…) are fetched by next/og from Google Fonts. */

const W = 1200, H = 630;
const LANGS = Object.keys(translations) as Lang[];

let fontsCache: Promise<{ name: string; data: Buffer; weight: 600 | 700 | 800; style: 'normal' }[]> | null = null;
function fonts() {
  fontsCache ??= Promise.all(([['SemiBold', 600], ['Bold', 700], ['ExtraBold', 800]] as const).map(async ([file, weight]) => ({
    name: 'Poppins', weight, style: 'normal' as const,
    data: await readFile(join(process.cwd(), 'assets/fonts', `Poppins-${file}.ttf`)),
  })));
  return fontsCache;
}

function formatDay(rec: ShareRecord, lang: string): string {
  const day = boardDay(rec.board);
  const d = day ? new Date(`${day}T12:00:00Z`) : new Date(rec.at);
  try {
    return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{
        width: 44, height: 44, borderRadius: 22,
        background: 'radial-gradient(circle at 34% 30%, #bfe0ff 0%, #5aa2ff 22%, #2f6ee8 48%, #173b9c 72%, #0a1640 100%)',
        boxShadow: '0 0 24px rgba(70,140,255,.7)',
      }} />
      <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, letterSpacing: 3, color: '#fff' }}>
        EVERY<span style={{ color: '#7C6CFF', marginLeft: 10 }}>DAY</span>
      </div>
    </div>
  );
}

/** Drawn tick (Poppins has no ✓ glyph). */
function Check() {
  return (
    <div style={{ width: 28, height: 28, borderRadius: 14, background: '#22C55E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 8, height: 14, borderRight: '3px solid #06210F', borderBottom: '3px solid #06210F', transform: 'rotate(45deg)', marginTop: -3 }} />
    </div>
  );
}

function Grid({ rows }: { rows: string[] }) {
  const longest = Math.max(...rows.map(r => r.length));
  const size = Math.min(56, Math.floor(380 / Math.max(longest, 1)) - 8, Math.floor(400 / rows.length) - 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {rows.map((row, i) => (
        <div key={i} style={{ display: 'flex', gap: 8 }}>
          {[...row].map((c, j) => (
            <div key={j} style={{
              width: size, height: size, borderRadius: Math.round(size / 5),
              background: GRID_COLOR[c as GridCell] ?? GRID_COLOR.x,
              boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18)',
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

function ShareCard({ rec, lang }: { rec: ShareRecord; lang: Lang }) {
  const t = translations[lang] ?? translations.en;
  const s = shareTexts(lang);
  const g = shareGame(rec.board);
  const color = g?.color ?? '#8475FF';
  const gameName = g ? g.name(t) : 'EVERY DAY';
  const value = formatShareValue(rec.board, rec, lang);
  const label = isTimeBoard(rec.board) ? s.time : s.score;
  const headline = fill(rec.vs ? s.rematchTitle : s.invites, { name: rec.name });
  const vsValue = rec.vs ? formatShareValue(rec.board, rec.vs, lang) : null;

  return (
    <div style={{
      width: W, height: H, display: 'flex', flexDirection: 'column', position: 'relative',
      background: '#060914', color: '#fff', fontFamily: 'Poppins', padding: '48px 64px',
    }}>
      {/* Glows in the game's colour and the site purple */}
      {/* (full-size layers: satori clips gradients of boxes that stick out of the image) */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, background: `radial-gradient(circle at 88% 0%, ${color}55 0%, ${color}00 45%)` }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: H, background: 'radial-gradient(circle at 0% 100%, #5D4CFF40 0%, #5D4CFF00 45%)' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: W, height: 8, background: `linear-gradient(90deg, ${color}, #5D4CFF)` }} />

      {/* Header: logo + date */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Logo />
        <div style={{
          display: 'flex', fontSize: 24, fontWeight: 600, color: '#C9CBE0', padding: '8px 22px', borderRadius: 999,
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)',
        }}>
          {formatDay(rec, lang)}
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 48, marginTop: 24 }}>
        {/* Left: game, nick, result */}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <div style={{
              width: 92, height: 92, borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 54, background: `linear-gradient(145deg, ${color}66, ${color}22)`, border: `2px solid ${color}AA`,
              boxShadow: `0 0 40px ${color}55`,
            }}>
              {g?.icon ?? '🎮'}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', fontSize: 40, fontWeight: 800, lineHeight: 1.1 }}>{gameName}</div>
              <div style={{ display: 'flex', fontSize: 28, fontWeight: 600, color, marginTop: 4 }}>{headline}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', marginTop: 30 }}>
            <div style={{ display: 'flex', fontSize: 22, fontWeight: 700, letterSpacing: 4, color: '#9AA0C8', textTransform: 'uppercase' }}>
              {label} · {rec.name}
            </div>
            <div style={{
              display: 'flex', fontSize: value.length > 9 ? 112 : 144, fontWeight: 800, lineHeight: 1.05, letterSpacing: -2, marginTop: 18,
              color: '#fff', textShadow: `0 0 48px ${color}AA`,
            }}>
              {value}
            </div>
          </div>
        </div>

        {/* Right: daily grid, or the rematch scoreline */}
        {rec.grid && rec.grid.length > 0 && !rec.vs && (
          <div style={{
            display: 'flex', padding: 28, borderRadius: 28, background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}>
            <Grid rows={rec.grid} />
          </div>
        )}
        {rec.vs && vsValue && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '28px 36px', borderRadius: 28,
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', minWidth: 300,
          }}>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#C9CBE0' }}>{rec.name}</div>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800 }}>{value}</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 800, color }}>VS</div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, color: '#C9CBE0' }}>{rec.vs.name}</div>
            <div style={{ display: 'flex', fontSize: 52, fontWeight: 800, color: '#9AA0C8' }}>{vsValue}</div>
          </div>
        )}
      </div>

      {/* Footer: call to action + verified badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 14, fontSize: 30, fontWeight: 700, padding: '14px 30px', borderRadius: 999,
          background: `linear-gradient(135deg, ${color}, #5D4CFF)`, boxShadow: `0 10px 40px ${color}66`,
        }}>
          {s.canYouBeat} <span style={{ fontSize: 30 }}>→</span> everyday1234567.com
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 22, fontWeight: 600, color: '#4ADE80' }}>
          <Check /> {s.verified}
        </div>
      </div>
    </div>
  );
}

function GenericCard() {
  return (
    <div style={{
      width: W, height: H, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 28,
      background: 'radial-gradient(circle at 70% 20%, #5D4CFF55 0%, #060914 60%)', color: '#fff', fontFamily: 'Poppins',
    }}>
      <Logo />
      <div style={{ display: 'flex', fontSize: 64, fontWeight: 800 }}>🎮 Games · Hry · Spiele</div>
      <div style={{ display: 'flex', fontSize: 30, fontWeight: 600, color: '#C9CBE0' }}>everyday1234567.com</div>
    </div>
  );
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const id = sp.get('id') ?? '';
  let rec: ShareRecord | null = null;
  try { rec = id ? await getShare(id) : null; } catch (err) { console.error('[og] share read failed:', err); }
  const qLang = sp.get('lang') as Lang | null;
  const wanted: Lang = qLang && LANGS.includes(qLang) ? qLang : rec?.lang ?? 'en';
  // Satori can't lay out Arabic properly (shaping fails with Google's fonts; others get broken
  // word spacing), so the Arabic preview uses the English texts
  const lang: Lang = wanted === 'ar' ? 'en' : wanted;

  // Rendered into a buffer, so a failure can still fall back: satori can't shape some scripts
  // (Arabic fonts from Google Fonts) → English texts and the nick without those letters.
  const attempts: (() => React.ReactElement)[] = [];
  if (rec) {
    const r = rec;
    attempts.push(() => <ShareCard rec={r} lang={lang} />);
    const latinName = r.name.replace(/[^\p{Script=Latin}\p{N} _.\-]/gu, '').trim() || 'Player';
    attempts.push(() => <ShareCard rec={{ ...r, name: latinName, vs: r.vs && { ...r.vs, name: r.vs.name.replace(/[^\p{Script=Latin}\p{N} _.\-]/gu, '').trim() || 'Player' } }} lang="en" />);
  }
  attempts.push(() => <GenericCard />);

  for (const [i, el] of attempts.entries()) {
    try {
      const png = await new ImageResponse(el(), { width: W, height: H, fonts: await fonts() }).arrayBuffer();
      const exact = rec && i === 0;
      return new Response(png, {
        headers: {
          'Content-Type': 'image/png',
          // A share never changes; a fallback or an unknown id may render better later, so keep those short
          'Cache-Control': exact ? 'public, max-age=86400, s-maxage=2592000, immutable' : 'public, max-age=300',
        },
      });
    } catch (err) {
      console.error(`[og] render attempt ${i + 1} failed:`, err);
    }
  }
  return new Response('Failed to generate the image', { status: 500 });
}
