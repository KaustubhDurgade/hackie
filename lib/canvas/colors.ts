export interface PhaseColor {
  bg: string;
  border: string;
  text: string;
  sub: string;
  handle: string;
}

export const PHASE_COLORS: Record<number, PhaseColor> = {
  1: { bg: '#eef4ff', border: '#6b9fdc', text: '#1e3a5f', sub: '#4a80c4', handle: '#6b9fdc' },
  2: { bg: '#edfaf3', border: '#5bbb8a', text: '#1a4030', sub: '#3a9b6b', handle: '#5bbb8a' },
  3: { bg: '#fff8ec', border: '#d4924a', text: '#5a3200', sub: '#c47a2a', handle: '#d4924a' },
  4: { bg: '#f3eeff', border: '#9076d4', text: '#2d1a5c', sub: '#7459bc', handle: '#9076d4' },
  5: { bg: '#ffeef5', border: '#d4688a', text: '#5a1a2f', sub: '#c04a72', handle: '#d4688a' },
};

export const DEFAULT_COLOR: PhaseColor = {
  bg: '#f5f3ef', border: '#c8c1b8', text: '#3a3530', sub: '#a8a29e', handle: '#b8b0a8',
};

export function getPhaseColor(phase?: number): PhaseColor {
  if (phase != null && PHASE_COLORS[phase]) return PHASE_COLORS[phase];
  return DEFAULT_COLOR;
}
