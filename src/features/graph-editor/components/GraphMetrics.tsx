import React, { useMemo } from 'react';
import type { GraphEdge, NodeId } from '../../graph/model/types';

interface GraphMetricsProps {
  nodes: NodeId[];
  edges: GraphEdge[];
  directed: boolean;
}

export const GraphMetrics: React.FC<GraphMetricsProps> = ({ nodes, edges, directed }) => {
  const metrics = useMemo(() => {
    const nodeCount = nodes.length;
    const edgeCount = edges.length;
    
    let maxEdges = nodeCount > 1 ? nodeCount * (nodeCount - 1) : 1;
    if (!directed) {
      maxEdges = maxEdges / 2;
    }
    
    const density = nodeCount > 1 ? ((edgeCount / maxEdges) * 100).toFixed(1) : 0;

    return { nodeCount, edgeCount, density };
  }, [nodes, edges, directed]);

  return (
    <div className="absolute bottom-4 right-4 bg-slate-900/80 backdrop-blur-md p-3.5 rounded-xl border border-slate-700/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)] text-xs text-slate-300 pointer-events-none transition-all duration-300 z-20">
      <div className="flex items-center gap-2 mb-2.5 border-b border-slate-700/50 pb-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-400" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
        </svg>
        <h4 className="text-white font-bold uppercase tracking-widest text-[10px]">Graph Metrics</h4>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 items-center">
        <span className="text-slate-400">Nodes</span> 
        <span className="text-right text-indigo-300 font-mono font-semibold">{metrics.nodeCount}</span>
        
        <span className="text-slate-400">Edges</span> 
        <span className="text-right text-purple-300 font-mono font-semibold">{metrics.edgeCount}</span>
        
        <span className="text-slate-400">Density</span> 
        <span className="text-right text-emerald-300 font-mono font-semibold">{metrics.density}%</span>
      </div>
    </div>
  );
};
