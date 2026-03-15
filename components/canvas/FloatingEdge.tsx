'use client';

import { useInternalNode, getBezierPath, type EdgeProps, Position, type InternalNode } from '@xyflow/react';

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width  ?? 150) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height ?? 50)  / 2,
  };
}

function getEdgeParams(source: InternalNode, target: InternalNode) {
  const sc = getNodeCenter(source);
  const tc = getNodeCenter(target);

  const dx = tc.x - sc.x;
  const dy = tc.y - sc.y;

  // Pick the side of each node that faces the other node
  let sourcePos: Position;
  let targetPos: Position;

  if (Math.abs(dx) >= Math.abs(dy)) {
    sourcePos = dx >= 0 ? Position.Right : Position.Left;
    targetPos = dx >= 0 ? Position.Left  : Position.Right;
  } else {
    sourcePos = dy >= 0 ? Position.Bottom : Position.Top;
    targetPos = dy >= 0 ? Position.Top    : Position.Bottom;
  }

  const sw = source.measured?.width  ?? 150;
  const sh = source.measured?.height ?? 50;
  const tw = target.measured?.width  ?? 150;
  const th = target.measured?.height ?? 50;

  const sx = source.internals.positionAbsolute.x;
  const sy = source.internals.positionAbsolute.y;
  const tx = target.internals.positionAbsolute.x;
  const ty = target.internals.positionAbsolute.y;

  const sourceX = sourcePos === Position.Right  ? sx + sw : sourcePos === Position.Left ? sx : sx + sw / 2;
  const sourceY = sourcePos === Position.Bottom ? sy + sh : sourcePos === Position.Top  ? sy : sy + sh / 2;
  const targetX = targetPos === Position.Right  ? tx + tw : targetPos === Position.Left ? tx : tx + tw / 2;
  const targetY = targetPos === Position.Bottom ? ty + th : targetPos === Position.Top  ? ty : ty + th / 2;

  return { sourceX, sourceY, sourcePos, targetX, targetY, targetPos };
}

export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  style,
  label,
  labelStyle,
  labelBgStyle,
  animated,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const { sourceX, sourceY, sourcePos, targetX, targetY, targetPos } = getEdgeParams(sourceNode, targetNode);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition: sourcePos,
    targetX, targetY, targetPosition: targetPos,
  });

  return (
    <>
      <path
        id={id}
        className={animated ? 'react-flow__edge-path animated' : 'react-flow__edge-path'}
        d={edgePath}
        markerEnd={markerEnd as string}
        style={style}
      />
      {label && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle" style={labelStyle}>
            <tspan dy={-6} style={labelBgStyle}>{String(label)}</tspan>
          </textPath>
        </text>
      )}
    </>
  );
}
