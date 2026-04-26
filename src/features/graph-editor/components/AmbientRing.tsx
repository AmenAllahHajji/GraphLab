import React from 'react';

export const AmbientRing: React.FC<{ radius: number; active?: boolean }> = ({ radius, active = false }) => {
  if (!active) return null;

  return (
    <g className="animate-[spin_8s_linear_infinite] origin-center pointer-events-none">
      <circle cx={0} cy={-radius - 8} r={2} fill="rgba(192, 132, 252, 0.6)" filter="drop-shadow(0 0 4px #c084fc)" />
      <circle cx={radius + 8} cy={0} r={1.5} fill="rgba(192, 132, 252, 0.4)" filter="drop-shadow(0 0 4px #c084fc)" />
      <circle cx={0} cy={radius + 8} r={2.5} fill="rgba(192, 132, 252, 0.8)" filter="drop-shadow(0 0 4px #c084fc)" />
    </g>
  );
};
