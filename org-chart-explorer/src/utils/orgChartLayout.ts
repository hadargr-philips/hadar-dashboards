import { Node, Edge, MarkerType } from 'reactflow';
import { Employee } from '../types/employee';

const LEVEL_HEIGHT = 185;
const NODE_WIDTH = 220;
const SELECTED_NODE_WIDTH = 250;
const MIN_NODE_SPACING = 270;

export function buildOrgChartElements(
  managersChain: Employee[],
  selected: Employee,
  directReports: Employee[],
  onNodeClick?: (employee: Employee) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const totalAbove = managersChain.length;
  const usedIds = new Set<string>();

  const addNode = (node: Node) => {
    if (!usedIds.has(node.id)) {
      usedIds.add(node.id);
      nodes.push(node);
    }
  };

  // ── Manager chain (above selected) ──────────────────────────────────
  managersChain.forEach((manager, index) => {
    const level = index - totalAbove; // Negative (above selected at y=0)
    const y = level * LEVEL_HEIGHT;

    addNode({
      id: manager.id,
      type: 'employeeNode',
      position: { x: -NODE_WIDTH / 2, y },
      data: { employee: manager, isSelected: false, onClick: onNodeClick },
      draggable: false,
      selectable: true,
    });

    // Edge to next manager in chain
    if (index < managersChain.length - 1) {
      const next = managersChain[index + 1];
      edges.push({
        id: `e-${manager.id}--${next.id}`,
        source: manager.id,
        target: next.id,
        type: 'smoothstep',
        style: { stroke: '#CBD5E1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#CBD5E1',
          width: 16,
          height: 16,
        },
      });
    }
  });

  // ── Selected employee (y = 0, centered) ─────────────────────────────
  addNode({
    id: selected.id,
    type: 'employeeNode',
    position: { x: -SELECTED_NODE_WIDTH / 2, y: 0 },
    data: { employee: selected, isSelected: true, onClick: onNodeClick },
    draggable: false,
    selectable: true,
  });

  // Edge from last manager → selected
  if (managersChain.length > 0) {
    const directManager = managersChain[managersChain.length - 1];
    edges.push({
      id: `e-${directManager.id}--${selected.id}`,
      source: directManager.id,
      target: selected.id,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#3B82F6', strokeWidth: 2.5 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#3B82F6',
        width: 16,
        height: 16,
      },
    });
  }

  // ── Direct reports (below selected) ─────────────────────────────────
  if (directReports.length > 0) {
    const totalWidth = (directReports.length - 1) * MIN_NODE_SPACING;
    const startX = -totalWidth / 2 - NODE_WIDTH / 2;

    directReports.forEach((report, index) => {
      const x = startX + index * MIN_NODE_SPACING;
      const y = LEVEL_HEIGHT;

      addNode({
        id: report.id,
        type: 'employeeNode',
        position: { x, y },
        data: { employee: report, isSelected: false, onClick: onNodeClick },
        draggable: false,
        selectable: true,
      });

      edges.push({
        id: `e-${selected.id}--${report.id}`,
        source: selected.id,
        target: report.id,
        type: 'smoothstep',
        style: { stroke: '#CBD5E1', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#CBD5E1',
          width: 14,
          height: 14,
        },
      });
    });
  }

  return { nodes, edges };
}
