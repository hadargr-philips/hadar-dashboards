import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Release, Stage } from '../types/release';
import { MonthCol, calcBarPosition, calcConsolidatedBar, fmtDate, fmtRange } from '../utils/ganttHelpers';
import MilestoneMarker from './MilestoneMarker';

// ── Color maps ────────────────────────────────────────────────────────────────
const TYPE_BAR_COLOR: Record<string, string> = {
  LR:  '#2563eb',
  SP:  '#059669',
  GSP: '#ea580c',
  FOK: '#9333ea',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  LR:  'bg-blue-100 text-blue-700 ring-blue-600/20',
  SP:  'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  GSP: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  FOK: 'bg-purple-100 text-purple-700 ring-purple-600/20',
};

// All colors dark enough for white text (WCAG AA)
const STATUS_COLOR: Record<string, string> = {
  'In Progress':        '#2563eb',
  'Planning':           '#d97706',
  'Completed':          '#16a34a',
  'New':                '#64748b',
  'Last Build Testing': '#9333ea',
  '':                   '#475569',
};

// Month separator gridlines via CSS background
const GRIDLINES =
  'repeating-linear-gradient(to right, transparent, transparent calc(100% / 12 - 1px), #e5e7eb calc(100% / 12 - 1px), #e5e7eb calc(100% / 12))';

// ── Stage bar ────────────────────────────────────────────────────────────────
function StageBar({ stage, months }: { stage: Stage; months: MonthCol[] }) {
  const [showTip, setShowTip] = useState(false);
  const pos = calcBarPosition(stage.start_date, stage.end_date, months);

  if (pos.isMilestone) {
    return <MilestoneMarker stage={stage} leftPct={pos.leftPct} />;
  }

  const color = STATUS_COLOR[stage.status] ?? STATUS_COLOR[''];

  // Inline date label strategy based on bar width
  const dateStr = stage.end_date
    ? fmtRange(stage.start_date, stage.end_date)
    : fmtDate(stage.start_date);
  const startStr = fmtDate(stage.start_date);

  // Wide (≥10%): name on left + full date range on right
  // Medium (5-10%): start date only centered
  // Narrow (<5%): floating label above bar
  const isWide   = pos.widthPct >= 10;
  const isMedium = pos.widthPct >= 5 && pos.widthPct < 10;
  const isNarrow = pos.widthPct < 5;

  return (
    <>
      {/* Floating label above narrow bars */}
      {isNarrow && (
        <div
          className="absolute z-10 pointer-events-none"
          style={{
            left: `${pos.leftPct + pos.widthPct / 2}%`,
            bottom: 'calc(50% + 15px)',
            transform: 'translateX(-50%)',
          }}
        >
          <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded whitespace-nowrap">
            {dateStr}
          </span>
        </div>
      )}

      <div
        className="absolute top-1/2 -translate-y-1/2 rounded-md flex items-center overflow-hidden cursor-default"
        style={{
          left: `${pos.leftPct}%`,
          width: `${pos.widthPct}%`,
          height: '26px',
          backgroundColor: color,
        }}
        onMouseEnter={() => setShowTip(true)}
        onMouseLeave={() => setShowTip(false)}
      >
        {isWide && (
          <>
            <span className="text-white text-[11px] font-semibold pl-2 truncate flex-shrink select-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
              {stage.name}
            </span>
            <span className="text-white text-[11px] font-semibold pr-2 ml-auto flex-shrink-0 select-none whitespace-nowrap" style={{ textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
              {dateStr}
            </span>
          </>
        )}
        {isMedium && (
          <span className="text-white text-[11px] font-semibold px-2 w-full text-center select-none" style={{ textShadow: '0 1px 2px rgba(0,0,0,.3)' }}>
            {startStr}
          </span>
        )}

        {/* Hover tooltip — deps & comments only */}
        {showTip && (
          <div
            className="absolute bottom-full mb-2 z-50 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none animate-fade-in"
            style={{ left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="font-semibold mb-1.5 truncate">{stage.name}</div>
            {stage.status && (
              <div className="text-gray-300">Status: <span className="text-white">{stage.status}</span></div>
            )}
            <div className="text-gray-300 mt-0.5">
              {stage.end_date ? fmtRange(stage.start_date, stage.end_date) : fmtDate(stage.start_date)}
            </div>
            {stage.dependencies && (
              <div className="mt-2 text-gray-400 leading-tight">
                <span className="text-gray-200 font-medium">Deps:</span> {stage.dependencies}
              </div>
            )}
            {stage.comments && (
              <div className="mt-1 text-gray-400 italic leading-tight">{stage.comments}</div>
            )}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        )}
      </div>
    </>
  );
}

// ── GanttRow ─────────────────────────────────────────────────────────────────
interface Props {
  release: Release;
  stages: Stage[];
  months: MonthCol[];
}

export default function GanttRow({ release, stages, months }: Props) {
  const [expanded, setExpanded] = useState(true);
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order);
  const consolidated = calcConsolidatedBar(stages, months);
  const typeColor = TYPE_BAR_COLOR[release.type] ?? '#6b7280';
  const typeBadge = TYPE_BADGE_CLASS[release.type] ?? 'bg-gray-100 text-gray-600 ring-gray-500/20';

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      {/* ── Consolidated row ── */}
      <div className="flex items-stretch h-12 hover:bg-slate-50 transition-colors">
        {/* Label */}
        <div className="w-52 flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-gray-100">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            aria-label={expanded ? 'Collapse stages' : 'Expand stages'}
          >
            {expanded
              ? <ChevronDown className="w-4 h-4" />
              : <ChevronRight className="w-4 h-4" />}
          </button>
          <span className="font-mono text-sm font-bold text-gray-800 truncate flex-1" title={release.number}>
            {release.number}
          </span>
          <span className={`flex-shrink-0 text-[11px] font-bold px-2 py-0.5 rounded ring-1 ring-inset ${typeBadge}`}>
            {release.type}
          </span>
        </div>

        {/* Consolidated bar */}
        <div className="flex-1 relative" style={{ backgroundImage: GRIDLINES }}>
          {consolidated && !consolidated.isMilestone && (
            <div
              className="absolute top-1/2 -translate-y-1/2 rounded-full pointer-events-none"
              style={{
                left: `${consolidated.leftPct}%`,
                width: `${consolidated.widthPct}%`,
                height: '10px',
                backgroundColor: typeColor,
                opacity: 0.35,
              }}
            />
          )}
          {consolidated && consolidated.isMilestone && (
            <div
              className="absolute top-1/2 pointer-events-none"
              style={{
                left: `${consolidated.leftPct}%`,
                transform: 'translateX(-50%) translateY(-50%) rotate(45deg)',
                width: '10px',
                height: '10px',
                backgroundColor: typeColor,
                opacity: 0.45,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Stage sub-rows ── */}
      {expanded && sortedStages.map(stage => (
        <div key={stage.id} className="flex items-stretch h-11 hover:bg-gray-50/60 transition-colors">
          <div className="w-52 flex-shrink-0 flex items-center px-3 pl-10 border-r border-gray-100">
            <span className="text-[13px] text-gray-500 truncate" title={stage.name}>
              {stage.name}
            </span>
          </div>
          <div className="flex-1 relative" style={{ backgroundImage: GRIDLINES }}>
            <StageBar stage={stage} months={months} />
          </div>
        </div>
      ))}
    </div>
  );
}
