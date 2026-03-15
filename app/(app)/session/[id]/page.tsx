'use client';

import { use, useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import { HackieCanvas, useCanvasState } from '@/components/canvas/HackieCanvas';
import { ChatPanel } from '@/components/chat/ChatPanel';
import type { ChatMessage } from '@/components/chat/MessageStream';
import type { CanvasUpdate } from '@/lib/canvas/schema';
import { cn } from '@/lib/utils';

const PHASES = [
  { id: 1, label: 'Idea'         },
  { id: 2, label: 'Features'     },
  { id: 3, label: 'Architecture' },
  { id: 4, label: 'Tech Stack'   },
  { id: 5, label: 'Pitch'        },
];

interface SessionPageProps {
  params: Promise<{ id: string }>;
}

export default function SessionPage({ params }: SessionPageProps) {
  const { id: sessionId } = use(params);
  const router = useRouter();

  const [session, setSession]               = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]               = useState(true);
  const [currentPhase, setCurrentPhase]     = useState(1);
  const [maxUnlockedPhase, setMaxUnlocked]  = useState(1);
  const [shareUrl, setShareUrl]             = useState('');
  const [copied, setCopied]                 = useState(false);
  const [persistedMessages, setPersistedMessages] = useState<ChatMessage[]>([]);

  const { nodes, edges, applyUpdate } = useCanvasState();

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autosave = useCallback((canvasNodes: typeof nodes, canvasEdges: typeof edges) => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(async () => {
      const guestToken = localStorage.getItem('hackie_guest_token');
      await fetch('/api/canvas', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          sessionId,
          phase:      currentPhase,
          canvasData: { nodes: canvasNodes, edges: canvasEdges, mode: 'replace' },
          guestToken,
        }),
      }).catch(console.error);
    }, 2000);
  }, [sessionId, currentPhase]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (nodes.length > 0) autosave(nodes, edges);
  }, [nodes, edges, autosave]);

  useEffect(() => {
    const guestToken = localStorage.getItem('hackie_guest_token');
    fetch(`/api/session?id=${sessionId}${guestToken ? `&guest_token=${guestToken}` : ''}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { router.push('/'); return; }
        setSession(data.session);
        const phase = (data.session as Record<string, unknown>).currentPhase as number ?? 1;
        setCurrentPhase(phase);
        setMaxUnlocked(phase);
        setShareUrl(`${window.location.origin}/session/${sessionId}/share`);

        // Load persisted messages
        const rawMessages = (data.session as Record<string, unknown>).messages as
          Array<{ id: string; role: string; content: string; phase: number | null }> | undefined;
        if (rawMessages) {
          const msgs: ChatMessage[] = rawMessages.map(m => ({
            id:      m.id,
            role:    m.role as 'user' | 'assistant',
            content: m.content,
            phase:   m.phase ?? 1,
          }));
          setPersistedMessages(msgs);
        }

        // Restore canvas snapshot
        const snapshots = (data.session as Record<string, unknown>).canvasSnapshots as
          Array<{ canvasData: { nodes: unknown[]; edges: unknown[] } }> | undefined;
        if (snapshots && snapshots.length > 0) {
          const last = snapshots[0].canvasData;
          if (last?.nodes) applyUpdate({ nodes: last.nodes as CanvasUpdate['nodes'], edges: (last.edges ?? []) as CanvasUpdate['edges'], mode: 'replace' });
        }
      })
      .finally(() => setLoading(false));
  }, [sessionId, router, applyUpdate]);

  const handleCanvasUpdate = useCallback((update: CanvasUpdate) => {
    applyUpdate(update);
  }, [applyUpdate]);

  const handleAdvancePhase = useCallback(() => {
    const next = Math.min(currentPhase + 1, 5);
    setCurrentPhase(next);
    setMaxUnlocked(prev => Math.max(prev, next));
  }, [currentPhase]);

  const handlePhaseClick = useCallback((phaseId: number) => {
    if (phaseId <= maxUnlockedPhase) setCurrentPhase(phaseId);
  }, [maxUnlockedPhase]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <div className="text-[#a8a29e] text-xs animate-pulse uppercase tracking-widest">loading...</div>
      </div>
    );
  }

  const sess = session as Record<string, unknown> | null;
  const phaseInitialMessages = persistedMessages.filter(m => m.phase === currentPhase);

  return (
    <div className="h-screen bg-[#f5f3ef] flex overflow-hidden">

      {/* Phase Sidebar */}
      <aside className="w-44 border-r border-[#e2ddd6] bg-white flex flex-col py-5 px-3 shrink-0">
        <div className="mb-6 px-2">
          <span className="font-display text-base font-bold tracking-tight text-[#1c1917]">hackie</span>
          {!!sess?.track && (
            <p className="text-[10px] text-[#a8a29e] mt-0.5 truncate uppercase tracking-widest">{String(sess.track)}</p>
          )}
        </div>

        <div className="space-y-0.5">
          {PHASES.map(phase => {
            const unlocked = phase.id <= maxUnlockedPhase;
            const active   = phase.id === currentPhase;
            const done     = phase.id < currentPhase;
            return (
              <button
                key={phase.id}
                onClick={() => handlePhaseClick(phase.id)}
                disabled={!unlocked}
                title={!unlocked ? 'Complete the current phase to unlock' : undefined}
                className={cn(
                  'flex items-center gap-2.5 px-2 py-1.5 text-left text-xs w-full transition-colors rounded-lg',
                  !unlocked  ? 'opacity-25 cursor-not-allowed' :
                  active     ? 'bg-[#1c1917] text-white cursor-pointer' :
                  done       ? 'text-[#6b6560] hover:bg-[#f5f3ef] cursor-pointer' :
                               'text-[#c8c1b8] hover:bg-[#f5f3ef] cursor-pointer'
                )}
              >
                <span className={cn(
                  'font-display text-[10px] tracking-widest w-5 shrink-0',
                  active ? 'text-white' : 'text-[#c8c1b8]'
                )}>
                  {String(phase.id).padStart(2, '0')}
                </span>
                <span className="truncate">{phase.label}</span>
                {done && <span className="ml-auto text-[10px] opacity-60">✓</span>}
              </button>
            );
          })}
        </div>

        <div className="mt-auto px-2 space-y-2">
          {shareUrl && (
            <button
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-[10px] transition-colors w-full text-left uppercase tracking-widest rounded"
              style={{ color: copied ? '#1c1917' : '#a8a29e' }}
              title={shareUrl}
            >
              {copied ? 'copied!' : 'copy share link'}
            </button>
          )}
          {!!sess?.teamSize && (
            <p className="text-[10px] text-[#c8c1b8] uppercase tracking-widest">{String(sess.teamSize)} people</p>
          )}
          <div className="pt-1">
            <UserButton
              appearance={{
                variables: { colorBackground: '#ffffff', colorText: '#1c1917', borderRadius: '8px' },
                elements: {
                  avatarBox: 'w-6 h-6',
                  userButtonPopoverCard: 'bg-white border border-[#e2ddd6] shadow-md rounded-xl',
                  userButtonPopoverActionButton: 'text-[#1c1917] hover:bg-[#f5f3ef] rounded-lg',
                  userButtonPopoverActionButtonText: 'text-[#1c1917] text-xs uppercase tracking-widest',
                  userButtonPopoverFooter: 'hidden',
                },
              }}
            />
          </div>
        </div>
      </aside>

      {/* Canvas */}
      <div className="flex-1 min-w-0" style={{ flexBasis: '55%', flexGrow: 0 }}>
        <HackieCanvas canvasNodes={nodes} canvasEdges={edges} />
      </div>

      {/* Chat — keyed by currentPhase so streaming state resets; initialMessages seed from DB */}
      <div key={currentPhase} style={{ flexBasis: '45%', flexGrow: 0 }} className="min-w-0">
        <ChatPanel
          sessionId={sessionId}
          currentPhase={currentPhase}
          onAdvancePhase={handleAdvancePhase}
          initialTokensUsed={sess?.tokensUsed as number ?? 0}
          tokenBudget={sess?.tokenBudget as number ?? 60000}
          onCanvasUpdate={handleCanvasUpdate}
          initialMessages={phaseInitialMessages}
        />
      </div>

    </div>
  );
}
