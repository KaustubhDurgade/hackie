import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CreateSessionSchema = z.object({
  track:       z.string().max(100).optional(),
  timeLimitHrs: z.number().int().min(1).max(168).optional(),
  teamSize:    z.number().int().min(1).max(50).optional(),
  skillsText:  z.string().max(2000).optional(),
  tools: z.object({
    hackathon: z.array(z.string().max(100)).max(30),
    personal:  z.array(z.string().max(100)).max(30),
  }).optional(),
  judges:     z.array(z.string().max(100)).max(20).optional(),
  guestToken: z.string().max(64).optional(),
});

// POST /api/session — create a new session from onboarding wizard
export async function POST(req: NextRequest) {
  const body   = await req.json();
  const parsed = CreateSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input', details: parsed.error.issues }, { status: 400 });
  }
  const {
    track,
    timeLimitHrs,
    teamSize,
    skillsText,
    tools,
    judges,
    guestToken,
  } = parsed.data;

  const { userId } = await auth();

  const expiresAt = userId ? null : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      shareToken:  nanoid(12),
      userId:      userId ?? null,
      guestToken:  userId ? null : (guestToken ?? nanoid(24)),
      track,
      timeLimitHrs,
      teamSize,
      expertise:   skillsText ? { skillsText } : {},
      tools:       tools ?? { hackathon: [], personal: [] },
      judges:      judges ?? [],
      expiresAt,
    },
  });

  return NextResponse.json({
    sessionId:  session.id,
    shareToken: session.shareToken,
    guestToken: session.guestToken,
  });
}

// GET /api/session?id=... OR ?share_token=...
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id         = searchParams.get('id');
  const shareToken = searchParams.get('share_token');

  if (!id && !shareToken) {
    return NextResponse.json({ error: 'id or share_token required' }, { status: 400 });
  }

  // VULN-007: validate UUID format before hitting the DB
  if (id && !UUID_RE.test(id)) {
    return NextResponse.json({ error: 'Invalid id format' }, { status: 400 });
  }

  const session = await prisma.session.findFirst({
    where: id ? { id } : { shareToken: shareToken! },
    include: {
      // Cap messages to last 200 to prevent unbounded response size
      messages: { orderBy: { createdAt: 'asc' }, take: 200 },
      canvasSnapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  const { userId } = await auth();
  // VULN-006: header only — no query param fallback (prevents token leakage in URLs/logs)
  const guestToken = req.headers.get('x-guest-token');

  const isOwner = !!(userId && session.userId === userId);
  const isGuest = !!(guestToken && session.guestToken === guestToken);
  // VULN-001 fix: isShareView only applies to share_token lookups, never bare id lookups.
  // Share views are read-only and do NOT get write access.
  const isShareView = !!shareToken;

  if (!isOwner && !isGuest && !isShareView) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  // VULN-004: strip sensitive fields for share-only viewers
  if (isShareView && !isOwner && !isGuest) {
    const { guestToken: _gt, userId: _uid, ...safeSession } = session as typeof session & { guestToken?: string; userId?: string };
    return NextResponse.json({
      session: { ...safeSession, messages: [] }, // don't expose chat history to share viewers
      readOnly: true,
    });
  }

  return NextResponse.json({ session, readOnly: false });
}

// PATCH /api/session — update mutable session fields (currentPhase)
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { sessionId, currentPhase, phaseData, guestToken } = body;

  if (!sessionId || !UUID_RE.test(sessionId)) {
    return NextResponse.json({ error: 'Valid sessionId required' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { userId } = await auth();
  const isOwner = !!(userId && session.userId === userId);
  const isGuest = !!(guestToken && session.guestToken === guestToken);
  if (!isOwner && !isGuest) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  const data: Record<string, unknown> = {};
  if (typeof currentPhase === 'number' && currentPhase >= 1 && currentPhase <= 5) {
    data.currentPhase = currentPhase;
  }
  if (phaseData !== undefined && typeof phaseData === 'object' && phaseData !== null) {
    // Merge with existing phaseData rather than replacing
    const existing = (session.phaseData as Record<string, unknown>) ?? {};
    data.phaseData = { ...existing, ...(phaseData as Record<string, unknown>) };
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 });
  }

  await prisma.session.update({ where: { id: sessionId }, data });
  return NextResponse.json({ ok: true });
}
