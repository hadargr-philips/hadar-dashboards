import React from 'react';
import { Calendar, Settings, GitBranch } from 'lucide-react';
import { useReleaseStore } from '../store/useReleaseStore';

interface Props {
  onCreateTimeline: () => void;
  onAdmin: () => void;
}

export default function HomePage({ onCreateTimeline, onAdmin }: Props) {
  const { releases, stages } = useReleaseStore(s => ({
    releases: s.releases,
    stages:   s.stages,
  }));

  const milestoneCount = stages.filter(s => !s.end_date).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col">
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 bg-white/70 backdrop-blur-md border-b border-white/50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-600">
            <GitBranch className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-gray-800 text-sm">Philips Release Timeline</span>
        </div>
        <button
          onClick={onAdmin}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          Admin
        </button>
      </header>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-blue-600 shadow-2xl shadow-blue-500/30 mb-6">
          <Calendar className="w-10 h-10 text-white" />
        </div>

        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
          Release Timeline
        </h1>
        <p className="text-gray-500 text-lg max-w-md mx-auto mb-10">
          Visualize the Philips R&amp;D software release schedule as an interactive Gantt chart.
        </p>

        {/* Stats */}
        <div className="flex items-center gap-8 mb-10">
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{releases.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">Releases</div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-gray-900">{stages.length}</div>
            <div className="text-sm text-gray-500 mt-0.5">Stages</div>
          </div>
          <div className="w-px h-10 bg-gray-200" />
          <div className="text-center">
            <div className="text-3xl font-bold text-indigo-600">{milestoneCount}</div>
            <div className="text-sm text-gray-500 mt-0.5">Milestones</div>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={onCreateTimeline}
          className="flex items-center gap-3 px-10 py-4 bg-blue-600 text-white text-lg font-bold rounded-2xl shadow-xl shadow-blue-500/30 hover:bg-blue-700 hover:shadow-blue-500/40 hover:scale-105 active:scale-100 transition-all"
        >
          <Calendar className="w-5 h-5" />
          Create Timeline
        </button>

        <p className="mt-4 text-xs text-gray-400">
          Showing 12-month rolling window · today's date marked in red
        </p>
      </div>
    </div>
  );
}
