import { Stage } from '../types/release';

export interface MonthCol {
  year: number;
  month: number; // 0-indexed (Jan=0)
  label: string; // "Jun 2026"
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/** Format a YYYY-MM-DD string as "Jun 16" */
export function fmtDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${MONTH_NAMES[m - 1]} ${d}`;
}

/** Format a date range as "Jun 16 – Sep 11" */
export function fmtRange(startDate: string, endDate: string): string {
  return `${fmtDate(startDate)} – ${fmtDate(endDate)}`;
}

/** Returns 12 MonthCol objects starting from the given date's month. */
export function getMonthColumns(fromDate: Date = new Date(), count = 12): MonthCol[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + i, 1);
    return {
      year: d.getFullYear(),
      month: d.getMonth(),
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    };
  });
}

/**
 * Converts a YYYY-MM-DD date string to a 0–100 percentage within the timeline.
 * Each month is visually equal (1/count of total width), regardless of day count.
 * Dates before the timeline clamp to 0; dates after clamp to 100.
 */
export function dateToPercent(dateStr: string, cols: MonthCol[]): number {
  const date = new Date(dateStr + 'T00:00:00');
  const timelineStart = new Date(cols[0].year, cols[0].month, 1);
  const timelineEnd = new Date(cols[cols.length - 1].year, cols[cols.length - 1].month + 1, 1);

  if (date <= timelineStart) return 0;
  if (date >= timelineEnd) return 100;

  for (let i = 0; i < cols.length; i++) {
    const colStart = new Date(cols[i].year, cols[i].month, 1);
    const colEnd = new Date(cols[i].year, cols[i].month + 1, 1);
    if (date >= colStart && date < colEnd) {
      const dayFraction = (date.getTime() - colStart.getTime()) / (colEnd.getTime() - colStart.getTime());
      return ((i + dayFraction) / cols.length) * 100;
    }
  }
  return 100;
}

export interface BarPosition {
  leftPct: number;
  widthPct: number;
  isMilestone: boolean;
}

/**
 * Returns position info for a bar between startDate and endDate.
 * If endDate is null → milestone (widthPct = 0).
 * Handles reversed dates (end < start) gracefully.
 */
export function calcBarPosition(startDate: string, endDate: string | null, cols: MonthCol[]): BarPosition {
  const leftPct = dateToPercent(startDate, cols);
  if (!endDate) {
    return { leftPct, widthPct: 0, isMilestone: true };
  }
  const rightPct = dateToPercent(endDate, cols);
  const lo = Math.min(leftPct, rightPct);
  const hi = Math.max(leftPct, rightPct);
  return { leftPct: lo, widthPct: Math.max(0.5, hi - lo), isMilestone: false };
}

/**
 * Computes a consolidated bar spanning all stage dates.
 * Uses min(all dates) → max(all dates).
 */
export function calcConsolidatedBar(stages: Stage[], cols: MonthCol[]): BarPosition | null {
  if (stages.length === 0) return null;
  const allDates = stages.flatMap(s =>
    [s.start_date, s.end_date].filter((d): d is string => !!d)
  );
  if (allDates.length === 0) return null;
  const sorted = [...allDates].sort();
  const minDate = sorted[0];
  const maxDate = sorted[sorted.length - 1];
  if (minDate === maxDate) {
    return { leftPct: dateToPercent(minDate, cols), widthPct: 0, isMilestone: true };
  }
  return calcBarPosition(minDate, maxDate, cols);
}

export function isMilestone(stage: Pick<Stage, 'end_date'>): boolean {
  return !stage.end_date;
}
