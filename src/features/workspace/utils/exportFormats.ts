import type { GraphState } from '../../graph/model/types'

export type ExportFormat = 'json' | 'adjacency' | 'edgelist' | 'dot' | 'tikz'

function edgeWeight(graph: GraphState, weight: number): number {
  return graph.weighted ? weight : 1
}

export function toAdjacencyList(graph: GraphState): string {
  return graph.nodes
    .map((nodeId) => {
      const neighbors = graph.edges
        .flatMap((edge) => {
          if (edge.from === nodeId) {
            return `${edge.to}(${edgeWeight(graph, edge.weight)})`
          }
          if (!graph.directed && edge.to === nodeId) {
            return `${edge.from}(${edgeWeight(graph, edge.weight)})`
          }
          return []
        })
        .join(', ')
      return `${nodeId}: ${neighbors}`
    })
    .join('\n')
}

export function toEdgeList(graph: GraphState): string {
  if (graph.edges.length === 0) {
    return '# empty graph'
  }
  return graph.edges
    .map((edge) => `${edge.from} ${edge.to} ${edgeWeight(graph, edge.weight)}`)
    .join('\n')
}

export function toDOT(graph: GraphState): string {
  const graphType = graph.directed ? 'digraph' : 'graph'
  const connector = graph.directed ? '->' : '--'
  const nodes = graph.nodes.map((nodeId) => `  ${nodeId};`).join('\n')
  const edges = graph.edges
    .map((edge) => {
      const weight = edgeWeight(graph, edge.weight)
      return `  ${edge.from} ${connector} ${edge.to} [label="${weight}", weight=${weight}];`
    })
    .join('\n')

  return `${graphType} G {\n${nodes}\n${edges}\n}`
}

export function toTikZ(graph: GraphState): string {
  const header = [
    '\\begin{tikzpicture}[>=stealth, every node/.style={circle,draw,minimum size=7mm}]',
  ]

  const nodes = graph.nodes.map((nodeId) => {
    const position = graph.positions[nodeId]
    const x = ((position?.x ?? 0) / 60).toFixed(2)
    const y = (-(position?.y ?? 0) / 60).toFixed(2)
    return `\\node (${nodeId}) at (${x}, ${y}) {${nodeId}};`
  })

  const edgePrefix = graph.directed ? '\\draw[->]' : '\\draw'
  const edges = graph.edges.map((edge) => {
    const weight = edgeWeight(graph, edge.weight)
    return `${edgePrefix} (${edge.from}) -- node[midway, fill=black!10, inner sep=1pt] {${weight}} (${edge.to});`
  })

  const footer = ['\\end{tikzpicture}']
  return [...header, ...nodes, ...edges, ...footer].join('\n')
}

export function toJson(graph: GraphState): string {
  return JSON.stringify(graph, null, 2)
}

export function formatGraphForExport(graph: GraphState, format: ExportFormat): string {
  switch (format) {
    case 'json':
      return toJson(graph)
    case 'adjacency':
      return toAdjacencyList(graph)
    case 'edgelist':
      return toEdgeList(graph)
    case 'dot':
      return toDOT(graph)
    case 'tikz':
      return toTikZ(graph)
    default:
      return toJson(graph)
  }
}

export async function svgToPngBlob(svgElement: SVGSVGElement): Promise<Blob | null> {
  const serializer = new XMLSerializer()
  
  // Clone SVG to modify it for export without affecting the live UI
  const clonedSvg = svgElement.cloneNode(true) as SVGSVGElement
  
  // 1. Pixel-Perfect Styling: Inject exact CSS and SVG Filters
  const style = document.createElementNS('http://www.w3.org/2000/svg', 'style')
  const isDarkMode = document.documentElement.getAttribute('data-mantine-color-scheme') === 'dark'
  
  // Theme Variables for export - Mirroring index.css exactly
  const theme = isDarkMode ? {
    text: '#e2e8f0',
    accent: '#0095ff',
    surface: '#0f172a',
    border: 'rgba(148, 163, 184, 0.45)', // More visible border for snapshot
    edge: 'rgba(148, 163, 184, 0.25)',
    bg: '#010812'
  } : {
    text: '#0f172a',
    accent: '#0078d7',
    surface: '#ffffff',
    border: 'rgba(15, 23, 42, 0.35)', // Darker border in light mode
    edge: 'rgba(15, 23, 42, 0.15)',
    bg: '#f0f8ff'
  }

  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&display=swap');
    svg { font-family: 'Outfit', sans-serif; }
    .node-wrapper circle { 
      fill: ${theme.surface}; 
      stroke: ${theme.border}; 
      stroke-width: 2px; 
    }
    .node-wrapper text { 
      fill: ${theme.text}; 
      font-weight: 700; 
      font-size: 14px;
    }
    .edge-path { 
      stroke: ${theme.edge}; 
      stroke-width: 2px; 
      fill: none; 
    }
    .edge-path[class*="stroke-blue-400"] { 
      stroke: ${theme.accent}; 
      stroke-width: 3.5px; 
    }
    .weight-label rect { 
      fill: ${theme.surface}; 
      stroke: ${theme.border}; 
      stroke-width: 1.5px;
    }
    .weight-label text { 
      fill: ${theme.text}; 
      font-weight: 700; 
      font-size: 12px;
    }
    /* Semantic Colors from Algorithms */
    [stroke="#22c55e"], [stroke="#15803d"] { stroke: ${isDarkMode ? '#22c55e' : '#15803d'}; stroke-width: 4px; }
    [stroke="#f59e0b"], [stroke="#b45309"] { stroke: ${isDarkMode ? '#f59e0b' : '#b45309'}; stroke-width: 4px; }
    [stroke="#00e5ff"], [stroke="#0097a7"] { stroke: ${isDarkMode ? '#00e5ff' : '#0097a7'}; stroke-width: 4px; }
  `
  clonedSvg.prepend(style)

  // 2. Center and Zoom to Graph Bounds
  const zoomGroup = clonedSvg.querySelector('g[transform*="scale"]')
  if (zoomGroup) {
    zoomGroup.removeAttribute('transform')
  }

  const nodes = Array.from(clonedSvg.querySelectorAll('.node-wrapper'))
  if (nodes.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  nodes.forEach(node => {
    const transform = node.getAttribute('transform')
    if (transform) {
      const match = /translate\(([^ ]+)[, ]+([^)]+)\)/.exec(transform)
      if (match) {
        const x = parseFloat(match[1]), y = parseFloat(match[2])
        minX = Math.min(minX, x - 45); minY = Math.min(minY, y - 45)
        maxX = Math.max(maxX, x + 45); maxY = Math.max(maxY, y + 45)
      }
    }
  })

  const padding = 20
  minX -= padding; minY -= padding; maxX += padding; maxY += padding
  const width = maxX - minX, height = maxY - minY

  clonedSvg.setAttribute('viewBox', `${minX} ${minY} ${width} ${height}`)
  clonedSvg.setAttribute('width', width.toString())
  clonedSvg.setAttribute('height', height.toString())

  const svgString = serializer.serializeToString(clonedSvg)
  const encoded = encodeURIComponent(svgString)
  const image = new Image()

  return new Promise<Blob | null>((resolve) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      const targetWidth = 1440 // Higher standard resolution
      canvas.width = targetWidth
      canvas.height = (height / width) * targetWidth
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(null)

      // Final Render with Exact Theme Background
      ctx.fillStyle = theme.bg
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    }
    image.onerror = () => resolve(null)
    image.src = `data:image/svg+xml;charset=utf-8,${encoded}`
  })
}
