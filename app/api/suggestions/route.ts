import { redis } from '../../../lib/redis';
import { NextRequest, NextResponse } from 'next/server';

export type SuggestionStatus =
  | 'Navrženo'
  | 'Zvažujeme'
  | 'Plánováno'
  | 'V vývoji'
  | 'Hotovo'
  | 'Zamítnuto';

export interface Suggestion {
  id: string;
  title: string;
  description: string;
  email?: string;
  status: SuggestionStatus;
  votes: number;
  createdAt: number;
  [key: string]: unknown;
}

export async function GET() {
  try {
    const ids = await redis.lrange<string>('suggestions:list', 0, -1);
    if (!ids || ids.length === 0) return NextResponse.json([]);
    const suggestions = await Promise.all(
      ids.map(id => redis.hgetall<Suggestion>(`suggestion:${id}`))
    );
    const valid = suggestions
      .filter((s): s is Suggestion => s !== null)
      .sort((a, b) => b.votes - a.votes);
    return NextResponse.json(valid);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load suggestions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, email, turnstileToken } = body as {
      title: string;
      description: string;
      email?: string;
      turnstileToken: string;
    };

    if (!title?.trim() || !description?.trim() || !turnstileToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify Cloudflare Turnstile
    const secret = process.env.TURNSTILE_SECRET_KEY;
    if (secret) {
      const verifyRes = await fetch(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret, response: turnstileToken }),
        }
      );
      const verifyData = await verifyRes.json() as { success: boolean };
      if (!verifyData.success) {
        return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 });
      }
    }

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const suggestion: Suggestion = {
      id,
      title: title.trim().slice(0, 120),
      description: description.trim().slice(0, 600),
      email: email?.trim().slice(0, 120) || undefined,
      status: 'Navrženo',
      votes: 0,
      createdAt: Date.now(),
    };

    await redis.hset(`suggestion:${id}`, suggestion);
    await redis.lpush('suggestions:list', id);

    return NextResponse.json(suggestion, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to submit suggestion' }, { status: 500 });
  }
}
