export interface Project {
  id: string;
  user_id: string;
  name: string;
  client_name: string;
  hourly_rate: number;
  budget: number;
  total_seconds: number;
  timer_running: boolean;
  timer_start_time: number | null;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  project_id: string;
  user_id: string;
  seconds: number;
  start_time: number;
  end_time: number;
  is_manual: boolean;
  created_at: string;
}

export interface Warning {
  id: string;
  user_id: string;
  project_id: string;
  type: 'BUDGET_90' | 'BUDGET_100' | 'LONG_SESSION';
  message: string;
  created_at: string;
  dismissed: boolean;
}
