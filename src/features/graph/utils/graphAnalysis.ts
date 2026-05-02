import type { NodeId, GraphEdge } from '../model/types';

/**
 * ============================================================================
 * GRAPH ANALYSIS UTILITIES
 * ============================================================================
 * Ensemble de fonctions pour analyser les propriétés d'un graphe :
 * - Recherche de chemins et chaînes (BFS, DFS)
 * - Analyse de connexité
 * - Propriétés eulériennes
 * - Détection de cycles
 * - Analyse de régularité
 * ============================================================================
 */

/**
 * Construit une liste d'adjacence à partir des noeuds et des arêtes.
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes
 * @param directed Si true, respecte l'orientation des arêtes; sinon traite comme non orienté
 * @returns Map contenant pour chaque noeud la liste de ses voisins
 */
function buildAdjacencyList(nodes: NodeId[], edges: GraphEdge[], directed: boolean): Map<NodeId, NodeId[]> {
  const adj = new Map<NodeId, NodeId[]>();
  nodes.forEach(n => adj.set(n, []));

  const seenEdges = new Set<string>();

  edges.forEach(e => {
    const edgeKey = directed
      ? e.id
      : (e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`);

    if (!directed && seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);

    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);

    adj.get(e.from)!.push(e.to);
    if (!directed) {
      adj.get(e.to)!.push(e.from);
    }
  });

  return adj;
}

// ============================================================================
// SECTION 1: RECHERCHE DE CHEMINS ET CHAÎNES
// ============================================================================

/**
 * Recherche une chaîne entre deux sommets en utilisant BFS (Breadth-First Search).
 * 
 * Note: Une "chaîne" en théorie des graphes ignore l'orientation des arêtes.
 * Cette fonction force directed=false pour la recherche.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns La chaîne (chemin) de départ à arrivée, ou null si aucune chaîne existe
 */
export function findChainBFS(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, false);
  
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);
  const parent = new Map<NodeId, NodeId>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) {
        // Reconstruire la chaîne
      const path: NodeId[] = [];
      let curr: NodeId | undefined = end;
      while (curr !== undefined) {
        path.unshift(curr);
        curr = parent.get(curr);
      }
      return path;
    }

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent.set(neighbor, current);
        queue.push(neighbor);
      }
    }
  }
  return null;
}

/**
 * Recherche un chemin simple entre deux sommets en utilisant DFS (Depth-First Search).
 * 
 * Un chemin simple n'a pas de répétition de sommets.
 * Cette fonction respecte l'orientation si le graphe est orienté.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @param directed Si true, respecte l'orientation des arêtes
 * @returns Le chemin simple de départ à arrivée, ou null si aucun chemin simple existe
 */
export function findSimplePathDFS(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId, directed: boolean): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, directed);
  
  const visited = new Set<NodeId>();
  const path: NodeId[] = [];

  function dfs(current: NodeId): boolean {
    visited.add(current);
    path.push(current);

    if (current === end) {
      return true;
    }

    for (const neighbor of (adj.get(current) || [])) {
      // Pour s'assurer qu'il s'agit d'un chemin *simple*, 
      // on vérifie qu'on n'a pas déjà visité ce sommet.
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) {
          return true;
        }
      }
    }

    // Retrait (backtrack) si on ne trouve pas la destination via ce sommet
    path.pop();
    visited.delete(current);
    return false;
  }

  if (dfs(start)) {
    return path;
  }
  return null;
}

/**
 * Vérifie s'il existe une chaîne (chemin non orienté) entre deux sommets.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns true si une chaîne existe entre start et end, false sinon
 */
export function hasChain(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): boolean {
  if (start === end) return true;
  // Une chaîne correspond à vérifier si un chemin existe dans le graphe non orienté
  const adj = buildAdjacencyList(nodes, edges, false);
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

/**
 * Vérifie s'il existe un chemin orienté entre deux sommets.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @param start Sommet de départ
 * @param end Sommet d'arrivée
 * @returns true si un chemin orienté existe entre start et end, false sinon
 */
export function hasPath(nodes: NodeId[], edges: GraphEdge[], start: NodeId, end: NodeId): boolean {
  if (start === end) return true;
  // Un chemin correspond à vérifier si on peut atteindre la destination en respectant l'orientation
  const adj = buildAdjacencyList(nodes, edges, true);
  const queue: NodeId[] = [start];
  const visited = new Set<NodeId>([start]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === end) return true;

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }
  return false;
}

// ============================================================================
// SECTION 2: PROPRIÉTÉS BASIQUES DU GRAPHE
// ============================================================================

/**
 * Calcule le degré de chaque sommet dans un graphe.
 * 
 * Pour les propriétés eulériennes, on s'intéresse au degré global non orienté:
 * chaque arête contribue 1 au degré de chaque extrémité (même pour les graphes orientés).
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet Record contenant le degré de chaque sommet
 */
export function calculateDegrees(nodes: NodeId[], edges: GraphEdge[]): Record<NodeId, number> {
  const degrees: Record<NodeId, number> = {};
  nodes.forEach(n => degrees[n] = 0);
  
  const seenEdges = new Set<string>();

  edges.forEach(e => {
    const edgeKey = e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`;
    if (e.directed === false && seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);

    degrees[e.from] = (degrees[e.from] || 0) + 1;
    degrees[e.to] = (degrees[e.to] || 0) + 1;
  });
  
  return degrees;
}

/**
 * Teste la connexité du graphe.
 * 
 * Vérifie si tous les sommets appartiennent à la même composante connexe globale
 * (ignorant l'orientation des arêtes pour tester la connexité faible).
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns true si le graphe est connexe, false sinon
 */
export function isConnected(nodes: NodeId[], edges: GraphEdge[]): boolean {
  if (nodes.length === 0) return true;

  // Pour la connexité utile aux propriétés eulériennes, on considère
  // uniquement les sommets de degré > 0. Les sommets isolés (degré 0)
  // n'empêchent pas l'existence d'un parcours eulérien sur la composante
  // qui contient toutes les arêtes.
  const degrees = calculateDegrees(nodes, edges);
  const nonIsolated = nodes.filter(n => (degrees[n] || 0) > 0);
  if (nonIsolated.length === 0) return true; // aucune arête dans le graphe

  const adj = buildAdjacencyList(nodes, edges, false);
  const visited = new Set<NodeId>();
  const queue: NodeId[] = [nonIsolated[0]];
  visited.add(nonIsolated[0]);

  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  // Le graphe est considéré connexe si tous les sommets non-isolés sont atteignables
  return nonIsolated.every(n => visited.has(n));
}

// ============================================================================
// SECTION 3: PROPRIÉTÉS EULÉRIENNES
// ============================================================================

export interface EulerianAnalysisResult {
  isConnexe: boolean;
  oddDegreeCount: number;
  oddNodes: NodeId[];
  isEulerianGraph: boolean;
  hasEulerianCircuitOrCycle: boolean;
  hasEulerianPathOrChain: boolean;
  ruleMatched: string;
}

/**
 * Analyse les propriétés eulériennes d'un graphe.
 * 
 * Détermine si le graphe admet:
 * - Un circuit eulérien (graphe eulérien)
 * - Un chemin/chaîne eulérien
 * 
 * Règles strictes appliquées :
 * - Non connexe → pas d'Eulérien
 * - Connexe + 0 sommets impairs → graphe eulérien
 * - Connexe + 2 sommets impairs → chemin eulérien uniquement
 * - Plus de 2 sommets impairs → pas d'Eulérien
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet contenant les propriétés eulériennes analysées
 */
export function analyzeEulerianProperties(nodes: NodeId[], edges: GraphEdge[]): EulerianAnalysisResult {
  const degrees = calculateDegrees(nodes, edges);
  
  // Test de la connexité (Condition requise)
  const isConnexe = isConnected(nodes, edges);
  
  // Comptage des sommets ayant un degré impair
  const oddNodes = Object.entries(degrees)
    .filter(([_, deg]) => (deg as number) % 2 !== 0)
    .map(([node, _]) => Number(node));
    
  const oddDegreeCount = oddNodes.length;
  
  let isEulerianGraph = false;
  let hasEulerianPathOrChain = false;
  let ruleMatched = '';

  if (!isConnexe) {
    ruleMatched = "Non connexe = non eulérien";
  } else if (oddDegreeCount === 0) {
    isEulerianGraph = true;
    hasEulerianPathOrChain = true; 
    ruleMatched = "Connexe + 0 sommets impairs = graphe eulérien";
  } else if (oddDegreeCount === 2) {
    hasEulerianPathOrChain = true;
    ruleMatched = "Connexe + 2 sommets impairs = chemin eulérien";
  } else {
    ruleMatched = "Plus de 2 impairs = non eulérien";
  }
  
  return {
    isConnexe,
    oddDegreeCount,
    oddNodes,
    isEulerianGraph,
    // Dans ce contexte métier strict, si c'est un graphe eulérien, c'est aussi un circuit/cycle
    hasEulerianCircuitOrCycle: isEulerianGraph, 
    // Chemin s'il correspond aux mêmes règles
    hasEulerianPathOrChain,                     
    ruleMatched
  };
}

// ============================================================================
// SECTION 4: DÉTECTION DE CYCLES
// ============================================================================

/**
 * Cherche et retourne un cycle dans un graphe orienté.
 * 
 * Utilise DFS (Depth-First Search) avec détection de back-edge
 * pour identifier un cycle.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste des sommets formant le cycle, ou null si aucun cycle n'existe
 */
export function findDirectedCycle(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, true);
  const visited = new Set<NodeId>();
  const inStack = new Set<NodeId>();
  const parent = new Map<NodeId, NodeId>();

  function dfsCycle(current: NodeId): NodeId[] | null {
    visited.add(current);
    inStack.add(current);

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, current);
        const result = dfsCycle(neighbor);
        if (result) return result;
      } else if (inStack.has(neighbor)) {
        // Cycle détecté
        const cyclePath: NodeId[] = [neighbor];
        let curr: NodeId | undefined = current;
        while (curr !== undefined && curr !== neighbor) {
          cyclePath.unshift(curr);
          curr = parent.get(curr);
        }
        cyclePath.unshift(neighbor); // Fermer le cycle
        return cyclePath;
      }
    }

    inStack.delete(current);
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const cycle = dfsCycle(node);
      if (cycle) return cycle;
    }
  }

  return null;
}

/**
 * Cherche et retourne un cycle (circuit) dans un graphe non orienté.
 * 
 * Utilise DFS avec suivi du parent pour identifier un circuit.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste des sommets formant le circuit, ou null si aucun ne existe
 */
export function findUndirectedCycle(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const adj = buildAdjacencyList(nodes, edges, false);
  const visited = new Set<NodeId>();
  const parent = new Map<NodeId, NodeId>();

  function dfsUndirectedCycle(current: NodeId, parentOfCurrent?: NodeId): NodeId[] | null {
    visited.add(current);

    for (const neighbor of (adj.get(current) || [])) {
      if (!visited.has(neighbor)) {
        parent.set(neighbor, current);
        const result = dfsUndirectedCycle(neighbor, current);
        if (result) return result;
      } else if (neighbor !== parentOfCurrent) {
        // Cycle détecté
        const cyclePath: NodeId[] = [neighbor];
        let curr: NodeId | undefined = current;
        while (curr !== undefined && curr !== neighbor) {
          cyclePath.unshift(curr);
          curr = parent.get(curr);
        }
        cyclePath.unshift(neighbor); // Fermer le cycle
        return cyclePath;
      }
    }
    return null;
  }

  for (const node of nodes) {
    if (!visited.has(node)) {
      const cycle = dfsUndirectedCycle(node);
      if (cycle) return cycle;
    }
  }
  return null;
}

/**
 * Trouve et retourne le tracé exact d'un chemin ou circuit eulérien.
 * 
 * Utilise l'algorithme de Hierholzer (valable pour graphes non orientés).
 * Retourne null si aucun chemin eulérien n'existe.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns La liste séquentielle des sommets parcourus, ou null s'il n'y a pas de parcours eulérien
 */
export function findEulerianPathOrCircuit(nodes: NodeId[], edges: GraphEdge[]): NodeId[] | null {
  const properties = analyzeEulerianProperties(nodes, edges);
  
  if (!properties.hasEulerianPathOrChain) {
    return null; // Pas de chemin ni de circuit eulérien possible
  }
  // Construire une liste d'adjacence contenant les arêtes (id) afin de gérer
  // correctement les multigraphes et pouvoir consommer chaque arête.
  const adj = new Map<NodeId, { to: NodeId; id: string }[]>();
  nodes.forEach(n => adj.set(n, []));
  const seenEdges = new Set<string>();
  edges.forEach(e => {
    const edgeKey = e.symmetryKey ?? `${Math.min(e.from, e.to)}:${Math.max(e.from, e.to)}:${e.weight}`;
    if (e.directed === false && seenEdges.has(edgeKey)) {
      return;
    }
    seenEdges.add(edgeKey);

    if (!adj.has(e.from)) adj.set(e.from, []);
    if (!adj.has(e.to)) adj.set(e.to, []);
    adj.get(e.from)!.push({ to: e.to, id: e.id });
    adj.get(e.to)!.push({ to: e.from, id: e.id });
  });

  // Choix du point de départ : un noeud de degré impair s'il y en a, sinon n'importe lequel
  let startNode = nodes[0];
  if (properties.oddDegreeCount === 2 && properties.oddNodes.length > 0) {
    startNode = properties.oddNodes[0];
  }

  const stack: NodeId[] = [startNode];
  const parcours: NodeId[] = [];

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = adj.get(current) || [];

    if (neighbors.length > 0) {
      const nextEdge = neighbors.pop()!;
      // Retirer l'arête inverse correspondant (même id) dans la liste du voisin
      const revList = adj.get(nextEdge.to)!;
      const revIndex = revList.findIndex(x => x.id === nextEdge.id && x.to === current);
      if (revIndex !== -1) revList.splice(revIndex, 1);

      stack.push(nextEdge.to);
    } else {
      parcours.push(stack.pop()!);
    }
  }

  return parcours.reverse();
}

export interface EulerianTraceReport {
  properties: EulerianAnalysisResult;
  chainTrace: NodeId[] | null;
  cycleTrace: NodeId[] | null;
  chainMessage: string;
  cycleMessage: string;
  verdictMessage: string;
}

/**
 * Construit un rapport eulérien prêt à afficher.
 *
 * Le rapport expose:
 * - la chaîne eulérienne et sa trace si elle existe
 * - le cycle eulérien et sa trace si elle existe
 * - le verdict final sur le graphe eulérien
 */
export function buildEulerianTraceReport(nodes: NodeId[], edges: GraphEdge[]): EulerianTraceReport {
  const properties = analyzeEulerianProperties(nodes, edges);
  const eulerianTrace = properties.hasEulerianPathOrChain ? findEulerianPathOrCircuit(nodes, edges) : null;
  const chainTrace = eulerianTrace && !properties.isEulerianGraph ? eulerianTrace : eulerianTrace;
  const cycleTrace = properties.isEulerianGraph ? eulerianTrace : null;

  const chainMessage = properties.hasEulerianPathOrChain
    ? `Chaîne eulérienne: oui. Trace de la chaîne: ${chainTrace ? chainTrace.join(' → ') : 'trace indisponible'}.`
    : 'Chaîne eulérienne: non.';

  const cycleMessage = properties.isEulerianGraph
    ? `Cycle eulérien: oui. Trace du cycle: ${cycleTrace ? cycleTrace.join(' → ') : 'trace indisponible'}.`
    : 'Cycle eulérien: non. Aucun cycle eulérien n\'existe dans ce graphe.';

  const verdictMessage = properties.isEulerianGraph
    ? 'Graphe eulérien: oui.'
    : 'Graphe eulérien: non.';

  return {
    properties,
    chainTrace,
    cycleTrace,
    chainMessage,
    cycleMessage,
    verdictMessage,
  };
}

// ============================================================================
// SECTION 5: PROPRIÉTÉS DE RÉGULARITÉ
// ============================================================================

export interface RegularGraphResult {
  isRegular: boolean;
  k: number | null;
}

/**
 * Vérifie si un graphe est k-régulier.
 * 
 * Un graphe est k-régulier si tous ses sommets ont exactement le même degré k.
 * 
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns Objet contenant un booléen `isRegular` et la valeur `k` (ou null si non régulier)
 */
export function checkRegularGraph(nodes: NodeId[], edges: GraphEdge[]): RegularGraphResult {
  if (nodes.length === 0) {
    return { isRegular: true, k: 0 }; // Un graphe vide peut être considéré 0-régulier
  }

  const degrees = calculateDegrees(nodes, edges);
  
  // Extraire toutes les valeurs de degré
  const degreeValues = Object.values(degrees);
  
  // Prendre le degré du premier sommet comme référence
  const firstDegree = degreeValues[0] as number;

  // Vérifier si tous les autres sommets ont exactement le même degré
  const isRegular = degreeValues.every(deg => deg === firstDegree);

  return {
    isRegular,
    k: isRegular ? firstDegree : null
  };
}
// ============================================================================
// SECTION 3: PROPRIÉTÉS EULÉRIENNES
// ============================================================================

// ... (tout le code existant reste intact) ...

// ↓ AJOUTER ICI, après analyzeEulerianProperties

/**
 * Vérifie si un graphe est eulérien.
 *
 * Un graphe est eulérien s'il est connexe ET que tous ses sommets
 * ont un degré pair (existence garantie d'un circuit eulérien).
 *
 * @param nodes Liste des identifiants des sommets
 * @param edges Liste des arêtes du graphe
 * @returns true si le graphe est eulérien, false sinon
 */
export function isEulerian(nodes: NodeId[], edges: GraphEdge[]): boolean {
  if (nodes.length === 0 || edges.length === 0) return false;

  if (!isConnected(nodes, edges)) return false;

  const degrees = calculateDegrees(nodes, edges);
  const hasOddDegree = Object.values(degrees).some(deg => (deg as number) % 2 !== 0);

  return !hasOddDegree;
}