import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getPhaseColor } from '@/lib/canvas/colors';

export function FeatureNode({ data }: NodeProps) {
  const d = data as { label?: string; phase?: number; sublabel?: string; step?: number };
  const c = getPhaseColor(d.phase);
  return (
    <div
      style={{ background: c.bg, borderColor: c.border }}
      className="border rounded-xl px-3 py-2 min-w-[130px] max-w-[175px] shadow-sm"
    >
      <Handle type="target" position={Position.Top}    style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
      <Handle type="target" position={Position.Left}   style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
      <div className="flex items-start gap-1.5">
        {d.step != null && (
          <span style={{ background: c.border, color: c.bg }} className="text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shrink-0 mt-px">
            {d.step}
          </span>
        )}
        <div style={{ color: c.text }} className="text-[11px] font-medium leading-tight">{String(d.label ?? '')}</div>
      </div>
      {d.sublabel && <div style={{ color: c.sub }} className="text-[9px] mt-1 leading-tight opacity-80">{d.sublabel}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
      <Handle type="source" position={Position.Right}  style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
    </div>
  );
}
