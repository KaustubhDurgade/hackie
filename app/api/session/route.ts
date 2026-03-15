import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { nanoid } from 'nanoid';
import { auth } from '@clerk/nextjs/server';

// POST /api/session — create a new session from onboarding wizard
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    track,
    timeLimitHrs,
    teamSize,
    skillsText,
    tools,
    judges,
    guestToken,
  } = body;

  const { userId } = await auth();

  // 7-day TTL for guest sessions; null for authenticated users
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

  const session = await prisma.session.findFirst({
    where: id ? { id } : { shareToken: shareToken! },
    include: {
      messages: { orderBy: { createdAt: 'asc' } },
      canvasSnapshots: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  if (!session) {
    return NextResponse.json({ error: 'Session not found' }, { status: 404 });
  }

  // Verify access: owner or share_token lookup (read-only)
  const { userId } = await auth();
  const guestToken = req.headers.get('x-guest-token') ?? searchParams.get('guest_token');

  const isOwner       = userId && session.userId === userId;
  const isGuest       = guestToken && session.guestToken === guestToken;
  const isShareView   = !!shareToken;

  if (!isOwner && !isGuest && !isShareView) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({ session, readOnly: isShareView && !isOwner && !isGuest });
}
