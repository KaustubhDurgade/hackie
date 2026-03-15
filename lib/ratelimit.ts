import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

function makeRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

// Sliding window rate limiters per route type
export const chatLimiter    = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'),  prefix: 'rl:chat'    }) : null;
export const sessionLimiter = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'),  prefix: 'rl:session' }) : null;
export const apiLimiter     = redis ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'),  prefix: 'rl:api'     }) : null;
