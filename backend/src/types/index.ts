export interface User {
  id: number;
  nickname: string;
  email: string;
  avatar_url?: string;
  total_points: number;
  created_at: Date;
  updated_at: Date;
}

export interface Driver {
  id: number;
  driver_number: number;
  name: string;
  name_acronym?: string;
  team: string;
  nationality?: string;
  total_points: number;
  season: number;
  created_at: Date;
  updated_at: Date;
}

export interface QualifyingResult {
  id: number;
  race_id: number;
  driver_id: number;
  position: number;
  created_at: Date;
  updated_at: Date;
}

export interface Race {
  id: number;
  season: number;
  round: number;
  race_name: string;
  circuit_name: string;
  country: string;
  race_date: Date;
  race_time?: string;
  race_type: 'sprint' | 'main';
  status: 'upcoming' | 'in_progress' | 'provisional' | 'completed';
  provisional_results_sent?: boolean;
  final_results_processed?: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Prediction {
  id: number;
  user_id: number;
  race_id: number;
  position_1?: number;
  position_2?: number;
  position_3?: number;
  position_4?: number;
  position_5?: number;
  position_6?: number;
  position_7?: number;
  position_8?: number;
  position_9?: number;
  position_10?: number;
  points_earned: number;
  submitted_at: Date;
  is_locked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RaceResult {
  id: number;
  race_id: number;
  driver_id: number;
  position: number;
  points: number;
  status: string;
  created_at: Date;
}

export interface MagicLink {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

export interface SprintPrediction {
  id: number;
  user_id: number;
  race_id: number;
  position_1?: number;
  position_2?: number;
  position_3?: number;
  position_4?: number;
  position_5?: number;
  position_6?: number;
  position_7?: number;
  position_8?: number;
  points_earned: number;
  submitted_at: Date;
  is_locked: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface PredictionRequest {
  positions: number[]; // Array of 10 driver IDs for main race, 8 for sprint
}

export interface SprintPredictionRequest {
  positions: number[]; // Array of 8 driver IDs
}

export interface LeaderboardEntry {
  user_id: number;
  nickname: string;
  avatar_url?: string;
  total_points: number;
  rank: number;
}
