import { Node, Edge, MarkerType } from 'reactflow';
import { Employee, Role, PositionedEmployee } from '../types/employee';

const LEVEL_HEIGHT = 185;
const NODE_WIDTH = 220;
const SELECTED_NODE_WIDTH = 250;
const MIN_NODE_SPACING = 270;

export function buildOrgChartElements(
  managersChain: PositionedEmployee[],
  selected: Employee,
  selectedEffectiveRole: Role,
  directReports: PositionedEmployee[],
  onNodeClick?: (employee: Employee, effectiveRole: Role) => void,
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

  const selectedPositionId = `${selected.id}::${selectedEffectiveRole}`;

  // ── Manager chain (above selected) ──────────────────────────────────
  managersChain.forEach((positioned, index) => {
    const level = index - totalAbove; // Negative (above selected at y=0)
    const y = level * LEVEL_HEIGHT;

    addNode({
      id: positioned.positionId,
      type: 'employeeNode',
      position: { x: -NODE_WIDTH / 2, y },
      data: {
        employee: positioned.employee,
        effectiveRole: positioned.effectiveRole,
        isSelected: false,
        onClick: onNodeClick,
      },
      draggable: false,
      selectable: true,
    });

    // Edge to next manager in chain
    if (index < managersChain.length - 1) {
      const next = managersChain[index + 1];
      edges.push({
        id: `e-${positioned.positionId}--${next.positionId}`,
        source: positioned.positionId,
        target: next.positionId,
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
    id: selectedPositionId,
    type: 'employeeNode',
    position: { x: -SELECTED_NODE_WIDTH / 2, y: 0 },
    data: {
      employee: selected,
      effectiveRole: selectedEffectiveRole,
      isSelected: true,
      onClick: onNodeClick,
    },
    draggable: false,
    selectable: true,
  });

  // Edge from last manager → selected
  if (managersChain.length > 0) {
    const directManager = managersChain[managersChain.length - 1];
    edges.push({
      id: `e-${directManager.positionId}--${selectedPositionId}`,
      source: directManager.positionId,
      target: selectedPositionId,
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

    directReports.forEach((positioned, index) => {
      const x = startX + index * MIN_NODE_SPACING;
      const y = LEVEL_HEIGHT;

      addNode({
        id: positioned.positionId,
        type: 'employeeNode',
        position: { x, y },
        data: {
          employee: positioned.employee,
          effectiveRole: positioned.effectiveRole,
          isSelected: false,
          onClick: onNodeClick,
        },
        draggable: false,
        selectable: true,
      });

      edges.push({
        id: `e-${selectedPositionId}--${positioned.positionId}`,
        source: selectedPositionId,
        target: positioned.positionId,
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
