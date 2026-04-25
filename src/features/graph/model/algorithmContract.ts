export type NodeVisualState =
  | 'idle'
  | 'frontier'
  | 'visiting'
  | 'visited'
  | 'in_path'
  | 'rejected'
  | 'source'
  | 'target'
  | 'mst_included'
  | 'flow_source'
  | 'flow_sink';

export type EdgeVisualState =
  | 'idle'
  | 'examining'
  | 'tree_edge'
  | 'relaxed'
  | 'mst_edge'
  | 'rejected_edge'
  | 'augmenting'
  | 'saturated'
  | 'flow_fill';

export interface CinemaNodeState {
  id: number;
  state: NodeVisualState;
  /** Optional badge value, e.g., distance or flow */
  badge?: string;
}

export interface CinemaEdgeState {
  id: string;
  state: EdgeVisualState;
  /** Optional badge value, e.g., capacity or relaxed distance */
  badge?: string;
}

export interface CinemaHighlight {
  type: 'convex_hull' | 'path_trace' | 'global_counter';
  /** Node IDs for convex hull, or ordered node IDs for path trace */
  nodes?: number[];
  /** Value for global counter */
  value?: string | number;
  color?: string;
}

export type AlgorithmType = 
  | 'BFS' 
  | 'DFS' 
  | 'Dijkstra' 
  | 'Prims' 
  | 'Kruskals' 
  | 'MaxFlow' 
  | 'TopologicalSort' 
  | 'BellmanFord';

export interface BaseAlgorithmStep {
  stepId: number;
  narration: string;
  nodes: Record<number, CinemaNodeState>;
  edges: Record<string, CinemaEdgeState>;
  highlights: CinemaHighlight[];
}

export interface BfsStep extends BaseAlgorithmStep { algorithm: 'BFS'; }
export interface DfsStep extends BaseAlgorithmStep { algorithm: 'DFS'; }
export interface DijkstraStep extends BaseAlgorithmStep { algorithm: 'Dijkstra'; }
export interface PrimsStep extends BaseAlgorithmStep { algorithm: 'Prims'; }
export interface KruskalsStep extends BaseAlgorithmStep { algorithm: 'Kruskals'; }
export interface MaxFlowStep extends BaseAlgorithmStep { algorithm: 'MaxFlow'; }
export interface TopoSortStep extends BaseAlgorithmStep { algorithm: 'TopologicalSort'; }
export interface BellmanFordStep extends BaseAlgorithmStep { algorithm: 'BellmanFord'; }

export type AlgorithmStep = 
  | BfsStep 
  | DfsStep 
  | DijkstraStep 
  | PrimsStep 
  | KruskalsStep 
  | MaxFlowStep 
  | TopoSortStep 
  | BellmanFordStep;

export interface AlgorithmMetadata {
  algorithm: AlgorithmType;
  sourceNode?: number;
  targetNode?: number;
  graphSignature: string; // Hash or representation of graph to ensure matching
}

export type AlgorithmResult = 
  | { type: 'path'; pathNodes: number[]; distance: number }
  | { type: 'mst'; edgeIds: string[]; totalWeight: number }
  | { type: 'max_flow'; maxFlow: number }
  | { type: 'topo_order'; order: number[] }
  | { type: 'cycle_detected'; message: string };

export interface AlgorithmCinemaPayload {
  metadata: AlgorithmMetadata;
  steps: AlgorithmStep[];
  result: AlgorithmResult;
}
