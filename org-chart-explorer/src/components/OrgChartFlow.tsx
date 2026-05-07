import React, { useCallback, useEffect, useMemo } from 'react';
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
} from 'reactflow';
import { Employee, Role, ROLE_STYLES } from '../types/employee';
import { getFullHierarchy, normalizeRole } from '../utils/hierarchyBuilder';
import { buildOrgChartElements } from '../utils/orgChartLayout';
import EmployeeNode from './EmployeeNode';

// Register custom node types outside component to prevent re-renders
const nodeTypes: NodeTypes = {
  employeeNode: EmployeeNode,
};

interface OrgChartFlowProps {
  employees: Employee[];
  selectedEmployee: Employee;
  selectedEffectiveRole: Role;
  onEmployeeClick: (employee: Employee, effectiveRole: Role) => void;
  darkMode: boolean;
}

function OrgChartFlowInner({
  employees,
  selectedEmployee,
  selectedEffectiveRole,
  onEmployeeClick,
  darkMode,
}: OrgChartFlowProps) {
  const { fitView } = useReactFlow();

  const hierarchy = useMemo(
    () => getFullHierarchy(selectedEmployee, selectedEffectiveRole, employees),
    [selectedEmployee, selectedEffectiveRole, employees],
  );

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () =>
      buildOrgChartElements(
        hierarchy.managersChain,
        hierarchy.selected,
        hierarchy.selectedEffectiveRole,
        hierarchy.directReports,
        onEmployeeClick,
      ),
    [hierarchy, onEmployeeClick],
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync when selected employee changes
  useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Fit view after layout settles
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ duration: 600, padding: 0.15 });
    }, 120);
    return () => clearTimeout(timer);
  }, [initialNodes, fitView]);

  const minimapNodeColor = useCallback((node: { data: { effectiveRole: Role } }) => {
    return ROLE_STYLES[node.data?.effectiveRole ?? '']?.badge ?? '#94A3B8';
  }, []);

  const bgColor = darkMode ? '#0F172A' : '#F8FAFC';
  const minimapBg = darkMode ? '#1E293B' : '#F1F5F9';
  const minimapMaskBg = darkMode ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.7)';

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={2.5}
      defaultEdgeOptions={{
        type: 'smoothstep',
      }}
      proOptions={{ hideAttribution: true }}
      style={{ background: bgColor }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color={darkMode ? '#1E293B' : '#E2E8F0'}
      />
      <Controls
        showInteractive={false}
        className="!shadow-lg !rounded-xl overflow-hidden"
        style={{
          background: darkMode ? '#1E293B' : '#ffffff',
          borderColor: darkMode ? '#334155' : '#E2E8F0',
        }}
      />
      <MiniMap
        nodeColor={minimapNodeColor}
        maskColor={minimapMaskBg}
        style={{
          background: minimapBg,
          border: `1px solid ${darkMode ? '#334155' : '#E2E8F0'}`,
          borderRadius: 12,
        }}
        nodeStrokeWidth={3}
        pannable
        zoomable
      />
    </ReactFlow>
  );
}

export default function OrgChartFlow(props: OrgChartFlowProps) {
  return (
    <ReactFlowProvider>
      <OrgChartFlowInner {...props} />
    </ReactFlowProvider>
  );
}
