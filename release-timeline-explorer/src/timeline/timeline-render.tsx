import React from 'react';
import { TimelineRow, TimelineReleaseRow, TimelineConsolidatedRow, MonthColumn } from './timeline-types';
import { TIMELINE_COLORS, TIMELINE_DIMENSIONS } from './timeline-theme';
import { formatDateRange, formatShortDate } from './timeline-utils';

interface TimelineRowsProps {
  rows: TimelineRow[];
  months: MonthColumn[];
}

function getBarColor(releaseType: TimelineReleaseRow['type'], releaseNumber: string): string {
  return TIMELINE_COLORS.specialReleaseBars[releaseNumber] ?? TIMELINE_COLORS.releaseBar[releaseType];
}

function getMilestoneColor(type: 'LR' | 'SP' | 'GSP' | 'FOK'): string {
  return TIMELINE_COLORS.milestone[type] ?? TIMELINE_COLORS.releaseBar[type];
}

function labelMode(widthPct: number): 'twoLine' | 'oneLine' | 'tooltipOnly' {
  if (widthPct >= 13) return 'twoLine';
  if (widthPct >= 7.5) return 'oneLine';
  return 'tooltipOnly';
}

function shouldShowFloatingLabel(widthPct: number, label: string): boolean {
  if (widthPct < 7.5) return true;
  // Approximation: allow ~1.2 chars per percentage point before clipping dominates readability.
  return label.length > widthPct * 1.2;
}

function RowLabel({ row }: { row: TimelineRow }) {
  const badgeClass = TIMELINE_COLORS.typeBadge[row.type] ?? 'bg-slate-100 text-slate-700 ring-slate-200';

  return (
    <div
      className="flex-shrink-0 border-r border-slate-200 px-4 py-4 bg-white"
      style={{ width: `${TIMELINE_DIMENSIONS.leftColumnPx}px` }}
    >
      <div className={`inline-flex items-center rounded-md ring-1 ring-inset px-2 py-0.5 text-xs font-bold tracking-wide mb-2 ${badgeClass}`}>
        {row.badge}
      </div>
      <div className="font-semibold text-base text-slate-900 leading-tight">{row.title}</div>
      <div className="text-xs text-slate-500 mt-1 leading-snug">{row.subtitle}</div>
    </div>
  );
}

function ReleaseRowBody({ row }: { row: TimelineReleaseRow }) {
  const laneCount = Math.max(1, row.phaseBars.reduce((max, bar) => Math.max(max, bar.lane + 1), 0));
  const rowHeight =
    TIMELINE_DIMENSIONS.rowVerticalPaddingPx * 2 +
    laneCount * TIMELINE_DIMENSIONS.phaseLaneHeightPx +
    TIMELINE_DIMENSIONS.milestoneLaneHeightPx;
  const barColor = getBarColor(row.type, row.releaseNumber);

  return (
    <div className="flex-1 relative overflow-hidden" style={{ minHeight: `${rowHeight}px` }}>
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${TIMELINE_DIMENSIONS.monthCount} - 1px), ${TIMELINE_COLORS.monthGrid} calc(100% / ${TIMELINE_DIMENSIONS.monthCount} - 1px), ${TIMELINE_COLORS.monthGrid} calc(100% / ${TIMELINE_DIMENSIONS.monthCount}))` }} />

      {row.phaseBars.map((bar) => {
        const mode = labelMode(bar.widthPct);
        const showFloatingLabel = shouldShowFloatingLabel(bar.widthPct, bar.label);
        const tooltip = `${bar.label} | ${formatDateRange(bar.startDate, bar.endDate)}`;
        const top = TIMELINE_DIMENSIONS.rowVerticalPaddingPx + bar.lane * TIMELINE_DIMENSIONS.phaseLaneHeightPx;
        const floatingLabelTop = Math.max(0, top - 24);

        return (
          <React.Fragment key={bar.id}>
            <div
              className="absolute rounded-lg shadow-sm overflow-hidden"
              style={{
                left: `${bar.leftPct}%`,
                width: `${bar.widthPct}%`,
                top: `${top}px`,
                height: `${TIMELINE_DIMENSIONS.barHeightPx}px`,
                backgroundColor: barColor,
                color: TIMELINE_COLORS.defaultBarText,
              }}
              title={tooltip}
            >
              {mode === 'twoLine' && (
                <div className="h-full flex flex-col items-center justify-center px-2 leading-tight">
                  <div className="text-[13px] font-semibold text-center w-full truncate">{bar.label}</div>
                  <div className="text-[11px] opacity-85 text-center w-full truncate">{formatDateRange(bar.startDate, bar.endDate)}</div>
                </div>
              )}
              {mode === 'oneLine' && (
                <div className="h-full px-2 flex flex-col items-center justify-center leading-tight">
                  <div className="text-[12px] font-semibold text-center w-full truncate">{bar.label}</div>
                  <div className="text-[10px] opacity-85 text-center w-full truncate">{formatDateRange(bar.startDate, bar.endDate)}</div>
                </div>
              )}
            </div>

            {showFloatingLabel && (
              <div
                className="absolute z-10 max-w-[260px] px-2 py-1 rounded border border-slate-300 bg-white/95 backdrop-blur-sm text-slate-700 shadow-sm pointer-events-none"
                style={{
                  left: `${bar.leftPct + bar.widthPct / 2}%`,
                  top: `${floatingLabelTop}px`,
                  transform: 'translateX(-50%)',
                }}
                title={tooltip}
              >
                <div className="text-[11px] font-semibold text-center truncate">{bar.label}</div>
                <div className="text-[10px] text-slate-500 text-center truncate">{formatDateRange(bar.startDate, bar.endDate)}</div>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {/* Layout rule: all milestones for a release are rendered on one dedicated lane below phase lanes. */}
      <div
        className="absolute left-0 right-0"
        style={{
          top: `${TIMELINE_DIMENSIONS.rowVerticalPaddingPx + laneCount * TIMELINE_DIMENSIONS.phaseLaneHeightPx}px`,
          height: `${TIMELINE_DIMENSIONS.milestoneLaneHeightPx}px`,
        }}
      >
        {row.milestones.map((milestone) => (
          <div
            key={milestone.id}
            className="absolute"
            style={{ left: `${milestone.leftPct}%`, transform: 'translateX(-50%)', top: '8px' }}
            title={`${milestone.label} | ${formatShortDate(milestone.date)}`}
          >
            <div className="w-4 h-4 rotate-45 rounded-[2px]" style={{ backgroundColor: getMilestoneColor(row.type) }} />
            <div className="text-[11px] text-slate-700 font-medium mt-1 whitespace-nowrap -translate-x-1/2">{milestone.label}</div>
            <div className="text-[10px] text-slate-500 whitespace-nowrap -translate-x-1/2">{formatShortDate(milestone.date)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Layout rule: SP and GSP releases are rendered as milestone diamonds on a single consolidated row,
// each diamond positioned at the release date. Multiple releases in the same month are spread left-to-right.
function ConsolidatedRowBody({ row }: { row: TimelineConsolidatedRow }) {
  const diamondColor = TIMELINE_COLORS.milestone[row.type] ?? TIMELINE_COLORS.releaseBar[row.type];
  return (
    <div className="flex-1 relative" style={{ minHeight: '88px' }}>
      <div className="absolute inset-0" style={{ backgroundImage: `repeating-linear-gradient(to right, transparent, transparent calc(100% / ${TIMELINE_DIMENSIONS.monthCount} - 1px), ${TIMELINE_COLORS.monthGrid} calc(100% / ${TIMELINE_DIMENSIONS.monthCount} - 1px), ${TIMELINE_COLORS.monthGrid} calc(100% / ${TIMELINE_DIMENSIONS.monthCount}))` }} />
      {row.bars.map((bar) => (
        <div
          key={bar.id}
          className="absolute flex flex-col items-center"
          style={{ left: `${bar.leftPct + bar.widthPct / 2}%`, transform: 'translateX(-50%)', top: '12px' }}
          title={`${bar.label} | ${formatShortDate(bar.startDate)}`}
        >
          {/* Diamond marker */}
          <div
            className="w-4 h-4 rotate-45 rounded-sm shadow-sm"
            style={{ backgroundColor: diamondColor }}
          />
          {/* Release number label below diamond */}
          <div
            className="mt-2 text-[11px] font-semibold whitespace-nowrap px-1 py-0.5 rounded"
            style={{ color: diamondColor }}
          >
            {bar.label}
          </div>
          <div className="text-[10px] text-slate-500 whitespace-nowrap mt-0.5">
            {formatShortDate(bar.startDate)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TimelineRows({ rows }: TimelineRowsProps) {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm bg-white">
        No releases found.
      </div>
    );
  }

  return (
    <div className="bg-white">
      {rows.map((row) => (
        <div key={row.key} className="flex border-b border-slate-100 last:border-b-0">
          <RowLabel row={row} />
          {row.kind === 'release' ? <ReleaseRowBody row={row} /> : <ConsolidatedRowBody row={row} />}
        </div>
      ))}
    </div>
  );
}
