import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getPhaseColor } from '@/lib/canvas/colors';

export function DatabaseNode({ data }: NodeProps) {
  const d = data as { label?: string; phase?: number; sublabel?: string; step?: number };
  const c = getPhaseColor(d.phase);
  return (
    <div
      style={{ background: c.border, borderColor: c.border }}
      className="border rounded-lg px-3 py-2 min-w-[130px] max-w-[175px] shadow-sm"
    >
      <Handle type="target" position={Position.Top}    style={{ background: c.bg, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
      <div className="flex items-start gap-1.5">
        {d.step != null && (
          <span style={{ background: c.bg, color: c.border }} className="text-[9px] font-bold rounded-sm w-4 h-4 flex items-center justify-center shrink-0 mt-px">
            {d.step}
          </span>
        )}
        <div style={{ color: c.bg }} className="text-[11px] font-semibold leading-tight">{String(d.label ?? '')}</div>
      </div>
      {d.sublabel && <div style={{ color: c.bg, opacity: 0.75 }} className="text-[9px] mt-1 leading-tight">{d.sublabel}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: c.bg, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
    </div>
  );
}
