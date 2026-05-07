import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Employee, ROLE_STYLES } from '../types/employee';
import { normalizeRole } from '../utils/hierarchyBuilder';

export interface EmployeeNodeData {
  employee: Employee;
  isSelected: boolean;
  onClick?: (employee: Employee) => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n.charAt(0).toUpperCase())
    .join('');
}

function EmployeeNode({ data }: NodeProps<EmployeeNodeData>) {
  const { employee, isSelected, onClick } = data;
  const role = normalizeRole(employee.role);
  const style = ROLE_STYLES[role] ?? ROLE_STYLES[''];

  return (
    <div
      onClick={() => onClick?.(employee)}
      title={`${employee.name} — ${style.label}${employee.team ? ` · ${employee.team}` : ''}`}
      className={`
        relative select-none transition-all duration-200 cursor-pointer
        rounded-2xl border-2 bg-white shadow-md
        ${isSelected
          ? 'border-blue-500 shadow-blue-200 shadow-xl animate-pulse-glow'
          : 'border-gray-200 hover:border-blue-400 hover:shadow-lg'
        }
      `}
      style={{
        width: isSelected ? 250 : 220,
        minWidth: isSelected ? 250 : 220,
        backgroundColor: isSelected ? '#FAFCFF' : '#ffffff',
      }}
    >
      {/* Top Handle (for incoming connections from managers) */}
      <Handle type="target" position={Position.Top} className="!opacity-0 !bg-transparent !border-0" />

      {/* Selected highlight ring */}
      {isSelected && (
        <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 opacity-20 pointer-events-none" />
      )}

      <div className={`p-4 ${isSelected ? 'p-5' : ''}`}>
        {/* Header: avatar + name */}
        <div className="flex items-center gap-3 mb-3">
          <div
            className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
            style={{
              width: isSelected ? 44 : 36,
              height: isSelected ? 44 : 36,
              fontSize: isSelected ? '15px' : '13px',
              background: `linear-gradient(135deg, ${style.badge}cc, ${style.badge})`,
              boxShadow: isSelected ? `0 0 0 3px ${style.badge}33` : undefined,
            }}
          >
            {getInitials(employee.name)}
          </div>
          <div className="flex-1 min-w-0">
            <p
              className={`font-semibold text-gray-900 leading-tight truncate ${isSelected ? 'text-base' : 'text-sm'}`}
            >
              {employee.name}
            </p>
            {isSelected && (
              <p className="text-xs text-blue-600 font-medium mt-0.5">Selected</p>
            )}
          </div>
        </div>

        {/* Role badge */}
        <span
          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border mb-2"
          style={{
            backgroundColor: style.bg,
            color: style.text,
            borderColor: style.border,
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: style.badge }}
          />
          {style.label}
        </span>

        {/* Details */}
        <div className="space-y-1">
          {employee.team && (
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
              <p className="text-xs text-gray-500 truncate" title={employee.team}>
                {employee.team}
              </p>
            </div>
          )}
          {employee.group && (
            <div className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0" />
              <p className="text-xs text-gray-400 truncate" title={employee.group}>
                {employee.group}
              </p>
            </div>
          )}
        </div>

        {/* Click hint for non-selected */}
        {!isSelected && (
          <p className="mt-2 text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity font-medium">
            View org chart →
          </p>
        )}
      </div>

      {/* Bottom Handle (for outgoing connections to reports) */}
      <Handle type="source" position={Position.Bottom} className="!opacity-0 !bg-transparent !border-0" />
    </div>
  );
}

export default memo(EmployeeNode);
