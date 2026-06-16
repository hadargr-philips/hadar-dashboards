import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Release, ReleaseType } from '../types/release';

const RELEASE_TYPES: ReleaseType[] = ['LR', 'SP', 'GSP', 'FOK'];

const TYPE_ACTIVE: Record<ReleaseType, string> = {
  LR:  'bg-blue-600 text-white shadow-md',
  SP:  'bg-emerald-600 text-white shadow-md',
  GSP: 'bg-orange-500 text-white shadow-md',
  FOK: 'bg-purple-600 text-white shadow-md',
};

interface Props {
  initial?: Partial<Release>;
  onSave: (number: string, type: ReleaseType) => void;
  onCancel: () => void;
  title?: string;
}

export default function ReleaseForm({ initial, onSave, onCancel, title = 'Add Release' }: Props) {
  const [number, setNumber] = useState(initial?.number ?? '');
  const [type,   setType]   = useState<ReleaseType>(initial?.type ?? 'LR');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!number.trim()) errs.number = 'Release number is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(number.trim(), type);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Number */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Release Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={number}
              onChange={e => { setNumber(e.target.value); setErrors(p => ({ ...p, number: '' })); }}
              placeholder="e.g. 15.1.2.0, 12.2.8.750…"
              autoFocus
              className={`w-full px-3 py-2 rounded-xl border text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${errors.number ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.number && <p className="text-xs text-red-500 mt-1">{errors.number}</p>}
          </div>

          {/* Type */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {RELEASE_TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`py-2.5 rounded-xl text-sm font-bold transition-all ${
                    type === t ? TYPE_ACTIVE[t] : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
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
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
