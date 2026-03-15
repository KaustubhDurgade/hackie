import { Handle, Position, type NodeProps } from '@xyflow/react';
import { getPhaseColor } from '@/lib/canvas/colors';

export function UserNode({ data }: NodeProps) {
  const d = data as { label?: string; phase?: number; sublabel?: string };
  const c = getPhaseColor(d.phase);
  return (
    <div
      style={{ background: c.bg, borderColor: c.border, borderWidth: 2 }}
      className="border px-4 py-2.5 min-w-[110px] max-w-[155px] text-center rounded-full shadow-sm"
    >
      <Handle type="target" position={Position.Top}    style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
      <div style={{ color: c.text }} className="text-[11px] font-semibold leading-tight">{String(d.label ?? '')}</div>
      {d.sublabel && <div style={{ color: c.sub }} className="text-[9px] mt-0.5 leading-tight opacity-80">{d.sublabel}</div>}
      <Handle type="source" position={Position.Bottom} style={{ background: c.handle, border: '2px solid white', width: 8, height: 8, borderRadius: 4 }} />
    </div>
  );
}
