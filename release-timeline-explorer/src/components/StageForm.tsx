import React, { useState } from 'react';
import { X, Calendar, Info } from 'lucide-react';
import { Stage, StageStatus } from '../types/release';

const STATUSES: StageStatus[] = ['New', 'In Progress', 'Planning', 'Completed', 'Last Build Testing'];

type StageData = Omit<Stage, 'id' | 'release_id' | 'sort_order' | 'created_at'>;

interface Props {
  initial?: Partial<Stage>;
  onSave: (data: StageData) => void;
  onCancel: () => void;
  title?: string;
}

export default function StageForm({ initial, onSave, onCancel, title = 'Add Stage' }: Props) {
  const [name,      setName]      = useState(initial?.name         ?? '');
  const [status,    setStatus]    = useState<StageStatus | ''>(initial?.status ?? '');
  const [startDate, setStartDate] = useState(initial?.start_date   ?? '');
  const [endDate,   setEndDate]   = useState(initial?.end_date      ?? '');
  const [deps,      setDeps]      = useState(initial?.dependencies  ?? '');
  const [comments,  setComments]  = useState(initial?.comments      ?? '');
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  const isMilestone = startDate && !endDate;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim())  e.name      = 'Stage name is required';
    if (!startDate)    e.startDate = 'Start date is required';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({
      name:         name.trim(),
      status:       status as StageStatus,
      start_date:   startDate,
      end_date:     endDate || null,
      dependencies: deps.trim(),
      comments:     comments.trim(),
    });
  };

  const clearError = (key: string) => setErrors(p => ({ ...p, [key]: '' }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Stage Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); clearError('name'); }}
              placeholder="e.g. Development, FOK, Clinical Validation…"
              autoFocus
              className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as StageStatus | '')}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">— Select status —</option>
              {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <Calendar className="inline w-3 h-3 mr-1 -mt-0.5" />
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); clearError('startDate'); }}
                className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.startDate ? 'border-red-400' : 'border-gray-200'}`}
              />
              {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                <Calendar className="inline w-3 h-3 mr-1 -mt-0.5" />
                End Date
                <span className="text-gray-400 font-normal ml-1 text-[10px]">(empty = milestone)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Milestone hint */}
          {isMilestone && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-indigo-50 rounded-xl text-xs text-indigo-700">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>No end date — this stage will render as a <strong>milestone (◆)</strong> on the timeline.</span>
            </div>
          )}

          {/* Dependencies */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Dependencies</label>
            <textarea
              value={deps}
              onChange={e => setDeps(e.target.value)}
              placeholder="e.g. FOK success, Verification and Validation Start…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Comments */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Comments</label>
            <textarea
              value={comments}
              onChange={e => setComments(e.target.value)}
              placeholder="Additional notes…"
              rows={2}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Save Stage
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
