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
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  const ymd = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const dmy = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

export async function parseReleaseUploadFile(file: File): Promise<UploadedReleaseRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The uploaded file has no sheets.');
  }

  const sheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });
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
    const start_date = toDateString(row[dateKey]) ?? new Date().toISOString().slice(0, 10);
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
