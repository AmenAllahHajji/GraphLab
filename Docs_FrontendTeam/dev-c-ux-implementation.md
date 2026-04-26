# Dev C: UX, Interaction, and Animation Implementations

This document provides production-ready React + TypeScript implementations for the UX Intelligence, Interaction, and Animation features assigned to Dev C. 

The focus is on **high performance** (avoiding React re-renders for animations), **modularity**, and **smooth visual feedback**.

---

## SPRINT 1 — DEMO IMPACT

### 1. Keyboard Shortcut System
**Approach:** 
A Context-based global shortcut manager. We use a custom hook `useShortcut` that registers handlers into a central registry. A single `keydown` event listener on the `window` handles execution, ensuring we don't attach dozens of event listeners. We also check `document.activeElement` to ignore typing inside inputs.

**Performance Consideration:**
A single global event listener. Handlers are stored in a mutable `useRef` registry, preventing React re-renders when shortcuts are added/removed.

```tsx
import React, { createContext, useContext, useEffect, useRef, useCallback } from 'react';

type ShortcutCallback = (e: KeyboardEvent) => void;
type ShortcutRegistry = Map<string, ShortcutCallback[]>;

interface ShortcutContextValue {
  registerShortcut: (keys: string, callback: ShortcutCallback) => void;
  unregisterShortcut: (keys: string, callback: ShortcutCallback) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const registry = useRef<ShortcutRegistry>(new Map());

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if typing in an input
    const target = e.target as HTMLElement;
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return;

    // Normalize shortcut string (e.g., "Ctrl+Shift+Z")
    const keys = [];
    if (e.ctrlKey || e.metaKey) keys.push('Ctrl');
    if (e.shiftKey) keys.push('Shift');
    if (e.altKey) keys.push('Alt');
    if (e.key && !['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) {
      keys.push(e.key.toUpperCase());
    }

    const shortcutKey = keys.join('+');
    const callbacks = registry.current.get(shortcutKey);

    if (callbacks && callbacks.length > 0) {
      e.preventDefault();
      callbacks.forEach(cb => cb(e));
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const registerShortcut = useCallback((keys: string, callback: ShortcutCallback) => {
    const normalized = keys.toUpperCase();
    const current = registry.current.get(normalized) || [];
    registry.current.set(normalized, [...current, callback]);
  }, []);

  const unregisterShortcut = useCallback((keys: string, callback: ShortcutCallback) => {
    const normalized = keys.toUpperCase();
    const current = registry.current.get(normalized) || [];
    registry.current.set(normalized, current.filter(cb => cb !== callback));
  }, []);

  return (
    <ShortcutContext.Provider value={{ registerShortcut, unregisterShortcut }}>
      {children}
    </ShortcutContext.Provider>
  );
};

// Custom Hook
export const useShortcut = (keys: string, callback: ShortcutCallback) => {
  const context = useContext(ShortcutContext);
  if (!context) throw new Error("useShortcut must be used within ShortcutProvider");

  useEffect(() => {
    context.registerShortcut(keys, callback);
    return () => context.unregisterShortcut(keys, callback);
  }, [keys, callback, context]);
};
```

### 2. Edge Data Flow Particles
**Approach:**
To prevent React re-renders from killing performance, we use raw DOM manipulation inside `requestAnimationFrame`. The particles travel along the SVG path using `getPointAtLength`.

**Performance Consideration:**
We only render the SVG `<circle>` elements once. The animation loop updates their `cx` and `cy` attributes directly via DOM refs.

```tsx
import React, { useEffect, useRef } from 'react';

interface EdgeFlowParticlesProps {
  pathRef: React.RefObject<SVGPathElement>;
  particleCount?: number;
  speed?: number;
  color?: string;
}

export const EdgeFlowParticles: React.FC<EdgeFlowParticlesProps> = ({
  pathRef,
  particleCount = 3,
  speed = 2, // pixels per frame
  color = '#00ffcc'
}) => {
  const groupRef = useRef<SVGGElement>(null);
  const animationRef = useRef<number>();
  const progressRef = useRef<number[]>(Array(particleCount).fill(0).map((_, i) => (i / particleCount)));

  useEffect(() => {
    if (!pathRef.current || !groupRef.current) return;
    
    const path = pathRef.current;
    const pathLength = path.getTotalLength();
    const particles = Array.from(groupRef.current.children) as SVGCircleElement[];

    const animate = () => {
      progressRef.current = progressRef.current.map((p, i) => {
        let newProgress = p + (speed / pathLength);
        if (newProgress > 1) newProgress = 0; // Loop back to start
        
        const point = path.getPointAtLength(newProgress * pathLength);
        particles[i].setAttribute('cx', point.x.toString());
        particles[i].setAttribute('cy', point.y.toString());
        
        return newProgress;
      });
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current!);
  }, [pathRef, speed]);

  return (
    <g ref={groupRef} style={{ pointerEvents: 'none' }}>
      {Array.from({ length: particleCount }).map((_, i) => (
        <circle key={i} r={3} fill={color} filter="drop-shadow(0 0 4px #00ffcc)" />
      ))}
    </g>
  );
};
```

---

## SPRINT 2 — POLISH

### 3. Particle Burst on Node Creation
**Approach:** 
We use CSS keyframes injected via a standard `<style>` block or CSS module for hardware-accelerated animations. The component unmounts itself after the animation finishes.

```tsx
import React, { useEffect } from 'react';
import './ParticleBurst.css'; // Contains the animation keyframes

interface ParticleBurstProps {
  x: number;
  y: number;
  color?: string;
  onComplete: () => void;
}

export const ParticleBurst: React.FC<ParticleBurstProps> = ({ x, y, color = '#fff', onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 600); // Matches CSS animation duration
    return () => clearTimeout(timer);
  }, [onComplete]);

  const particles = Array.from({ length: 8 }).map((_, i) => {
    const angle = (i / 8) * Math.PI * 2;
    const dx = Math.cos(angle) * 40;
    const dy = Math.sin(angle) * 40;
    return (
      <circle
        key={i}
        cx={x} cy={y} r={4} fill={color}
        style={{
          '--dx': `${dx}px`,
          '--dy': `${dy}px`,
          animation: 'burst 0.6s ease-out forwards'
        } as React.CSSProperties}
      />
    );
  });

  return <g style={{ pointerEvents: 'none' }}>{particles}</g>;
};

/* CSS (ParticleBurst.css):
@keyframes burst {
  0% { transform: translate(0, 0) scale(1); opacity: 1; }
  100% { transform: translate(var(--dx), var(--dy)) scale(0); opacity: 0; }
}
*/
```

### 4. Edge Completion Pulse
**Approach:**
A secondary path overlaying the main edge path. We animate `strokeDasharray` and `strokeDashoffset` via CSS to create a fast-moving pulse.

```tsx
export const EdgePulse: React.FC<{ d: string; color?: string }> = ({ d, color = '#00ffcc' }) => {
  return (
    <path
      d={d}
      fill="none"
      stroke={color}
      strokeWidth={4}
      strokeLinecap="round"
      style={{
        pointerEvents: 'none',
        strokeDasharray: '0 1000',
        animation: 'pulse-travel 0.5s ease-out forwards'
      }}
    />
  );
};

/* CSS:
@keyframes pulse-travel {
  0% { stroke-dasharray: 0 1000; stroke-dashoffset: 0; opacity: 1; }
  50% { stroke-dasharray: 100 1000; stroke-dashoffset: -50; }
  100% { stroke-dasharray: 0 1000; stroke-dashoffset: -200; opacity: 0; }
}
*/
```

---

## SPRINT 3 — UX INTELLIGENCE

### 5. Live Graph Metrics Dashboard
**Approach:**
Calculations are wrapped in `useMemo` so they only run when nodes/edges change, preventing expensive array traversals on irrelevant renders.

```tsx
import React, { useMemo } from 'react';
import { Node, Edge } from '../types';

export const GraphMetrics: React.FC<{ nodes: Node[]; edges: Edge[] }> = ({ nodes, edges }) => {
  const metrics = useMemo(() => {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    // Density: E / (V * (V - 1)) for directed, multiply by 2 for undirected
    const maxEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    const density = nodeCount > 1 ? (edgeCount / maxEdges).toFixed(3) : 0;

    return { nodeCount, edgeCount, density };
  }, [nodes, edges]);

  return (
    <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-md p-4 rounded-xl border border-gray-700 text-sm text-gray-300">
      <h4 className="text-white font-semibold mb-2">Graph Metrics</h4>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Nodes:</span> <span className="text-right text-white">{metrics.nodeCount}</span>
        <span>Edges:</span> <span className="text-right text-white">{metrics.edgeCount}</span>
        <span>Density:</span> <span className="text-right text-white">{metrics.density}</span>
      </div>
    </div>
  );
};
```

### 6. Magnetic Snap Guides
**Approach:**
A custom hook used during the node drag handler. It compares the dragged node's X/Y with all other nodes' X/Y. If within a threshold (e.g., 10px), it locks the coordinate and returns guide line coordinates to render.

```tsx
export const useMagneticSnap = (nodes: Node[], threshold = 10) => {
  const calculateSnap = (draggingNodeId: string, rawX: number, rawY: number) => {
    let snapX = rawX;
    let snapY = rawY;
    let guideX: number | null = null;
    let guideY: number | null = null;

    nodes.forEach(node => {
      if (node.id === draggingNodeId) return;

      if (Math.abs(node.x - rawX) < threshold) {
        snapX = node.x;
        guideX = node.x;
      }
      if (Math.abs(node.y - rawY) < threshold) {
        snapY = node.y;
        guideY = node.y;
      }
    });

    return { snapX, snapY, guideX, guideY };
  };

  return { calculateSnap };
};

// Renderer Component
export const SnapGuides: React.FC<{ x: number | null; y: number | null; bounds: { w: number, h: number } }> = ({ x, y, bounds }) => (
  <g className="snap-guides" stroke="#00ffcc" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} pointerEvents="none">
    {x !== null && <line x1={x} y1={0} x2={x} y2={bounds.h} />}
    {y !== null && <line x1={0} y1={y} x2={bounds.w} y2={y} />}
  </g>
);
```

---

## SPRINT 4 — INTERACTION & ATMOSPHERE

### 7. Ghost Graph Overlay
**Approach:**
Simply re-renders a snapshot of the graph (stored in state before a major algorithm step) using the existing rendering logic but wrapped in a low-opacity, pointer-events-none group.

```tsx
export const GhostOverlay: React.FC<{ previousNodes: Node[]; previousEdges: Edge[] }> = ({ previousNodes, previousEdges }) => {
  return (
    <g opacity={0.2} style={{ pointerEvents: 'none', filter: 'grayscale(100%)' }}>
      {/* Re-use your standard GraphRenderer component here, but purely visual */}
      <GraphRenderer nodes={previousNodes} edges={previousEdges} interactive={false} />
    </g>
  );
};
```

### 8. Delete Implosion Effect
**Approach:**
When a node is deleted, we don't remove it from the React state immediately. We mark it as `isDeleting: true`, trigger a CSS animation, and use `setTimeout` to dispatch the actual Redux/Context removal action 300ms later.

```tsx
/* CSS for node group */
/*
.node-implode {
  animation: implode 0.3s cubic-bezier(0.55, 0.085, 0.68, 0.53) forwards;
}
@keyframes implode {
  0% { transform: scale(1); filter: brightness(1); }
  50% { transform: scale(1.2); filter: brightness(2); }
  100% { transform: scale(0); opacity: 0; filter: brightness(0); }
}
*/
```

### 9. Edge Weight Scrub
**Approach:**
Invisible expanded SVG path over the edge, or an invisible bounding box over the label. We use `onPointerDown` to initiate a drag state, capturing initial Y and mapping `deltaY` to weight changes.

```tsx
import React, { useState, useEffect } from 'react';

export const WeightScrubber: React.FC<{ x: number; y: number; weight: number; onChange: (w: number) => void }> = ({ x, y, weight, onChange }) => {
  const [isScrubbing, setIsScrubbing] = useState(false);

  useEffect(() => {
    if (!isScrubbing) return;
    
    const handleMove = (e: PointerEvent) => {
      // Decrease weight moving down, increase moving up
      onChange(weight - e.movementY * 0.1); 
    };
    
    const handleUp = () => setIsScrubbing(false);

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [isScrubbing, weight, onChange]);

  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect x={-15} y={-10} width={30} height={20} fill="transparent" cursor="ns-resize" onPointerDown={() => setIsScrubbing(true)} />
      <text textAnchor="middle" dominantBaseline="middle" fill={isScrubbing ? '#00ffcc' : '#fff'} pointerEvents="none">
        {Math.round(weight)}
      </text>
    </g>
  );
};
```

### 10. Animated Grid Background
**Approach:**
SVG `<pattern>` with a CSS translation applied to the `<rect>` that fills the background, creating an infinite scrolling illusion.

```tsx
export const AnimatedGrid: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <svg className="absolute inset-0 w-full h-full pointer-events-none z-[-1]">
    <defs>
      <pattern id="grid-pattern" width={size} height={size} patternUnits="userSpaceOnUse">
        <path d={`M ${size} 0 L 0 0 0 ${size}`} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={1} />
      </pattern>
    </defs>
    <rect width="200%" height="200%" fill="url(#grid-pattern)" className="animate-grid-pan" />
  </svg>
);

/* CSS:
@keyframes pan-grid {
  0% { transform: translate(0, 0); }
  100% { transform: translate(-40px, -40px); }
}
.animate-grid-pan {
  animation: pan-grid 2s linear infinite;
}
*/
```

### 11. Glitch Effect
**Approach:**
A CSS class temporarily applied to a node/edge during specific errors (e.g., trying to connect an invalid edge).

```css
.glitch-feedback {
  animation: glitch-anim 0.2s 2 linear alternate;
}
@keyframes glitch-anim {
  0% { transform: translate(0, 0); filter: hue-rotate(0deg); }
  25% { transform: translate(-2px, 2px); filter: hue-rotate(90deg); }
  50% { transform: translate(2px, -2px); filter: hue-rotate(-90deg); }
  75% { transform: translate(-2px, -2px); filter: hue-rotate(180deg); }
  100% { transform: translate(0, 0); filter: hue-rotate(0deg); }
}
```

### 12. Node Ambient Particle Ring
**Approach:**
Pure CSS rotation applied to a group of small circles around the main node. Lightweight and requires zero JS overhead.

```tsx
export const AmbientRing: React.FC<{ radius: number }> = ({ radius }) => {
  return (
    <g className="animate-spin-slow" style={{ pointerEvents: 'none', transformOrigin: 'center' }}>
      <circle cx={0} cy={-radius - 8} r={2} fill="rgba(0, 255, 204, 0.6)" />
      <circle cx={radius + 8} cy={0} r={1.5} fill="rgba(0, 255, 204, 0.4)" />
      <circle cx={0} cy={radius + 8} r={2.5} fill="rgba(0, 255, 204, 0.8)" />
    </g>
  );
};

/* CSS:
.animate-spin-slow {
  animation: spin 8s linear infinite;
}
@keyframes spin {
  100% { transform: rotate(360deg); }
}
*/
```
