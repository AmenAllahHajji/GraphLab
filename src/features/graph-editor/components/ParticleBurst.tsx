import React, { useEffect } from 'react';
import './ParticleBurst.css';

interface ParticleBurstProps {
  x: number;
  y: number;
  color?: string;
  onComplete: () => void;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({ x, y, color = '#c084fc', onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600); // Matches CSS animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dx = Math.cos(angle) * 45;
    const dy = Math.sin(angle) * 45;
    return (
      <circle
        key={i}
        cx={0} cy={0} r={4} fill={color}
        filter={`drop-shadow(0 0 6px ${color})`}
        style={{
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animation: 'burst 0.6s cubic-bezier(0.165, 0.84, 0.44, 1) forwards'
        } as React.CSSProperties}
      />
    );
  });

  return (
    <g transform={`translate(${x}, ${y})`} style={{ pointerEvents: 'none' }}>
      {particles}
    </g>
  );
};
