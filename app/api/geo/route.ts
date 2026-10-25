import { NextRequest, NextResponse } from 'next/server';

/* Approximate visitor location from Vercel's IP headers — used by My Day weather
   when the browser location isn't allowed. Locally (no Vercel headers) it returns nulls. */
export async function GET(req: NextRequest) {
  const h = req.headers;
  const decode = (v: string | null) => {
    if (!v) return null;
    try { return decodeURIComponent(v); } catch { return v; }
  };
  const lat = Number(h.get('x-vercel-ip-latitude'));
  const lon = Number(h.get('x-vercel-ip-longitude'));
  const ok = Number.isFinite(lat) && Number.isFinite(lon) && !(lat === 0 && lon === 0) && h.has('x-vercel-ip-latitude');

  return NextResponse.json(
    {
      city: decode(h.get('x-vercel-ip-city')),
      country: h.get('x-vercel-ip-country'),
      lat: ok ? lat : null,
      lon: ok ? lon : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
