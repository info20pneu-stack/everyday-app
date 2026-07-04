import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { isAdminAuthed } from '../../../../lib/adminAuth';
import type { Suggestion, SuggestionStatus } from '../route';

const VALID_STATUSES: SuggestionStatus[] = [
  'Navrženo', 'Zvažujeme', 'Plánováno', 'V vývoji', 'Hotovo', 'Zamítnuto',
];

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json() as { status?: SuggestionStatus };
    if (!body.status || !VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const existing = await redis.hgetall<Suggestion>(`suggestion:${id}`);
    if (!existing) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    await redis.hset(`suggestion:${id}`, { status: body.status });
    return NextResponse.json({ ...existing, status: body.status });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update suggestion' }, { status: 500 });
  }
}
