import React, { useEffect, useMemo, useState } from 'react';
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
  const {
    releases,
    stages,
    goLives,
    timelineDetailsReleaseId,
    selectTimelineDetailsRelease,
    collapsedReleaseIds,
    toggleReleaseCollapsed,
  } = useReleaseStore(s => ({
    releases: s.releases,
    stages: s.stages,
    goLives: s.goLives,
    timelineDetailsReleaseId: s.timelineDetailsReleaseId,
    selectTimelineDetailsRelease: s.selectTimelineDetailsRelease,
    collapsedReleaseIds: s.collapsedReleaseIds,
    toggleReleaseCollapsed: s.toggleReleaseCollapsed,
  }));
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const months = useMemo(() => getMonthColumns(new Date(), TIMELINE_DIMENSIONS.monthCount), []);
  const rows = useMemo(() => buildReleaseRows(releases, stages, months), [releases, stages, months]);

  const selectedRelease = useMemo(
    () => releases.find((release) => release.id === timelineDetailsReleaseId) ?? null,
    [releases, timelineDetailsReleaseId]
  );
  const selectedStages = useMemo(
    () => stages
      .filter((stage) => stage.release_id === timelineDetailsReleaseId)
      .sort((a, b) => a.sort_order - b.sort_order),
    [stages, timelineDetailsReleaseId]
  );

  const todayPct = useMemo(() => {
    return dateToX(toIsoDate(new Date()), months);
  }, [months]);

  useEffect(() => {
    if (timelineDetailsReleaseId) {
      setIsDrawerOpen(true);
    }
  }, [timelineDetailsReleaseId]);

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    window.setTimeout(() => {
      selectTimelineDetailsRelease(null);
    }, 180);
  };

  const openDrawerForRelease = (releaseId: string) => {
    selectTimelineDetailsRelease(releaseId);
  };

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

            <TimelineRows
              rows={rows}
              months={months}
              collapsedReleaseIds={collapsedReleaseIds}
              onToggleReleaseCollapse={toggleReleaseCollapsed}
              onConsolidatedReleaseClick={openDrawerForRelease}
            />
          </div>

          {(timelineDetailsReleaseId && selectedRelease) && (
            <section
              className="mt-4 border border-slate-200 rounded-xl bg-white shadow-sm overflow-hidden transition-all duration-200 ease-out"
              style={{
                opacity: isDrawerOpen ? 1 : 0,
                transform: isDrawerOpen ? 'translateY(0)' : 'translateY(6px)',
                maxHeight: isDrawerOpen ? '680px' : '0px',
              }}
            >
              <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Release Details</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedRelease.number} ({selectedRelease.type})</p>
                </div>
                <button
                  onClick={closeDrawer}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>
              </div>

              <div className="grid lg:grid-cols-2 gap-4 p-4">
                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Release Fields</h3>
                  <div className="space-y-1.5 text-sm">
                    <p><span className="font-semibold text-slate-700">Number:</span> <span className="text-slate-900">{selectedRelease.number}</span></p>
                    <p><span className="font-semibold text-slate-700">Type:</span> <span className="text-slate-900">{selectedRelease.type}</span></p>
                    <p><span className="font-semibold text-slate-700">Created:</span> <span className="text-slate-900">{selectedRelease.created_at.slice(0, 10)}</span></p>
                    {Object.entries(selectedRelease.metadata ?? {}).map(([key, value]) => (
                      <p key={key}>
                        <span className="font-semibold text-slate-700">{key}:</span>{' '}
                        <span className="text-slate-900">{value || '-'}</span>
                      </p>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 p-3">
                  <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">Stage and Milestone Details</h3>
                  {selectedStages.length === 0 ? (
                    <p className="text-sm text-slate-400">No stage details found for this release.</p>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-auto pr-1">
                      {selectedStages.map((stage) => (
                        <div key={stage.id} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2">
                          <p className="text-sm font-semibold text-slate-900">{stage.name}</p>
                          <p className="text-xs text-slate-600 mt-0.5">Status: {stage.status || '-'}</p>
                          <p className="text-xs text-slate-600">Start: {stage.start_date} | End: {stage.end_date ?? 'Milestone'}</p>
                          <p className="text-xs text-slate-600">Dependencies: {stage.dependencies || '-'}</p>
                          <p className="text-xs text-slate-600">Comments: {stage.comments || '-'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}

          <TimelineGoLivesTable rows={goLives} />
        </div>
      </div>
    </div>
  );
}
