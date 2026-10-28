export type ElectionState = 'draft' | 'active' | 'paused' | 'closed';

export interface ClassItem {
  id: string;
  name: string;
  grade: number;
  is_active: boolean;
  student_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Student {
  id: string;
  nisn: string;
  full_name: string;
  birth_date: string; // YYYY-MM-DD
  class_id: string;
  class_name?: string;
  is_active: boolean;
  has_voted?: boolean;
  voted_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Candidate {
  id: string;
  ballot_number: number;
  chair_name: string;
  vice_chair_name: string;
  photo_path: string;
  vision: string;
  mission: string;
  slogan: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  vote_count?: number;
  vote_percentage?: number;
}

export interface ElectionSettings {
  id: string;
  school_name: string;
  school_logo_path: string;
  election_name: string;
  starts_at: string;
  ends_at: string;
  election_status: ElectionState;
  publish_results: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CandidateTally {
  candidate_id: string;
  ballot_number: number;
  chair_name: string;
  vice_chair_name: string;
  photo_path: string;
  slogan: string;
  vote_count: number;
  percentage: number;
}

export interface ElectionStats {
  total_students: number;
  total_classes: number;
  total_candidates: number;
  voted_count: number;
  not_voted_count: number;
  participation_rate: number;
  total_valid_votes: number;
  election_status: ElectionState;
  is_timing_active: boolean;
  publish_results: boolean;
  last_updated: string;
  candidates_tally: CandidateTally[];
  settings: ElectionSettings;
}

export interface AdminUser {
  id: string;
  username: string;
  display_name: string;
  role: 'admin' | 'super_admin';
}

export interface StudentProfile {
  id: string;
  nisn_masked: string;
  full_name: string;
  birth_date: string;
  class_id: string;
  class_name: string;
  has_voted: boolean;
  is_active: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
