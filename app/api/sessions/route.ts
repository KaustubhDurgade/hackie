import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@clerk/nextjs/server';

// GET /api/sessions — list sessions for the authenticated user
export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
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
