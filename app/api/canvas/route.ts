import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { CanvasUpdateSchema } from '@/lib/canvas/schema';
import { auth } from '@clerk/nextjs/server';

// PATCH /api/canvas — autosave canvas state
export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { sessionId, phase, canvasData, guestToken } = body;

  if (!sessionId || !canvasData) {
    return NextResponse.json({ error: 'sessionId and canvasData required' }, { status: 400 });
  }

  const session = await prisma.session.findUnique({ where: { id: sessionId } });
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

  const { userId } = await auth();
  const isOwner = userId && session.userId === userId;
  const isGuest = guestToken && session.guestToken === guestToken;
  if (!isOwner && !isGuest) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

  // Validate canvas data shape
  const parsed = CanvasUpdateSchema.safeParse(canvasData);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid canvas data', details: parsed.error.issues }, { status: 400 });
  }

  await prisma.canvasSnapshot.create({
    data: {
      sessionId,
      phase:      phase ?? session.currentPhase,
      canvasData: parsed.data as unknown as Parameters<typeof prisma.canvasSnapshot.create>[0]['data']['canvasData'],
    },
  });

  return NextResponse.json({ ok: true });
}
