'use client';

import { use, useEffect, useState } from 'react';
import { HackieCanvas } from '@/components/canvas/HackieCanvas';
import type { CanvasNode, CanvasEdge } from '@/lib/canvas/schema';

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export default function SharePage({ params }: SharePageProps) {
  const { id: sessionId } = use(params);
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/session?id=${sessionId}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) { setNotFound(true); return; }
        setSession(data.session);
        const snapshots = (data.session as Record<string, unknown>).canvasSnapshots as Array<{ canvasData: { nodes: CanvasNode[]; edges: CanvasEdge[] } }> | undefined;
        if (snapshots && snapshots.length > 0) {
          const last = snapshots[0].canvasData;
          if (last?.nodes) { setNodes(last.nodes); setEdges(last.edges ?? []); }
        }
      })
      .catch(() => setNotFound(true));
  }, [sessionId]);

  if (notFound) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-[#333] text-xs uppercase tracking-widest">session not found.</p>
      </div>
    );
  }

  const sess = session as Record<string, unknown> | null;

  return (
    <div className="h-screen bg-black flex flex-col">
      <div className="border-b border-[#111] px-5 py-3 flex items-center gap-3">
        <span className="font-display font-bold text-white">hackie</span>
        <span className="text-[#222]">·</span>
        <span className="text-[#444] text-xs uppercase tracking-widest">
          {sess?.track ? `${String(sess.track)} · ` : ''}
          {sess?.teamSize ? `${String(sess.teamSize)}-person team` : 'project map'}
        </span>
        <span className="ml-auto text-[10px] text-[#222] uppercase tracking-widest">read-only</span>
      </div>
      <div className="flex-1">
        <HackieCanvas canvasNodes={nodes} canvasEdges={edges} />
      </div>
    </div>
  );
}
