import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { streamResponse, type OrchestratorMessage } from '@/lib/llm/orchestrator';
import { StreamParser } from '@/lib/llm/stream-parser';
import { auth } from '@clerk/nextjs/server';

const CANVAS_APPLY_TRIGGER = '__CANVAS_APPLY__';

// Matches any message that has an action verb + "canvas" or "diagram" nearby,
// regardless of filler words ("that", "this", "it", "the idea", etc.)
const CANVAS_NL_PATTERNS = [
  // verb ... canvas (within ~30 chars)
  /\b(send|put|push|add|apply|map|show|draw|render|post|throw|dump|stick|place|move|transfer)\b.{0,30}\b(canvas|diagram|board|map)\b/i,
  // canvas ... verb
  /\b(canvas|diagram|board)\b.{0,30}\b(update|apply|generate|create|build|refresh)\b/i,
  // "generate/create/build the diagram/canvas"
  /\b(generate|create|build|make|visualize|visualise)\b.{0,20}\b(canvas|diagram|map|visual)\b/i,
  // "map (it|this|that|everything) out"
  /\bmap\b.{0,15}\bout\b/i,
  // "update/refresh the canvas"
  /\b(update|refresh)\b.{0,15}\b(canvas|diagram|map)\b/i,
];

function isNaturalLanguageCanvasApply(msg: string): boolean {
  return CANVAS_NL_PATTERNS.some(p => p.test(msg));
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { sessionId, message, guestToken, phase: requestPhase } = body;

  if (!sessionId || !message) {
    return new Response('sessionId and message required', { status: 400 });
  }

  const isCanvasApply = message === CANVAS_APPLY_TRIGGER || isNaturalLanguageCanvasApply(message);

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { messages: { orderBy: { createdAt: 'asc' } } },
  });

  if (!session) return new Response('Session not found', { status: 404 });

  const { userId } = await auth();
  const isOwner = userId && session.userId === userId;
  const isGuest = guestToken && session.guestToken === guestToken;
  if (!isOwner && !isGuest) return new Response('Unauthorized', { status: 403 });

  if (session.tokensUsed >= session.tokenBudget) {
    return new Response('Token budget exhausted', { status: 429 });
  }

  const currentPhase = requestPhase ?? session.currentPhase;

  // For canvas apply: don't save as user message — it's an internal trigger
  // For regular messages: save to DB
  if (!isCanvasApply) {
    await prisma.message.create({
      data: { sessionId, role: 'user', content: message, phase: currentPhase },
    });
  }

  // Build message history
  // For canvas apply: use only messages from the current phase (so AI has focused context)
  // For regular chat: use all messages for full conversation continuity
  let history: OrchestratorMessage[];

  if (isCanvasApply) {
    const phaseMessages = session.messages.filter(m => m.phase === currentPhase);
    history = [
      ...phaseMessages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: 'Apply canvas now.' },
    ];
  } else {
    history = [
      ...session.messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content: message },
    ];
  }

  const encoder    = new TextEncoder();
  const parser     = new StreamParser();
  let assistantContent = '';
  let totalInputTokens  = session.tokensUsed;
  let totalOutputTokens = 0;

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const generator = streamResponse({
          phase:            currentPhase,
          hackathonContext: {
            track:       session.track ?? undefined,
            timeLimitHrs: session.timeLimitHrs ?? undefined,
            teamSize:    session.teamSize ?? undefined,
            expertise:   (session.expertise as Record<string, number>) ?? undefined,
            tools:       (session.tools as { hackathon: string[]; personal: string[] }) ?? undefined,
            judges:      (session.judges as string[]) ?? undefined,
          },
          messages:         history,
          tokensUsed:       session.tokensUsed,
          tokenBudget:      session.tokenBudget,
          isCanvasApply,
        });

        for await (const event of generator) {
          if (event.type === 'text') {
            const chunks = parser.process(event.content);
            for (const chunk of chunks) {
              if (chunk.type === 'text') {
                assistantContent += chunk.content;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`)
                );
              } else if (chunk.type === 'canvas_update') {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: 'canvas_update', update: chunk.update })}\n\n`
                  )
                );
              }
            }
          }

          if (event.type === 'usage') {
            totalInputTokens  += event.inputTokens;
            totalOutputTokens += event.outputTokens;
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'usage', tokensUsed: totalInputTokens + totalOutputTokens, tokenBudget: session.tokenBudget })}\n\n`
              )
            );
          }

          if (event.type === 'error') {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'error', message: event.message })}\n\n`)
            );
          }
        }

        // Flush parser tail
        const tail = parser.flush();
        for (const chunk of tail) {
          if (chunk.type === 'text') {
            assistantContent += chunk.content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: 'text', content: chunk.content })}\n\n`)
            );
          } else if (chunk.type === 'canvas_update') {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ type: 'canvas_update', update: chunk.update })}\n\n`
              )
            );
          }
        }

        // Persist assistant message + update token count
        await Promise.all([
          prisma.message.create({
            data: {
              sessionId,
              role:    'assistant',
              content: assistantContent,
              phase:   currentPhase,
              tokens:  totalOutputTokens,
            },
          }),
          prisma.session.update({
            where: { id: sessionId },
            data:  { tokensUsed: { increment: totalInputTokens + totalOutputTokens - session.tokensUsed } },
          }),
        ]);

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', wasCanvasApply: isCanvasApply })}\n\n`));
      } catch (err) {
        console.error('[chat/route] stream error:', err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Internal server error' })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type':  'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection':    'keep-alive',
    },
  });
}
