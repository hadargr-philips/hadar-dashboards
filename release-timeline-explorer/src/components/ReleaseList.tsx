import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronRight } from 'lucide-react';
import { Release } from '../types/release';
import { useReleaseStore } from '../store/useReleaseStore';
import ReleaseForm from './ReleaseForm';
import { DEFAULT_LIST_URL, fetchSharePointReleases } from '../lib/sharepoint';

const TYPE_BADGE: Record<string, string> = {
  LR:  'bg-blue-100 text-blue-700',
  SP:  'bg-emerald-100 text-emerald-700',
  GSP: 'bg-orange-100 text-orange-700',
  FOK: 'bg-purple-100 text-purple-700',
};

export default function ReleaseList() {
  const { releases, stages, addRelease, importReleases, updateRelease, deleteRelease, selectRelease } =
    useReleaseStore(s => ({
      releases:      s.releases,
      stages:        s.stages,
      addRelease:    s.addRelease,
      importReleases: s.importReleases,
      updateRelease: s.updateRelease,
      deleteRelease: s.deleteRelease,
      selectRelease: s.selectRelease,
    }));

  const [showAdd,       setShowAdd]       = useState(false);
  const [editRelease,   setEditRelease]   = useState<Release | null>(null);
  const [syncing,       setSyncing]       = useState(false);

  const sorted = [...releases].sort((a, b) => a.sort_order - b.sort_order);
  const stageCount = (rid: string) => stages.filter(s => s.release_id === rid).length;

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this release and all its stages?')) deleteRelease(id);
  };

  const handleSyncFromSharePoint = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const incoming = await fetchSharePointReleases(DEFAULT_LIST_URL);
      const { added, skipped } = importReleases(incoming);
      window.alert(`SharePoint sync completed. Added ${added} new release(s), skipped ${skipped}.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error.';
      window.alert(`SharePoint sync failed: ${message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {releases.length} release{releases.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncFromSharePoint}
            disabled={syncing}
            className="px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {syncing ? 'Syncing...' : 'Sync SharePoint'}
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Release
          </button>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">No releases yet.</div>
      ) : (
        <div className="space-y-2">
          {sorted.map(release => (
            <div
              key={release.id}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
            >
              {/* Type badge */}
              <span className={`text-xs font-bold px-2.5 py-1 rounded-lg flex-shrink-0 ${TYPE_BADGE[release.type] ?? 'bg-gray-100 text-gray-600'}`}>
                {release.type}
              </span>

              {/* Number */}
              <span className="font-mono font-semibold text-sm text-gray-900 flex-1 truncate">
                {release.number}
              </span>

              {/* Stages drill-down */}
              <button
                onClick={() => selectRelease(release.id)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors flex-shrink-0"
              >
                <span>{stageCount(release.id)} stage{stageCount(release.id) !== 1 ? 's' : ''}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Edit */}
              <button
                onClick={() => setEditRelease(release)}
                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Edit release"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>

              {/* Delete */}
              <button
                onClick={() => handleDelete(release.id)}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                title="Delete release"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <ReleaseForm
          onSave={(number, type) => { addRelease(number, type); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}
      {editRelease && (
        <ReleaseForm
          initial={editRelease}
          onSave={(number, type) => { updateRelease(editRelease.id, { number, type }); setEditRelease(null); }}
          onCancel={() => setEditRelease(null)}
          title="Edit Release"
        />
      )}
    </div>
  );
}
