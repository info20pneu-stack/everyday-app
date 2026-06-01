import { NextRequest, NextResponse } from 'next/server';

const SOURCES: Record<string, string> = {
  bbc:        'https://feeds.bbci.co.uk/news/world/rss.xml',
  cnn:        'https://rss.cnn.com/rss/edition.rss',
  reuters:    'https://feeds.reuters.com/reuters/topNews',
  ct24:       'https://ct24.ceskatelevize.cz/rss/hlavni-zpravy-ct24.php',
  tagesschau: 'https://www.tagesschau.de/xml/rss2/',
};

export async function GET(req: NextRequest) {
  const sourceId = req.nextUrl.searchParams.get('source') ?? 'bbc';
  const url = SOURCES[sourceId];
  if (!url) return NextResponse.json({ error: 'Unknown source' }, { status: 400 });

  const res = await fetch(url, {
    next: { revalidate: 900 },
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; EverydayApp/1.0)' },
  });
  if (!res.ok) return NextResponse.json({ error: `Feed returned ${res.status}` }, { status: 502 });
  const contents = await res.text();
  return NextResponse.json({ contents });
}
