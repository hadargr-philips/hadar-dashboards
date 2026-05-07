import React from 'react';
import { ROLE_STYLES } from '../types/employee';

interface RoleBadgeProps {
  role: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RoleBadge({ role, size = 'md', className = '' }: RoleBadgeProps) {
  const style = ROLE_STYLES[role] ?? ROLE_STYLES[''];
  const label = style.label;

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-0.5 text-xs font-medium',
    lg: 'px-3 py-1 text-sm font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: style.bg,
        color: style.text,
        borderColor: style.border,
      }}
    >
      <span
        className="mr-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: style.badge }}
      />
      {label}
    </span>
  );
}
