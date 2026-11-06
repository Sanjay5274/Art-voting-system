export interface PublicDrawing {
  id: string;
  drawing_number: string;
  drawing_title: string | null;
  category: string | null;
  image_path: string;
  created_at: string;
}

export interface OrganizerDrawing extends PublicDrawing {
  student_name: string;
  vote_count: number;
}

export interface CompetitionSettings {
  id: number;
  competition_name: string;
  max_selections: number;
  voting_open: boolean;
  results_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardItem {
  id: string;
  drawing_number: string;
  student_name?: string;
  drawing_title: string | null;
  category: string | null;
  image_path: string;
  vote_count: number;
  rank: number;
}

export interface OrganizerStats {
  totalDrawings: number;
  totalCodesIssued: number;
  totalVotesSubmitted: number;
  unusedCodes: number;
  votingCompletionPercentage: number;
  votingOpen: boolean;
  resultsPublished: boolean;
  maxSelections: number;
  topDrawings: LeaderboardItem[];
}

export interface VotingTokenInfo {
  id: string;
  used_at: string | null;
  created_at: string;
  is_used: boolean;
}
