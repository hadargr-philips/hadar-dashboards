import { Release, ReleaseType, Stage } from '../types/release';

export interface MonthColumn {
  year: number;
  month: number;
  label: string;
  startDate: string;
  endDateExclusive: string;
}

export interface TimelinePhaseBar {
  id: string;
  releaseId: string;
  label: string;
  startDate: string;
  endDate: string;
  lane: number;
  leftPct: number;
  widthPct: number;
}

export interface TimelineMilestonePoint {
  id: string;
  releaseId: string;
  label: string;
  date: string;
  leftPct: number;
}

export interface TimelineConsolidatedBar {
  id: string;
  releaseId: string;
  label: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  leftPct: number;
  widthPct: number;
}

export interface NormalizedRelease {
  release: Release;
  stages: Stage[];
  phaseBars: Omit<TimelinePhaseBar, 'lane'>[];
  milestones: TimelineMilestonePoint[];
  startDate: string | null;
  endDate: string | null;
}

export interface TimelineReleaseRow {
  key: string;
  kind: 'release';
  type: ReleaseType;
  badge: string;
  title: string;
  subtitle: string;
  releaseNumber: string;
  phaseBars: TimelinePhaseBar[];
  milestones: TimelineMilestonePoint[];
}

export interface TimelineConsolidatedRow {
  key: string;
  kind: 'consolidated';
  type: 'SP' | 'GSP';
  badge: string;
  title: string;
  subtitle: string;
  bars: TimelineConsolidatedBar[];
}

export type TimelineRow = TimelineReleaseRow | TimelineConsolidatedRow;
