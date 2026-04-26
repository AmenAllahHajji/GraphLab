import type { Position } from '../../graph/model/types';

interface SnapResult {
  snapX: number;
  snapY: number;
  guideX: number | null;
  guideY: number | null;
}

export const calculateSnap = (
  draggingNodeId: number,
  rawX: number,
  rawY: number,
  nodes: number[],
  positions: Record<number, Position>,
  threshold = 12
): SnapResult => {
  let snapX = rawX;
  let snapY = rawY;
  let guideX: number | null = null;
  let guideY: number | null = null;

  for (const nodeId of nodes) {
    if (nodeId === draggingNodeId) continue;
    
    const pos = positions[nodeId];
    if (!pos) continue;

    if (Math.abs(pos.x - rawX) < threshold) {
      snapX = pos.x;
      guideX = pos.x;
    }
    if (Math.abs(pos.y - rawY) < threshold) {
      snapY = pos.y;
      guideY = pos.y;
    }
  }

  return { snapX, snapY, guideX, guideY };
};
