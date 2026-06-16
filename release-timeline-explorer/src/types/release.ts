export type ReleaseType = 'LR' | 'SP' | 'GSP' | 'FOK';
export type StageStatus = 'New' | 'In Progress' | 'Planning' | 'Completed' | 'Last Build Testing' | '';

export interface Release {
  id: string;
  number: string;
  type: ReleaseType;
  sort_order: number;
  created_at: string;
}

export interface Stage {
  id: string;
  release_id: string;
  name: string;
  status: StageStatus;
  start_date: string;       // YYYY-MM-DD
  end_date: string | null;  // YYYY-MM-DD or null → milestone
  dependencies: string;
  comments: string;
  sort_order: number;
  created_at: string;
}
