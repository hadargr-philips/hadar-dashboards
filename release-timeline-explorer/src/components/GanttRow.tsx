import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Release, Stage } from '../types/release';
import { MonthCol, calcBarPosition, calcConsolidatedBar } from '../utils/ganttHelpers';
import MilestoneMarker from './MilestoneMarker';

// ── Color maps ────────────────────────────────────────────────────────────────
const TYPE_BAR_COLOR: Record<string, string> = {
  LR:  '#2563eb',
  SP:  '#059669',
  GSP: '#f97316',
  FOK: '#9333ea',
};

const TYPE_BADGE_CLASS: Record<string, string> = {
  LR:  'bg-blue-100 text-blue-700 ring-blue-600/20',
  SP:  'bg-emerald-100 text-emerald-700 ring-emerald-600/20',
  GSP: 'bg-orange-100 text-orange-700 ring-orange-600/20',
  FOK: 'bg-purple-100 text-purple-700 ring-purple-600/20',
};

const STATUS_COLOR: Record<string, string> = {
  'In Progress':        '#3b82f6',
  'Planning':           '#f59e0b',
  'Completed':          '#22c55e',
  'New':                '#9ca3af',
  'Last Build Testing': '#a855f7',
  '':                   '#d1d5db',
};

// Month separator gridlines via CSS background
const GRIDLINES =
  'repeating-linear-gradient(to right, transparent, transparent calc(100% / 12 - 1px), #e5e7eb calc(100% / 12 - 1px), #e5e7eb calc(100% / 12))';

// ── Stage bar ────────────────────────────────────────────────────────────────
function StageBar({ stage, months }: { stage: Stage; months: MonthCol[] }) {
  const [show, setShow] = useState(false);
  const pos = calcBarPosition(stage.start_date, stage.end_date, months);

  if (pos.isMilestone) {
    return <MilestoneMarker stage={stage} leftPct={pos.leftPct} />;
  }

  const color = STATUS_COLOR[stage.status] ?? STATUS_COLOR[''];
  const showLabel = pos.widthPct > 7;

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 rounded-md cursor-pointer transition-opacity hover:opacity-100 flex items-center overflow-hidden"
      style={{
        left: `${pos.leftPct}%`,
        width: `${pos.widthPct}%`,
        height: '22px',
        backgroundColor: color,
        opacity: 0.88,
      }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {showLabel && (
        <span className="text-white text-[10px] font-medium px-2 truncate select-none leading-none">
          {stage.name}
        </span>
      )}

      {show && (
        <div
          className="absolute bottom-full mb-2 z-50 w-60 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none animate-fade-in"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="font-semibold mb-1.5 truncate">{stage.name}</div>
          {stage.status && (
            <div className="text-gray-300">Status: <span className="text-white">{stage.status}</span></div>
          )}
          <div className="text-gray-300 mt-0.5">Start: <span className="text-white">{stage.start_date}</span></div>
          {stage.end_date && (
            <div className="text-gray-300 mt-0.5">End: <span className="text-white">{stage.end_date}</span></div>
          )}
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
      <div className="flex items-stretch h-11 hover:bg-slate-50 transition-colors">
        {/* Label */}
        <div className="w-44 flex-shrink-0 flex items-center gap-1.5 px-3 border-r border-gray-100">
          <button
            onClick={() => setExpanded(e => !e)}
            className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors"
            aria-label={expanded ? 'Collapse stages' : 'Expand stages'}
          >
            {expanded
              ? <ChevronDown className="w-3.5 h-3.5" />
              : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          <span className="font-mono text-xs font-bold text-gray-800 truncate flex-1" title={release.number}>
            {release.number}
          </span>
          <span className={`flex-shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded ring-1 ring-inset ${typeBadge}`}>
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
        <div key={stage.id} className="flex items-stretch h-9 hover:bg-gray-50/60 transition-colors">
          <div className="w-44 flex-shrink-0 flex items-center px-3 pl-9 border-r border-gray-100">
            <span className="text-[11px] text-gray-500 truncate" title={stage.name}>
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
