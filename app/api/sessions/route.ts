import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/sessions — list sessions for the authenticated user
export async function GET(req: NextRequest) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page  = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
  const limit = 20;

  const sessions = await prisma.session.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    limit,
    skip:    (page - 1) * limit,
    select: {
      id:          true,
      track:       true,
      timeLimitHrs: true,
      teamSize:    true,
      currentPhase: true,
      tokensUsed:  true,
      tokenBudget: true,
      createdAt:   true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ sessions });
}
