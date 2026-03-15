import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// ── Rate limiters (only active when Upstash env vars are set) ────────────────
function makeRedis() {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  return new Redis({ url, token });
}

const redis = makeRedis();

const limiters = redis ? {
  chat:    new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'),  prefix: 'rl:chat'    }),
  session: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '1 h'),  prefix: 'rl:session' }),
  api:     new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(60, '1 m'),  prefix: 'rl:api'     }),
} : null;

function getIP(req: NextRequest) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    'anonymous'
  );
}

// ── Route matchers ────────────────────────────────────────────────────────────
const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/account(.*)']);
const isChatRoute      = createRouteMatcher(['/api/chat(.*)']);
const isSessionRoute   = createRouteMatcher(['/api/session(.*)']);
const isApiRoute       = createRouteMatcher(['/api/(.*)']);

export default clerkMiddleware(async (auth, req) => {
  // 1. Rate limiting (skipped if Upstash not configured)
  if (limiters) {
    const ip = getIP(req);
    let limiter = limiters.api;
    if (isChatRoute(req))   limiter = limiters.chat;
    if (isSessionRoute(req) && req.method === 'POST') limiter = limiters.session;

    if (isApiRoute(req)) {
      const { success } = await limiter.limit(ip);
      if (!success) {
        return NextResponse.json({ error: 'Too many requests. Slow down.' }, { status: 429 });
      }
    }
  }

  // 2. Auth protection
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
