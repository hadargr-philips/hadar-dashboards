import React, { useState } from 'react';
import { Stage } from '../types/release';

interface Props {
  stage: Stage;
  leftPct: number;
}

export default function MilestoneMarker({ stage, leftPct }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="absolute top-1/2 z-10"
      style={{ left: `${leftPct}%`, transform: 'translateX(-50%) translateY(-50%)' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {/* Diamond */}
      <div className="w-3.5 h-3.5 rotate-45 border-2 border-indigo-500 bg-indigo-400 cursor-pointer hover:scale-125 transition-transform shadow-sm" />

      {/* Tooltip */}
      {show && (
        <div
          className="absolute bottom-full mb-3 z-50 w-60 bg-gray-900 text-white text-xs rounded-xl p-3 shadow-2xl pointer-events-none animate-fade-in"
          style={{ left: '50%', transform: 'translateX(-50%)' }}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-indigo-400 text-base leading-none">◆</span>
            <span className="font-semibold truncate">{stage.name}</span>
            <span className="ml-auto flex-shrink-0 text-[10px] text-gray-400 bg-gray-800 px-1.5 py-0.5 rounded">Milestone</span>
          </div>
          <div className="text-gray-300">Date: <span className="text-white">{stage.start_date}</span></div>
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
          {/* Caret */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-gray-900" />
        </div>
      )}
    </div>
  );
}
