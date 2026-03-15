'use client';

import { useState, useCallback, KeyboardEvent, useEffect, useRef } from 'react';
import { nanoid } from 'nanoid';
import { Textarea } from '@/components/ui/textarea';
import { MessageStream, type ChatMessage } from './MessageStream';
import { TokenBudget } from './TokenBudget';
import { StreamParser } from '@/lib/llm/stream-parser';
import type { CanvasUpdate } from '@/lib/canvas/schema';

const PHASE_NAMES: Record<number, string> = {
  1: 'Idea',
  2: 'Features',
  3: 'Architecture',
  4: 'Tech Stack',
  5: 'Pitch',
};

interface ChatPanelProps {
  sessionId: string;
  currentPhase: number;
  onAdvancePhase: () => void;
  initialTokensUsed?: number;
  tokenBudget?: number;
  onCanvasUpdate: (update: CanvasUpdate) => void;
  initialMessages?: ChatMessage[];
}

export function ChatPanel({
  sessionId,
  currentPhase,
  onAdvancePhase,
  initialTokensUsed = 0,
  tokenBudget = 60000,
  onCanvasUpdate,
  initialMessages = [],
}: ChatPanelProps) {
  const [messages, setMessages]          = useState<ChatMessage[]>(initialMessages);
  const seededRef = useRef(false);

  // Seed from DB once when initialMessages arrive (async load after mount)
  useEffect(() => {
    if (seededRef.current || initialMessages.length === 0) return;
    seededRef.current = true;
    setMessages(initialMessages);
  }, [initialMessages]);
  const [input, setInput]                = useState('');
  const [isStreaming, setIsStreaming]     = useState(false);
  const [streamingContent, setStreaming] = useState('');
  const [tokensUsed, setTokensUsed]      = useState(initialTokensUsed);
  const [isApplyingCanvas, setApplyingCanvas] = useState(false);
  const [showMoveOnPrompt, setShowMoveOnPrompt] = useState(false);
  const [canvasApplied, setCanvasApplied] = useState(false);

  const prevPhaseRef = useRef(currentPhase);
  useEffect(() => {
    if (prevPhaseRef.current !== currentPhase) {
      prevPhaseRef.current = currentPhase;
      setIsStreaming(false);
      setStreaming('');
      setInput('');
      setApplyingCanvas(false);
      setShowMoveOnPrompt(false);
      setCanvasApplied(false);
    }
  }, [currentPhase]);

  const phaseMessages = messages.filter(m => m.phase === currentPhase);

  const streamRequest = useCallback(async (
    message: string,
    isApply: boolean,
  ): Promise<{ wasCanvasApply: boolean }> => {
    const guestToken = typeof window !== 'undefined'
      ? localStorage.getItem('hackie_guest_token') ?? undefined
      : undefined;

    const res = await fetch('/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ sessionId, message, guestToken, phase: currentPhase }),
    });

    if (!res.body) throw new Error('No response body');

    const reader  = res.body.getReader();
    const decoder = new TextDecoder();
    const parser  = new StreamParser();
    let assistantText = '';
    let wasCanvasApply = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const raw   = decoder.decode(value, { stream: true });
      const lines = raw.split('\n');

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const event = JSON.parse(line.slice(6));

          if (event.type === 'text') {
            const chunks = parser.process(event.content);
            for (const chunk of chunks) {
              if (chunk.type === 'text') {
                assistantText += chunk.content;
                setStreaming(assistantText);
              } else if (chunk.type === 'canvas_update') {
                onCanvasUpdate(chunk.update);
              }
            }
          }

          if (event.type === 'canvas_update') {
            onCanvasUpdate(event.update);
          }

          if (event.type === 'usage') {
            setTokensUsed(event.tokensUsed);
          }

          if (event.type === 'done') {
            wasCanvasApply = event.wasCanvasApply === true;
            const tail = parser.flush();
            for (const chunk of tail) {
              if (chunk.type === 'text') assistantText += chunk.content;
              else if (chunk.type === 'canvas_update') onCanvasUpdate(chunk.update);
            }
            setMessages(prev => [
              ...prev,
              { id: nanoid(), role: 'assistant', content: assistantText, phase: currentPhase },
            ]);
            setIsStreaming(false);
            setStreaming('');
          }

          if (event.type === 'error') {
            setMessages(prev => [
              ...prev,
              { id: nanoid(), role: 'assistant', content: `Error: ${event.message}`, phase: currentPhase },
            ]);
            setIsStreaming(false);
            setStreaming('');
          }
        } catch { /* malformed SSE line */ }
      }
    }

    return { wasCanvasApply };
  }, [sessionId, currentPhase, onCanvasUpdate]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    setInput('');
    setMessages(prev => [
      ...prev,
      { id: nanoid(), role: 'user', content: text, phase: currentPhase },
    ]);
    setIsStreaming(true);
    setStreaming('');

    try {
      const result = await streamRequest(text, false);
      if (result?.wasCanvasApply && currentPhase < 5) setShowMoveOnPrompt(true);
    } catch (err) {
      console.error('[ChatPanel] stream error:', err);
      setIsStreaming(false);
      setStreaming('');
    }
  }, [input, isStreaming, currentPhase, streamRequest]);

  const handleApplyCanvas = useCallback(async () => {
    if (isStreaming || isApplyingCanvas) return;
    setApplyingCanvas(true);
    setIsStreaming(true);
    setStreaming('');
    setShowMoveOnPrompt(false);

    try {
      await streamRequest('__CANVAS_APPLY__', true);
      setCanvasApplied(true);
      if (currentPhase < 5) setShowMoveOnPrompt(true);
    } catch (err) {
      console.error('[ChatPanel] canvas apply error:', err);
    } finally {
      setApplyingCanvas(false);
      setIsStreaming(false);
      setStreaming('');
    }
  }, [isStreaming, isApplyingCanvas, streamRequest, currentPhase]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const hasExchange   = phaseMessages.some(m => m.role === 'assistant');
  const canApply      = hasExchange && !isStreaming && !canvasApplied;
  const canNextPhase  = hasExchange && !isStreaming && currentPhase < 5;
  const nextPhaseName = PHASE_NAMES[currentPhase + 1];

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#e2ddd6]">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-[#e2ddd6] flex items-baseline gap-2 shrink-0 bg-white">
        <h2 className="font-display text-sm font-bold tracking-tight text-[#1c1917]">hackie</h2>
        <span className="text-[#a8a29e] text-xs">/ {PHASE_NAMES[currentPhase]?.toLowerCase()}</span>
      </div>

      {/* Messages */}
      <MessageStream
        messages={phaseMessages}
        streamingContent={streamingContent}
        isStreaming={isStreaming}
        currentPhase={currentPhase}
      />

      {/* Post-canvas move-on prompt */}
      {showMoveOnPrompt && canNextPhase && (
        <div className="px-4 py-3 border-t border-[#e2ddd6] bg-[#faf9f6] shrink-0">
          <p className="text-[#6b6560] text-xs mb-2.5">
            Canvas applied. Ready to move on to <span className="text-[#1c1917] font-semibold">{nextPhaseName}</span>?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setShowMoveOnPrompt(false); onAdvancePhase(); }}
              className="text-[10px] uppercase tracking-widest bg-[#1c1917] text-white px-3 py-1.5 rounded-lg hover:bg-[#3a3530] transition-colors font-semibold"
            >
              Continue →
            </button>
            <button
              onClick={() => setShowMoveOnPrompt(false)}
              className="text-[10px] uppercase tracking-widest border border-[#e2ddd6] text-[#a8a29e] px-3 py-1.5 rounded-lg hover:border-[#c8c1b8] hover:text-[#6b6560] transition-colors"
            >
              Keep iterating
            </button>
          </div>
        </div>
      )}

      {/* Action buttons */}
      {!showMoveOnPrompt && (canApply || canNextPhase) && (
        <div className="px-4 py-2.5 border-t border-[#e2ddd6] flex items-center gap-3 shrink-0 bg-white">
          {canApply && (
            <button
              onClick={handleApplyCanvas}
              disabled={isApplyingCanvas}
              className="text-[10px] uppercase tracking-widest border border-[#e2ddd6] px-3 py-1.5 rounded-lg hover:border-[#b8956a] hover:text-[#b8956a] text-[#a8a29e] transition-colors disabled:opacity-40"
            >
              {isApplyingCanvas ? 'Applying...' : canvasApplied ? 'Canvas updated ✓' : 'Apply to canvas →'}
            </button>
          )}
          {canNextPhase && (
            <button
              onClick={onAdvancePhase}
              className="text-[10px] uppercase tracking-widest text-[#a8a29e] hover:text-[#1c1917] transition-colors ml-auto"
            >
              Next: {nextPhaseName} →
            </button>
          )}
        </div>
      )}

      {/* Token budget */}
      <TokenBudget tokensUsed={tokensUsed} tokenBudget={tokenBudget} />

      {/* Input */}
      <div className="px-4 py-4 border-t border-[#e2ddd6] shrink-0 bg-white">
        <div className="flex gap-2.5 items-end">
          <Textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your idea..."
            rows={2}
            className="flex-1 resize-none bg-[#faf9f6] border-[#e2ddd6] text-[#1c1917] placeholder:text-[#c8c1b8] text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-[#b8956a] focus:border-[#b8956a]"
            disabled={isStreaming}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            className="bg-[#1c1917] text-white text-xs font-bold px-3.5 h-[4.5rem] rounded-xl hover:bg-[#3a3530] transition-colors disabled:opacity-25 disabled:cursor-not-allowed shrink-0"
          >
            {isStreaming ? '···' : 'send'}
          </button>
        </div>
        <p className="text-[10px] text-[#c8c1b8] mt-1.5 uppercase tracking-widest">Enter to send · Shift+Enter for newline</p>
      </div>
    </div>
  );
}
