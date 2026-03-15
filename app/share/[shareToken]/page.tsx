'use client';

import { use, useEffect, useState } from 'react';
import { HackieCanvas } from '@/components/canvas/HackieCanvas';
import type { CanvasNode, CanvasEdge } from '@/lib/canvas/schema';

interface SharePageProps {
  params: Promise<{ shareToken: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { shareToken } = use(params);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    // Fetch by share_token — read-only, no sensitive data returned
    fetch(`/api/session?share_token=${shareToken}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); return; }
        setSession(data.session);
        const snapshots = (data.session as Record<string, unknown>).canvasSnapshots as
          Array<{ canvasData: { nodes: CanvasNode[]; edges: CanvasEdge[] } }> | undefined;
        if (snapshots && snapshots.length > 0) {
          const last = snapshots[0].canvasData;
          if (last?.nodes) { setNodes(last.nodes); setEdges(last.edges ?? []); }
        }
      })
      .catch(() => setNotFound(true));
  }, [shareToken]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
        <p className="text-[#a8a29e] text-xs uppercase tracking-widest">project not found.</p>
      </div>
    );
  }

  const sess = session as Record<string, unknown> | null;

  return (
    <div className="h-screen bg-[#f5f3ef] flex flex-col">
      <div className="border-b border-[#e2ddd6] bg-white px-5 py-3 flex items-center gap-3">
        <span className="font-display font-bold text-[#1c1917]">hackie</span>
        <span className="text-[#c8c1b8]">·</span>
        <span className="text-[#a8a29e] text-xs uppercase tracking-widest">
          {sess?.track ? `${String(sess.track)} · ` : ''}
          {sess?.teamSize ? `${String(sess.teamSize)}-person team` : 'project map'}
        </span>
        <span className="ml-auto text-[10px] text-[#c8c1b8] uppercase tracking-widest">read-only</span>
      </div>
      <div className="flex-1">
        <HackieCanvas canvasNodes={nodes} canvasEdges={edges} />
      </div>
    </div>
  );
}
