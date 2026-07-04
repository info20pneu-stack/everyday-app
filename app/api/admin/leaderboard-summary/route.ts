import { NextRequest, NextResponse } from 'next/server';
import { redis } from '../../../../lib/redis';
import { isAdminAuthed } from '../../../../lib/adminAuth';
import { VALID_GAMES, lbKey, type GameId } from '../../leaderboard/route';

export async function GET(req: NextRequest) {
  if (!(await isAdminAuthed(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const counts = await Promise.all(VALID_GAMES.map(game => redis.zcard(lbKey(game))));
    const games = VALID_GAMES
      .map((game: GameId, i) => ({ game, players: counts[i] ?? 0 }))
      .sort((a, b) => b.players - a.players);

    const totalPlayers = games.reduce((sum, g) => sum + g.players, 0);
    const mostPlayed = games[0] ?? null;

    return NextResponse.json({ games, totalPlayers, mostPlayed });
  } catch (err) {
    console.error('[admin/leaderboard-summary] error:', err);
    return NextResponse.json({ error: 'Failed to load leaderboard summary' }, { status: 500 });
  }
}
