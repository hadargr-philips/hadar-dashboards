import React, { useState } from 'react';
import { Plus, Edit2, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import { Stage } from '../types/release';
import { useReleaseStore } from '../store/useReleaseStore';
import StageForm from './StageForm';

const STATUS_BADGE: Record<string, string> = {
  'In Progress':        'bg-blue-100 text-blue-700',
  'Planning':           'bg-amber-100 text-amber-700',
  'Completed':          'bg-green-100 text-green-700',
  'New':                'bg-gray-100 text-gray-600',
  'Last Build Testing': 'bg-purple-100 text-purple-700',
  '':                   '',
};

interface Props {
  releaseId: string;
}

export default function StageList({ releaseId }: Props) {
  const { stages, addStage, updateStage, deleteStage, moveStageUp, moveStageDown } = useReleaseStore(s => ({
    stages:       s.stages,
    addStage:     s.addStage,
    updateStage:  s.updateStage,
    deleteStage:  s.deleteStage,
    moveStageUp:  s.moveStageUp,
    moveStageDown: s.moveStageDown,
  }));

  const releaseStages = stages
    .filter(s => s.release_id === releaseId)
    .sort((a, b) => a.sort_order - b.sort_order);

  const [showAdd,    setShowAdd]    = useState(false);
  const [editStage,  setEditStage]  = useState<Stage | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this stage?')) deleteStage(id);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-gray-500">
          {releaseStages.length} stage{releaseStages.length !== 1 ? 's' : ''}
        </span>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Stage
        </button>
      </div>

      {releaseStages.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          No stages yet. Click "Add Stage" to begin.
        </div>
      ) : (
        <div className="space-y-2">
          {releaseStages.map((stage, idx) => (
            <div
              key={stage.id}
              className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
            >
              {/* Up / Down */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 pt-0.5">
                <button
                  onClick={() => moveStageUp(stage.id)}
                  disabled={idx === 0}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => moveStageDown(stage.id)}
                  disabled={idx === releaseStages.length - 1}
                  className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-gray-900">{stage.name}</span>
                  {stage.status && STATUS_BADGE[stage.status] && (
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_BADGE[stage.status]}`}>
                      {stage.status}
                    </span>
                  )}
                  {!stage.end_date && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                      ◆ Milestone
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {stage.start_date}
                  {stage.end_date ? ` → ${stage.end_date}` : ''}
                </div>
                {stage.dependencies && (
                  <div className="text-xs text-gray-400 mt-0.5 truncate">
                    Deps: {stage.dependencies}
                  </div>
                )}
                {stage.comments && (
                  <div className="text-xs text-gray-400 mt-0.5 italic truncate">{stage.comments}</div>
                )}
              </div>

              {/* Edit / Delete */}
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditStage(stage)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit stage"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(stage.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete stage"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <StageForm
          onSave={data => { addStage(releaseId, data); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
          title="Add Stage"
        />
      )}
      {editStage && (
        <StageForm
          initial={editStage}
          onSave={data => { updateStage(editStage.id, data); setEditStage(null); }}
          onCancel={() => setEditStage(null)}
          title="Edit Stage"
        />
      )}
    </div>
  );
}
