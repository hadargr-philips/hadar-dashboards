import { Employee, Role, PositionedEmployee } from '../types/employee';

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

/** Build a PositionedEmployee from an employee + role. */
function makePositioned(employee: Employee, effectiveRole: Role): PositionedEmployee {
  return {
    employee,
    effectiveRole,
    positionId: `${employee.id}::${effectiveRole}`,
  };
}

/**
 * Given an employee at a known effective role, return their manager as a
 * PositionedEmployee with the correct effective role for that level.
 *
 * Lookup is column-based, NOT role-field-based — so the same person can
 * appear twice in one chain if they occupy two different positions
 * (e.g., someone listed both as a GM and as a Department Manager).
 */
function getManagerPositioned(
  currentEmployee: Employee,
  currentEffectiveRole: Role,
  allEmployees: Employee[],
  visitedPositions: Set<string>,
): PositionedEmployee | null {
  let managerName = '';
  let managerRole: Role = '';

  switch (currentEffectiveRole) {
    case 'Dev':
    case 'QA':
    case '':
      managerName = currentEmployee.teamManager;
      managerRole = 'SM';
      break;
    case 'SM':
      // SM reports to GL if groupLead is filled, otherwise directly to GM
      if (currentEmployee.groupLead) {
        managerName = currentEmployee.groupLead;
        managerRole = 'GL';
      } else {
        managerName = currentEmployee.groupManager;
        managerRole = 'GM';
      }
      break;
    case 'GL':
      managerName = currentEmployee.groupManager;
      managerRole = 'GM';
      break;
    case 'GM':
      // GM reports to Department Manager if filled, otherwise directly to Division Manager
      if (currentEmployee.departmentManager) {
        managerName = currentEmployee.departmentManager;
        managerRole = 'Department Manager';
      } else {
        managerName = currentEmployee.divisionManager;
        managerRole = 'Division Manager';
      }
      break;
    case 'Department Manager':
      managerName = currentEmployee.divisionManager;
      managerRole = 'Division Manager';
      break;
    case 'Division Manager':
      return null;
  }

  if (!managerName) return null;

  const managerEmployee = allEmployees.find(
    e => e.name === managerName && e.id !== currentEmployee.id,
  );
  if (!managerEmployee) return null;

  const positionId = `${managerEmployee.id}::${managerRole}`;
  // Cycle guard: same person in the same role already visited
  if (visitedPositions.has(positionId)) return null;

  return { employee: managerEmployee, effectiveRole: managerRole, positionId };
}

/**
 * Returns the direct reports of an employee at a given effective role,
 * as PositionedEmployee objects carrying their own effective roles.
 */
export function getDirectReportsPositioned(
  employee: Employee,
  effectiveRole: Role,
  allEmployees: Employee[],
): PositionedEmployee[] {
  const seen = new Set<string>();
  const dedupe = (list: PositionedEmployee[]): PositionedEmployee[] =>
    list.filter(p => {
      if (seen.has(p.positionId)) return false;
      seen.add(p.positionId);
      return true;
    });

  switch (effectiveRole) {
    case 'SM': {
      return dedupe(
        allEmployees
          .filter(e => e.teamManager === employee.name && e.id !== employee.id)
          .map(e => makePositioned(e, normalizeRole(e.role) || 'Dev')),
      );
    }

    case 'GL': {
      // SMs who have this person listed as their groupLead
      return dedupe(
        allEmployees
          .filter(e => normalizeRole(e.role) === 'SM' && e.groupLead === employee.name)
          .map(e => makePositioned(e, 'SM')),
      );
    }

    case 'GM': {
      // GLs whose groupManager is this person
      const gls = allEmployees
        .filter(e => normalizeRole(e.role) === 'GL' && e.groupManager === employee.name)
        .map(e => makePositioned(e, 'GL'));
      // SMs who have NO groupLead (so they skip GL and report directly to GM)
      const sms = allEmployees
        .filter(
          e =>
            normalizeRole(e.role) === 'SM' &&
            !e.groupLead &&
            e.groupManager === employee.name,
        )
        .map(e => makePositioned(e, 'SM'));
      return dedupe([...gls, ...sms]);
    }

    case 'Department Manager': {
      // GMs whose departmentManager is this person
      return dedupe(
        allEmployees
          .filter(e => normalizeRole(e.role) === 'GM' && e.departmentManager === employee.name)
          .map(e => makePositioned(e, 'GM')),
      );
    }

    case 'Division Manager': {
      // Department Managers who report to this Division Manager
      const dms = allEmployees
        .filter(
          e =>
            normalizeRole(e.role) === 'Department Manager' &&
            e.divisionManager === employee.name,
        )
        .map(e => makePositioned(e, 'Department Manager'));
      // GMs who have no departmentManager (fall back directly to Division Manager)
      const gms = allEmployees
        .filter(
          e =>
            normalizeRole(e.role) === 'GM' &&
            !e.departmentManager &&
            e.divisionManager === employee.name,
        )
        .map(e => makePositioned(e, 'GM'));
      return dedupe([...dms, ...gms]);
    }

    default:
      return [];
  }
}

/** Backwards-compat shim used by HomePage stats. */
export function getDirectReports(
  employee: Employee,
  allEmployees: Employee[],
): Employee[] {
  return getDirectReportsPositioned(
    employee,
    normalizeRole(employee.role),
    allEmployees,
  ).map(p => p.employee);
}

export interface OrgHierarchy {
  /** Managers from topmost (Division Manager) down to direct manager, each with their effective role. */
  managersChain: PositionedEmployee[];
  selected: Employee;
  selectedEffectiveRole: Role;
  /** One level of direct reports with their effective roles. */
  directReports: PositionedEmployee[];
}

/**
 * Builds the full hierarchy for the selected employee at a given effective role.
 *
 * A person who holds two roles (e.g. GM AND Department Manager) will appear
 * TWICE in the chain — once per distinct position — so both roles are visible.
 * Cycle detection is position-based (`employee.id + role`), not name-based.
 */
export function getFullHierarchy(
  employee: Employee,
  effectiveRole: Role,
  allEmployees: Employee[],
): OrgHierarchy {
  const managersChain: PositionedEmployee[] = [];
  const visitedPositions = new Set<string>();

  visitedPositions.add(`${employee.id}::${effectiveRole}`);

  let currentEmp = employee;
  let currentRole = effectiveRole;

  while (true) {
    const mgr = getManagerPositioned(currentEmp, currentRole, allEmployees, visitedPositions);
    if (!mgr) break;

    visitedPositions.add(mgr.positionId);
    managersChain.unshift(mgr); // Prepend → topmost first

    currentEmp = mgr.employee;
    currentRole = mgr.effectiveRole;
  }

  const directReports = getDirectReportsPositioned(employee, effectiveRole, allEmployees);

  return {
    managersChain,
    selected: employee,
    selectedEffectiveRole: effectiveRole,
    directReports,
  };
}

/** Searches employees by partial name match (case-insensitive) */
export function searchEmployees(query: string, employees: Employee[]): Employee[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return employees.filter(e => e.name.toLowerCase().includes(q)).slice(0, 12);
}

/** Returns unique team names matching a query (case-insensitive) */
export function searchTeams(query: string, employees: Employee[]): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const teams = [...new Set(employees.map(e => e.team).filter(Boolean))];
  return teams.filter(t => t.toLowerCase().includes(q)).slice(0, 8);
}

/** Returns unique group names matching a query (case-insensitive) */
export function searchGroups(query: string, employees: Employee[]): string[] {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  const groups = [...new Set(employees.map(e => e.group).filter(Boolean))];
  return groups.filter(g => g.toLowerCase().includes(q)).slice(0, 8);
}

/**
 * Find the Team Manager (SM) employee for a given team name.
 * First looks for an employee with role SM in that team; falls back to
 * looking up the teamManager name from any employee in the team.
 */
export function findTeamSM(teamName: string, employees: Employee[]): Employee | null {
  const direct = employees.find(
    e => e.team === teamName && normalizeRole(e.role) === 'SM',
  );
  if (direct) return direct;
  const anyInTeam = employees.find(e => e.team === teamName && e.teamManager);
  if (anyInTeam) {
    return employees.find(e => e.name === anyInTeam.teamManager) ?? null;
  }
  return null;
}

/**
 * Find the Group Manager (GM) employee for a given group name.
 * First looks for an employee with role GM in that group; falls back to
 * looking up the groupManager name from any employee in the group.
 */
export function findGroupGM(groupName: string, employees: Employee[]): Employee | null {
  const direct = employees.find(
    e => e.group === groupName && normalizeRole(e.role) === 'GM',
  );
  if (direct) return direct;
  const anyInGroup = employees.find(e => e.group === groupName && e.groupManager);
  if (anyInGroup) {
    return employees.find(e => e.name === anyInGroup.groupManager) ?? null;
  }
  return null;
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
