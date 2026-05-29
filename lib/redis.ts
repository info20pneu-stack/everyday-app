import { Redis } from '@upstash/redis';

const url   = process.env.UPSTASH_REDIS_REST_URL   || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

if (!url)   console.error('[redis] MISSING env: UPSTASH_REDIS_REST_URL / KV_REST_API_URL');
if (!token) console.error('[redis] MISSING env: UPSTASH_REDIS_REST_TOKEN / KV_REST_API_TOKEN');

export const redis = new Redis({ url: url!, token: token! });
