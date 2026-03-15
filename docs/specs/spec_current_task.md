---
date: 2026-03-14
topic: Hackie — Full Implementation Spec
status: ready-for-execution
---

# Implementation Spec: Hackie

## Phase Overview

| Phase | Name | Files Created/Modified | Testable Output |
|---|---|---|---|
| 0 | Project Scaffold | package.json, next.config, tailwind, prisma | `npm run dev` works |
| 1 | DB Schema + Prisma | prisma/schema.prisma, lib/db/prisma.ts | `npx prisma migrate dev` passes |
| 2 | Canvas Schema + Stream Parser | lib/canvas/schema.ts, lib/llm/stream-parser.ts | Unit tests pass |
| 3 | LLM Orchestrator + Prompts | lib/llm/orchestrator.ts, lib/llm/prompts/* | Manual: API call returns streamed text + canvas_update |
| 4 | API Routes | app/api/chat, session, canvas, boilerplate | curl tests pass |
| 5 | Onboarding Wizard | components/onboarding/OnboardingWizard.tsx, app/(app)/session/new/page.tsx | Manual: completes 3-step form, creates session |
| 6 | Chat Panel | components/chat/*, app/(app)/session/[id]/page.tsx (shell) | Manual: sends message, sees streaming response |
| 7 | Canvas Panel | components/canvas/*, HackieCanvas.tsx | Manual: canvas updates when LLM sends canvas_update |
| 8 | Split Pane + Phase Nav | app/(app)/session/[id]/page.tsx (complete) | Manual: full split pane works, phase sidebar navigates |
| 9 | Boilerplate Download | app/api/boilerplate/route.ts, ZIP generation | Manual: downloads ZIP with correct files |
| 10 | Share URL | app/(app)/session/[id]/share/page.tsx | Manual: read-only canvas loads from share_token |
| 11 | Landing Page | app/page.tsx | Manual: landing page renders |

---

## Phase 0: Project Scaffold

### Files to CREATE

**`package.json`** (via `npx create-next-app@latest`)
- TypeScript: yes
- Tailwind: yes
- App Router: yes
- src/ dir: no

**Additional packages to install:**
```bash
npm install @anthropic-ai/sdk @xyflow/react @clerk/nextjs
npm install prisma @prisma/client zod
npm install jszip file-saver nanoid
npm install @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react
npx shadcn@latest init
npx shadcn@latest add button input textarea card badge separator scroll-area
```

**`next.config.ts`** — MODIFY to add:
```ts
const nextConfig = {
  experimental: { serverActions: { allowedOrigins: ['*'] } },
};
```

**`.env.local`** — CREATE:
```
DATABASE_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Success Criteria
- [ ] Automated: `npm run build` exits 0
- [ ] Manual: `npm run dev` loads at localhost:3000

---

## Phase 1: DB Schema + Prisma

### Files to CREATE

**`prisma/schema.prisma`**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Session {
  id           String    @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  shareToken   String    @unique @map("share_token")
  userId       String?   @map("user_id")
  guestToken   String?   @map("guest_token")

  track        String?
  timeLimitHrs Int?      @map("time_limit_hrs")
  teamSize     Int?      @map("team_size")
  expertise    Json?
  tools        Json?
  judges       Json?

  currentPhase Int       @default(1) @map("current_phase")
  phaseData    Json?     @map("phase_data")

  tokensUsed   Int       @default(0) @map("tokens_used")
  tokenBudget  Int       @default(60000) @map("token_budget")

  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  expiresAt    DateTime? @map("expires_at")

  canvasSnapshots CanvasSnapshot[]
  messages        Message[]

  @@map("sessions")
}

model CanvasSnapshot {
  id         String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId  String   @map("session_id") @db.Uuid
  phase      Int
  canvasData Json     @map("canvas_data")
  createdAt  DateTime @default(now()) @map("created_at")

  session    Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("canvas_snapshots")
}

model Message {
  id        String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  sessionId String   @map("session_id") @db.Uuid
  role      String   // 'user' | 'assistant'
  content   String
  phase     Int?
  tokens    Int?
  createdAt DateTime @default(now()) @map("created_at")

  session   Session  @relation(fields: [sessionId], references: [id], onDelete: Cascade)

  @@map("messages")
}
```

**`lib/db/prisma.ts`**
```ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ log: ['query'] });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Success Criteria
- [ ] Automated: `npx prisma migrate dev --name init` exits 0
- [ ] Automated: `npx prisma generate` exits 0
- [ ] Manual: Prisma Studio shows 3 empty tables

---

## Phase 2: Canvas Schema + Stream Parser

### Files to CREATE

**`lib/canvas/schema.ts`**
```ts
import { z } from 'zod';

export const NodeTypeSchema = z.enum(['feature', 'service', 'database', 'external', 'user', 'page', 'component']);
export const EdgeTypeSchema = z.enum(['data', 'user-flow', 'dependency', 'api-call']);

export const CanvasNodeSchema = z.object({
  id:    z.string(),
  label: z.string(),
  type:  NodeTypeSchema,
  phase: z.number().int().min(1).max(6),
  data:  z.record(z.unknown()).optional(),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
});

export const CanvasEdgeSchema = z.object({
  id:     z.string(),
  source: z.string(),
  target: z.string(),
  label:  z.string().optional(),
  type:   EdgeTypeSchema.optional(),
});

export const CanvasUpdateSchema = z.object({
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(CanvasEdgeSchema),
  mode:  z.enum(['replace', 'merge']).default('merge'),
});

export type CanvasUpdate = z.infer<typeof CanvasUpdateSchema>;
export type CanvasNode = z.infer<typeof CanvasNodeSchema>;
export type CanvasEdge = z.infer<typeof CanvasEdgeSchema>;
```

**`lib/llm/stream-parser.ts`**
```ts
import { CanvasUpdateSchema, type CanvasUpdate } from '@/lib/canvas/schema';

export type ParsedChunk =
  | { type: 'text'; content: string }
  | { type: 'canvas_update'; update: CanvasUpdate; phase: string }
  | { type: 'parse_error'; raw: string };

const OPEN_TAG = /<canvas_update\s+type="([^"]+)">/;
const CLOSE_TAG = '</canvas_update>';

export class StreamParser {
  private buffer = '';
  private inTag = false;
  private tagType = '';
  private tagBuffer = '';

  process(chunk: string): ParsedChunk[] {
    const results: ParsedChunk[] = [];
    this.buffer += chunk;

    while (this.buffer.length > 0) {
      if (!this.inTag) {
        const openIdx = this.buffer.indexOf('<canvas_update');
        if (openIdx === -1) {
          // No tag in buffer — flush all as text
          results.push({ type: 'text', content: this.buffer });
          this.buffer = '';
          break;
        }
        // Flush text before the tag
        if (openIdx > 0) {
          results.push({ type: 'text', content: this.buffer.slice(0, openIdx) });
          this.buffer = this.buffer.slice(openIdx);
        }
        // Check if full opening tag is in buffer
        const closeAngle = this.buffer.indexOf('>');
        if (closeAngle === -1) break; // wait for more chunks

        const tagMatch = OPEN_TAG.exec(this.buffer.slice(0, closeAngle + 1));
        if (!tagMatch) {
          // Malformed tag — treat as text
          results.push({ type: 'text', content: this.buffer.slice(0, closeAngle + 1) });
          this.buffer = this.buffer.slice(closeAngle + 1);
          continue;
        }
        this.inTag = true;
        this.tagType = tagMatch[1];
        this.tagBuffer = '';
        this.buffer = this.buffer.slice(closeAngle + 1);
      } else {
        // We're inside a canvas_update tag
        const closeIdx = this.buffer.indexOf(CLOSE_TAG);
        if (closeIdx === -1) {
          // Accumulate and wait
          this.tagBuffer += this.buffer;
          this.buffer = '';
          break;
        }
        this.tagBuffer += this.buffer.slice(0, closeIdx);
        this.buffer = this.buffer.slice(closeIdx + CLOSE_TAG.length);
        this.inTag = false;

        // Parse and validate
        try {
          const parsed = JSON.parse(this.tagBuffer.trim());
          const validated = CanvasUpdateSchema.parse(parsed);
          results.push({ type: 'canvas_update', update: validated, phase: this.tagType });
        } catch {
          results.push({ type: 'parse_error', raw: this.tagBuffer });
        }
        this.tagBuffer = '';
        this.tagType = '';
      }
    }

    return results;
  }

  flush(): ParsedChunk[] {
    const results: ParsedChunk[] = [];
    if (this.inTag && this.tagBuffer) {
      results.push({ type: 'parse_error', raw: this.tagBuffer });
    } else if (this.buffer) {
      results.push({ type: 'text', content: this.buffer });
    }
    this.buffer = '';
    this.tagBuffer = '';
    this.inTag = false;
    return results;
  }
}
```

### Success Criteria
- [ ] Automated: Write a quick test:
  ```ts
  // test: parser extracts canvas_update from mixed stream
  const parser = new StreamParser();
  const input = 'Hello <canvas_update type="phase_3">{"nodes":[],"edges":[]}</canvas_update> world';
  const chunks = parser.process(input);
  // chunks[0].type === 'text', chunks[1].type === 'canvas_update', chunks[2].type === 'text'
  ```
- [ ] Manual: No TS errors in `lib/`

---

## Phase 3: LLM Orchestrator + Prompts

### Files to CREATE

**`lib/llm/prompts/system.ts`** — base system prompt
```ts
export const SYSTEM_PROMPT = `You are Hackie, an AI co-pilot for hackathon teams.
You help teams go from "we have 24 hours" to "we have a plan and a codebase."

PERSONALITY:
- Honest and direct. No fluff.
- Constructive, never demoralizing. When something isn't feasible, show the version that IS.
- Technical but approachable.

FEASIBILITY RULE:
When assessing feasibility, ALWAYS:
1. State your confidence level: High / Medium / Low
2. List the assumptions you're making
3. End with: "Here's what IS achievable in [X] hours:" followed by the actionable path

CANVAS UPDATE FORMAT:
When you want to update the visual canvas, embed this XML in your response:
<canvas_update type="[phase_type]">
{
  "nodes": [{ "id": "...", "label": "...", "type": "feature|service|database|external|user|page|component", "phase": 3 }],
  "edges": [{ "id": "...", "source": "...", "target": "...", "label": "..." }],
  "mode": "merge"
}
</canvas_update>

Phase types: phase_2_idea, phase_3_features, phase_4_architecture, phase_5_stack, phase_6_design

IMPORTANT: The canvas_update block is parsed automatically. Do not explain or narrate it.
Prose before and after it streams normally to the chat.`;
```

**`lib/llm/prompts/phases.ts`** — per-phase injection
```ts
export const PHASE_PROMPTS: Record<number, string> = {
  2: `You are now in Phase 2: Idea Validation / Generation.
The user either has an idea to validate, or needs one generated.
After your response, emit a canvas_update with type="phase_2_idea" containing:
- One node: the idea title
- One node: feasibility score (High/Medium/Low)
- One node: "What to cut for MVP" list`,

  3: `You are now in Phase 3: Feature Mapping.
Propose 5-8 features. The user will refine. For each confirmed feature, update the canvas.
Use mode="merge" to add features incrementally as confirmed.`,

  4: `You are now in Phase 4: Architecture Diagram.
Generate a layered architecture: User → Frontend → Backend → Database → External APIs.
Emit a full canvas_update with type="phase_4_architecture" using mode="replace".`,

  5: `You are now in Phase 5: Tech Stack + Boilerplate.
Recommend one of these 3 templates based on team expertise + project type:
A: Next.js 14 + Prisma + Clerk + Postgres
B: FastAPI + React (Vite) + JWT + SQLite
C: Next.js + Supabase (auth + db + storage)
Explain why. Once confirmed, the boilerplate download will be available.`,

  6: `You are now in Phase 6: Design Artifacts.
6A: Describe the landing page above-fold layout (hero, CTA, key features).
6B: Generate a pitch deck outline, slide by slide:
  1. Title + tagline
  2. Problem (3 bullets)
  3. Solution (3 bullets)
  4. Demo flow (step by step)
  5. Tech stack (brief)
  6. Team (name + role)
  7. The Ask (what you want from judges)`,
};
```

**`lib/llm/orchestrator.ts`**
```ts
import Anthropic from '@anthropic-ai/sdk';
import { SYSTEM_PROMPT } from './prompts/system';
import { PHASE_PROMPTS } from './prompts/phases';

const client = new Anthropic();

export interface OrchestratorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface OrchestratorContext {
  phase: number;
  hackathonContext: {
    track?: string;
    timeLimitHrs?: number;
    teamSize?: number;
    expertise?: Record<string, number>;
    tools?: { hackathon: string[]; personal: string[] };
    judges?: string[];
  };
  messages: OrchestratorMessage[];
  tokensUsed: number;
  tokenBudget: number;
}

export async function* streamResponse(ctx: OrchestratorContext) {
  const phasePrompt = PHASE_PROMPTS[ctx.phase] ?? '';
  const contextBlock = `
HACKATHON CONTEXT:
Track: ${ctx.hackathonContext.track ?? 'not specified'}
Time limit: ${ctx.hackathonContext.timeLimitHrs ?? '?'} hours
Team size: ${ctx.hackathonContext.teamSize ?? '?'}
Expertise: ${JSON.stringify(ctx.hackathonContext.expertise ?? {})}
Tools: ${JSON.stringify(ctx.hackathonContext.tools ?? {})}
Judges: ${(ctx.hackathonContext.judges ?? []).join(', ') || 'not specified'}
`;

  const systemPrompt = [SYSTEM_PROMPT, contextBlock, phasePrompt]
    .filter(Boolean)
    .join('\n\n---\n\n');

  const stream = client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: systemPrompt,
    messages: ctx.messages,
  });

  for await (const event of stream) {
    if (
      event.type === 'content_block_delta' &&
      event.delta.type === 'text_delta'
    ) {
      yield { type: 'text' as const, content: event.delta.text };
    }
    if (event.type === 'message_delta' && event.usage) {
      yield { type: 'usage' as const, outputTokens: event.usage.output_tokens };
    }
  }
}
```

### Success Criteria
- [ ] Manual: Call `streamResponse` from a test script, receive streamed text
- [ ] Manual: No TS errors

---

## Phase 4: API Routes

### Files to CREATE

**`app/api/session/route.ts`** — POST (create), GET (load by id or share_token)
```ts
// POST: create session (from onboarding wizard)
// Body: { track, timeLimitHrs, teamSize, expertise, tools, judges, guestToken? }
// Returns: { sessionId, shareToken }

// GET: load session
// Query: ?id=... OR ?share_token=...
// Returns: full session object
```

**`app/api/chat/route.ts`** — POST, returns SSE stream
```ts
// POST: send message
// Body: { sessionId, message, guestToken? }
// Returns: SSE stream
// Each event: data: { type: "text"|"canvas_update"|"usage"|"done", ... }
// After stream: saves assistant message + updates tokens_used in DB
```

**`app/api/canvas/route.ts`** — PATCH (autosave)
```ts
// PATCH: save canvas snapshot
// Body: { sessionId, phase, canvasData, guestToken? }
// Returns: { ok: true }
```

**`app/api/boilerplate/route.ts`** — POST, returns ZIP
```ts
// POST: generate boilerplate
// Body: { template: 'A'|'B'|'C', projectName, features: string[], sessionId }
// Returns: ZIP file (application/zip)
// Templates are static files in lib/templates/[A|B|C]/**
```

### Auth middleware pattern (for all routes)
```ts
// Helper: resolveSession(req) → Session | null
// Checks Clerk auth first, falls back to guestToken header/cookie
// Returns null if neither matches a valid session
```

### Success Criteria
- [ ] Manual: `curl -X POST /api/session` creates a row in DB
- [ ] Manual: `curl -X POST /api/chat` returns SSE events
- [ ] Manual: `curl -X PATCH /api/canvas` saves a canvas_snapshot row

---

## Phase 5: Onboarding Wizard

### Files to CREATE

**`components/onboarding/OnboardingWizard.tsx`**
```
Step 1 (required):
  - Hackathon track (text input)
  - Time limit (number input, hours)
  - Team size (1-10 stepper)
  [Continue →]

Step 2 (encouraged):
  - Per-person expertise (add person → name + skill ratings)
  - Tools: checkboxes for common ones + free text
  [Continue →] [Skip →]

Step 3 (optional):
  - Judge names + backgrounds (textarea)
  - Hackathon-provided API keys (key-value pairs)
  [Start Hacking →] [Skip →]

On complete: POST /api/session → redirect to /session/[id]
```

**`app/(app)/session/new/page.tsx`**
- Renders `<OnboardingWizard />`
- Handles session creation + redirect

### Success Criteria
- [ ] Manual: Complete wizard, session row appears in DB, redirects to /session/[id]
- [ ] Manual: Skip to step 3 works, session created with partial data

---

## Phase 6: Chat Panel

### Files to CREATE

**`components/chat/TokenBudget.tsx`**
```tsx
// Props: tokensUsed: number, tokenBudget: number
// Renders: progress bar, "X / 60,000 tokens" label
// Colors: green → yellow at 80% → red at 95%
```

**`components/chat/MessageStream.tsx`**
```tsx
// Props: messages: Message[], isStreaming: boolean, streamingContent: string
// Renders scrollable message list
// Last assistant message renders streamingContent if isStreaming
// Auto-scrolls to bottom on new content
```

**`components/chat/ChatPanel.tsx`**
```tsx
// Props: sessionId, onCanvasUpdate(update: CanvasUpdate, phase: string) => void
// State: messages[], streamingContent, isStreaming, tokensUsed
// On submit:
//   1. Add user message to list
//   2. POST /api/chat → SSE stream
//   3. Feed chunks through StreamParser
//   4. text chunks → append to streamingContent
//   5. canvas_update chunks → call onCanvasUpdate
//   6. usage chunks → update tokensUsed
//   7. On stream end: finalize message, clear streamingContent
```

### Success Criteria
- [ ] Manual: Type message, see streaming response
- [ ] Manual: Token budget bar updates after each response
- [ ] Manual: Canvas update fires when LLM includes canvas_update block

---

## Phase 7: Canvas Panel

### Files to CREATE

**`components/canvas/nodes/FeatureNode.tsx`** — custom node for features
**`components/canvas/nodes/ServiceNode.tsx`** — custom node for services/APIs
**`components/canvas/nodes/DatabaseNode.tsx`** — custom node for DB
**`components/canvas/nodes/UserNode.tsx`** — custom node for user/actor

**`components/canvas/HackieCanvas.tsx`**
```tsx
// Props: canvasData: { nodes: CanvasNode[], edges: CanvasEdge[] }, phase: number
// State: internal React Flow nodes/edges (initialized from canvasData)

// On canvasData prop change (new canvas_update):
//   mode === 'merge': add/update nodes/edges, keep existing
//   mode === 'replace': full replace

// Auto-layout: use simple dagre layout on merge
// Empty state: "Your project map will appear here as we build your idea."

// Node type mapping:
//   'feature' → FeatureNode (blue)
//   'service' → ServiceNode (purple)
//   'database' → DatabaseNode (orange)
//   'external' → ServiceNode with dashed border (gray)
//   'user' → UserNode (green)
```

**`lib/canvas/layout.ts`**
```ts
// Auto-layout using dagre
// Input: nodes[], edges[]
// Output: nodes[] with position: { x, y } set
// Called on every canvas update before rendering
```

### Success Criteria
- [ ] Manual: Triggering a canvas_update from chat adds nodes to the canvas
- [ ] Manual: Merge mode preserves existing nodes
- [ ] Manual: Empty state shows when no nodes

---

## Phase 8: Split Pane + Phase Navigation

### Files to CREATE / MODIFY

**`app/(app)/session/[id]/page.tsx`** — COMPLETE this file
```tsx
// Loads session from /api/session?id=[id]
// Renders:
//
// ┌──── Phase Sidebar ─────┬──── Canvas (55%) ────┬── Chat (45%) ──┐
// │ 1 ✅ Context           │                      │                │
// │ 2 → Idea              │  <HackieCanvas />    │ <ChatPanel />  │
// │ 3   Features          │                      │                │
// │ 4   Architecture      │                      │                │
// │ 5   Tech Stack        │                      │                │
// │ 6   Design            │                      │                │
// └────────────────────────┴──────────────────────┴────────────────┘
//
// State: canvasData (updated by ChatPanel via onCanvasUpdate callback)
// Autosave: debounce(PATCH /api/canvas, 2000ms) on canvasData change
// Phase switching: clicking phase in sidebar updates system context
```

**`app/(app)/layout.tsx`**
```tsx
// Clerk auth check (optional — guests pass through)
// Sets up session cookie for guest token
```

### Success Criteria
- [ ] Manual: Full split pane renders
- [ ] Manual: Chatting and receiving canvas_update updates the left panel
- [ ] Manual: Phase sidebar reflects current phase

---

## Phase 9: Boilerplate Download

### Files to CREATE

**`lib/templates/A/`** — Next.js + Prisma + Clerk + Postgres template files
**`lib/templates/B/`** — FastAPI + React + JWT + SQLite template files
**`lib/templates/C/`** — Next.js + Supabase template files

Each template contains:
- README.md with setup instructions
- Correct package.json / requirements.txt
- Auth setup (pre-wired)
- DB connection setup
- Basic folder structure
- `.env.example`
- One "hello world" protected route

**`app/api/boilerplate/route.ts`** — COMPLETE
```ts
// Read template files from lib/templates/[template]/
// Replace placeholders: {{PROJECT_NAME}}, {{FEATURE_LIST}}
// Zip with JSZip
// Return as application/zip download
```

### Success Criteria
- [ ] Manual: Requesting template A downloads a ZIP
- [ ] Manual: ZIP contains correct files with project name substituted

---

## Phase 10: Share URL

### Files to CREATE

**`app/(app)/session/[id]/share/page.tsx`**
```tsx
// Query: loads session by share_token (from URL)
// Renders: HackieCanvas (read-only, no controls)
// Shows: session title, phase reached, team size
// No chat panel. No edit controls.
// Banner: "This is a read-only view of [Project Name]'s Hackie session"
```

### Success Criteria
- [ ] Manual: /session/[id]/share loads and shows canvas
- [ ] Manual: No chat, no edit controls visible

---

## Phase 11: Landing Page

### Files to CREATE / MODIFY

**`app/page.tsx`**
```
Hero: "Build a hackathon winner in 24 hours"
Sub: "AI-powered co-pilot that goes from idea to codebase — with a live visual blueprint"
CTA: [Start a new project →]

Features grid (3 cards):
1. "Honest feasibility" — We tell you what you CAN build, not what you wish you could
2. "Live visual map" — Watch your project blueprint build itself in real-time
3. "Ready to code" — Get a working boilerplate at the end, not a to-do list

Phase walkthrough (numbered steps 1-6)

Footer: minimal
```

### Success Criteria
- [ ] Manual: Landing page renders cleanly
- [ ] Manual: CTA links to /session/new

---

## ADR Files to CREATE

**`docs/architecture/adr-001-nextjs-monolith.md`**
**`docs/architecture/adr-002-sse-streaming.md`**
**`docs/architecture/adr-003-postgresql-prisma.md`**
**`docs/architecture/adr-004-clerk-auth.md`**

(Content from architecture session above)

---

## Execution Order

```
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4
    → Phase 5 → Phase 6 → Phase 7 → Phase 8
    → Phase 9 → Phase 10 → Phase 11
```

**STOP after each phase.** Verify success criteria. Report completion. Ask to proceed.
