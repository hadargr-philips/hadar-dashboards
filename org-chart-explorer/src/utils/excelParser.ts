import * as XLSX from 'xlsx';
import { Employee, Role } from '../types/employee';

function normalizeHeader(header: unknown): string {
  return String(header ?? '').toLowerCase().trim();
}

function findColumnIndex(headers: string[], ...patterns: string[]): number {
  for (const pattern of patterns) {
    const lp = pattern.toLowerCase();
    const idx = headers.findIndex(h => {
      const lh = normalizeHeader(h);
      return lh === lp || lh.includes(lp);
    });
    if (idx !== -1) return idx;
  }
  return -1;
}

function toRole(value: string | undefined): Role {
  const v = (value ?? '').trim();
  if (v === 'SM' || v.toLowerCase() === 'team manager') return 'SM';
  if (v === 'GL' || v.toLowerCase() === 'group lead') return 'GL';
  if (v === 'GM' || v.toLowerCase() === 'group manager') return 'GM';
  if (v === 'Dev' || v.toLowerCase() === 'developer') return 'Dev';
  if (v === 'QA') return 'QA';
  if (v.toLowerCase().includes('department manager') || v.toLowerCase() === 'dm') return 'Department Manager';
  if (v.toLowerCase().includes('division manager') || v.toLowerCase() === 'divm') return 'Division Manager';
  return '';
}

export interface ParseResult {
  employees: Employee[];
  errors: string[];
  warnings: string[];
}

export const REQUIRED_COLUMN_GUIDE = [
  { column: 'Employee Name', description: 'Full name of the employee' },
  { column: 'Team', description: 'Team name' },
  { column: 'Group', description: 'Group name (use "Backend" for Backend group)' },
  { column: 'Role', description: 'SM / GL / GM / Dev / QA (blank allowed)' },
  { column: 'Team Manager (SM)', description: 'Name of the Team Manager (SM)' },
  { column: 'Group Lead (GL)', description: 'Name of the Group Lead (GL) — Backend only' },
  { column: 'Group Manager (GM)', description: 'Name of the Group Manager (GM)' },
  { column: 'Department Manager', description: 'Name of the Department Manager' },
  { column: 'Division Manager', description: 'Name of the Division Manager' },
];

export function parseExcelFile(arrayBuffer: ArrayBuffer): ParseResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Read workbook
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
  } catch {
    return {
      employees: [],
      errors: ['Failed to read Excel file. Please ensure it is a valid .xlsx file.'],
      warnings: [],
    };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { employees: [], errors: ['Excel file contains no sheets.'], warnings: [] };
  }

  const sheet = workbook.Sheets[sheetName];

  // Get as 2D array (header: 1 returns arrays, row 0 = headers)
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: '',
    blankrows: false,
  });

  if (rawData.length < 2) {
    return { employees: [], errors: ['Excel file has no data rows.'], warnings: [] };
  }

  const headers = (rawData[0] as unknown[]).map(h => String(h ?? ''));
  const dataRows = rawData.slice(1) as unknown[][];

  // Locate columns
  const colName = findColumnIndex(headers, 'employee name', 'name', 'employee');
  const colTeam = findColumnIndex(headers, 'team');
  const colGroup = findColumnIndex(headers, 'group');
  const colRole = findColumnIndex(headers, 'role');
  const colSM = findColumnIndex(headers, 'team manager', 'sm');
  const colGL = findColumnIndex(headers, 'group lead', 'gl');
  const colGM = findColumnIndex(headers, 'group manager', 'gm');
  const colDM = findColumnIndex(headers, 'department manager', 'dept manager');
  const colDivM = findColumnIndex(headers, 'division manager', 'divm', 'division head');

  if (colName === -1) {
    errors.push('Missing required column: "Employee Name" (or "Name").');
  }
  if (errors.length > 0) {
    return { employees: [], errors, warnings };
  }

  if (colTeam === -1) warnings.push('Column "Team" not found — team field will be blank.');
  if (colGroup === -1) warnings.push('Column "Group" not found — group field will be blank.');
  if (colRole === -1) warnings.push('Column "Role" not found — roles will be blank.');
  if (colSM === -1) warnings.push('Column "Team Manager (SM)" not found.');
  if (colGL === -1) warnings.push('Column "Group Lead (GL)" not found — GL layer will be unavailable.');
  if (colGM === -1) warnings.push('Column "Group Manager (GM)" not found.');
  if (colDM === -1) warnings.push('Column "Department Manager" not found.');
  if (colDivM === -1) warnings.push('Column "Division Manager" not found.');

  const getValue = (row: unknown[], colIndex: number): string => {
    if (colIndex === -1 || colIndex >= row.length) return '';
    return String(row[colIndex] ?? '').trim();
  };

  const employees: Employee[] = [];
  const seenIds = new Set<string>();

  dataRows.forEach((row, rowIdx) => {
    const rawName = getValue(row, colName);
    if (!rawName) return; // Skip blank rows

    // Generate stable ID
    const baseId = `emp-${rawName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`;
    let uid = baseId;
    let suffix = 1;
    while (seenIds.has(uid)) {
      uid = `${baseId}-${suffix++}`;
    }
    seenIds.add(uid);

    const employee: Employee = {
      id: uid,
      name: rawName,
      team: getValue(row, colTeam),
      group: getValue(row, colGroup),
      role: toRole(getValue(row, colRole)),
      teamManager: getValue(row, colSM),
      groupLead: getValue(row, colGL),
      groupManager: getValue(row, colGM),
      departmentManager: getValue(row, colDM),
      divisionManager: getValue(row, colDivM),
    };

    employees.push(employee);

    if (rowIdx < 3 && !employee.team) {
      // Only warn for first few rows to avoid spam
    }
  });

  if (employees.length === 0) {
    errors.push('No valid employees were found in the Excel file.');
  }

  return { employees, errors, warnings };
}
