import { NextResponse } from 'next/server';

export const revalidate = 3600;

export async function GET() {
  const res = await fetch('https://api.frankfurter.app/latest?from=USD', {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return NextResponse.json({ error: 'upstream error' }, { status: 502 });
  const data = await res.json();
  return NextResponse.json(data.rates as Record<string, number>);
}
