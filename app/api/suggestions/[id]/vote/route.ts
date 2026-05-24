import { kv } from '@vercel/kv';
import { NextRequest, NextResponse } from 'next/server';
import type { Suggestion } from '../../route';

const VOTE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function getClientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const suggestion = await kv.hgetall<Suggestion>(`suggestion:${id}`);
    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const ip = getClientIP(req);
    const voteKey = `vote:${id}:${ip}`;
    const lastVote = await kv.get<number>(voteKey);

    if (lastVote && Date.now() - lastVote < VOTE_WINDOW_MS) {
      return NextResponse.json({ error: 'Already voted in the last 24h' }, { status: 429 });
    }

    const newVotes = (suggestion.votes || 0) + 1;
    await kv.hset(`suggestion:${id}`, { votes: newVotes });
    await kv.set(voteKey, Date.now(), { ex: Math.ceil(VOTE_WINDOW_MS / 1000) });

    return NextResponse.json({ votes: newVotes });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to register vote' }, { status: 500 });
  }
}
