/* Redis key names of the leaderboards and their protection.
   LB_KEY_PREFIX (default "lb2", the live boards) lets tests run against separate keys, e.g. "lbtest". */

export const LB_PREFIX = (process.env.LB_KEY_PREFIX || 'lb2').replace(/[^a-z0-9_-]/gi, '') || 'lb2';

export const K = {
  board: (game: string) => `${LB_PREFIX}:${game}`,
  boardIps: (game: string) => `${LB_PREFIX}:ips:${game}`,
  week: (game: string, week: string) => `${LB_PREFIX}:week:${week}:${game}`,
  weekIps: (game: string, week: string) => `${LB_PREFIX}:week:${week}:ips:${game}`,
  /** Normalised nick → device id that owns it. */
  nick: (norm: string) => `${LB_PREFIX}:nick:${norm}`,
  /** Session nonce already spent. */
  usedToken: (nonce: string) => `${LB_PREFIX}:tok:${nonce}`,
  rate: (kind: string, who: string, bucket: string) => `${LB_PREFIX}:rl:${kind}:${who}:${bucket}`,
  bannedNicks: () => `${LB_PREFIX}:ban:nick`,
  bannedDevices: () => `${LB_PREFIX}:ban:dev`,
  /** Last accepted saves across all boards (admin). */
  recent: () => `${LB_PREFIX}:recent`,
  /** Refused saves (admin log). */
  rejects: () => `${LB_PREFIX}:rejects`,
};
