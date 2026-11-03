import { NextRequest, NextResponse } from 'next/server';
import { getShare, publicShare } from '../../../../lib/share/store';

/* GET /api/share/<id> → the shared result (the challenge a friend plays against). */

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const rec = await getShare(id);
    if (!rec) return NextResponse.json({ error: 'not_found' }, { status: 404 });
    return NextResponse.json({ share: publicShare(rec) }, { headers: { 'Cache-Control': 'public, max-age=60' } });
  } catch (err) {
    console.error('[share GET]', id, err);
    return NextResponse.json({ error: 'server' }, { status: 500 });
  }
}
