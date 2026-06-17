import { ReleaseType } from '../types/release';

export const TIMELINE_DIMENSIONS = {
  leftColumnPx: 320,
  monthCount: 12,
  phaseLaneHeightPx: 62,
  milestoneLaneHeightPx: 42,
  rowVerticalPaddingPx: 14,
  barHeightPx: 44,
  monthHeaderHeightPx: 56,
};

export const TIMELINE_COLORS = {
  background: '#f4f7fb',
  monthGrid: '#dbe3ef',
  defaultBarText: '#ffffff',
  todayLine: 'rgba(220, 38, 38, 0.65)',
  typeBadge: {
    LR: 'bg-blue-100 text-blue-800 ring-blue-200',
    SP: 'bg-teal-100 text-teal-800 ring-teal-200',
    GSP: 'bg-amber-100 text-amber-900 ring-amber-200',
    FOK: 'bg-violet-100 text-violet-800 ring-violet-200',
  },
  releaseBar: {
    LR: '#1e3a8a',
    SP: '#0f766e',
    GSP: '#92400e',
    FOK: '#6d28d9',
  } as Record<ReleaseType, string>,
  specialReleaseBars: {
    '15.1.2.0': '#1e3a8a',
    '12.2.8.750': '#15803d',
  } as Record<string, string>,
};
