import React from 'react';

interface SnapGuidesProps {
  x: number | null;
  y: number | null;
  bounds: { w: number; h: number };
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ x, y, bounds }) => {
  if (x === null && y === null) return null;

  return (
    <g className="snap-guides pointer-events-none" stroke="#00ffcc" strokeWidth={1} strokeDasharray="4 4" opacity={0.4}>
      {x !== null && <line x1={x} y1={0} x2={x} y2={bounds.h} />}
      {y !== null && <line x1={0} y1={y} x2={bounds.w} y2={y} />}
    </g>
  );
};
