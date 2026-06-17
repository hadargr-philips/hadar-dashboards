import * as XLSX from 'xlsx';
import { ReleaseType, StageStatus } from '../types/release';

export interface UploadedReleaseRow {
  number: string;
  type: ReleaseType;
  start_date: string;
  status: StageStatus;
  isReleased: boolean;
}

function normalizeHeader(value: string): string {
  return value.replace(/[\s\\/]+/g, '').toLowerCase();
}

function normalizeType(value: unknown): ReleaseType | null {
  if (typeof value !== 'string') return null;
  const text = value.trim().toUpperCase();
  if (!text) return null;
  if (text.includes('GSP')) return 'GSP';
  if (text.includes('SP')) return 'SP';
  if (text.includes('LR')) return 'LR';
  if (text.includes('FOK')) return 'FOK';
  return null;
}

function normalizeStatus(value: unknown): { status: StageStatus; isReleased: boolean } {
  if (typeof value !== 'string') return { status: '', isReleased: false };
  const text = value.trim().toLowerCase();
  if (!text) return { status: '', isReleased: false };
  if (text === 'released') return { status: '', isReleased: true };
  if (text === 'new') return { status: 'New', isReleased: false };
  if (text === 'in progress') return { status: 'In Progress', isReleased: false };
  if (text === 'planning') return { status: 'Planning', isReleased: false };
  if (text === 'completed' || text === 'complete') return { status: 'Completed', isReleased: false };
  if (text === 'last build testing') return { status: 'Last Build Testing', isReleased: false };
  return { status: '', isReleased: false };
}

function toDateString(value: unknown): string | null {
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed || !parsed.y || !parsed.m || !parsed.d) return null;
    const month = String(parsed.m).padStart(2, '0');
    const day = String(parsed.d).padStart(2, '0');
    return `${parsed.y}-${month}-${day}`;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const isLocalMidnight =
      value.getHours() === 0 &&
      value.getMinutes() === 0 &&
      value.getSeconds() === 0 &&
      value.getMilliseconds() === 0;

    const isUtcMidnight =
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0 &&
      value.getUTCMilliseconds() === 0;

    if (isLocalMidnight && !isUtcMidnight) {
      const year = value.getFullYear();
      const month = String(value.getMonth() + 1).padStart(2, '0');
      const day = String(value.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    if (isUtcMidnight && !isLocalMidnight) {
      const year = value.getUTCFullYear();
      const month = String(value.getUTCMonth() + 1).padStart(2, '0');
      const day = String(value.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    // Ambiguous/non-midnight timestamps: prefer local calendar date.
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  // If a full ISO datetime is present, keep the literal calendar date prefix.
  const isoDateTime = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})T/);
  if (isoDateTime) {
    const [, y, m, d] = isoDateTime;
    return `${y}-${m}-${d}`;
  }

  const mdYorDmY = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})(?:\s+.*)?$/);
  if (mdYorDmY) {
    const [, p1, p2, y] = mdYorDmY;
    const n1 = Number(p1);
    const n2 = Number(p2);

    // Resolve ambiguous slashed dates predictably:
    // - If one side is > 12, that side must be the day.
    // - If both are <= 12, default to MM/DD/YYYY (source file convention).
    const month = n1 > 12 ? n2 : n1;
    const day = n1 > 12 ? n1 : n2;

    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function parseReleaseUploadFile(file: File): Promise<UploadedReleaseRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: '',
    raw: false,
  });
  if (!rows.length) return [];

  const firstRow = rows[0];
  const headerKeyMap = new Map<string, string>();
  for (const key of Object.keys(firstRow)) {
    headerKeyMap.set(normalizeHeader(key), key);
  }

  const projectKey = headerKeyMap.get('project');
  const typeKey = headerKeyMap.get('spgsp');
  const dateKey = headerKeyMap.get('plannedreleasedate');
  const statusKey = headerKeyMap.get('gspspreleasestatus');

  if (!projectKey || !typeKey || !dateKey || !statusKey) {
    throw new Error(
      'Missing required columns. Expected: Project, SP/GSP, Planned Release date, GSP\\SP Release status.'
    );
  }

  const parsedRows: UploadedReleaseRow[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const project = row[projectKey];
    const number = typeof project === 'string' ? project.trim() : '';
    if (!number) continue;

    const key = number.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const type = normalizeType(row[typeKey]) ?? 'SP';
    const start_date = toDateString(row[dateKey]) ?? getTodayDateString();
    const { status, isReleased } = normalizeStatus(row[statusKey]);

    parsedRows.push({
      number,
      type,
      start_date,
      status,
      isReleased,
    });
  }

  return parsedRows;
}
