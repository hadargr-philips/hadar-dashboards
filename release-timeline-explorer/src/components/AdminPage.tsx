import React, { useState } from 'react';
import { X, Shield, Eye, EyeOff, ChevronLeft, Settings } from 'lucide-react';
import { useReleaseStore } from '../store/useReleaseStore';
import ReleaseList from './ReleaseList';
import StageList from './StageList';

const ADMIN_PASSWORD = 'Phil2026!';

// ── Password gate ─────────────────────────────────────────────────────────────
function PasswordGate({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [pwd,   setPwd]   = useState('');
  const [show,  setShow]  = useState(false);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd === ADMIN_PASSWORD) {
      onSuccess();
    } else {
      setError(true);
      setPwd('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-gray-200 shadow-xl p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-600">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-lg font-bold text-gray-900">Admin Panel</h1>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 mb-6">
          Enter the admin password to manage releases and stages.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              value={pwd}
              onChange={e => { setPwd(e.target.value); setError(false); }}
              placeholder="Admin password"
              autoFocus
              className={`w-full px-4 py-3 pr-11 rounded-xl border text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                error ? 'border-red-400 bg-red-50' : 'border-gray-200'
              }`}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={show ? 'Hide password' : 'Show password'}
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <p className="text-xs text-red-500">Incorrect password. Please try again.</p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

// ── AdminPage ─────────────────────────────────────────────────────────────────
interface Props {
  onClose: () => void;
}

export default function AdminPage({ onClose }: Props) {
  const [authed, setAuthed] = useState(false);
  const { selectedReleaseId, releases, selectRelease } = useReleaseStore(s => ({
    selectedReleaseId: s.selectedReleaseId,
    releases:          s.releases,
    selectRelease:     s.selectRelease,
  }));

  if (!authed) {
    return <PasswordGate onSuccess={() => setAuthed(true)} onClose={onClose} />;
  }

  const selectedRelease = releases.find(r => r.id === selectedReleaseId) ?? null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-5 py-3 bg-white border-b border-gray-200 shadow-sm">
        {selectedRelease ? (
          <button
            onClick={() => selectRelease(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            All Releases
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Home
          </button>
        )}
        <div className="w-px h-5 bg-gray-200" />
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-gray-400" />
          <h1 className="font-bold text-gray-900 text-sm">
            {selectedRelease
              ? `Stages — ${selectedRelease.number}`
              : 'Admin Panel'}
          </h1>
        </div>
        {selectedRelease && (
          <span className={`ml-2 text-[11px] font-bold px-2 py-0.5 rounded ${
            { LR: 'bg-blue-100 text-blue-700', SP: 'bg-emerald-100 text-emerald-700', GSP: 'bg-orange-100 text-orange-700', FOK: 'bg-purple-100 text-purple-700' }[selectedRelease.type] ?? 'bg-gray-100 text-gray-600'
          }`}>
            {selectedRelease.type}
          </span>
        )}
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {selectedRelease
          ? <StageList releaseId={selectedRelease.id} />
          : <ReleaseList />
        }
      </div>
    </div>
  );
}
