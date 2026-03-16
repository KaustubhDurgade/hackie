'use client';

import { useEffect, useCallback, useRef } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  BackgroundVariant,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useState } from 'react';

import type { CanvasUpdate, CanvasNode, CanvasEdge } from '@/lib/canvas/schema';
import { applyDagreLayout, getDiagramLabels } from '@/lib/canvas/layout';
import { getPhaseColor } from '@/lib/canvas/colors';
import { FeatureNode }  from './nodes/FeatureNode';
import { ServiceNode }  from './nodes/ServiceNode';
import { DatabaseNode } from './nodes/DatabaseNode';
import { UserNode }     from './nodes/UserNode';
import { FloatingEdge } from './FloatingEdge';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const nodeTypes: Record<string, any> = {
  feature:   FeatureNode,
  service:   ServiceNode,
  database:  DatabaseNode,
  external:  ServiceNode,
  user:      UserNode,
  page:      FeatureNode,
  component: FeatureNode,
  label:     DiagramLabelNode,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const edgeTypes: Record<string, any> = {
  floating: FloatingEdge,
};

function DiagramLabelNode({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="pointer-events-none select-none">
      <span className="text-[10px] uppercase tracking-[0.2em] font-display font-bold text-[#a8a29e]">
        {String(data.label ?? '')}
      </span>
    </div>
  );
}

interface HackieCanvasProps {
  canvasNodes: CanvasNode[];
  canvasEdges: CanvasEdge[];
  savedPositions?: Record<string, { x: number; y: number }>;
  onNodePositionsChange?: (positions: Record<string, { x: number; y: number }>) => void;
}

function getEdgeColor(sourceNodePhase?: number): string {
  const c = getPhaseColor(sourceNodePhase);
  return c.sub || '#c8c1b8';
}

function buildReactFlowNodes(positioned: ReturnType<typeof applyDagreLayout>): Node[] {
  const labelNodes = getDiagramLabels(positioned);

  // Assign step numbers per diagram group
  const groupCounters: Map<string, number> = new Map();
  const mainNodes: Node[] = positioned.map(node => {
    const diagram = (node.data?.diagram as string) ?? 'default';
    const count = (groupCounters.get(diagram) ?? 0) + 1;
    groupCounters.set(diagram, count);
    return {
      id:       node.id,
      type:     node.type,
      position: node.position,
      data:     { label: node.label, phase: node.phase, step: count, ...(node.data ?? {}) },
    };
  });

  const labelRfNodes: Node[] = labelNodes.map(l => ({
    id:          l.id,
    type:        'label',
    position:    { x: l.x, y: l.y },
    data:        { label: l.label },
    selectable:  false,
    draggable:   false,
    connectable: false,
  }));

  return [...mainNodes, ...labelRfNodes];
}

function buildReactFlowEdges(edges: CanvasEdge[], phaseByNodeId: Map<string, number>): Edge[] {
  return edges.map(edge => {
    const phase = phaseByNodeId.get(edge.source);
    const color = getEdgeColor(phase);
    return {
      id:           edge.id,
      type:         'floating',
      source:       edge.source,
      target:       edge.target,
      label:        edge.label,
      animated:     edge.type === 'data' || edge.type === 'api-call',
      markerEnd:    { type: MarkerType.ArrowClosed, color },
      style:        { stroke: color, strokeWidth: 1.5 },
      labelStyle:   { fill: '#6b6560', fontSize: 9 },
      labelBgStyle: { fill: '#ffffff', fillOpacity: 0.85 },
    };
  });
}

export function HackieCanvas({ canvasNodes, canvasEdges, savedPositions, onNodePositionsChange }: HackieCanvasProps) {
  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([]);
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Always-current map of node positions so we can preserve them when new nodes are added
  const livePositionsRef = useRef<Map<string, { x: number; y: number }>>(new Map());

  // Keep livePositionsRef in sync with rfNodes on every render
  useEffect(() => {
    for (const n of rfNodes) {
      if (n.type !== 'label') livePositionsRef.current.set(n.id, n.position);
    }
  }, [rfNodes]);

  // Track last external props to avoid re-laying on drag
  const lastNodesRef = useRef<CanvasNode[]>([]);
  const lastEdgesRef = useRef<CanvasEdge[]>([]);

  useEffect(() => {
    // Only re-layout if the external props actually changed (by reference)
    if (lastNodesRef.current === canvasNodes && lastEdgesRef.current === canvasEdges) return;

    const prevNodeIds = new Set(lastNodesRef.current.map(n => n.id));
    lastNodesRef.current = canvasNodes;
    lastEdgesRef.current = canvasEdges;

    if (canvasNodes.length === 0) {
      setRfNodes([]);
      setRfEdges([]);
      return;
    }

    const positioned = applyDagreLayout(canvasNodes, canvasEdges);
    const phaseByNodeId = new Map<string, number>();
    for (const n of positioned) {
      if (n.phase != null) phaseByNodeId.set(n.id, n.phase);
    }

    // Position priority: savedPositions (drag) > livePositions (existing) > Dagre (new nodes only)
    const rfNodesToSet = buildReactFlowNodes(positioned).map(n => {
      const saved = savedPositions?.[n.id];
      if (saved) return { ...n, position: saved };
      // Preserve position of nodes that already existed on canvas
      const live = prevNodeIds.has(n.id) ? livePositionsRef.current.get(n.id) : undefined;
      return live ? { ...n, position: live } : n;
    });

    setRfNodes(rfNodesToSet);
    setRfEdges(buildReactFlowEdges(canvasEdges, phaseByNodeId));
  }, [canvasNodes, canvasEdges, savedPositions, setRfNodes, setRfEdges]);

  const handleNodeDragStop = useCallback(() => {
    if (!onNodePositionsChange) return;
    // Collect current positions of all non-label nodes from RF state
    setRfNodes(current => {
      const positions: Record<string, { x: number; y: number }> = {};
      for (const n of current) {
        if (n.type !== 'label') positions[n.id] = { x: n.position.x, y: n.position.y };
      }
      onNodePositionsChange(positions);
      return current; // no state change, just reading
    });
  }, [onNodePositionsChange, setRfNodes]);

  const isEmpty = canvasNodes.length === 0;

  return (
    <div className="w-full h-full relative" style={{ background: '#f5f3ef' }}>
      {isEmpty ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 pointer-events-none select-none">
          <p className="font-display text-4xl font-bold text-[#d4cfc8] mb-3">map.</p>
          <p className="text-[#b8b0a8] text-xs max-w-[200px] leading-relaxed uppercase tracking-widest">
            Your project map will appear here as you build.
          </p>
        </div>
      ) : null}

      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={handleNodeDragStop}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        proOptions={{ hideAttribution: true }}
        style={{ background: '#f5f3ef' }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#ddd8d0"
        />
        <Controls />
        <MiniMap
          nodeColor={node => {
            const phase = (node.data as Record<string, unknown>)?.phase as number | undefined;
            if (node.type === 'label') return 'transparent';
            const c = getPhaseColor(phase);
            return c.border;
          }}
          maskColor="rgba(245,243,239,0.75)"
          style={{ background: '#ffffff', border: '1px solid #e2ddd6' }}
        />
      </ReactFlow>
    </div>
  );
}

// Hook for managing canvas state
export function useCanvasState() {
  const [nodes, setNodes] = useState<CanvasNode[]>([]);
  const [edges, setEdges] = useState<CanvasEdge[]>([]);

  const applyUpdate = useCallback((update: CanvasUpdate) => {
    if (update.mode === 'replace') {
      setNodes(update.nodes);
      setEdges(update.edges);
    } else {
      setNodes(prev => {
        const map = new Map(prev.map(n => [n.id, n]));
        for (const n of update.nodes) map.set(n.id, n);
        return Array.from(map.values());
      });
      setEdges(prev => {
        const map = new Map(prev.map(e => [e.id, e]));
        for (const e of update.edges) map.set(e.id, e);
        return Array.from(map.values());
      });
    }
  }, []);

  const reset = useCallback(() => {
    setNodes([]);
    setEdges([]);
  }, []);

  return { nodes, edges, applyUpdate, reset };
}
