import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { SYSTEM_PROMPT, CANVAS_APPLY_SYSTEM_PROMPT } from './prompts/system';
import { PHASE_PROMPTS } from './prompts/phases';

// ─── Provider selection ───────────────────────────────────────────────────────

const USE_OLLAMA = process.env.LLM_PROVIDER === 'ollama';
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL ?? 'llama3.1';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface OrchestratorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface HackathonContext {
  track?: string;
  timeLimitHrs?: number;
  teamSize?: number;
  expertise?: Record<string, number>;
  tools?: { hackathon: string[]; personal: string[] };
  judges?: string[];
}

export interface OrchestratorContext {
  phase: number;
  hackathonContext: HackathonContext;
  messages: OrchestratorMessage[];
  tokensUsed: number;
  tokenBudget: number;
  isCanvasApply?: boolean;
}

export type StreamEvent =
  | { type: 'text'; content: string }
  | { type: 'usage'; inputTokens: number; outputTokens: number }
  | { type: 'error'; message: string };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildContextBlock(ctx: HackathonContext): string {
  const lines = [
    '## Hackathon Context',
    `Track: ${ctx.track ?? 'not specified'}`,
    `Time limit: ${ctx.timeLimitHrs != null ? `${ctx.timeLimitHrs} hours` : 'not specified'}`,
    `Team size: ${ctx.teamSize ?? 'not specified'}`,
  ];

  if (ctx.expertise && Object.keys(ctx.expertise).length > 0) {
    const raw = ctx.expertise as Record<string, unknown>;
    if (raw.skillsText) {
      lines.push(`Team skills: ${raw.skillsText}`);
    } else {
      const expertiseStr = Object.entries(raw)
        .map(([skill, level]) => `${skill} (${level}/5)`)
        .join(', ');
      lines.push(`Team expertise: ${expertiseStr}`);
    }
  }

  if (ctx.tools) {
    if (ctx.tools.hackathon.length > 0)
      lines.push(`Hackathon-provided tools: ${ctx.tools.hackathon.join(', ')}`);
    if (ctx.tools.personal.length > 0)
      lines.push(`Personal tools: ${ctx.tools.personal.join(', ')}`);
  }

  if (ctx.judges && ctx.judges.length > 0)
    lines.push(`Judges: ${ctx.judges.join(', ')}`);

  return lines.join('\n');
}

function buildSystemPrompt(ctx: OrchestratorContext): string {
  if (ctx.isCanvasApply) {
    return [CANVAS_APPLY_SYSTEM_PROMPT, buildContextBlock(ctx.hackathonContext)]
      .filter(Boolean)
      .join('\n\n---\n\n');
  }
  return [SYSTEM_PROMPT, buildContextBlock(ctx.hackathonContext), PHASE_PROMPTS[ctx.phase] ?? '']
    .filter(Boolean)
    .join('\n\n---\n\n');
}

// ─── Claude (Anthropic) provider ─────────────────────────────────────────────

async function* streamClaude(ctx: OrchestratorContext): AsyncGenerator<StreamEvent> {
  const client = new Anthropic();

  const stream = client.messages.stream({
    model:      'claude-sonnet-4-6',
    max_tokens: Math.min(4096, ctx.tokenBudget - ctx.tokensUsed),
    system:     buildSystemPrompt(ctx),
    messages:   ctx.messages,
  });

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield { type: 'text', content: event.delta.text };
    }
    if (event.type === 'message_start' && event.message.usage) {
      yield { type: 'usage', inputTokens: event.message.usage.input_tokens, outputTokens: 0 };
    }
    if (event.type === 'message_delta' && event.usage) {
      yield { type: 'usage', inputTokens: 0, outputTokens: event.usage.output_tokens };
    }
  }
}

// ─── Ollama provider (OpenAI-compatible) ─────────────────────────────────────

async function* streamOllama(ctx: OrchestratorContext): AsyncGenerator<StreamEvent> {
  const client = new OpenAI({
    baseURL: `${OLLAMA_BASE_URL}/v1`,
    apiKey:  'ollama', // required by SDK but not validated by Ollama
  });

  const systemPrompt = buildSystemPrompt(ctx);

  // OpenAI-style messages with system injected as first message
  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...ctx.messages.map(m => ({ role: m.role, content: m.content } as OpenAI.ChatCompletionMessageParam)),
  ];

  const stream = await client.chat.completions.create({
    model:    OLLAMA_MODEL,
    messages,
    stream:   true,
    // Ollama ignores max_tokens for most models but pass it anyway
    max_tokens: Math.min(4096, ctx.tokenBudget - ctx.tokensUsed),
  });

  let inputTokens  = 0;
  let outputTokens = 0;

  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content;
    if (delta) {
      yield { type: 'text', content: delta };
      outputTokens += Math.ceil(delta.length / 4); // rough estimate
    }

    // Ollama sends usage in the final chunk
    if (chunk.usage) {
      inputTokens  = chunk.usage.prompt_tokens ?? inputTokens;
      outputTokens = chunk.usage.completion_tokens ?? outputTokens;
    }
  }

  yield { type: 'usage', inputTokens, outputTokens };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function* streamResponse(ctx: OrchestratorContext): AsyncGenerator<StreamEvent> {
  if (ctx.tokensUsed >= ctx.tokenBudget) {
    yield { type: 'error', message: 'Token budget exhausted. Start a new session to continue.' };
    return;
  }

  if (USE_OLLAMA) {
    console.log(`[llm] Using Ollama — model: ${OLLAMA_MODEL} @ ${OLLAMA_BASE_URL}`);
    yield* streamOllama(ctx);
  } else {
    yield* streamClaude(ctx);
  }
}

export const currentProvider = USE_OLLAMA
  ? { name: 'ollama', model: OLLAMA_MODEL }
  : { name: 'anthropic', model: 'claude-sonnet-4-6' };
