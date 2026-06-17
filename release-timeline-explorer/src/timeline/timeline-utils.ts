import { MonthColumn } from './timeline-types';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getMonthColumns(fromDate: Date = new Date(), count = 12): MonthColumn[] {
  return Array.from({ length: count }, (_, i) => {
    const start = new Date(fromDate.getFullYear(), fromDate.getMonth() + i, 1);
    const end = new Date(fromDate.getFullYear(), fromDate.getMonth() + i + 1, 1);
    return {
      year: start.getFullYear(),
      month: start.getMonth(),
      label: `${MONTH_NAMES[start.getMonth()]} ${start.getFullYear()}`,
      startDate: toIsoDate(start),
      endDateExclusive: toIsoDate(end),
    };
  });
}

export function formatShortDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

export function formatDateRange(startDate: string, endDate: string): string {
  return `${formatShortDate(startDate)} - ${formatShortDate(endDate)}`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// Layout helper: map a date to X percentage within equal-width month columns.
export function dateToX(dateStr: string, cols: MonthColumn[]): number {
  const date = new Date(`${dateStr}T00:00:00`);
  const timelineStart = new Date(cols[0].year, cols[0].month, 1);
  const timelineEnd = new Date(cols[cols.length - 1].year, cols[cols.length - 1].month + 1, 1);

  if (date <= timelineStart) return 0;
  if (date >= timelineEnd) return 100;

  for (let i = 0; i < cols.length; i += 1) {
    const colStart = new Date(cols[i].year, cols[i].month, 1);
    const colEnd = new Date(cols[i].year, cols[i].month + 1, 1);
    if (date >= colStart && date < colEnd) {
      const fraction = (date.getTime() - colStart.getTime()) / (colEnd.getTime() - colStart.getTime());
      return ((i + fraction) / cols.length) * 100;
    }
  }

  return 100;
}

export function monthKey(isoDate: string): string {
  return isoDate.slice(0, 7);
}
