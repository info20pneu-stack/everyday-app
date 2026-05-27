import { Redis } from '@upstash/redis';

// Redis.fromEnv() reads UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN
// and falls back to KV_REST_API_URL / KV_REST_API_TOKEN (Vercel KV compat).
export const redis = Redis.fromEnv();
