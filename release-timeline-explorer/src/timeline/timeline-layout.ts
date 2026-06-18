import { Release, Stage } from '../types/release';
import {
  MonthColumn,
  NormalizedRelease,
  TimelineConsolidatedBar,
  TimelineConsolidatedRow,
  TimelinePhaseBar,
  TimelineReleaseRow,
  TimelineRow,
} from './timeline-types';
import { dateToX, formatDateRange, monthKey } from './timeline-utils';

function sortByDateThenOrder(a: Stage, b: Stage): number {
  if (a.start_date < b.start_date) return -1;
  if (a.start_date > b.start_date) return 1;
  return a.sort_order - b.sort_order;
}

function getReleaseDateRange(stages: Stage[]): { startDate: string | null; endDate: string | null } {
  if (stages.length === 0) {
    return { startDate: null, endDate: null };
  }

  const allDates = stages.flatMap((stage) => (stage.end_date ? [stage.start_date, stage.end_date] : [stage.start_date]));
  const sorted = [...allDates].sort();

  return {
    startDate: sorted[0] ?? null,
    endDate: sorted[sorted.length - 1] ?? null,
  };
}

export function normalizeReleases(releases: Release[], stages: Stage[], months: MonthColumn[]): NormalizedRelease[] {
  const stagesByRelease = new Map<string, Stage[]>();

  for (const stage of stages) {
    const current = stagesByRelease.get(stage.release_id) ?? [];
    current.push(stage);
    stagesByRelease.set(stage.release_id, current);
  }

  return [...releases]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((release) => {
      const releaseStages = [...(stagesByRelease.get(release.id) ?? [])].sort(sortByDateThenOrder);
      const phaseBars = releaseStages
        .filter((stage) => !!stage.end_date)
        .map((stage) => {
          const left = dateToX(stage.start_date, months);
          const right = dateToX(stage.end_date as string, months);
          const low = Math.min(left, right);
          const high = Math.max(left, right);
          return {
            id: stage.id,
            releaseId: release.id,
            label: stage.name,
            startDate: stage.start_date,
            endDate: stage.end_date as string,
            leftPct: low,
            widthPct: Math.max(1.2, high - low),
          };
        });

      const milestones = releaseStages
        .filter((stage) => !stage.end_date)
        .map((stage) => ({
          id: stage.id,
          releaseId: release.id,
          label: stage.name,
          date: stage.start_date,
          leftPct: dateToX(stage.start_date, months),
        }));

      const range = getReleaseDateRange(releaseStages);

      return {
        release,
        stages: releaseStages,
        phaseBars,
        milestones,
        startDate: range.startDate,
        endDate: range.endDate,
      };
    });
}

// Layout rule: each phase bar gets its own dedicated lane (one stage per row for standard timeline layout).
export function assignPhaseLanes(bars: Omit<TimelinePhaseBar, 'lane'>[]): TimelinePhaseBar[] {
  return bars.map((bar, index) => ({
    ...bar,
    lane: index,
  }));
}

function getReleaseSubtitle(startDate: string | null, endDate: string | null, phaseCount: number, milestoneCount: number): string {
  const phases = `${phaseCount} phase${phaseCount === 1 ? '' : 's'}`;
  const milestones = `${milestoneCount} milestone${milestoneCount === 1 ? '' : 's'}`;

  if (!startDate || !endDate) {
    return `${phases} | ${milestones}`;
  }

  return `${formatDateRange(startDate, endDate)} | ${phases} | ${milestones}`;
}

function groupConsolidatedBarsByMonth(bars: TimelineConsolidatedBar[]): Map<string, TimelineConsolidatedBar[]> {
  const grouped = new Map<string, TimelineConsolidatedBar[]>();

  for (const bar of bars) {
    const key = monthKey(bar.startDate);
    const current = grouped.get(key) ?? [];
    current.push(bar);
    grouped.set(key, current);
  }

  return grouped;
}

// Layout rule: in a consolidated row, releases that start in the same month are sequenced left-to-right with fixed spacing.
export function layoutConsolidatedMonthlyBars(
  bars: TimelineConsolidatedBar[],
  months: MonthColumn[],
): TimelineConsolidatedBar[] {
  const grouped = groupConsolidatedBarsByMonth(bars);

  return Array.from(grouped.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .flatMap(([month, monthBars]) => {
      const monthIdx = months.findIndex((col) => `${col.year}-${String(col.month + 1).padStart(2, '0')}` === month);
      if (monthIdx < 0) {
        return monthBars;
      }

      const monthWidthPct = 100 / months.length;
      const monthStartPct = monthIdx * monthWidthPct;
      const gapPct = 0.9;
      const availablePct = Math.max(3, monthWidthPct - gapPct * (monthBars.length - 1));
      const barWidthPct = Math.max(2.8, availablePct / monthBars.length);

      return monthBars
        .sort((a, b) => (a.startDate < b.startDate ? -1 : a.startDate > b.startDate ? 1 : a.label.localeCompare(b.label)))
        .map((bar, idx) => ({
          ...bar,
          leftPct: monthStartPct + idx * (barWidthPct + gapPct),
          widthPct: barWidthPct,
        }));
    });
}

function buildConsolidatedRow(type: 'SP' | 'GSP', normalized: NormalizedRelease[], months: MonthColumn[]): TimelineConsolidatedRow | null {
  const items = normalized.filter((item) => item.release.type === type);
  if (items.length === 0) {
    return null;
  }

  const bars = items.map((item) => {
    const fallbackDate = item.startDate ?? item.release.created_at.slice(0, 10);
    const left = dateToX(fallbackDate, months);
    const right = dateToX(item.endDate ?? fallbackDate, months);
    const low = Math.min(left, right);
    const high = Math.max(left, right);

    return {
      id: item.release.id,
      releaseId: item.release.id,
      label: item.release.number,
      subtitle: `${item.phaseBars.length + item.milestones.length} item${item.phaseBars.length + item.milestones.length === 1 ? '' : 's'}`,
      startDate: fallbackDate,
      endDate: item.endDate ?? fallbackDate,
      leftPct: low,
      widthPct: Math.max(3, high - low),
    };
  });

  const laidOut = layoutConsolidatedMonthlyBars(bars, months);

  return {
    key: `consolidated-${type}`,
    kind: 'consolidated',
    type,
    badge: type,
    title: type === 'SP' ? 'Service Packs' : 'Global Service Packs',
    subtitle: `${items.length} releases consolidated`,
    bars: laidOut,
  };
}

// Layout rule: LR releases are rendered one release per row with dedicated milestone lane; SP/GSP are each consolidated into one row.
export function buildReleaseRows(releases: Release[], stages: Stage[], months: MonthColumn[]): TimelineRow[] {
  const normalized = normalizeReleases(releases, stages, months);
  const rows: TimelineRow[] = [];

  for (const item of normalized) {
    if (item.release.type !== 'LR') {
      continue;
    }

    rows.push({
      key: `release-${item.release.id}`,
      kind: 'release',
      type: item.release.type,
      badge: item.release.type,
      title: item.release.number,
      subtitle: getReleaseSubtitle(item.startDate, item.endDate, item.phaseBars.length, item.milestones.length),
      releaseNumber: item.release.number,
      phaseBars: assignPhaseLanes(item.phaseBars),
      milestones: item.milestones,
    });
  }

  const spRow = buildConsolidatedRow('SP', normalized, months);
  const gspRow = buildConsolidatedRow('GSP', normalized, months);

  if (spRow) rows.push(spRow);
  if (gspRow) rows.push(gspRow);

  return rows;
}
