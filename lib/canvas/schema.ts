import { z } from 'zod';

export const NodeTypeSchema = z.enum([
  'feature',
  'service',
  'database',
  'external',
  'user',
  'page',
  'component',
]);

export const EdgeTypeSchema = z.enum([
  'data',
  'user-flow',
  'dependency',
  'api-call',
]);

export const CanvasNodeSchema = z.object({
  id:    z.string(),
  label: z.string(),
  type:  NodeTypeSchema,
  phase: z.number().int().min(1).max(6),
  data:  z.record(z.string(), z.unknown()).optional(),
  position: z
    .object({ x: z.number(), y: z.number() })
    .optional(),
});

export const CanvasEdgeSchema = z.object({
  id:     z.string(),
  source: z.string(),
  target: z.string(),
  label:  z.string().optional(),
  type:   EdgeTypeSchema.optional(),
});

export const CanvasUpdateSchema = z.object({
  nodes: z.array(CanvasNodeSchema),
  edges: z.array(CanvasEdgeSchema),
  mode:  z.enum(['replace', 'merge']).default('merge'),
});

export type CanvasUpdate = z.infer<typeof CanvasUpdateSchema>;
export type CanvasNode   = z.infer<typeof CanvasNodeSchema>;
export type CanvasEdge   = z.infer<typeof CanvasEdgeSchema>;
export type NodeType     = z.infer<typeof NodeTypeSchema>;
export type EdgeType     = z.infer<typeof EdgeTypeSchema>;
