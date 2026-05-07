export type Role =
  | 'Dev'
  | 'QA'
  | 'SM'
  | 'GL'
  | 'GM'
  | 'Department Manager'
  | 'Division Manager'
  | '';

export interface Employee {
  id: string;
  name: string;
  team: string;
  group: string;
  role: Role;
  teamManager: string;
  groupLead: string;
  groupManager: string;
  departmentManager: string;
  divisionManager: string;
}

export interface RoleStyle {
  bg: string;
  text: string;
  border: string;
  badge: string;
  label: string;
}

export const ROLE_STYLES: Record<string, RoleStyle> = {
  Dev: {
    bg: '#EFF6FF',
    text: '#1D4ED8',
    border: '#BFDBFE',
    badge: '#3B82F6',
    label: 'Developer',
  },
  QA: {
    bg: '#F0FDF4',
    text: '#15803D',
    border: '#BBF7D0',
    badge: '#22C55E',
    label: 'QA Engineer',
  },
  SM: {
    bg: '#FFF7ED',
    text: '#C2410C',
    border: '#FED7AA',
    badge: '#F97316',
    label: 'Team Manager',
  },
  GL: {
    bg: '#FAF5FF',
    text: '#7E22CE',
    border: '#E9D5FF',
    badge: '#A855F7',
    label: 'Group Lead',
  },
  GM: {
    bg: '#FEF2F2',
    text: '#B91C1C',
    border: '#FECACA',
    badge: '#EF4444',
    label: 'Group Manager',
  },
  'Department Manager': {
    bg: '#EFF6FF',
    text: '#1E3A5F',
    border: '#93C5FD',
    badge: '#1E40AF',
    label: 'Department Manager',
  },
  'Division Manager': {
    bg: '#F1F5F9',
    text: '#0F172A',
    border: '#CBD5E1',
    badge: '#0F172A',
    label: 'Division Manager',
  },
  '': {
    bg: '#F8FAFC',
    text: '#475569',
    border: '#E2E8F0',
    badge: '#64748B',
    label: 'Employee',
  },
};

/** Role hierarchy order (higher index = higher in org) */
export const ROLE_RANK: Record<string, number> = {
  '': 0,
  Dev: 0,
  QA: 0,
  SM: 1,
  GL: 2,
  GM: 3,
  'Department Manager': 4,
  'Division Manager': 5,
};

/**
 * Represents an employee occupying a *specific* position in the hierarchy.
 * The same person can appear multiple times with different effectiveRoles
 * (e.g., someone who is both a GM and a Department Manager).
 */
export interface PositionedEmployee {
  employee: Employee;
  /** The role this person plays at this position in the chain. */
  effectiveRole: Role;
  /** Unique id for this position: `${employee.id}::${effectiveRole}` */
  positionId: string;
}
