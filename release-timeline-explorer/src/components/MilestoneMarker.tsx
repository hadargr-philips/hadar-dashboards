import React, { useState } from 'react';
import { Stage } from '../types/release';
import { fmtDate } from '../utils/ganttHelpers';

interface Props {
  stage: Stage;
  leftPct: number;
}

export default function MilestoneMarker({ stage, leftPct }: Props) {
  const [showTip, setShowTip] = useState(false);
  // Flip inline label to the left when milestone is near the right edge
  const flipLeft = leftPct > 82;

  return (
    <div
      className="absolute top-1/2 z-10 flex items-center"
      style={{ left: `${leftPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
      onMouseEnter={() => setShowTip(true)}
      onMouseLeave={() => setShowTip(false)}
    >
      {/* Diamond */}
      <div className="w-5 h-5 rotate-45 border-2 border-indigo-500 bg-indigo-500 flex-shrink-0 shadow-sm cursor-default" />

      {/* Always-visible date label */}
      <span
        className="absolute text-[14px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded whitespace-nowrap pointer-events-none z-20"
        style={
          flipLeft
            ? { right: 'calc(100% + 8px)', transform: 'translateY(0)' }
            : { left: 'calc(100% + 8px)', transform: 'translateY(0)' }
        }
      >
        ◆ {fmtDate(stage.start_date)}
      </span>

      {/* Tooltip — shows name, status, deps, comments on hover */}
      {showTip && (stage.dependencies || stage.comments || stage.status) && (
        <div
          className="absolute bottom-full mb-4 z-50 w-64 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none animate-fade-in"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-indigo-400 text-base leading-none">◆</span>
            <span className="font-semibold truncate">{stage.name}</span>
          </div>
          <div className="text-gray-300">{fmtDate(stage.start_date)}</div>
          {stage.status && (
            <div className="text-gray-300 mt-0.5">Status: <span className="text-white">{stage.status}</span></div>
          )}
          {stage.dependencies && (
            <div className="mt-1.5 text-gray-400 leading-tight">
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
