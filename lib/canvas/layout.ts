import dagre from '@dagrejs/dagre';
import type { CanvasNode, CanvasEdge } from './schema';

export interface PositionedNode extends CanvasNode {
  position: { x: number; y: number };
}

const NODE_WIDTH  = 160;
const NODE_HEIGHT = 52;
const PADDING     = 100;

interface DiagramConfig {
  rankdir: string;
  nodesep: number;
  ranksep: number;
}

const DIAGRAM_CONFIGS: Record<string, DiagramConfig> = {
  architecture: { rankdir: 'TB', nodesep: 70,  ranksep: 90  },
  userflow:     { rankdir: 'LR', nodesep: 55,  ranksep: 110 },
  dataflow:     { rankdir: 'LR', nodesep: 55,  ranksep: 110 },
  default:      { rankdir: 'TB', nodesep: 60,  ranksep: 80  },
};

function layoutGroup(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  config: DiagramConfig,
  offsetX: number,
  offsetY: number,
): PositionedNode[] {
  if (nodes.length === 0) return [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: config.rankdir, nodesep: config.nodesep, ranksep: config.ranksep });

  for (const node of nodes) {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  }

  const nodeIds = new Set(nodes.map(n => n.id));
  for (const edge of edges) {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      g.setEdge(edge.source, edge.target);
    }
  }

  dagre.layout(g);

  return nodes.map(node => {
    const pos = g.node(node.id);
    return {
      ...node,
      position: pos
        ? { x: pos.x - NODE_WIDTH / 2 + offsetX, y: pos.y - NODE_HEIGHT / 2 + offsetY }
        : node.position ?? { x: offsetX, y: offsetY },
    };
  });
}

function getBounds(nodes: PositionedNode[]) {
  if (nodes.length === 0) return { width: 0, height: 0 };
  const maxX = Math.max(...nodes.map(n => n.position.x + NODE_WIDTH));
  const maxY = Math.max(...nodes.map(n => n.position.y + NODE_HEIGHT));
  return { width: maxX, height: maxY };
}

export function applyDagreLayout(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): PositionedNode[] {
  if (nodes.length === 0) return [];

  // Group nodes by their data.diagram field
  const groups: Map<string, CanvasNode[]> = new Map();
  for (const node of nodes) {
    const diagram = (node.data?.diagram as string) ?? 'default';
    if (!groups.has(diagram)) groups.set(diagram, []);
    groups.get(diagram)!.push(node);
  }

  const diagramKeys = Array.from(groups.keys());

  // Single-group shortcut (most phases)
  if (diagramKeys.length === 1) {
    const key    = diagramKeys[0];
    const config = DIAGRAM_CONFIGS[key] ?? DIAGRAM_CONFIGS['default'];
    return layoutGroup(groups.get(key)!, edges, config, 0, 0);
  }

  // Multi-diagram layout: architecture (TL), userflow (TR), dataflow (bottom)
  // Step 1: layout each group at origin to get its natural bounds
  const LABEL_OFFSET = 36; // reserved for diagram label node above each section
  const tempLayouts: Map<string, PositionedNode[]> = new Map();

  for (const [key, groupNodes] of groups) {
    const config = DIAGRAM_CONFIGS[key] ?? DIAGRAM_CONFIGS['default'];
    const temp   = layoutGroup(groupNodes, edges, config, 0, 0);
    tempLayouts.set(key, temp);
  }

  // Step 2: arrange diagrams in a 2-column grid
  // Row 1: architecture (col 0) + userflow (col 1)
  // Row 2: dataflow (full width, centered)
  const archNodes = tempLayouts.get('architecture') ?? [];
  const userNodes = tempLayouts.get('userflow')     ?? [];
  const dataNodes = tempLayouts.get('dataflow')     ?? [];
  const extraDiagrams = diagramKeys.filter(k => !['architecture', 'userflow', 'dataflow'].includes(k));

  const archBounds = getBounds(archNodes);
  const userBounds = getBounds(userNodes);
  const dataBounds = getBounds(dataNodes);

  const row1Height = Math.max(archBounds.height, userBounds.height, 100);
  const row2Y      = row1Height + PADDING + LABEL_OFFSET;

  const positioned: PositionedNode[] = [];

  const reposition = (nodes: PositionedNode[], dx: number, dy: number) => {
    for (const n of nodes) {
      positioned.push({ ...n, position: { x: n.position.x + dx, y: n.position.y + dy } });
    }
  };

  // architecture: top-left
  reposition(archNodes, 0, LABEL_OFFSET);

  // userflow: top-right, offset past architecture
  const userOffsetX = archBounds.width > 0 ? archBounds.width + PADDING : 0;
  reposition(userNodes, userOffsetX, LABEL_OFFSET);

  // dataflow: bottom row
  reposition(dataNodes, 0, row2Y);

  // any other groups stacked below data flow
  let extraY = row2Y + dataBounds.height + PADDING;
  for (const key of extraDiagrams) {
    const nodes = tempLayouts.get(key) ?? [];
    if (nodes.length > 0) {
      reposition(nodes, 0, extraY);
      extraY += getBounds(nodes).height + PADDING;
    }
  }

  return positioned;
}

// Returns a map of diagram → {label, x, y} for rendering section headers in the canvas
export function getDiagramLabels(nodes: PositionedNode[]): Array<{ id: string; label: string; x: number; y: number }> {
  const LABEL_MAP: Record<string, string> = {
    architecture: 'System Architecture',
    userflow:     'User Flow',
    dataflow:     'Data Flow',
  };

  const groups: Map<string, PositionedNode[]> = new Map();
  for (const node of nodes) {
    const diagram = (node.data?.diagram as string) ?? 'default';
    if (diagram === 'default') continue; // no label for single-diagram layouts
    if (!groups.has(diagram)) groups.set(diagram, []);
    groups.get(diagram)!.push(node);
  }

  const labels: Array<{ id: string; label: string; x: number; y: number }> = [];
  for (const [key, groupNodes] of groups) {
    if (!LABEL_MAP[key]) continue;
    const minX = Math.min(...groupNodes.map(n => n.position.x));
    const minY = Math.min(...groupNodes.map(n => n.position.y));
    labels.push({ id: `__label_${key}`, label: LABEL_MAP[key], x: minX, y: minY - 32 });
  }

  return labels;
}
