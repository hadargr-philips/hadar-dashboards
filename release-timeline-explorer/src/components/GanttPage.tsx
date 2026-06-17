import React, { useMemo } from 'react';
import { ChevronLeft, Calendar, Settings } from 'lucide-react';
import { useReleaseStore } from '../store/useReleaseStore';
import { buildReleaseRows } from '../timeline/timeline-layout';
import { TimelineRows } from '../timeline/timeline-render';
import { TimelineGoLivesTable } from '../timeline/timeline-table';
import { TIMELINE_COLORS, TIMELINE_DIMENSIONS } from '../timeline/timeline-theme';
import { dateToX, getMonthColumns, toIsoDate } from '../timeline/timeline-utils';

interface Props {
  onBack: () => void;
  onAdmin: () => void;
}

export default function GanttPage({ onBack, onAdmin }: Props) {
  const { releases, stages, goLives } = useReleaseStore(s => ({
    releases: s.releases,
    stages: s.stages,
    goLives: s.goLives,
  }));
  const months = useMemo(() => getMonthColumns(new Date(), TIMELINE_DIMENSIONS.monthCount), []);
  const rows = useMemo(() => buildReleaseRows(releases, stages, months), [releases, stages, months]);

  const todayPct = useMemo(() => {
    return dateToX(toIsoDate(new Date()), months);
  }, [months]);

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: TIMELINE_COLORS.background }}>
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
          <h1 className="font-bold text-gray-900 text-sm">Release Timeline - Executive Dashboard</h1>
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
        <div className="min-w-[1280px]">

          {/* Month header (sticky within scroll container) */}
          <div className="sticky top-0 z-20 flex bg-white border-b border-gray-200 shadow-sm">
            <div
              className="flex-shrink-0 border-r border-gray-200 flex items-center px-4"
              style={{ width: `${TIMELINE_DIMENSIONS.leftColumnPx}px`, height: `${TIMELINE_DIMENSIONS.monthHeaderHeightPx}px` }}
            >
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Release / Section</span>
            </div>
            <div className="flex-1 flex">
              {months.map((m, i) => (
                <div
                  key={i}
                  className="flex-1 text-center py-4 border-l border-gray-200 text-[13px] font-semibold text-slate-500 select-none"
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
                  left: `calc(${TIMELINE_DIMENSIONS.leftColumnPx}px + (100% - ${TIMELINE_DIMENSIONS.leftColumnPx}px) * ${todayPct / 100})`,
                  width: '2px',
                  background: TIMELINE_COLORS.todayLine,
                }}
              >
                <span className="absolute top-0 left-1/2 -translate-x-1/2 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-b whitespace-nowrap leading-none">
                  Today
                </span>
              </div>
            )}

            <TimelineRows rows={rows} months={months} />
          </div>

          <TimelineGoLivesTable rows={goLives} />
        </div>
      </div>
    </div>
  );
}
