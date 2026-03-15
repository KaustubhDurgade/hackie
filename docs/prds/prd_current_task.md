---
date: 2026-03-14
topic: Hackie — AI Hackathon Co-Pilot (Full Build)
tags: [nextjs, react-flow, claude-api, prisma, clerk, postgresql, streaming, mvp]
status: research-complete
---

# PRD: Hackie

## What It Is

An AI-powered hackathon co-pilot with a split-pane interface.
- **Right pane**: Chat driven by Claude API (streaming)
- **Left pane**: Live visual canvas (React Flow) that builds the project blueprint in real-time as conversation progresses

## Project State

**NEW PROJECT** — empty repo, greenfield build.

---

## User Problem

Hackathon teams waste the first 2-4 hours of a hackathon on:
1. Figuring out what to build
2. Arguing about whether it's feasible
3. Debating tech stack
4. Trying to set up a boilerplate that actually works together
5. Not knowing how to pitch it

Hackie solves all five in sequence.

---

## The 6 Phases

| Phase | Name | What happens |
|---|---|---|
| 1 | Context Intake | Onboarding wizard collects hackathon info |
| 2 | Idea Validate/Generate | AI validates user idea OR generates one, with honest feasibility |
| 3 | Feature Mapping | AI proposes features → user refines → canvas nodes/edges appear |
| 4 | Architecture Diagram | AI generates layered arch diagram on canvas |
| 5 | Tech Stack + Boilerplate | AI recommends stack → user picks one of 3 templates → ZIP download |
| 6 | Design Artifacts | Landing page wireframe concept + pitch deck slide-by-slide outline |

---

## Key UX Requirement

Split pane: chat (right 45%) + visual canvas (left 55%).
Canvas evolves phase by phase. Serves as the team's project blueprint and "how we built it" artifact.

---

## Technical Constraints (from design review)

- Per-session token budget: 60,000 tokens (soft warn at 80%, hard cap)
- Auth is OPTIONAL. Guest mode = localStorage session token, 7-day TTL
- Boilerplate = 3 curated templates only (no arbitrary generation)
- Phase 6B = pitch deck TEXT OUTLINE only (no PPTX in MVP)
- Real-time collaboration = post-MVP. MVP has read-only share URL.
- Canvas autosave every 2s (debounced) to DB

---

## Stack (Decided)

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, SSE streaming, single deploy |
| UI | Tailwind CSS + shadcn/ui | Fast, consistent |
| Canvas | React Flow (`@xyflow/react`) | Interactive nodes/edges, React-native |
| AI | Anthropic SDK (`@anthropic-ai/sdk`) + `claude-sonnet-4-6` | Streaming + structured output |
| ORM | Prisma | Type-safe, excellent DX |
| DB | PostgreSQL via Neon | Serverless, free tier, zero cold starts |
| Auth | Clerk | Fastest setup, optional (guest mode) |
| ZIP | JSZip + file-saver | Client-side boilerplate download |
| Validation | Zod | Schema validation for canvas updates |

---

## Critical Technical Mechanism: Stream Parser

Every LLM response can embed canvas updates inline:

```xml
<canvas_update type="phase_3_features">
{
  "nodes": [...],
  "edges": [...],
  "mode": "merge"
}
</canvas_update>
```

The stream parser:
1. Pipes normal text to chat UI
2. Buffers content between `<canvas_update>` tags
3. Validates with Zod on tag close
4. Dispatches canvas state update
5. Triggers 2s debounced DB autosave
6. On failure: logs silently, canvas unchanged

**This is the first thing to build.** All other phases depend on it.

---

## Database Schema (3 tables)

### sessions
- id (UUID PK)
- share_token (VARCHAR 12, UNIQUE) — read-only share URL
- user_id (VARCHAR, nullable) — Clerk user ID
- guest_token (VARCHAR, nullable) — localStorage guest token
- track, time_limit, team_size (hackathon context)
- expertise, tools, judges (JSONB)
- current_phase (INTEGER, default 1)
- phase_data (JSONB) — all phase outputs
- tokens_used, token_budget (INTEGER)
- created_at, updated_at, expires_at

### canvas_snapshots
- id (UUID PK)
- session_id (FK → sessions)
- phase (INTEGER)
- canvas_data (JSONB) — { nodes: [], edges: [] }
- created_at

### messages
- id (UUID PK)
- session_id (FK → sessions)
- role (VARCHAR 10: 'user' | 'assistant')
- content (TEXT)
- phase (INTEGER)
- tokens (INTEGER)
- created_at

---

## Folder Structure (Target)

```
hackie/
├── app/
│   ├── (app)/
│   │   ├── session/
│   │   │   ├── [id]/
│   │   │   │   ├── page.tsx          # main split-pane app
│   │   │   │   └── share/page.tsx    # read-only canvas view
│   │   │   └── new/page.tsx          # onboarding wizard
│   │   └── layout.tsx
│   ├── api/
│   │   ├── chat/route.ts             # SSE stream endpoint
│   │   ├── session/route.ts          # create / load session
│   │   ├── canvas/route.ts           # autosave canvas state
│   │   └── boilerplate/route.ts      # ZIP generation
│   └── page.tsx                      # landing page
├── components/
│   ├── canvas/
│   │   ├── HackieCanvas.tsx
│   │   ├── nodes/
│   │   └── edges/
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── MessageStream.tsx
│   │   └── TokenBudget.tsx
│   └── onboarding/
│       └── OnboardingWizard.tsx
├── lib/
│   ├── llm/
│   │   ├── orchestrator.ts
│   │   ├── stream-parser.ts          # CRITICAL — build first
│   │   └── prompts/
│   ├── canvas/
│   │   └── schema.ts                 # Zod canvas update schema
│   └── db/
│       └── prisma.ts
├── prisma/
│   └── schema.prisma
└── docs/
    ├── prds/
    ├── specs/
    └── architecture/
        ├── adr-001-nextjs-monolith.md
        ├── adr-002-sse-streaming.md
        ├── adr-003-postgresql-prisma.md
        └── adr-004-clerk-auth.md
```

---

## Post-MVP Backlog

- Real-time collaborative editing (Yjs/CRDT)
- PPTX pitch deck generation
- PDF/PNG canvas export
- Session replay timeline
- Hackathon template library
- Judge persona simulation

---

## Build Order (from Arbiter recommendation)

1. Stream parser + canvas schema (foundation — everything depends on this)
2. DB schema + Prisma setup
3. Next.js project scaffold + Clerk auth
4. Onboarding wizard (Phase 1)
5. Chat panel + SSE streaming (Phase 2)
6. Canvas panel + React Flow (Phase 3)
7. Architecture diagram phase (Phase 4)
8. Boilerplate generation (Phase 5)
9. Design artifacts (Phase 6)
10. Landing page
