import { Employee, Role } from '../types/employee';

/** Normalize raw role string to a canonical Role value */
export function normalizeRole(role: string | undefined): Role {
  const v = (role ?? '').trim();
  if (v === 'SM') return 'SM';
  if (v === 'GL') return 'GL';
  if (v === 'GM') return 'GM';
  if (v === 'Dev') return 'Dev';
  if (v === 'QA') return 'QA';
  if (v === 'Department Manager') return 'Department Manager';
  if (v === 'Division Manager') return 'Division Manager';
  return '';
}

export function isBackendGroup(employee: Employee): boolean {
  return employee.group.toLowerCase() === 'backend';
}

/**
 * Returns the direct manager of an employee based on:
 * - Role-based hierarchy rules
 * - Backend group special rules (SM → GL → GM)
 */
export function getManagerEmployee(
  employee: Employee,
  allEmployees: Employee[],
): Employee | null {
  const role = normalizeRole(employee.role);
  const isBackend = isBackendGroup(employee);

  let managerName = '';

  switch (role) {
    case 'Dev':
    case 'QA':
    case '':
      managerName = employee.teamManager;
      break;
    case 'SM':
      // Backend: SM → GL; others: SM → GM
      managerName = isBackend ? employee.groupLead : employee.groupManager;
      break;
    case 'GL':
      // GL only exists in Backend; GL → GM
      managerName = employee.groupManager;
      break;
    case 'GM':
      managerName = employee.departmentManager;
      break;
    case 'Department Manager':
      managerName = employee.divisionManager;
      break;
    case 'Division Manager':
      return null;
  }

  if (!managerName) return null;

  // Find by exact name match, excluding self (circular reference guard)
  return (
    allEmployees.find(e => e.name === managerName && e.id !== employee.id) ?? null
  );
}

/** Returns the unique direct reports of an employee. */
export function getDirectReports(
  employee: Employee,
  allEmployees: Employee[],
): Employee[] {
  const role = normalizeRole(employee.role);
  const isBackend = isBackendGroup(employee);

  const seen = new Set<string>();
  const dedupe = (list: Employee[]): Employee[] =>
    list.filter(e => {
      if (seen.has(e.id)) return false;
      seen.add(e.id);
      return true;
    });

  switch (role) {
    case 'SM': {
      // Dev/QA (and blank-role) employees whose teamManager is this SM
      return dedupe(
        allEmployees.filter(
          e => e.teamManager === employee.name && e.id !== employee.id,
        ),
      );
    }

    case 'GL': {
      // SMs whose groupLead is this GL (Backend only)
      return dedupe(
        allEmployees.filter(
          e =>
            normalizeRole(e.role) === 'SM' && e.groupLead === employee.name,
        ),
      );
    }

    case 'GM': {
      if (isBackend) {
        // GLs under this GM
        const gls = dedupe(
          allEmployees.filter(
            e =>
              normalizeRole(e.role) === 'GL' &&
              e.groupManager === employee.name,
          ),
        );
        if (gls.length > 0) return gls;
        // Fallback: SMs if no explicit GL rows
        return dedupe(
          allEmployees.filter(
            e =>
              normalizeRole(e.role) === 'SM' &&
              e.groupManager === employee.name,
          ),
        );
      } else {
        // SMs under this GM
        return dedupe(
          allEmployees.filter(
            e =>
              normalizeRole(e.role) === 'SM' &&
              e.groupManager === employee.name,
          ),
        );
      }
    }

    case 'Department Manager': {
      // GMs whose departmentManager is this DM
      return dedupe(
        allEmployees.filter(
          e =>
            normalizeRole(e.role) === 'GM' &&
            e.departmentManager === employee.name,
        ),
      );
    }

    case 'Division Manager': {
      // Department Managers whose divisionManager is this DivM
      return dedupe(
        allEmployees.filter(
          e =>
            normalizeRole(e.role) === 'Department Manager' &&
            e.divisionManager === employee.name,
        ),
      );
    }

    default:
      return [];
  }
}

export interface OrgHierarchy {
  /** Managers from topmost (Division Manager) down to direct manager */
  managersChain: Employee[];
  selected: Employee;
  /** One level of direct reports */
  directReports: Employee[];
}

/**
 * Builds the full hierarchy for the selected employee:
 * - managersChain: from Division Manager down to direct manager
 * - directReports: immediate subordinates
 */
export function getFullHierarchy(
  employee: Employee,
  allEmployees: Employee[],
): OrgHierarchy {
  const managersChain: Employee[] = [];
  const visited = new Set<string>();

  // Walk up the chain
  let current: Employee | null = employee;
  while (current) {
    if (visited.has(current.id)) break; // Circular reference guard
    visited.add(current.id);
    const manager = getManagerEmployee(current, allEmployees);
    if (manager && !visited.has(manager.id)) {
      managersChain.unshift(manager); // Prepend so topmost is first
      current = manager;
    } else {
      break;
    }
  }

  const directReports = getDirectReports(employee, allEmployees);

  return {
    managersChain,
    selected: employee,
    directReports,
  };
}

/** Searches employees by partial name match (case-insensitive) */
export function searchEmployees(query: string, employees: Employee[]): Employee[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return employees.filter(e => e.name.toLowerCase().includes(q)).slice(0, 12);
}

/** Returns org statistics */
export function getOrgStats(employees: Employee[]) {
  const teams = new Set(employees.map(e => e.team).filter(Boolean));
  const groups = new Set(employees.map(e => e.group).filter(Boolean));
  const divisionManagers = employees.filter(
    e => normalizeRole(e.role) === 'Division Manager',
  );
  const departmentManagers = employees.filter(
    e => normalizeRole(e.role) === 'Department Manager',
  );
  const groupManagers = employees.filter(e => normalizeRole(e.role) === 'GM');
  const sms = employees.filter(e => normalizeRole(e.role) === 'SM');

  return {
    totalEmployees: employees.length,
    totalTeams: teams.size,
    totalGroups: groups.size,
    divisionManagers: divisionManagers.length,
    departmentManagers: departmentManagers.length,
    groupManagers: groupManagers.length,
    teamManagers: sms.length,
  };
}
