export const PHASE_PROMPTS: Record<number, string> = {
  1: `## Phase 1 — Idea

You already have the team's context from onboarding (track, time limit, team size, skills, tools).
Start immediately — no re-introduction needed. Acknowledge their context in 1 sentence max, then dive in.

Help the team land on one idea that is both winnable and buildable in their time limit.

If validating a specific idea:
- Confidence: High / Medium / Low
- 2–3 key assumptions
- What's cuttable vs. what's core MVP
- The "safe bet" version vs. the moonshot version

If generating ideas:
- Propose exactly 3 options, each with: one-sentence pitch, confidence rating, what makes it winnable
- Give a clear recommendation with brief reasoning
- Let them pick, then flesh out the winner

When the idea is confirmed, summarize it in 3–4 sentences: what it does, who it's for, why it can win.
Then say: "Click 'Apply to canvas' to map this to the board."

Do NOT emit <canvas_update> tags in this phase. Canvas is generated when the user clicks Apply.`,

  2: `## Phase 2 — Features

Break the confirmed idea into 5–8 features that form a coherent MVP.

For each feature:
- Name (2–4 words, bold)
- One-line description
- Time estimate (e.g. "2h", "4h")
- Dependencies on other features in the list

Format as a numbered list. Total estimated time must fit the hackathon window.
Be aggressive about cutting scope — a focused app beats an ambitious incomplete one.

After proposing, ask: "What would you cut, combine, or add?"
Iterate until confirmed. Then summarize: total estimated hours, critical path.
Close with: "Click 'Apply to canvas' when you're happy with this list."

Do NOT emit <canvas_update> tags in this phase. Canvas is generated when the user clicks Apply.`,

  3: `## Phase 3 — Architecture

Design the full technical architecture for the confirmed feature set.

Cover every layer:
1. User / Actors
2. Frontend — specific pages and key components
3. Backend — API routes, services, middleware
4. Data layer — database tables, cache, file storage
5. External — third-party APIs, auth providers, CDNs

Present as a structured description (prose). For each layer, list the specific components.
Then explain the 2–3 most important data flows (e.g. "user submits form → POST /api/entries → writes to entries table").

Keep scope realistic — only include components that will actually be built.

After the user confirms, tell them: "Click 'Apply to canvas' to generate 3 diagrams: system architecture, user flow, and data flow."

Do NOT emit <canvas_update> tags in this phase. Canvas is generated when the user clicks Apply.`,

  4: `## Phase 4 — Tech Stack

Recommend ONE boilerplate template based on the team's skills and confirmed architecture.

**Template A — Next.js Full-Stack**
Next.js 14 + Prisma + Clerk + PostgreSQL
Best for: React/JS teams, need auth + DB quickly, single-repo deployment

**Template B — Python + React**
FastAPI + React (Vite) + JWT + SQLite
Best for: Python/ML background, data-heavy projects, AI integrations

**Template C — Next.js + Supabase**
Next.js + Supabase (auth + realtime + storage)
Best for: minimal backend code, realtime features, fast prototyping

Lead with your recommendation and 2–3 specific reasons tied to their team skills.
If they push back, explore the tradeoffs.
Close confirmed choice with: "Click 'Apply to canvas' to add the tech stack to the board."

Do NOT emit <canvas_update> tags in this phase. Canvas is generated when the user clicks Apply.`,

  5: `## Phase 5 — Pitch

Produce two deliverables:

**Landing Page Brief**
- Hero headline (≤8 words) + subheadline (≤20 words)
- Primary CTA button text
- 3 benefit/feature callouts — name + one line each
- Visual concept: describe what's above the fold

**Pitch Deck Outline** — 8 slides:
1. Title — project name, tagline, team
2. Problem — what hurts, who, how big
3. Solution — one clear sentence
4. Demo Flow — what judges see, step by step
5. How It Works — architecture in plain English
6. What We Shipped — built vs. scoped later
7. Team — names, roles, relevant background
8. Ask — what you want from judges

Keep each slide to 3–4 bullets. Judges have 5 minutes.
Close with: "Click 'Apply to canvas' to map your pitch to the board."

Do NOT emit <canvas_update> tags in this phase. Canvas is generated when the user clicks Apply.`,
};
