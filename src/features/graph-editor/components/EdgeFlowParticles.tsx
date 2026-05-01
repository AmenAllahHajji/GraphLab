import React, { useEffect, useRef } from 'react';

interface EdgeFlowParticlesProps {
  pathRef: React.RefObject<SVGPathElement | null>;
  particleCount?: number;
  speed?: number;
  color?: string;
  isActive?: boolean;
  reverse?: boolean;
}

export const EdgeFlowParticles: React.FC<EdgeFlowParticlesProps> = ({
  pathRef,
  particleCount = 3,
  speed = 1,
  color = '#00ffcc',
  isActive = true,
  reverse = false,
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number | null>(null);
  const progressRef = useRef<number[]>(
    Array(particleCount)
      .fill(0)
      .map((_, i) => i / particleCount)
  );

  useEffect(() => {
    if (!isActive || !pathRef.current || !groupRef.current) {
      if (animationRef.current !== null) cancelAnimationFrame(animationRef.current);
      return;
    }

    const path = pathRef.current;
    const particles = Array.from(groupRef.current.children) as SVGCircleElement[];

    const animate = () => {
      const pathLength = path.getTotalLength();

      if (pathLength > 0) {
        progressRef.current = progressRef.current.map((p, i) => {
          const move = speed / pathLength;
          let newProgress = reverse ? p - move : p + move;
          
          // Smooth wrap-around
          if (newProgress > 1) newProgress -= 1;
          if (newProgress < 0) newProgress += 1;

          try {
            const point = path.getPointAtLength(newProgress * pathLength);
            particles[i].setAttribute('cx', point.x.toString());
            particles[i].setAttribute('cy', point.y.toString());
          } catch (e) {
            // Path might be invalid during updates
          }

          return newProgress;
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [pathRef, speed, isActive, particleCount, reverse]);

  if (!isActive) return null;

  return (
    <g ref={groupRef} style={{ pointerEvents: 'none' }}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r={2.5} fill={color} opacity={0.6} filter="drop-shadow(0 0 3px #00ffcc)" />
      ))}
    </g>
  );
};
