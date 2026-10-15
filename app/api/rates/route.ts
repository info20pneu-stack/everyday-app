import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 3600;

function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(req: NextRequest) {
  const sp   = req.nextUrl.searchParams;
  const days = sp.get('days');

  if (days) {
    const from = (sp.get('from') ?? 'USD').toUpperCase();
    const to   = (sp.get('to') ?? 'EUR').toUpperCase();
    const n    = Math.min(90, Math.max(1, parseInt(days, 10) || 30));
    const end   = new Date();
    const start = new Date(end.getTime() - n * 86_400_000);

    const res = await fetch(
      `https://api.frankfurter.app/${fmtDate(start)}..${fmtDate(end)}?from=${from}&to=${to}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 });
    const data = await res.json();
    const ratesByDate = data.rates as Record<string, Record<string, number>>;
    const dates = Object.keys(ratesByDate).sort();
    const values = dates.map(d => ratesByDate[d][to]);
    return NextResponse.json({ from, to, dates, values });
  }

  const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data.rates as Record<string, number>);
}
