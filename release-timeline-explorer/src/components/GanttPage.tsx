import React, { useMemo } from 'react';
import { ChevronLeft, Calendar, Settings } from 'lucide-react';
import { useReleaseStore } from '../store/useReleaseStore';
import { getMonthColumns, dateToPercent } from '../utils/ganttHelpers';
import GanttRow from './GanttRow';

const STATUS_LEGEND = [
  { label: 'In Progress',        color: '#3b82f6' },
  { label: 'Planning',           color: '#f59e0b' },
  { label: 'Completed',          color: '#22c55e' },
  { label: 'New',                color: '#9ca3af' },
  { label: 'Last Build Testing', color: '#a855f7' },
  { label: 'Milestone ◆',       color: '#6366f1' },
];

interface Props {
  onBack: () => void;
  onAdmin: () => void;
}

export default function GanttPage({ onBack, onAdmin }: Props) {
  const { releases, stages } = useReleaseStore(s => ({ releases: s.releases, stages: s.stages }));
  const months = useMemo(() => getMonthColumns(new Date()), []);

  const todayPct = useMemo(() => {
    const t = new Date();
    const y = t.getFullYear();
    const m = String(t.getMonth() + 1).padStart(2, '0');
    const d = String(t.getDate()).padStart(2, '0');
    return dateToPercent(`${y}-${m}-${d}`, months);
  }, [months]);

  const sortedReleases = [...releases].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* ── App header ── */}
      <header className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-200 shadow-sm z-30">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600">
            <Calendar className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-bold text-gray-900 text-sm">Release Timeline</h1>
        </div>

        {/* Legend */}
        <div className="ml-4 hidden lg:flex items-center gap-3 flex-wrap">
          {STATUS_LEGEND.map(({ label, color }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-3">
          <span className="text-xs text-gray-400 hidden sm:block">
            {months[0].label} → {months[months.length - 1].label}
          </span>
          <button
            onClick={onAdmin}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
            Admin
          </button>
        </div>
      </header>

      {/* ── Gantt chart (scrollable) ── */}
      <div className="flex-1 overflow-auto">
        <div className="min-w-[1100px]">

          {/* Month header (sticky within scroll container) */}
          <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-sm">
            <div className="w-44 flex-shrink-0 border-r border-gray-200 flex items-center px-3 py-2">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Release</span>
            </div>
            <div className="flex-1 flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 text-center py-2 border-l border-gray-200 text-[11px] font-medium text-gray-500 select-none"
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Rows + today line */}
          <div className="bg-white relative">
            {/* Today vertical line */}
            {todayPct > 0 && todayPct < 100 && (
              <div
                className="absolute top-0 bottom-0 z-10 pointer-events-none"
                style={{
                  left: `calc(11rem + (100% - 11rem) * ${todayPct / 100})`,
                  width: '2px',
                  background: 'rgba(239,68,68,0.45)',
                }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b whitespace-nowrap leading-none">
                  Today
                </span>
              </div>
            )}

            {sortedReleases.length === 0 ? (
              <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                No releases yet. Add some in the Admin Panel.
              </div>
            ) : (
              sortedReleases.map(release => (
                <GanttRow
                  key={release.id}
                  release={release}
                  stages={stages.filter(s => s.release_id === release.id)}
                  months={months}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
