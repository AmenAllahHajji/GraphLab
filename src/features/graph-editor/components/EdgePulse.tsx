import React, { useEffect, useState } from 'react';
import './EdgePulse.css';

interface EdgePulseProps {
  d: string;
  color?: string;
}

export const EdgePulse: React.FC<EdgePulseProps> = ({ d, color = '#38bdf8' }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Unmount the pulse after the animation duration (500ms)
    const timer = setTimeout(() => setIsVisible(false), 500);
    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={5}
      strokeLinecap="round"
      className="edge-pulse-animation"
      style={{
        pointerEvents: 'none',
        strokeDasharray: '0 1000'
      }}
    />
  );
};
