import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Release, ReleaseMetadata, ReleaseType } from '../types/release';

const RELEASE_TYPES: ReleaseType[] = ['LR', 'SP', 'GSP', 'FOK'];

const TYPE_ACTIVE: Record<ReleaseType, string> = {
  LR:  'bg-blue-600 text-white shadow-md',
  SP:  'bg-emerald-600 text-white shadow-md',
  GSP: 'bg-orange-500 text-white shadow-md',
  FOK: 'bg-purple-600 text-white shadow-md',
};

interface Props {
  initial?: Partial<Release>;
  onSave: (payload: { number: string; type: ReleaseType; metadata: ReleaseMetadata }) => void;
  onCancel: () => void;
  title?: string;
}

interface MetadataField {
  id: string;
  key: string;
  value: string;
}

function toFieldList(metadata?: ReleaseMetadata): MetadataField[] {
  if (!metadata) return [];
  return Object.entries(metadata).map(([key, value]) => ({
    id: crypto.randomUUID(),
    key,
    value,
  }));
}

export default function ReleaseForm({ initial, onSave, onCancel, title = 'Add Release' }: Props) {
  const [number, setNumber] = useState(initial?.number ?? '');
  const [type,   setType]   = useState<ReleaseType>(initial?.type ?? 'LR');
  const [metadataFields, setMetadataFields] = useState<MetadataField[]>(() => toFieldList(initial?.metadata));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!number.trim()) errs.number = 'Release number is required';
    if (!type) errs.type = 'Release type is required';

    const metadata: ReleaseMetadata = {};
    const seenKeys = new Set<string>();
    for (const field of metadataFields) {
      const key = field.key.trim();
      if (!key) continue;
      const lower = key.toLowerCase();
      if (seenKeys.has(lower)) {
        errs.metadata = `Duplicate field detected: ${key}`;
        break;
      }
      seenKeys.add(lower);
      metadata[key] = field.value;
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ number: number.trim(), type, metadata });
  };

  const addMetadataField = () => {
    setMetadataFields((prev) => [
      ...prev,
      { id: crypto.randomUUID(), key: '', value: '' },
    ]);
  };

  const removeMetadataField = (id: string) => {
    setMetadataFields((prev) => prev.filter((field) => field.id !== id));
    setErrors((prev) => ({ ...prev, metadata: '' }));
  };

  const updateMetadataField = (id: string, patch: Partial<Pick<MetadataField, 'key' | 'value'>>) => {
    setMetadataFields((prev) => prev.map((field) => (field.id === id ? { ...field, ...patch } : field)));
    setErrors((prev) => ({ ...prev, metadata: '' }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5 overflow-auto">

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
            {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
          </div>

          <div className="rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-gray-700">Imported Fields</p>
                <p className="text-xs text-gray-500 mt-0.5">All fields are optional and editable.</p>
              </div>
              <button
                type="button"
                onClick={addMetadataField}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add field
              </button>
            </div>

            {metadataFields.length === 0 ? (
              <p className="text-xs text-gray-400 py-2">No optional fields yet.</p>
            ) : (
              <div className="space-y-2">
                {metadataFields.map((field) => (
                  <div key={field.id} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] gap-2 items-center">
                    <input
                      type="text"
                      value={field.key}
                      onChange={(e) => updateMetadataField(field.id, { key: e.target.value })}
                      placeholder="Field name"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="text"
                      value={field.value}
                      onChange={(e) => updateMetadataField(field.id, { value: e.target.value })}
                      placeholder="Field value"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeMetadataField(field.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Remove field"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {errors.metadata && <p className="text-xs text-red-500">{errors.metadata}</p>}
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
