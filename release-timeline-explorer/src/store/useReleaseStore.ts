import { create } from 'zustand';
import { Release, Stage, ReleaseType, GoLiveItem } from '../types/release';
import { UploadedReleaseRow } from '../lib/uploadReleaseFile';

const LS_RELEASES = 'rl-releases-v1';
const LS_STAGES = 'rl-stages-v1';
const LS_GOLIVES = 'rl-golives-v1';

function uid(): string {
  return crypto.randomUUID();
}

const _t = new Date().toISOString();

// ── Seed data from Confluence "2026-2027 Release Plan" ──────────────────────
const SEED_RELEASES: Release[] = [
  { id: 'r1',  number: '15.1.2.0',    type: 'LR',  sort_order: 1,  created_at: _t },
  { id: 'r2',  number: '15.1.0.50',   type: 'SP',  sort_order: 2,  created_at: _t },
  { id: 'r3',  number: '12.2.8.750',  type: 'LR',  sort_order: 3,  created_at: _t },
  { id: 'r4',  number: '12.2.8.615',  type: 'GSP', sort_order: 4,  created_at: _t },
  { id: 'r5',  number: '12.2.8.622',  type: 'GSP', sort_order: 5,  created_at: _t },
  { id: 'r6',  number: '12.2.8.593',  type: 'GSP', sort_order: 6,  created_at: _t },
  { id: 'r7',  number: '12.2.8.602A', type: 'SP',  sort_order: 7,  created_at: _t },
  { id: 'r8',  number: '12.2.8.701',  type: 'GSP', sort_order: 8,  created_at: _t },
  { id: 'r9',  number: '12.2.8.619',  type: 'SP',  sort_order: 9,  created_at: _t },
  { id: 'r10', number: '12.2.8.604',  type: 'GSP', sort_order: 10, created_at: _t },
];

const SEED_STAGES: Stage[] = [
  // ── 15.1.2.0 (LR) ──
  { id: 's1',  release_id: 'r1', name: 'Development',                                            status: 'In Progress', start_date: '2026-01-29', end_date: '2026-11-30', dependencies: '',                                                  comments: '',                            sort_order: 1, created_at: _t },
  { id: 's2',  release_id: 'r1', name: 'Formal Verification (SVER)',                             status: '',            start_date: '2026-12-14', end_date: '2027-03-16', dependencies: '',                                                  comments: 'BLR Shutdown - Dec 20–Jan 4', sort_order: 2, created_at: _t },
  { id: 's3',  release_id: 'r1', name: 'Service Validation and Design Transfer (SVAL and DT)',   status: '',            start_date: '2027-01-07', end_date: '2027-03-31', dependencies: '',                                                  comments: '',                            sort_order: 3, created_at: _t },
  { id: 's4',  release_id: 'r1', name: 'RFA',                                                   status: '',            start_date: '2027-02-03', end_date: null,         dependencies: 'Verification and Validation Start',                 comments: '',                            sort_order: 4, created_at: _t },
  { id: 's5',  release_id: 'r1', name: 'RFD',                                                   status: '',            start_date: '2027-04-19', end_date: null,         dependencies: 'Development, Verification, Validation, Launch, DT', comments: '',                            sort_order: 5, created_at: _t },
  { id: 's6',  release_id: 'r1', name: 'FOK',                                                   status: '',            start_date: '2027-04-19', end_date: '2027-09-30', dependencies: '',                                                  comments: '',                            sort_order: 6, created_at: _t },
  { id: 's7',  release_id: 'r1', name: 'RC',                                                    status: '',            start_date: '2027-09-30', end_date: null,         dependencies: 'FOK success',                                       comments: '',                            sort_order: 7, created_at: _t },

  // ── 15.1.0.50 (SP) ──
  { id: 's8',  release_id: 'r2', name: 'FOK',                                                   status: 'Planning',    start_date: '2026-06-15', end_date: '2026-07-30', dependencies: '',                                                  comments: 'No official release date, still in scope discussions', sort_order: 1, created_at: _t },

  // ── 12.2.8.750 (LR) ──
  { id: 's9',  release_id: 'r3', name: 'Development',                                           status: 'In Progress', start_date: '2026-06-30', end_date: '2026-08-14', dependencies: '',                                                  comments: '',                            sort_order: 1, created_at: _t },
  { id: 's10', release_id: 'r3', name: 'Clinical Performance Evaluation',                       status: 'In Progress', start_date: '2026-03-16', end_date: '2026-06-19', dependencies: '',                                                  comments: '',                            sort_order: 2, created_at: _t },
  { id: 's11', release_id: 'r3', name: 'AWS Attestation',                                       status: 'Completed',   start_date: '2026-04-29', end_date: null,         dependencies: '',                                                  comments: '',                            sort_order: 3, created_at: _t },
  { id: 's12', release_id: 'r3', name: 'Formal Verification',                                   status: '',            start_date: '2026-07-01', end_date: '2026-07-21', dependencies: '',                                                  comments: '',                            sort_order: 4, created_at: _t },
  { id: 's13', release_id: 'r3', name: 'Clinical Validation',                                   status: '',            start_date: '2026-07-26', end_date: '2026-08-12', dependencies: '',                                                  comments: '',                            sort_order: 5, created_at: _t },
  { id: 's14', release_id: 'r3', name: 'Launch and Release Activities',                         status: '',            start_date: '2026-08-12', end_date: '2026-09-11', dependencies: '',                                                  comments: '',                            sort_order: 6, created_at: _t },
  { id: 's15', release_id: 'r3', name: 'FOK',                                                   status: '',            start_date: '2026-09-14', end_date: null,         dependencies: '',                                                  comments: '',                            sort_order: 7, created_at: _t },

  // ── GSP / SP single-milestone releases ──
  { id: 's16', release_id: 'r4',  name: 'Release', status: 'In Progress',        start_date: '2026-06-29', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's17', release_id: 'r5',  name: 'Release', status: 'In Progress',        start_date: '2026-06-26', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's18', release_id: 'r6',  name: 'Release', status: 'In Progress',        start_date: '2026-06-12', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's19', release_id: 'r7',  name: 'Release', status: 'In Progress',        start_date: '2026-06-10', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's20', release_id: 'r8',  name: 'Release', status: 'In Progress',        start_date: '2026-06-07', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's21', release_id: 'r9',  name: 'Release', status: 'In Progress',        start_date: '2026-06-02', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
  { id: 's22', release_id: 'r10', name: 'Release', status: 'Last Build Testing', start_date: '2026-05-21', end_date: null, dependencies: '', comments: '', sort_order: 1, created_at: _t },
];

// Hardcoded from Confluence page "2026-2027 Release Plan" -> table "Future Releases".
const SEED_GOLIVES: GoLiveItem[] = [
  { id: 'gl1', release: '15.1.0.X', customer_site: 'NYP', objective: 'TBD', planned_date: 'August 2026', created_at: _t },
  { id: 'gl2', release: '15.1.0.X', customer_site: 'Visn1', objective: 'TBD', planned_date: 'Q4', created_at: _t },
  { id: 'gl3', release: '12.2.X', customer_site: 'UKB - Berlin', objective: 'Super PACS', planned_date: 'Q4', created_at: _t },
  { id: 'gl4', release: '12.2.X', customer_site: 'Geisinger - NAM', objective: 'VNA', planned_date: 'Q4', created_at: _t },
  { id: 'gl5', release: '12.2.X', customer_site: 'Atrium', objective: 'Super PACS', planned_date: 'In progress', created_at: _t },
  { id: 'gl6', release: '12.2.X', customer_site: 'Stamford', objective: 'Cloud + Linux DB', planned_date: 'Test: July', created_at: _t },
  { id: 'gl7', release: '12.2.X', customer_site: 'Ichilov', objective: 'Client only + WIM 15.1.0.1', planned_date: 'June 2026', created_at: _t },
  { id: 'gl8', release: '12.2.X', customer_site: 'CHN', objective: 'ISPACS to HSI Vue Cloud', planned_date: 'Q1 2027', created_at: _t },
  { id: 'gl9', release: '12.2.X', customer_site: 'UCM - NAM', objective: 'Cloud, ISPACS migration', planned_date: 'Q3 2027', created_at: _t },
  { id: 'gl10', release: '12.2.X', customer_site: 'UNIMED Rio Verde - Brazil', objective: 'Small site - Net new', planned_date: 'Q1 2027', created_at: _t },
];

// ── localStorage helpers ─────────────────────────────────────────────────────
function loadFromLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persist(releases: Release[], stages: Stage[]) {
  localStorage.setItem(LS_RELEASES, JSON.stringify(releases));
  localStorage.setItem(LS_STAGES, JSON.stringify(stages));
}

// ── Store interface ──────────────────────────────────────────────────────────
interface ReleaseStore {
  releases: Release[];
  stages: Stage[];
  goLives: GoLiveItem[];
  selectedReleaseId: string | null;

  addRelease: (number: string, type: ReleaseType) => void;
  importReleases: (incoming: Array<{ number: string; type: ReleaseType }>) => { added: number; skipped: number };
  syncUploadedReleases: (incoming: UploadedReleaseRow[]) => { added: number; updated: number; removed: number; skipped: number };
  updateRelease: (id: string, patch: Partial<Pick<Release, 'number' | 'type'>>) => void;
  deleteRelease: (id: string) => void;

  addStage: (releaseId: string, data: Omit<Stage, 'id' | 'release_id' | 'sort_order' | 'created_at'>) => void;
  updateStage: (id: string, patch: Partial<Omit<Stage, 'id' | 'release_id' | 'created_at'>>) => void;
  deleteStage: (id: string) => void;
  moveStageUp: (id: string) => void;
  moveStageDown: (id: string) => void;

  selectRelease: (id: string | null) => void;
}

// ── Store ────────────────────────────────────────────────────────────────────
export const useReleaseStore = create<ReleaseStore>((set, get) => {
  const releases = loadFromLS<Release[]>(LS_RELEASES, SEED_RELEASES);
  const stages   = loadFromLS<Stage[]>(LS_STAGES,   SEED_STAGES);
  const goLives  = loadFromLS<GoLiveItem[]>(LS_GOLIVES, SEED_GOLIVES);

  return {
    releases,
    stages,
    goLives,
    selectedReleaseId: null,

    addRelease: (number, type) =>
      set(s => {
        const next = [...s.releases, {
          id: uid(), number, type,
          sort_order: s.releases.length + 1,
          created_at: new Date().toISOString(),
        }];
        persist(next, s.stages);
        return { releases: next };
      }),

    importReleases: (incoming) => {
      const current = get().releases;
      const stages = get().stages;
      const existing = new Set(current.map(r => r.number.trim().toLowerCase()));
      const toAdd = incoming.filter(r => {
        const key = r.number.trim().toLowerCase();
        if (!key || existing.has(key)) return false;
        existing.add(key);
        return true;
      });

      if (toAdd.length === 0) {
        return { added: 0, skipped: incoming.length };
      }

      const now = new Date().toISOString();
      const next = [
        ...current,
        ...toAdd.map((r, index) => ({
          id: uid(),
          number: r.number,
          type: r.type,
          sort_order: current.length + index + 1,
          created_at: now,
        })),
      ];

      persist(next, stages);
      set({ releases: next });

      return { added: toAdd.length, skipped: incoming.length - toAdd.length };
    },

    syncUploadedReleases: (incoming) => {
      const currentReleases = get().releases;
      const currentStages = get().stages;

      const releasesByNumber = new Map(currentReleases.map(r => [r.number.trim().toLowerCase(), r] as const));
      let nextReleases = [...currentReleases];
      let nextStages = [...currentStages];
      let added = 0;
      let updated = 0;
      let removed = 0;
      let skipped = 0;

      const now = new Date().toISOString();

      for (const row of incoming) {
        const numberKey = row.number.trim().toLowerCase();
        if (!numberKey) {
          skipped += 1;
          continue;
        }

        const existing = releasesByNumber.get(numberKey);

        if (row.isReleased) {
          if (!existing) {
            skipped += 1;
            continue;
          }

          nextReleases = nextReleases.filter(r => r.id !== existing.id);
          nextStages = nextStages.filter(s => s.release_id !== existing.id);
          releasesByNumber.delete(numberKey);
          removed += 1;
          continue;
        }

        if (!existing) {
          const newRelease: Release = {
            id: uid(),
            number: row.number,
            type: row.type,
            sort_order: nextReleases.length + 1,
            created_at: now,
          };
          nextReleases.push(newRelease);
          releasesByNumber.set(numberKey, newRelease);
          nextStages.push({
            id: uid(),
            release_id: newRelease.id,
            name: 'Release',
            status: row.status,
            start_date: row.start_date,
            end_date: null,
            dependencies: '',
            comments: '',
            sort_order: 1,
            created_at: now,
          });
          added += 1;
          continue;
        }

        nextReleases = nextReleases.map(r =>
          r.id === existing.id ? { ...r, type: row.type } : r
        );
        releasesByNumber.set(numberKey, { ...existing, type: row.type });

        const existingReleaseStage = nextStages.find(
          s => s.release_id === existing.id && s.name.trim().toLowerCase() === 'release'
        );
        if (existingReleaseStage) {
          nextStages = nextStages.map(s =>
            s.id === existingReleaseStage.id
              ? {
                  ...s,
                  status: row.status,
                  start_date: row.start_date,
                  end_date: null,
                }
              : s
          );
        } else {
          const sortOrder =
            nextStages.filter(s => s.release_id === existing.id).reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
          nextStages.push({
            id: uid(),
            release_id: existing.id,
            name: 'Release',
            status: row.status,
            start_date: row.start_date,
            end_date: null,
            dependencies: '',
            comments: '',
            sort_order: sortOrder,
            created_at: now,
          });
        }

        updated += 1;
      }

      nextReleases = nextReleases.map((release, index) => ({
        ...release,
        sort_order: index + 1,
      }));

      persist(nextReleases, nextStages);
      set({ releases: nextReleases, stages: nextStages });

      return { added, updated, removed, skipped };
    },

    updateRelease: (id, patch) =>
      set(s => {
        const next = s.releases.map(r => r.id === id ? { ...r, ...patch } : r);
        persist(next, s.stages);
        return { releases: next };
      }),

    deleteRelease: (id) =>
      set(s => {
        const nextR = s.releases.filter(r => r.id !== id);
        const nextS = s.stages.filter(st => st.release_id !== id);
        persist(nextR, nextS);
        return { releases: nextR, stages: nextS, selectedReleaseId: null };
      }),

    addStage: (releaseId, data) =>
      set(s => {
        const count = s.stages.filter(st => st.release_id === releaseId).length;
        const next = [...s.stages, {
          id: uid(), release_id: releaseId,
          sort_order: count + 1,
          created_at: new Date().toISOString(),
          ...data,
        }];
        persist(s.releases, next);
        return { stages: next };
      }),

    updateStage: (id, patch) =>
      set(s => {
        const next = s.stages.map(st => st.id === id ? { ...st, ...patch } : st);
        persist(s.releases, next);
        return { stages: next };
      }),

    deleteStage: (id) =>
      set(s => {
        const next = s.stages.filter(st => st.id !== id);
        persist(s.releases, next);
        return { stages: next };
      }),

    moveStageUp: (id) =>
      set(s => {
        const stage = s.stages.find(st => st.id === id);
        if (!stage) return {};
        const siblings = s.stages
          .filter(st => st.release_id === stage.release_id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const idx = siblings.findIndex(st => st.id === id);
        if (idx <= 0) return {};
        const prev = siblings[idx - 1];
        const next = s.stages.map(st => {
          if (st.id === id)      return { ...st, sort_order: prev.sort_order };
          if (st.id === prev.id) return { ...st, sort_order: stage.sort_order };
          return st;
        });
        persist(s.releases, next);
        return { stages: next };
      }),

    moveStageDown: (id) =>
      set(s => {
        const stage = s.stages.find(st => st.id === id);
        if (!stage) return {};
        const siblings = s.stages
          .filter(st => st.release_id === stage.release_id)
          .sort((a, b) => a.sort_order - b.sort_order);
        const idx = siblings.findIndex(st => st.id === id);
        if (idx >= siblings.length - 1) return {};
        const nextSib = siblings[idx + 1];
        const next = s.stages.map(st => {
          if (st.id === id)          return { ...st, sort_order: nextSib.sort_order };
          if (st.id === nextSib.id)  return { ...st, sort_order: stage.sort_order };
          return st;
        });
        persist(s.releases, next);
        return { stages: next };
      }),

    selectRelease: (id) => set({ selectedReleaseId: id }),
  };
});
