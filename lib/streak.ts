const KEY = 'everyday_streak_v1';
const EVENT = 'everyday-streak-updated';

export type BadgeId =
  | 'streak3' | 'streak7' | 'streak30' | 'streak100'
  | 'games10' | 'games100' | 'top100';

export type Badge = { id: BadgeId; emoji: string; threshold: number; kind: 'days' | 'games' | 'rank' };

export const BADGES: Badge[] = [
  { id: 'streak3',   emoji: '🔥', threshold: 3,   kind: 'days' },
  { id: 'streak7',   emoji: '🔥', threshold: 7,   kind: 'days' },
  { id: 'streak30',  emoji: '🔥', threshold: 30,  kind: 'days' },
  { id: 'streak100', emoji: '🔥', threshold: 100, kind: 'days' },
  { id: 'games10',   emoji: '🎮', threshold: 10,  kind: 'games' },
  { id: 'games100',  emoji: '🎮', threshold: 100, kind: 'games' },
  { id: 'top100',    emoji: '🏆', threshold: 100, kind: 'rank' },
];

export type StreakState = {
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  totalCompletedDays: number;
  totalGamesPlayed: number;
  bestLeaderboardRank: number | null;
  unlockedBadges: BadgeId[];
};

const DEFAULT_STATE: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastCompletedDate: '',
  totalCompletedDays: 0,
  totalGamesPlayed: 0,
  bestLeaderboardRank: null,
  unlockedBadges: [],
};

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function todayKey(): string {
  return dayKey(new Date());
}

function yesterdayKey(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return dayKey(d);
}

export function getStreakState(): StreakState {
  if (typeof window === 'undefined') return DEFAULT_STATE;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

// Breaks the displayed current streak to 0 once a day has been missed,
// without needing an explicit "completion" event to detect the break.
export function getDisplayState(): StreakState {
  const state = getStreakState();
  if (!state.lastCompletedDate) return state;
  if (state.lastCompletedDate !== todayKey() && state.lastCompletedDate !== yesterdayKey()) {
    return { ...state, currentStreak: 0 };
  }
  return state;
}

function save(state: StreakState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

function recomputeBadges(state: StreakState): BadgeId[] {
  const unlocked = new Set(state.unlockedBadges);
  for (const b of BADGES) {
    if (b.kind === 'days' && state.totalCompletedDays >= b.threshold) unlocked.add(b.id);
    if (b.kind === 'games' && state.totalGamesPlayed >= b.threshold) unlocked.add(b.id);
    if (b.kind === 'rank' && state.bestLeaderboardRank !== null && state.bestLeaderboardRank <= b.threshold) unlocked.add(b.id);
  }
  return Array.from(unlocked);
}

function markDayCompleted(state: StreakState): StreakState {
  const today = todayKey();
  if (state.lastCompletedDate === today) return state;
  const isConsecutive = state.lastCompletedDate === yesterdayKey();
  const currentStreak = isConsecutive ? state.currentStreak + 1 : 1;
  return {
    ...state,
    currentStreak,
    longestStreak: Math.max(state.longestStreak, currentStreak),
    lastCompletedDate: today,
    totalCompletedDays: state.totalCompletedDays + 1,
  };
}

// Call whenever the user finishes a round of any game (DailyGames, HumanBenchmark, WordleGames).
export function recordGameCompleted(): StreakState {
  let state = getStreakState();
  state = markDayCompleted({ ...state, totalGamesPlayed: state.totalGamesPlayed + 1 });
  state.unlockedBadges = recomputeBadges(state);
  save(state);
  return state;
}

// Call whenever the user marks at least one Daily Boost activity as done.
export function recordDailyBoostActivity(): StreakState {
  let state = getStreakState();
  state = markDayCompleted(state);
  state.unlockedBadges = recomputeBadges(state);
  save(state);
  return state;
}

// Call with the user's rank after a successful leaderboard submission.
export function recordLeaderboardRank(rank: number): StreakState {
  let state = getStreakState();
  if (state.bestLeaderboardRank === null || rank < state.bestLeaderboardRank) {
    state = { ...state, bestLeaderboardRank: rank };
  }
  state.unlockedBadges = recomputeBadges(state);
  save(state);
  return state;
}

export const STREAK_UPDATED_EVENT = EVENT;
