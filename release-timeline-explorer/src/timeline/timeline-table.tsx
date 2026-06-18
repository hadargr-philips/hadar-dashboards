import React from 'react';
import { GoLiveItem } from '../types/release';
import { formatShortDate } from './timeline-utils';

interface TimelineTableProps {
  rows: GoLiveItem[];
}

function formatPlannedDate(value: string): string {
  const isoDate = /^\d{4}-\d{2}-\d{2}$/;
  if (isoDate.test(value)) {
    return formatShortDate(value);
  }
  return value;
}

export function TimelineGoLivesTable({ rows }: TimelineTableProps) {
  return (
    <section className="mt-6 bg-white border border-slate-200 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-blue-900 bg-blue-900">
        <h2 className="text-sm font-bold text-white tracking-wide">GO-LIVES</h2>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-blue-900 text-white text-xs uppercase tracking-wide">
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
              rows.map((item) => (
                <tr key={item.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.release}</td>
                  <td className="px-4 py-3 text-slate-700">{item.customer_site}</td>
                  <td className="px-4 py-3 text-slate-700">{item.objective}</td>
                  <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{formatPlannedDate(item.planned_date)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
