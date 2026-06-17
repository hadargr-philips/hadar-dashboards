import React from 'react';
import { GoLiveItem } from '../types/release';
import { formatShortDate } from './timeline-utils';

interface TimelineTableProps {
  rows: GoLiveItem[];
}

export function TimelineGoLivesTable({ rows }: TimelineTableProps) {
  return (
    <section className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50">
        <h2 className="text-sm font-bold text-slate-800 tracking-wide">GO-LIVES</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Release</th>
              <th className="text-left px-4 py-3">Customer (Site)</th>
              <th className="text-left px-4 py-3">Objective</th>
              <th className="text-left px-4 py-3">Planned Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No go-live records yet.</td>
              </tr>
            ) : (
              rows
                .slice()
                .sort((a, b) => (a.planned_date < b.planned_date ? -1 : a.planned_date > b.planned_date ? 1 : 0))
                .map((item) => (
                  <tr key={item.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.release}</td>
                    <td className="px-4 py-3 text-slate-700">{item.customer_site}</td>
                    <td className="px-4 py-3 text-slate-700">{item.objective}</td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatShortDate(item.planned_date)}</td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
